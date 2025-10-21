// Frontend-only invoice utilities (normalization + generator)
// Clean, standalone module used by SalesInvoice.tsx

export interface InvoiceItem {
  id: string;
  code: string;
  product: string;
  hsCode: string;
  description: string;
  qty: number;
  rate: number;
  exGSTRate: number;
  exGSTAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryNumber?: string;
  deliveryDate?: string;
  poNumber?: string;
  poDate?: string;
  accountNumber?: string;
  accountTitle: string;
  saleAccount?: string;
  saleAccountTitle?: string;
  ntnNumber?: string;
  amount: number;
  netAmount?: number;
  province?: "Punjab" | "Sindh";
  items?: InvoiceItem[];
}

export function getNextInvoiceNumber(invoices: Invoice[] | unknown): string {
  const list = Array.isArray(invoices) ? invoices : [];
  const numbers = list
    .map((inv) => {
      const raw =
        (inv as Partial<Invoice>)?.invoiceNumber ??
        ((inv as Record<string, unknown>)["number"] as unknown) ??
        null;
      const match = typeof raw === "string" ? raw.match(/^INV-(\d+)$/) : null;
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n): n is number => n !== null);
  const max = numbers.length ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `INV-${next.toString().padStart(3, "0")}`;
}

export function mapRawToInvoice(invRaw: Record<string, unknown>): Invoice {
  const inv = invRaw || ({} as Record<string, unknown>);

  const mappedItems: InvoiceItem[] = (
    Array.isArray(inv.products)
      ? (inv.products as unknown[])
      : Array.isArray(inv.items)
      ? (inv.items as unknown[])
      : []
  ).map((it) => {
    const item = (it as Record<string, unknown>) || {};
    return {
      id:
        item.id !== undefined
          ? String(item.id)
          : item._id !== undefined
          ? String(item._id)
          : String(Math.random()),
      code: String(item.code ?? ""),
      product: String(item.product ?? ""),
      hsCode: String(item.hsCode ?? ""),
      description: String(item.description ?? ""),
      qty: typeof item.qty === "number" ? item.qty : 0,
      rate: typeof item.rate === "number" ? item.rate : 0,
      exGSTRate: typeof item.exGSTRate === "number" ? item.exGSTRate : 0,
      exGSTAmount: typeof item.exGSTAmount === "number" ? item.exGSTAmount : 0,
    };
  });

  const id = inv._id
    ? String(inv._id)
    : inv.id !== undefined
    ? String(inv.id)
    : String(
        (inv.number as unknown) ??
          (inv.invoiceNumber as unknown) ??
          Math.random()
      );

  const invoiceNumber =
    (inv.invoiceNumber as string) ??
    (inv.number !== undefined ? String(inv.number) : "");
  const invoiceDate = inv.invoiceDate
    ? String(inv.invoiceDate).slice(0, 10)
    : inv.date
    ? String(inv.date).slice(0, 10)
    : "";

  const saleAccountTitleMap: Record<string, string> = {
    "4114": "Sale Of Chemicals and Equipments",
    "4112": "Sale Of Equipments",
    "4111": "Sales Of Chemicals",
    "4113": "Services",
  };

  let saleAccountValue: string | undefined = undefined;
  let saleAccountTitle: string | undefined = undefined;
  const rawSale = (inv.saleAccount as string) ?? undefined;
  const rawSaleTitle = (inv.saleAccountTitle as string) ?? undefined;

  if (rawSale && rawSale.trim()) {
    const parts = rawSale.split("-").map((s) => s.trim());
    const codePart = parts[0] || rawSale.trim();
    const rest = parts.slice(1).join("-").trim();
    const titleFromParts =
      rest || rawSaleTitle || saleAccountTitleMap[codePart];
    if (titleFromParts) {
      saleAccountValue = `${codePart}-${titleFromParts}`;
      saleAccountTitle = titleFromParts;
    } else {
      saleAccountValue = codePart;
      saleAccountTitle = rawSaleTitle ?? saleAccountTitleMap[codePart];
    }
  } else if (rawSaleTitle && rawSaleTitle.trim()) {
    saleAccountValue = rawSaleTitle;
    saleAccountTitle = rawSaleTitle;
  }

  // compute subtotal from mapped items so we can fallback if backend omits amounts
  const subtotal = (mappedItems || []).reduce(
    (s, it) => s + (it.qty || 0) * (it.rate || 0),
    0
  );

  const invoiceObj: Invoice = {
    id,
    invoiceNumber,
    invoiceDate,
    deliveryNumber: (inv.deliveryNumber as string) ?? undefined,
    deliveryDate: inv.deliveryDate
      ? String(inv.deliveryDate).slice(0, 10)
      : undefined,
    poNumber: (inv.poNumber as string) ?? undefined,
    poDate: inv.poDate ? String(inv.poDate).slice(0, 10) : undefined,
    accountNumber: (inv.accountNumber as string) ?? undefined,
    accountTitle: (inv.accountTitle as string) ?? "",
    saleAccount: saleAccountValue ?? (inv.saleAccount as string) ?? undefined,
    saleAccountTitle:
      saleAccountTitle ?? (inv.saleAccountTitle as string) ?? undefined,
    ntnNumber: (inv.ntnNumber as string) ?? undefined,
    amount:
      typeof inv.amount === "number"
        ? inv.amount
        : typeof inv.netAmount === "number"
        ? inv.netAmount
        : subtotal,
    netAmount: typeof inv.netAmount === "number" ? inv.netAmount : subtotal,
    province: (inv.province as "Punjab" | "Sindh") ?? undefined,
    items: mappedItems,
  };

  return invoiceObj;
}
