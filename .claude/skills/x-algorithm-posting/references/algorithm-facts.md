# X For You アルゴリズム 一次情報メモ

出典: `xai-org/x-algorithm`（Apache-2.0 / 本メモ作成時点の HEAD = `0d3cdd8`, 2026-08-25）を
`/Users/kouheisakai/dev/x-algorithm` にクローンして直接読んだもの。

**このファイルの役割**: SKILL.md の主張の根拠。行番号付きで引用元を残す。
数値は「デフォルト値」であって、実際の配信では A/B テストのパラメータ上書きが入りうる
（`param!(名前, 型, "キー", デフォルト)` という形で、キーは実験システムから差し替え可能）。
**リポジトリを再クローンして数値が変わっていたらこのファイルを更新すること。**

---

## 1. スコアの計算式

`home-mixer/scorers/ranking_scorer.rs`

```
base   = Σ (weight_i × P(action_i))          … Phoenix が予測した各アクション確率の加重和
score  = offset_score(base)                   … 負値を [0, offset] に潰す正規化 (:472-480)
score ×= OON係数                              … 非フォロワー配信なら 0.75 (:618-633)
score ×= 著者多様性係数                        … 同一著者の2本目以降を減衰 (:561-563)
score  = cold_start 補正                       … 小規模著者の押し上げ (author_cold_start.rs)
→ VMRanker (vm-ranker/) が最終的に並べ替える
```

`offset_score` (`ranking_scorer.rs:472-480`), `NEGATIVE_SCORES_OFFSET = 0.001`
(`home-mixer/params/config.rs:40`)。

---

## 2. 重み一覧（`home-mixer/params/param.rs:307-475`）

| アクション | param 定数 | デフォルト | 行 |
|---|---|---:|---|
| リンクコピーで共有 | `ShareViaCopyLinkWeight` | **20.0** | 351 |
| 返信（相互フォロー × オリジナル投稿） | `ReplyWeight` + `BidirectionalFollowReplyWeightBoost` | **5.0 + 15.0 = 20.0** | 308, 310 |
| 返信 | `ReplyWeight` | 5.0 | 308 |
| 引用ポスト | `QuoteWeight` | 5.0 | 357 |
| DM で共有 | `ShareViaDmWeight` | 5.0 | 345 |
| 著者をフォロー | `FollowAuthorWeight` | 4.0 | 371 |
| 共有 | `ShareWeight` | 2.0 | 343 |
| リポスト | `RetweetWeight` | 1.0 | 321 |
| いいね | `FavoriteWeight` | 0.5 | 307 |
| ポストをクリック | `ClickWeight` | 0.4 | 334 |
| リンクを開く | `OpenLinkWeight` | **+0.2** | 335 |
| 動画を開く | `VideoOpenWeight` | 0.07 | 329 |
| 画像を拡大 | `PhotoExpandWeight` | 0.05 | 323 |
| 引用元をクリック | `QuotedClickWeight` | 0.05 | 359 |
| 滞在（dwell） | `DwellWeight` | 0.05 | 356 |
| 未探索ポスト | `PostUnexploredWeight` | 0.02 | 377 |
| 滞在秒数（連続値） | `ContDwellTimeWeight` | 0.004 | 401 |
| プロフィールクリック | `ProfileClickWeight` | 0.0 | 337 |
| 動画品質視聴 (VQV) | `VqvWeight` | 0.0 | 342 |
| 相互フォロー dwell ブースト | `BidirectionalFollowDwellWeightBoost` | 0.0（未出荷） | 316 |
| 滞在しなかった | `NotDwelledWeight` | -0.02 | 469 |
| 著者をブロック | `BlockAuthorWeight` | -31.2 | 456 |
| 興味がない | `NotInterestedWeight` | -43.2 | 450 |
| 著者をミュート | `MuteAuthorWeight` | -58.8 | 462 |
| 通報 | `ReportWeight` | **-234.0** | 467 |

### 重みの読み方（コード内コメント `param.rs:278-305` の要約）

- 重みが掛かるのは **予測確率**であって、生のエンゲージメント数ではない。
  「通報1件 = いいね468件を打ち消す」という読み方は**誤り**。
- 通報の基礎発生率はいいねの 1/1000 以下なので、係数を大きくしないとランキングに効かない。
  負の重みが大きいのは「重視している」ではなく「レアだから正規化している」。
- 推薦はパーソナライズされているので、悪意ある大量通報は「通報した人と似た人」の
  推薦にしか主に影響しない。
- そもそも Home Timeline に配信されたポスト上での行動しかカウントされない。
  ポストに直接遷移して（グループチャットで示し合わせるなど）押した行動はランキングに効かない。

### 相互フォロー返信ブーストの適用条件（`ranking_scorer.rs:180-193`）

```rust
fn bidirectional_boost_eligible(candidate: &PostCandidate) -> bool {
    candidate.in_reply_to_tweet_id.is_none()      // 返信ではない
        && candidate.retweeted_tweet_id.is_none() // リポストではない
        && candidate.is_mutual_follow_author == Some(true)
}
```

