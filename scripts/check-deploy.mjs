#!/usr/bin/env node
/**
 * 直近の本番デプロイのビルドログを読んで、**黙って失敗している後処理**を洗い出す。
 *
 * ## なぜこれが要るか
 *
 * **ビルドが緑 = 成功、ではない。** このプロジェクトの後処理 (postbuild など) は
 * 失敗しても exit 0 で通す設計にしてある。送信系や通知系のために本番デプロイが
 * 止まるほうが損だから。**その代償として、失敗はビルドログの中にしか出ない。**
 *
 * 実際に踏んだ: IndexNow への URL 送信が 2026-07-26 の実装以来 **約 1 ヶ月、
 * 1 件も送れないまま気付かれなかった** (毎回 403 を返していたが
 * `Not failing the build` で握りつぶされ、ビルドは緑のまま通っていた)。
 * roadmap には「IndexNow は効いている」と書かれ、それを前提にした判断まで積まれていた。
 *
 * **これは IndexNow 固有の問題ではない。** 同じ形の後処理を足せば同じことが起きる。
 *
 * ## 使い方
 *
 *   npm run check:deploy                    # 直近の本番デプロイ
 *   npm run check:deploy -- <deployment-url>  # 特定のデプロイ
 *
 * 何か見つかったら exit 1。
 */

import { spawnSync } from "node:child_process";

/**
 * **ここに引っかかったら調べる。** 特定のツール名を入れないこと
 * (IndexNow 対策に閉じさせない)。見ているのは「失敗の形」であって中身ではない。
 */
const RED_FLAGS = [
  // このリポジトリの後処理が失敗を握りつぶすときの決まり文句。必ずこの語で書く
  { re: /Not failing the build/i, why: "後処理が失敗を握りつぶしている" },
  { re: /\bHTTP [45]\d\d\b/, why: "外部 API が 4xx / 5xx を返している" },
  { re: /\bFAILED\b/, why: "明示的な失敗" },
  { re: /unexpected error/i, why: "想定外の例外" },
  { re: /\bECONNREFUSED\b|\bETIMEDOUT\b|\bENOTFOUND\b/, why: "ネットワーク到達不可" },
];

/** 自前スクリプトのログ行。`[name] ...` の形で出す規約にしてある */
const OWN_LOG = /^\s*\[[a-z0-9:-]+\]\s/i;

/**
 * CLI の出力はサブコマンドごとに出る先が違う。**ここを取り違えると誤報になる**:
 *
 * - `inspect --logs` は**ビルドログを stderr に出す**。stdout だけ拾うと
 *   何も取れず「後処理のログ 0 行」と誤報する (実際に踏んだ)
 * - `ls --format json` は JSON を stdout に出すが、**進捗行が stderr に出る**。
 *   両方繋ぐと JSON の後ろにゴミが付いてパースに失敗する (これも踏んだ)
 */
function vercel(args, { streams = "both" } = {}) {
  const r = spawnSync("vercel", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (streams === "stdout") return r.stdout ?? "";
  return `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
}

function latestProductionDeployment() {
  const raw = vercel(["ls", "--prod", "--format", "json"], { streams: "stdout" });
  // CLI が JSON の前に進捗行を出すので、最初の `{` から読む
  const json = JSON.parse(raw.slice(raw.indexOf("{")));
  const d = json.deployments?.[0];
  if (!d) throw new Error("本番デプロイが見つからない");
  return d;
}

function main() {
  const arg = process.argv[2];
  let url, state, commit;

  if (arg) {
    url = arg.replace(/^https?:\/\//, "");
    state = "(指定)";
    commit = "(指定)";
  } else {
    const d = latestProductionDeployment();
    url = d.url;
    state = d.state;
    commit = (d.meta?.githubCommitMessage ?? "").split("\n")[0];
  }

  console.log(`デプロイ: https://${url}`);
  console.log(`状態:     ${state}`);
  if (commit) console.log(`コミット: ${commit}`);
  console.log("");

  const logs = vercel(["inspect", "--logs", `https://${url}`]);
  const lines = logs.split("\n");

  // 1) 自前スクリプトが何をしたかは必ず目に入れる (0 件でも「動いて 0 件」か「動いていない」かが分かる)
  const own = lines.filter((l) => OWN_LOG.test(l.replace(/^\S+\s+/, "")));
  console.log(`--- 後処理のログ (${own.length} 行) ---`);
  if (own.length === 0) {
    console.log("  (無し) 後処理が動いていない可能性がある。postbuild の設定を確認する");
  } else {
    for (const l of own) console.log(`  ${l.trim()}`);
  }
  console.log("");

  // 2) 失敗の形に一致する行
  const hits = [];
  for (const line of lines) {
    for (const { re, why } of RED_FLAGS) {
      if (re.test(line)) {
        hits.push({ line: line.trim(), why });
        break;
      }
    }
  }

  if (state !== "READY" && state !== "(指定)") {
    hits.push({ line: `deployment state = ${state}`, why: "デプロイが READY でない" });
  }

  if (hits.length === 0) {
    console.log("--- 検出 ---");
    console.log("  問題なし");
    console.log("");
    console.log("※ ビルドログが綺麗でも「意図した出力になっているか」は別問題。");
    console.log("  変更したページ / ファイルを本番に curl して中身を確かめること。");
    return;
  }

  console.log(`--- 検出 (${hits.length} 件) ---`);
  for (const h of hits) console.log(`  [${h.why}] ${h.line}`);
  console.log("");
  console.log("握りつぶされた失敗がある。放置すると気付かないまま数週間走る。");
  process.exitCode = 1;
}

try {
  main();
} catch (err) {
  console.error(`チェックを実行できなかった: ${err?.message ?? err}`);
  console.error("");
  console.error("手で確認する:");
  console.error("  vercel ls --prod");
  console.error("  vercel inspect --logs <deployment-url>");
  process.exitCode = 2;
}
