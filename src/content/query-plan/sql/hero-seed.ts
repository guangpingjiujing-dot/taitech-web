/**
 * 旗艦の実行計画を手元で再現するための SQL 全文。
 *
 * **ここが正。** `capture-all.sh` はこのファイルからテンプレートリテラルの中身を
 * 取り出して `capture/hero-seed.sql` を生成し、それを流す。**採り直すときはここだけ直す。**
 *
 * かつては capture 側の `.sql` が正で、こちらは手で写した読者向けの複製だった。
 * capture/ は harvest で消えるので、消えたあとに「出荷版が正しいか」を確かめる手段が
 * 無くなる（05-implementation-review §L-6）。だから正を出荷版側に移した。
 *
 * ★ 抽出は `export const HERO_SEED_SQL = \`` 〜 行末の `` `; `` を目印にしている。
 *   この宣言の形を変えるときは `capture-all.sh` の `build_seed_sql` も直すこと
 *   （形が変わると生成が失敗して、スクリプトが止まる）。
 */
export const HERO_SEED_SQL = `-- 実行計画の題材を手元に作る。PostgreSQL 18 で確認。
-- 所要時間: 約 1 分 20 秒 / ディスク使用量: 約 3.5 GB
--
-- このデータが「遅いクエリ」になるように仕込んである点は 4 つ。
--   1. orders の 4 条件を完全に相関させる
--      → プランナは選択率を独立と仮定して掛けるので、25 万行を 500 行前後と見積もる
--      → その結果 Hash Join ではなく Nested Loop が選ばれ、内側が 25 万回まわる
--   2. order_items を「商品順」に物理配置する
--      → 同じ注文の明細がページ上に散らばる
--      → 1 回あたりのヒープ取得が効かなくなり、per-loop が 1 桁上がる
--   3. 1 注文あたり明細 6 行 + クエリ側で qty = 3 に絞る
--      → 内側は 6 行ぶん働くのに、上に流れるのは 2 行
--   4. 明細行に product_name / note を持たせて現実的な幅にする
--      → テーブルが 3.5GB になり、メモリに載り切らない
--
-- 1 と 2 が無いと Execution Time が 100ms 台になり、教材として成立しない。

DROP TABLE IF EXISTS order_items, orders, customers;

CREATE TABLE customers (
    id   int PRIMARY KEY,
    code text NOT NULL,          -- 業務キー。あえてインデックスを張らない
    name text NOT NULL
);
INSERT INTO customers
SELECT g, 'C-' || g, 'customer-' || g FROM generate_series(1, 20000) g;

CREATE TABLE orders (
    id            int PRIMARY KEY,
    customer_code text NOT NULL,
    status        text NOT NULL,
    channel       text NOT NULL,
    payment       text NOT NULL,
    ordered_at    date NOT NULL
);

-- id <= 250000 が「4 条件すべてを満たす行」。4 条件は完全に相関している
INSERT INTO orders
SELECT g,
       'C-' || (1 + (g % 20000)),
       CASE WHEN g <= 250000 THEN 'shipped' ELSE (ARRAY['pending','cancelled','returned'])[1 + (g % 3)] END,
       CASE WHEN g <= 250000 THEN 'web'     ELSE (ARRAY['store','phone','partner'])[1 + (g % 3)]        END,
       CASE WHEN g <= 250000 THEN 'card'    ELSE 'cash'                                                 END,
       -- 条件を満たさない行は必ず 2026-06-30 以前に収める
       CASE WHEN g <= 250000 THEN DATE '2026-07-01' + (g % 31) ELSE DATE '2025-08-01' + (g % 334) END
FROM generate_series(1, 2000000) g;

CREATE TABLE order_items (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id     int  NOT NULL,
    product_name text NOT NULL,
    note         text NOT NULL,
    price        int  NOT NULL,
    qty          int  NOT NULL
);
-- ORDER BY で物理順を「商品順」にする（移行やバルクロードでよくある形）
INSERT INTO order_items (order_id, product_name, note, price, qty)
SELECT o.id, 'product-' || (o.id % 5000), repeat('note ', 40), 100 + (o.id % 900), 1 + (s % 3)
FROM orders o, generate_series(1, 6) s
ORDER BY (o.id % 5000), o.id;

CREATE INDEX order_items_order_id_idx ON order_items (order_id);

ANALYZE customers;
ANALYZE orders;
ANALYZE order_items;

-- ここから計画を採る。この 2 つの SET を先に打つこと（打たないと形が変わる）
SET max_parallel_workers_per_gather = 0;
SET jit = off;

EXPLAIN (ANALYZE)
SELECT c.name, count(*), sum(i.price * i.qty) AS total
FROM customers c
JOIN orders o      ON o.customer_code = c.code
JOIN order_items i ON i.order_id = o.id
WHERE o.status = 'shipped'
  AND o.ordered_at >= '2026-07-01'
  AND o.channel = 'web'
  AND o.payment = 'card'
  AND i.qty = 3
GROUP BY c.name
ORDER BY total DESC
LIMIT 10;

-- Execution Time はコールド単発でも 1.8〜4.5 秒に振れる。1 回だけ見て判断しないこと。
-- 安定しているのは「構造」と、内側の Index Scan が 1 位で 2 位を大きく引き離すこと。`;