→ **オリジナル投稿にしか効かない**。返信・リポストは対象外。
経緯は `docs/BIDIRECTIONAL_BOOST_CHANGE.md`（2026-07 に 20 で広く出荷 → 07-24 に 15 に調整）。

---

## 3. 乗算補正

### OON（アウトオブネットワーク）割引

`ranking_scorer.rs:616-635`, `param.rs:247-273`

| 条件 | 係数 |
|---|---:|
| 非フォロワーへの配信 | `OonWeightFactor` = **0.75** |
| トピック指定リクエスト時 | `TopicOonWeightFactor` = 0.5 |
| 新規ユーザー（条件付き） | `NEW_USER_OON_WEIGHT_FACTOR` = 0.00001（`params/config.rs:38`） |

さらに `EnableOonRescoreForInNetworkRepliesRetweets = true`（`param.rs:261`）により、
**フォロワー向けであっても「返信」と「リポスト」には同じ 0.75 が掛かる**
（`ranking_scorer.rs:680-687`）。

### 著者多様性の減衰

`ranking_scorer.rs:561-563`, `param.rs:223-239`

```rust
multiplier = (1.0 - floor) * decay.powf(k) + floor
// decay = 0.5 (AuthorDiversityDecay), floor = 0.25 (AuthorDiversityFloor)
```

`k` = そのリクエストの候補プール内で、同じ著者のより高スコアなポストが既に何本あるか
（`author_pool_counts`, `:565-583` — スコア降順に走査してカウント）。

| k | 係数 |
|---:|---:|
| 0（最高スコアの1本） | 1.0 |
| 1 | 0.625 |
| 2 | 0.4375 |
| 3 | 0.34375 |
| 4 | 0.296875 |
| ∞ | 0.25（floor） |

候補プールは AgeFilter により最大 48 時間ぶん。つまり**48時間以内に複数投稿すると、
自分の2本目以降が自分の1本目に食われる**。

### 小規模著者のコールドスタート押し上げ

`home-mixer/scorers/author_cold_start.rs`, `param.rs:634-710`

| パラメータ | デフォルト | 意味 |
|---|---:|---|
| `ColdStartImpressionThreshold` | 1000 | インプレッションがこれ未満のポストが対象 |
| `ColdStartFollowerCap` | 1000 | フォロワーがこれ以下の著者が対象 |
| `ColdStartMaxPostAgeSecs` | 86400 | 投稿から24時間以内 |
| `ColdStartSlotMin` / `SlotMax` | 15 / 16 | 押し上げ先のスロット（15〜16位相当） |
| `LowImpressionsMaxPositionRatio` | 0.85 | 非ゼロ候補の上位85%の位置までしか押し上げない |
| `EnableViewerColdStart` | true | 有効 |

→ フォロワー1000人以下のアカウントには、**投稿後24時間限定の実在する押し上げ**がある。

---

## 4. フィルタ（スコアリング前）

`home-mixer/filters/`。README の "Filtering" 節に評価順の表がある。書き手に効くものだけ抜粋。

| フィルタ | 落とすもの | 実装 |
|---|---|---|
| `AgeFilter` | **48時間より古いポスト** | `age_filter.rs`（README 記載の 48h） |
| `OONRetweetReplyFilter` | **非フォロワー向けの返信とリポスト全部**、および親が取れない返信 | `oon_retweet_reply_filter.rs:13-21` |
| `SelfReplyChainFilter` | 返信のうち、返信先アカウントを閲覧者がフォローしていないもの | `self_reply_chain_filter.rs:30-45` |
| `PreviouslySeenPostsFilter` | すでに表示済みのポスト | 同名ファイル |
| `NewUserMinEngagementFilter` | 新規ユーザー向けに、エンゲージメント閾値未満の OON ポスト | `new_user_min_engagement_filter.rs` |
| `TopicIdsFilter` | 要求トピック外／除外トピックのポスト | `topic_ids_filter.rs` |
| `DedupConversationFilter` | 同一会話の追加の枝 | `dedup_conversation_filter.rs` |

### `OONRetweetReplyFilter` の重要な帰結

```rust
(c.in_network == Some(false) && (is_retweet || is_reply)) || (is_reply && c.ancestors.is_empty())
```

**あなたの返信は、For You 経由では非フォロワーに一切届かない。** リポストも同様。

### `SelfReplyChainFilter` の帰結

```rust
match candidate.ancestor_users.iter().copied().find(|uid| *uid != self_id) {
    Some(effective_directed_at) => allowed_users.contains(&effective_directed_at),
    None => true,   // 祖先がすべて自分自身 → 通す
}
```

**自分へのリプ（セルフスレッド）はこのフィルタでは落ちない。**
ただし返信である以上、上の `OONRetweetReplyFilter` で非フォロワーには落ちるし、
フォロワー向けでも OON 割引 0.75 が掛かる。

