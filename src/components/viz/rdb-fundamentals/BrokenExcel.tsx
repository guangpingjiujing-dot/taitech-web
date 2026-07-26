import { cn } from "@/lib/utils";

/**
 * 旗艦ページ Hero: 「壊れた Excel」の視覚化。
 * 3 シート (注文 / 顧客 / 商品) の一部を並置し、7 つの意図的な違和感を仕込む。
 *
 * highlightIds を渡すと、該当セルがオレンジ枠 + 番号バッジで強調される (「答え合わせ」モード)。
 * highlightIds が空 or 未指定なら、通常のセルは中立、`isWrong` セルのみ淡いピンク背景 (--wrong-soft) で
 * さりげなく「何かおかしい」を示唆する。
 */

export type AnomalyId =
  | "stock-neg"
  | "dup-order"
  | "same-name"
  | "orphan-fk"
  | "resurrected"
  | "invalid-email"
  | "sum-mismatch";

export type BrokenExcelProps = {
  highlightIds?: AnomalyId[];
};

type AnomalyCell = {
  id: AnomalyId;
  /** 番号バッジで表示する連番 */
  number: number;
};

export function BrokenExcel({ highlightIds = [] }: BrokenExcelProps) {
  const isHl = (id: AnomalyId) => highlightIds.includes(id);

  return (
    <div className="overflow-x-auto rounded-sm border border-[var(--border-strong)] bg-[var(--card)]">
      {/* Excel 風のシートタブ */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs">
        <SheetTab active>注文</SheetTab>
        <SheetTab>顧客</SheetTab>
        <SheetTab>商品</SheetTab>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
          fictional-ec-shop.xlsx
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[2fr_1fr]">
        {/* Left: 注文シート (メイン) */}
        <MainOrdersSheet isHl={isHl} />
        {/* Right: 顧客 / 商品 の小シート */}
        <div className="flex flex-col gap-4">
          <CustomersMiniSheet isHl={isHl} />
          <ProductsMiniSheet isHl={isHl} />
        </div>
      </div>
    </div>
  );
}

function SheetTab({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "border border-b-0 px-3 py-1 font-bold",
        active
          ? "border-[var(--border-strong)] bg-[var(--card)] text-[var(--foreground)]"
          : "border-transparent text-[var(--muted-foreground)]",
      )}
    >
      {children}
    </span>
  );
}

function CellHighlight({
  anomaly,
  active,
  children,
}: {
  anomaly?: AnomalyCell;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-flex items-center">
      <span
        className={cn(
          "inline-block",
          active && "font-bold text-[var(--foreground)]",
        )}
      >
        {children}
      </span>
      {anomaly && active && (
        <span
          aria-label={`違和感 ${anomaly.number}`}
          className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--wrong)] text-[9px] font-bold text-white"
        >
          {anomaly.number}
        </span>
      )}
    </span>
  );
}