---

## 5. 可視性フィルタ（表示するかどうか自体）

`visibility-filtering/rules/registry.rs`。ランキングとは**別サービス・別ルール**
（README "Key Design Decisions" #4）。最初に drop と答えたルールで評価終了。

`timeline_home_recommendations_policy()` (`registry.rs:138-171`) は
**非フォロワーへの推薦時にだけ追加で適用される drop ルール群**。同じポストでも
フォロワーには表示される。書き手に関係するもの:

- `SPAM_HIGH_RECALL_DROP` / `SPAM_HIGH_RECALL_USER_DROP`（スパム、高再現率＝広めに拾う）
- `DO_NOT_AMPLIFY_DROP` / `DO_NOT_AMPLIFY_NON_FOLLOWER_USER_DROP`
- `MALICIOUS_URL_DROP`
- `ABUSIVE_HIGH_RECALL_USER_DROP`
- `FOSNR_ABUSE_INSULTS_OON_DROP`
- `IMPERSONATION_HIGH_PRECISION_USER_DROP`
- `NSFW_TEXT_DROP` / NSFW 系一式（アバター・バナー画像も含む）
- `COMPROMISED_USER_DROP` / `READ_ONLY_USER_DROP`

→ **「フォロワーには普通に見えているのに OON リーチだけゼロ」という状態が構造的にありうる。**
自分にラベルが付いているかは X の "Under the Hood" 透明性ツールで確認できる（README 参照）。

---

## 6. LLM による投稿スクリーニング（Grox）

`grox/flows/upa/` — 全ポストに対して VLM (Gemma系) を走らせるフロー。

`grox/flows/upa/models.py`:

```python
class TweetBoolMetadata(BaseModel):
    isHighQuality: bool | None = None
    isNsfw: bool | None = None
    isGore: bool | None = None
    isViolent: bool | None = None
    isSpam: bool | None = None
    isSoftNsfw: bool | None = None
    isAdult: bool | None = None
```

`grox/flows/upa/state_initial_banger.py` の `BangerScreenResult` が出力するもの:
`summary` / `tags` / `taxonomy_categories`（トピック分類 + スコア）/ `tweet_bool_metadata` /
`slop_score` / `has_minor_score`。これらは `task_write.py:167-178` で
`slopScore` `hasMinorScore` などとして書き出される。

- **投稿本文と画像は LLM に読まれ、トピック分類・品質判定・`slop_score` が付く。**
- 分類されたトピックは `TopicIdsFilter` やトピック指定リクエストの経路に効く。
- **プロンプト（`.j2`）はゲーミング防止のため意図的に非公開**
  （`grox/flows/upa/prompts.py` のコメント、および README "What's not in this repo?"）。
  よって「isHighQuality の判定基準」はコードからは読み取れない。

`grox/flows/reply_spam/` には `classifier_coordinated_spam.py` / `task_spam_detection.py` /
`classifier_reply_ranking.py` があり、返信スパムと協調的スパムを別途 LLM で検出している。

---

## 7. Phoenix（ランキング/検索モデル）が見ているもの

`phoenix/README.md`

- 2タワー構成。ユーザータワーは**ユーザーの行動履歴のトランスフォーマー**で、
  本番の retrieval には**学習済みのユーザーID埋め込みが存在しない**
  (`use_user_embedding=False`)。ユーザーは実質「履歴 + 粗いプロフィール特徴
  （国・言語・地域・タイムゾーン・ローカル時刻など）」でしか表現されない (:102-108, :182-187)。
- 候補タワーは各ポストの**マルチモーダル埋め込みから導出したセマンティックID（6×256コード）**
  を使う (:112, :247, :411)。テキストと画像の中身がモデルに入っている。
- ハッシュベース埋め込みなので語彙管理が不要で、**新しいポストは即座に表現可能**
  （README "Key Design Decisions" #3）。「新規投稿はモデルに認識されるまで時間がかかる」は誤り。
- ランキング推論では**候補同士は相互に注意を向けない**（#2）。スコアはバッチ内の
  他のポストに依存しない。

→ 帰結: 配信先の決定は「あなたの投稿の意味ベクトル」×「閲覧者の行動履歴」のマッチ。
著者IDそのものではない。**トピックが一貫している方が、履歴の似た人に届きやすい。**

---

## 8. このリポジトリで確認できなかったこと

- ハッシュタグの本数と評価の関係（該当ルールなし。スパム判定は LLM 側で、プロンプト非公開）
- 文字数・改行・書式と評価の関係（該当コードなし）
- 投稿時刻の最適化（`ContextFeature` にローカル時刻はあるが、時刻自体を優遇するコードはない）
- `slop_score` / `isHighQuality` の**消費側**（本リポジトリ内に参照箇所なし。外部シンクに書き出される）
- Grox のプロンプト、一部の botmaker ルール（README により意図的に非公開）
- For You 以外の面（検索・通知・プロフィール・Following タブ）の扱い