function MainOrdersSheet({ isHl }: { isHl: (id: AnomalyId) => boolean }) {
  const rows: Array<{
    n: string;
    orderId: React.ReactNode;
    customerId: React.ReactNode;
    customerName: React.ReactNode;
    productId: string;
    qty: number;
    amount: React.ReactNode;
    dt: string;
    rowHl?: AnomalyId;
  }> = [
    {
      n: "2",
      orderId: "ORD-001",
      customerId: "C-001",
      customerName: "山田太郎",
      productId: "P-042",
      qty: 1,
      amount: "¥9,800",
      dt: "2026-03-15 10:22",
    },
    {
      n: "3",
      orderId: (
        <CellHighlight
          anomaly={{ id: "dup-order", number: 2 }}
          active={isHl("dup-order")}
        >
          ORD-001
        </CellHighlight>
      ),
      customerId: "C-002",
      customerName: "佐藤花子",
      productId: "P-042",
      qty: 1,
      amount: (
        <CellHighlight
          anomaly={{ id: "dup-order", number: 2 }}
          active={isHl("dup-order")}
        >
          ¥10,800
        </CellHighlight>
      ),
      dt: "2026-03-15 10:23",
      rowHl: "dup-order",
    },
    {
      n: "4",
      orderId: "ORD-002",
      customerId: (
        <CellHighlight
          anomaly={{ id: "orphan-fk", number: 4 }}
          active={isHl("orphan-fk")}
        >
          C-999
        </CellHighlight>
      ),
      customerName: (
        <CellHighlight
          anomaly={{ id: "orphan-fk", number: 4 }}
          active={isHl("orphan-fk")}
        >
          #N/A
        </CellHighlight>
      ),
      productId: "P-018",
      qty: 2,
      amount: "¥7,600",
      dt: "2026-03-15 11:05",
      rowHl: "orphan-fk",
    },
    {
      n: "5",
      orderId: "ORD-003",
      customerId: "C-011",
      customerName: (
        <CellHighlight
          anomaly={{ id: "same-name", number: 3 }}
          active={isHl("same-name")}
        >
          山田太郎
        </CellHighlight>
      ),
      productId: "P-042",
      qty: 1,
      amount: "¥9,800",
      dt: "2026-03-15 11:47",
    },
    {
      n: "6",
      orderId: "ORD-004",
      customerId: "C-012",
      customerName: (
        <CellHighlight
          anomaly={{ id: "same-name", number: 3 }}
          active={isHl("same-name")}
        >
          山田太郎
        </CellHighlight>
      ),
      productId: "P-042",
      qty: 1,
      amount: "¥9,800",
      dt: "2026-03-15 12:10",
    },
    {
      n: "7",
      orderId: "ORD-005",
      customerId: "C-013",
      customerName: (
        <CellHighlight
          anomaly={{ id: "same-name", number: 3 }}
          active={isHl("same-name")}
        >
          山田太郎
        </CellHighlight>
      ),
      productId: "P-042",
      qty: 1,
      amount: "¥9,800",
      dt: "2026-03-15 12:33",
    },
    {
      n: "8",
      orderId: "ORD-006",
      customerId: "C-001",
      customerName: "山田太郎",
      productId: "P-018",
      qty: 3,
      amount: (
        <CellHighlight
          anomaly={{ id: "sum-mismatch", number: 7 }}
          active={isHl("sum-mismatch")}
        >
          ¥30.00 ($9.99×3)
        </CellHighlight>
      ),
      dt: "2026-03-15 13:15",
      rowHl: "sum-mismatch",
    },
    {
      n: "9",
      orderId: (
        <CellHighlight
          anomaly={{ id: "resurrected", number: 5 }}
          active={isHl("resurrected")}
        >
          (削除済み?)
        </CellHighlight>
      ),
      customerId: "—",
      customerName: "—",
      productId: "—",
      qty: 0,
      amount: "—",
      dt: "2024-03-15 (最終保存不整合)",
      rowHl: "resurrected",
    },
  ];

  return (
    <div className="overflow-x-auto border border-[var(--border-strong)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 font-mono text-xs font-bold">
        注文
      </div>
      <table className="min-w-full font-mono text-[11px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
            <th className="w-8 px-2 py-1 text-center text-[var(--muted-foreground)]">
              {" "}
            </th>
            <th className="px-3 py-1.5 text-left font-bold">注文ID</th>
            <th className="px-3 py-1.5 text-left font-bold">顧客ID</th>
            <th className="px-3 py-1.5 text-left font-bold">顧客名</th>
            <th className="px-3 py-1.5 text-left font-bold">商品ID</th>
            <th className="px-3 py-1.5 text-right font-bold">数量</th>
            <th className="px-3 py-1.5 text-right font-bold">金額</th>
            <th className="px-3 py-1.5 text-left font-bold">日時</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-[var(--border)] last:border-b-0",
                row.rowHl && isHl(row.rowHl) && "bg-[var(--wrong-soft)]",
              )}
            >
              <th className="w-8 bg-[var(--muted)]/20 px-2 py-1 text-center font-normal text-[var(--muted-foreground)]">
                {row.n}
              </th>
              <td className="px-3 py-1.5">{row.orderId}</td>
              <td className="px-3 py-1.5">{row.customerId}</td>
              <td className="px-3 py-1.5">{row.customerName}</td>
              <td className="px-3 py-1.5">{row.productId}</td>
              <td className="px-3 py-1.5 text-right">{row.qty}</td>
              <td className="px-3 py-1.5 text-right">{row.amount}</td>
              <td className="whitespace-nowrap px-3 py-1.5 text-[var(--muted-foreground)]">
                {row.dt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomersMiniSheet({ isHl }: { isHl: (id: AnomalyId) => boolean }) {
  const rows: Array<{
    id: string;
    name: string;
    email: React.ReactNode;
    hl?: AnomalyId;
  }> = [
    { id: "C-001", name: "山田太郎", email: "yamada@example.com" },
    {
      id: "C-011",
      name: "山田太郎",
      email: (
        <CellHighlight
          anomaly={{ id: "invalid-email", number: 6 }}
          active={isHl("invalid-email")}
        >
          n/a
        </CellHighlight>
      ),
      hl: "invalid-email",
    },
    {
      id: "C-012",
      name: "山田太郎",
      email: (
        <CellHighlight
          anomaly={{ id: "invalid-email", number: 6 }}
          active={isHl("invalid-email")}
        >
          unknown
        </CellHighlight>
      ),
      hl: "invalid-email",
    },
    {
      id: "C-013",
      name: "山田太郎",
      email: (
        <CellHighlight
          anomaly={{ id: "invalid-email", number: 6 }}
          active={isHl("invalid-email")}
        >
          -
        </CellHighlight>
      ),
      hl: "invalid-email",
    },
    { id: "C-002", name: "佐藤花子", email: "sato@example.com" },
  ];
  return (
    <div className="overflow-x-auto border border-[var(--border-strong)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 font-mono text-xs font-bold">
        顧客
      </div>
      <table className="min-w-full font-mono text-[11px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
            <th className="px-3 py-1.5 text-left font-bold">顧客ID</th>
            <th className="px-3 py-1.5 text-left font-bold">名前</th>
            <th className="px-3 py-1.5 text-left font-bold">メール</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-[var(--border)] last:border-b-0",
                r.hl && isHl(r.hl) && "bg-[var(--wrong-soft)]",
              )}
            >
              <td className="px-3 py-1.5">{r.id}</td>
              <td className="px-3 py-1.5">{r.name}</td>
              <td className="px-3 py-1.5">{r.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-[var(--border)] bg-[var(--muted)]/20 px-3 py-1.5 text-[10px] text-[var(--muted-foreground)]">
        ※ 注文シートに存在する C-999 の行はここに無い
      </div>
    </div>
  );
}

function ProductsMiniSheet({ isHl }: { isHl: (id: AnomalyId) => boolean }) {
  return (
    <div className="overflow-x-auto border border-[var(--border-strong)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 font-mono text-xs font-bold">
        商品
      </div>
      <table className="min-w-full font-mono text-[11px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
            <th className="px-3 py-1.5 text-left font-bold">商品ID</th>
            <th className="px-3 py-1.5 text-left font-bold">商品名</th>
            <th className="px-3 py-1.5 text-right font-bold">在庫</th>
          </tr>
        </thead>
        <tbody>
          <tr
            className={cn(
              "border-b border-[var(--border)]",
              isHl("stock-neg") && "bg-[var(--wrong-soft)]",
            )}
          >
            <td className="px-3 py-1.5">P-042</td>
            <td className="px-3 py-1.5">プレミアム座布団</td>
            <td className="px-3 py-1.5 text-right">
              <CellHighlight
                anomaly={{ id: "stock-neg", number: 1 }}
                active={isHl("stock-neg")}
              >
                <span className="font-bold text-[var(--wrong)]">-1</span>
              </CellHighlight>
            </td>
          </tr>
          <tr className="border-b border-[var(--border)] last:border-b-0">
            <td className="px-3 py-1.5">P-018</td>
            <td className="px-3 py-1.5">竹製箸</td>
            <td className="px-3 py-1.5 text-right">42</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
