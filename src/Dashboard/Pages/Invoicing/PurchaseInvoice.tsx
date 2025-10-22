import { useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  TextInput,
  Textarea,
  Group,
  Select,
  Table,
  Text,
} from "@mantine/core";
import { IconPencil, IconPrinter, IconTrash } from "@tabler/icons-react";
import api from "../../../api_configuration/api";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import type { AccountNode } from "../../Context/ChartOfAccountsContext";
import { notifications } from "@mantine/notifications";
import type { JSX } from "react/jsx-runtime";

type Province = "Punjab" | "Sindh";

interface Item {
  id: string | number;
  code?: string;
  product?: string;
  description?: string;
  hsCode?: string;
  qty?: number;
  rate?: number;
  exGSTRate?: number;
  exGSTAmount?: number;
}
interface Invoice {
  id?: string | number;
  number?: string;
  invoiceNumber?: string;
  date?: string;
  supplierNo?: string;
  supplierTitle?: string;
  purchaseAccount?: string;
  purchaseTitle?: string;
  items?: Item[];
  amount?: number;
  discount?: number;
  ntnNo?: string;
  partyBillNo?: string;
  partyBillDate?: string;
  notes?: string;
}

const hsCodeTypeMap: Record<
  string,
  "Chemicals" | "Equipments" | "Pumps" | "Services"
> = {
  "3824": "Chemicals",
  "8421": "Equipments",
  "8413": "Pumps",
  "9833": "Services",
};

function getTaxRate(hsCode: string | undefined, province: Province) {
  if (!hsCode) return 0;
  const type = hsCodeTypeMap[hsCode];
  if (!type) return 0;
  if (type === "Services") {
    return province === "Punjab" ? 16 : 15;
  }
  return 18;
}
const hsOptions = Object.entries(hsCodeTypeMap).map(([code, type]) => ({
  value: code,
  label: `${code} — ${type}`,
}));
const numberToWordsLocal = (n: number) =>
  n ? String(n).toUpperCase() : "ZERO";

export default function PurchaseInvoice(): JSX.Element {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { accounts } = useChartOfAccounts() as { accounts: AccountNode[] };
  const [productOptions, setProductOptions] = useState<
    {
      value: string;
      label: string;
      productName: string;
      description?: string;
      rate?: number;
    }[]
  >([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("PUR-001");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierNo, setSupplierNo] = useState("");
  const [supplierTitle, setSupplierTitle] = useState("");
  const [purchaseTitle, setPurchaseTitle] = useState("");
  const [purchaseAccount, setPurchaseAccount] = useState("");
  const [ntnNo, setNtnNo] = useState("");
  const [discount, setDiscount] = useState<number>(0);
  const [partyBillNo, setPartyBillNo] = useState("");
  const [partyBillDate, setPartyBillDate] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");
  const [province, setProvince] = useState<Province>("Punjab");

  // derive Purchase Party accounts for supplier select
  const purchasePartyOptions = (() => {
    const results: {
      value: string;
      label: string;
      account: { code: string; name: string };
    }[] = [];

    // Simple walk function to find accounts with code starting with "221"
    function walk(nodes: AccountNode[]) {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n) continue;

        // Get the account code
        const accountCode = String(
          n.accountCode ?? n.code ?? n.selectedCode ?? ""
        );

        // Check if this is a Purchase Party account (code starts with "221")
        const isPurchaseParty = accountCode.startsWith("221");

        if (isPurchaseParty) {
          results.push({
            value: String(
              n.accountCode ?? n.code ?? n.selectedCode ?? n._id ?? ""
            ),
            label: `${n.accountCode ?? n.code ?? ""} - ${
              n.accountName ?? n.name ?? ""
            }`,
            account: {
              code: String(n.accountCode ?? n.code ?? ""),
              name: String(n.accountName ?? n.name ?? ""),
            },
          });
        }

        // Recursively walk children
        if (Array.isArray(n.children) && n.children.length > 0) {
          walk(n.children as AccountNode[]);
        }
      }
    }

    walk(accounts as AccountNode[]);

    // remove duplicate values
    const uniqueResults = results.filter(
      (r, idx, arr) => arr.findIndex((x) => x.value === r.value) === idx
    );

    // Debug log
    console.log("Purchase Party Options (Suppliers):", uniqueResults);

    return uniqueResults;
  })();

  // derive Inventory accounts (Assets -> Inventories) for Purchase Account select
  const inventoryOptions = (() => {
    const results: {
      value: string;
      label: string;
      account: { code: string; name: string };
    }[] = [];
    function walk(nodes: AccountNode[]) {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n) continue;
        const isInventory =
          String(n.accountType || "")
            .toLowerCase()
            .includes("inventory") ||
          String(n.accountCode || n.code || "")
            .toString()
            .startsWith("13") ||
          String(n.accountType || "")
            .toLowerCase()
            .includes("inventories");
        if (isInventory) {
          results.push({
            value: String(
              n.accountCode ?? n.code ?? n.selectedCode ?? n._id ?? ""
            ),
            label: `${n.accountCode ?? n.code ?? ""} - ${
              n.accountName ?? n.name ?? n.accountName ?? ""
            }`,
            account: {
              code: String(n.accountCode ?? n.code ?? ""),
              name: String(n.accountName ?? n.name ?? ""),
            },
          });
        }
        if (Array.isArray(n.children) && n.children.length)
          walk(n.children as AccountNode[]);
      }
    }
    walk(accounts as AccountNode[]);
    // remove duplicate values (Mantine Select throws on duplicate option values)
    return results.filter(
      (r, idx, arr) => arr.findIndex((x) => x.value === r.value) === idx
    );
  })();

  const printRef = useRef<HTMLDivElement | null>(null);

  const deleteInvoice = async (id: string | number) => {
    // confirm deletion
    // assumption: backend exposes DELETE /purchase-invoice/delete-purchase-invoice/:id
    const ok = window.confirm("Delete this invoice? This cannot be undone.");
    if (!ok) return;
    try {
      await api.delete(`/purchase-invoice/delete-purchase-invoice/${id}`);
      notifications.show({
        title: "Deleted",
        message: "Invoice deleted",
        color: "green",
      });
      // refresh list
      await fetchInvoices();
    } catch (err) {
      console.error(err);
      notifications.show({
        title: "Error",
        message: "Delete failed",
        color: "red",
      });
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/purchase-invoice/all-purchase-invoices");
      if (Array.isArray(res.data)) {
        const mapped = (res.data as unknown[]).map((rRaw) => {
          const r = rRaw as Record<string, unknown>;
          const itemsRaw = Array.isArray(r.items)
            ? (r.items as unknown[])
            : Array.isArray(r.products)
            ? (r.products as unknown[])
            : [];
          const items = (itemsRaw as Record<string, unknown>[]).map(
            (itRaw, idx) => {
              const it = itRaw as Record<string, unknown>;
              return {
                id: (it.id ?? it._id ?? idx) as string | number,
                code: String(
                  it.code ?? it.productCode ?? it.sku ?? it.barcode ?? ""
                ),
                product: String(
                  it.product ?? it.productName ?? it.name ?? it.title ?? ""
                ),
                description: String(
                  it.description ?? it.productDescription ?? ""
                ),
                hsCode: String(it.hsCode ?? it.hs_code ?? ""),
                qty: Number(it.qty ?? it.quantity ?? 0),
                rate: Number(it.rate ?? it.unitPrice ?? it.price ?? 0),
              } as Item;
            }
          );
          return {
            id: (r.id ?? r._id ?? Date.now()) as string | number,
            number: String(r.number ?? r.invoiceNumber ?? r.invoiceNo ?? ""),
            date: String(r.date ?? r.invoiceDate ?? r.invoice_date ?? ""),
            // typed supplier object
            supplierNo: String(
              (r.supplier as Record<string, unknown> | undefined)?.code ??
                (r.supplier as Record<string, unknown> | undefined)
                  ?.accountCode ??
                r.supplierNo ??
                ""
            ),
            supplierTitle: String(
              (r.supplier as Record<string, unknown> | undefined)?.name ??
                (r.supplier as Record<string, unknown> | undefined)
                  ?.accountName ??
                r.supplierTitle ??
                ""
            ),
            purchaseAccount: String(
              r.purchaseAccount ??
                r.purchase_account ??
                (r.supplier as Record<string, unknown> | undefined)
                  ?.purchaseAccount ??
                (r.supplier as Record<string, unknown> | undefined)
                  ?.purchase_account ??
                ""
            ),
            purchaseTitle: String(
              r.purchase_account ??
                (r.supplier as Record<string, unknown> | undefined)
                  ?.purchaseTitle ??
                (r.supplier as Record<string, unknown> | undefined)
                  ?.purchase_title ??
                ""
            ),
            items,
            amount: Number(r.totalAmount ?? r.amount ?? 0),
            ntnNo: String(r.ntnNo ?? r.ntn ?? ""),
            partyBillNo: String(r.partyBillNo ?? r.party_bill_no ?? ""),
            partyBillDate: String(r.partyBillDate ?? r.party_bill_date ?? ""),
            notes: String(r.notes ?? r.remarks ?? ""),
          } as Invoice;
        });
        setInvoices(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void fetchInvoices();
    // fetch product options for dropdowns
    const fetchProducts = async () => {
      type Product = {
        code?: string;
        productCode?: string;
        sku?: string;
        productName?: string;
        name?: string;
        productDescription?: string;
        description?: string;
        unitPrice?: number;
        price?: number;
      };
      try {
        const res = await api.get("/products");
        if (Array.isArray(res.data)) {
          setProductOptions(
            (res.data as Product[]).map((p) => ({
              value: String(p.code ?? p.productCode ?? p.sku ?? ""),
              label: `${p.code ?? p.productCode ?? p.sku ?? ""} - ${
                p.productName ?? p.name ?? ""
              }`,
              productName: p.productName ?? p.name ?? "",
              description: p.productDescription ?? p.description ?? "",
              rate: Number(p.unitPrice ?? p.price ?? 0),
            }))
          );
        }
      } catch {
        setProductOptions([]);
      }
    };
    void fetchProducts();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setInvoiceNumber(
      `PUR-${(invoices.length + 1).toString().padStart(3, "0")}`
    );
    setDate(new Date().toISOString().slice(0, 10));
    setSupplierNo("");
    setSupplierTitle("");
    setPurchaseTitle("");
    setPurchaseAccount("");
    setNtnNo("");
    setPartyBillNo("");
    setPartyBillDate("");
    setItems([]);
    setNotes("");
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (raw: any) => {
    const rawItems = raw.items ?? raw.products ?? [];
    type RawItem = {
      id?: string | number;
      _id?: string | number;
      product?: string;
      productName?: string;
      name?: string;
      title?: string;
      description?: string;
      productDescription?: string;
      hsCode?: string;
      hs_code?: string;
      qty?: number | string;
      quantity?: number | string;
      rate?: number | string;
      unitPrice?: number | string;
      price?: number | string;
    };
    const mapped: Item[] = (Array.isArray(rawItems) ? rawItems : []).map(
      (it: RawItem & { code?: string; productCode?: string }, i: number) => ({
        id: it.id ?? it._id ?? i,
        code: it.code ?? it.productCode ?? "",
        product: it.product ?? it.productName ?? it.name ?? it.title ?? "",
        description: it.description ?? it.productDescription ?? "",
        hsCode: it.hsCode ?? it.hs_code ?? "",
        qty: Number(it.qty ?? it.quantity ?? 0),
        rate: Number(it.rate ?? it.unitPrice ?? it.price ?? 0),
      })
    );
    const supplierObj = raw.supplier ?? raw.party ?? {};
    setInvoiceNumber(raw.number ?? raw.invoiceNumber ?? raw.invoiceNo ?? "");
    setDate(
      raw.date ??
        raw.invoiceDate ??
        raw.invoice_date ??
        new Date().toISOString().slice(0, 10)
    );
    setSupplierNo(
      raw.supplierNo ?? supplierObj.code ?? supplierObj.accountCode ?? ""
    );
    setSupplierTitle(
      raw.supplierTitle ?? supplierObj.name ?? supplierObj.accountName ?? ""
    );
    setPurchaseTitle(
      raw.purchaseTitle ??
        raw.purchase_account ??
        supplierObj.purchaseTitle ??
        ""
    );
    setPurchaseAccount(
      raw.purchaseAccount ??
        raw.purchase_account ??
        supplierObj.purchaseAccount ??
        ""
    );
    setNtnNo(raw.ntnNo ?? supplierObj.ntn ?? supplierObj.salesTaxNo ?? "");
    setDiscount(Number(raw.discount ?? 0));
    setPartyBillNo(raw.partyBillNo ?? raw.party_bill_no ?? "");
    setPartyBillDate(raw.partyBillDate ?? raw.party_bill_date ?? "");
    setItems(mapped);
    setNotes(raw.notes ?? raw.remarks ?? "");
    setEditing({
      id: raw.id ?? raw._id,
      invoiceNumber: raw.number ?? raw.invoiceNumber ?? "",
      date: raw.date ?? raw.invoiceDate ?? "",
      supplierNo: supplierObj.code ?? "",
      supplierTitle: supplierObj.name ?? "",
      purchaseAccount:
        supplierObj.purchaseAccount ??
        raw.purchaseAccount ??
        raw.purchase_account ??
        "",
      purchaseTitle: supplierObj.purchaseTitle ?? raw.purchaseTitle ?? "",
      items: mapped,
      amount: raw.totalAmount ?? raw.amount ?? 0,
    });
    setModalOpen(true);
  };

  const addItem = () =>
    setItems((s) => [
      ...s,
      {
        id: Date.now(),
        code: "",
        product: "",
        description: "",
        hsCode: "",
        qty: 0,
        rate: 0,
        exGSTRate: 0,
        exGSTAmount: 0,
      },
    ]);
  const updateItem = <K extends keyof Item>(
    id: string | number,
    field: K,
    value: Item[K]
  ) =>
    setItems((s) =>
      s.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  const removeItem = (id: string | number) =>
    setItems((s) => s.filter((i) => i.id !== id));

  const buildPrintableHtml = (invoice: Invoice) => {
    const itemsList = invoice.items || [];
    const subtotal = itemsList.reduce(
      (s, it) => s + (it.qty || 0) * (it.rate || 0),
      0
    );
    const salesTax = itemsList.reduce(
      (s, it) =>
        s +
        ((it.qty || 0) * (it.rate || 0) * getTaxRate(it.hsCode, province)) /
          100,
      0
    );
    const grandTotal = subtotal + salesTax;

    const rowsHtml = itemsList
      .map((item, idx) => {
        const gst = getTaxRate(item.hsCode, province);
        const net = (item.qty || 0) * (item.rate || 0);
        return `<tr><td style="border:1px solid #000;padding:8px;text-align:center">${
          idx + 1
        }</td><td style="border:1px solid #000;padding:8px">${String(
          item.product || item.description || ""
        ).replace(
          /</g,
          "&lt;"
        )}</td><td style="border:1px solid #000;padding:8px;text-align:center">${
          item.hsCode || ""
        }</td><td style="border:1px solid #000;padding:8px;text-align:center">${gst.toFixed(
          2
        )}</td><td style="border:1px solid #000;padding:8px;text-align:center">${(
          item.rate || 0
        ).toFixed(
          2
        )}</td><td style="border:1px solid #000;padding:8px;text-align:center">${(
          item.qty || 0
        ).toFixed(
          2
        )}</td><td style="border:1px solid #000;padding:8px;text-align:right">${net.toFixed(
          2
        )}</td></tr>`;
      })
      .join("");

    const desiredRows = 8;
    const paddingCount = Math.max(0, desiredRows - itemsList.length);
    const paddingRows = Array.from({ length: paddingCount })
      .map(
        () =>
          `<tr><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td></tr>`
      )
      .join("");

    const html =
      `<!doctype html><html><head><meta charset="utf-8"/><title>Invoice</title><style>body{font-family:Arial,sans-serif;color:#222;margin:24px}table{width:100%;border-collapse:collapse;border:2px solid #000}th,td{border:1px solid #000;padding:8px;font-size:12px;vertical-align:top}thead th:nth-child(2),tbody td:nth-child(2){width:40%}tbody tr{height:48px}.right{text-align:right}.muted{color:#666;font-size:12px}</style></head><body>` +
      `<div style="padding:0;margin-bottom:12px"><img src="/Header.jpg" style="display:block;width:100%;height:auto;max-height:120px;object-fit:contain"/></div>` +
      `<div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="border:1px solid #222;padding:8px;flex:1;margin-right:8px"><div><strong>Title:</strong> ${
        invoice.supplierTitle || ""
      }</div><div><strong>NTN:</strong> ${
        invoice.ntnNo || ""
      }</div></div><div style="width:320px;border:1px solid #222;padding:8px"><div><strong>Invoice No:</strong> ${
        invoice.invoiceNumber || ""
      }</div><div><strong>Invoice Date:</strong> ${
        invoice.date || ""
      }</div><div><strong>Supplier No:</strong> ${
        invoice.supplierNo || ""
      }</div></div></div>` +
      `<table><thead><tr><th>SR No</th><th>Description</th><th>HS Code</th><th>GST %</th><th>Rate</th><th>Qty</th><th>Net Amount</th></tr></thead><tbody>` +
      rowsHtml +
      paddingRows +
      `</tbody></table>` +
      `<div style="margin-top:8px;font-size:12px;color:#666">*Computer generated invoice. No need for signature</div>` +
      `<div style="margin-top:12px;display:flex;justify-content:flex-end"><div style="width:360px;border:1px solid #222;padding:12px"><div style="display:flex;justify-content:space-between"><div>Gross Total:</div><div>${subtotal.toFixed(
        2
      )}</div></div><div style="display:flex;justify-content:space-between"><div>Sales Tax:</div><div>${salesTax.toFixed(
        2
      )}</div></div><div style="display:flex;justify-content:space-between"><div>Discount:</div><div>${(
        invoice.discount ?? 0
      ).toFixed(
        2
      )}</div></div><hr/><div style="display:flex;justify-content:space-between;font-weight:bold"><div>Grand Total Inclusive Tax:</div><div>${(
        grandTotal - (invoice.discount ?? 0)
      ).toFixed(
        2
      )}</div></div><div style="margin-top:10px;font-size:12px">Amount in words: ${numberToWordsLocal(
        Math.round(grandTotal - (invoice.discount ?? 0))
      )}</div></div></div>` +
      `<div style="margin-top:18px;page-break-inside:avoid"><img src="/Footer.jpg" style="width:100%;max-height:120px;object-fit:contain"/></div>` +
      `</body></html>`;

    return html;
  };

  const handlePrintWindow = (invoice: Invoice) => {
    const html = buildPrintableHtml(invoice);
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (err) {
        console.error(err);
      }
    }, 250);
  };

  const onModalPrint = () => {
    const printable: Invoice = {
      id: editing?.id ?? Date.now(),
      invoiceNumber: invoiceNumber,
      date,
      supplierNo,
      supplierTitle,
      items,
      amount: items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0),
      discount,
      ntnNo,
      partyBillNo,
      partyBillDate,
      notes,
    };
    handlePrintWindow(printable);
  };

  const save = async () => {
    try {
      const payload = {
        invoiceNumber,
        invoiceDate: date,
        partyBillNo,
        partyBillDate,
        supplier: {
          name: supplierTitle,
          code: supplierNo,
          purchaseAccount,
          purchaseTitle,
        },
        items,
        notes,
        discount,
        totalAmount:
          items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0) -
          (discount || 0),
      };
      if (editing) {
        await api.put(
          `/purchase-invoice/update-purchase-invoice/${editing.id}`,
          payload
        );
        notifications.show({
          title: "Success",
          message: "Updated",
          color: "green",
        });
      } else {
        await api.post(`/purchase-invoice/create-purchase-invoice`, payload);
        notifications.show({
          title: "Success",
          message: "Created",
          color: "green",
        });
      }
      setModalOpen(false);
      try {
        const res = await api.get("/purchase-invoice/all-purchase-invoices");
        if (Array.isArray(res.data)) {
          type RawInvoice = Record<string, unknown>;
          const mapped = (res.data as unknown[]).map((r: unknown) => {
            const obj = r as RawInvoice;
            const id = (obj.id ?? obj._id ?? Date.now()) as string | number;
            const number = (obj.number ??
              obj.invoiceNumber ??
              obj.invoiceNo ??
              "") as string;
            const date = (obj.date ??
              obj.invoiceDate ??
              obj.invoice_date ??
              "") as string;
            const supplierObj =
              (obj.supplier as Record<string, unknown> | undefined) ??
              undefined;
            const supplierTitle =
              (supplierObj && (supplierObj.name ?? supplierObj.accountName)) ??
              obj.supplierTitle ??
              "";
            const supplierNo =
              (supplierObj && (supplierObj.code ?? supplierObj.accountCode)) ??
              obj.supplierNo ??
              "";
            const itemsRaw = Array.isArray(obj.items)
              ? (obj.items as unknown[])
              : Array.isArray(obj.products)
              ? (obj.products as unknown[])
              : [];
            type RawItem = {
              id?: string | number;
              _id?: string | number;
              code?: string;
              productCode?: string;
              sku?: string;
              product?: string;
              productName?: string;
              name?: string;
              description?: string;
              productDescription?: string;
              hsCode?: string;
              hs_code?: string;
              qty?: number;
              quantity?: number;
              rate?: number;
              unitPrice?: number;
              price?: number;
            };
            const items = (itemsRaw as RawItem[]).map(
              (it: RawItem, idx: number) => {
                return {
                  id: it.id ?? it._id ?? idx,
                  code: it.code ?? it.productCode ?? it.sku ?? "",
                  product: it.product ?? it.productName ?? it.name ?? "",
                  description: it.description ?? it.productDescription ?? "",
                  hsCode: it.hsCode ?? it.hs_code ?? "",
                  qty: Number(it.qty ?? it.quantity ?? 0),
                  rate: Number(it.rate ?? it.unitPrice ?? it.price ?? 0),
                };
              }
            );
            const amount = (obj.totalAmount ?? obj.amount ?? 0) as number;

            return {
              id,
              number,
              date,
              supplierTitle: String(supplierTitle),
              supplierNo: String(supplierNo),
              items,
              amount,
            } as Invoice;
          });
          setInvoices(mapped);
        }
      } catch (err) {
        console.error(err);
      }
    } catch (e) {
      console.error(e);
      notifications.show({
        title: "Error",
        message: "Save failed",
        color: "red",
      });
    }
  };

  return (
    <div>
      <Group justify="space-between" style={{ marginBottom: 12 }}>
        <Text size="xl" fw={700}>
          Purchase Invoice
        </Text>
        <div>
          <Button onClick={resetForm}>+ Create Purchase Invoice</Button>
        </div>
      </Group>

      <Table highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Invoice #</Table.Th>
            <Table.Th>Date</Table.Th>
            <Table.Th>Supplier</Table.Th>
            <Table.Th>Purchase Account</Table.Th>
            <Table.Th>Purchase Title</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {invoices.map((inv) => (
            <Table.Tr key={String(inv.id)}>
              <Table.Td>{inv.invoiceNumber || inv.invoiceNumber}</Table.Td>
              <Table.Td>{inv.date}</Table.Td>
              <Table.Td>{inv.supplierTitle}</Table.Td>
              <Table.Td>{inv.purchaseAccount || ""}</Table.Td>
              <Table.Td>{inv.purchaseTitle || ""}</Table.Td>
              <Table.Td>{(inv.amount ?? 0).toFixed(2)}</Table.Td>
              <Table.Td>
                <Group>
                  <Button
                    variant="subtle"
                    onClick={() => openEdit(inv)}
                    leftSection={<IconPencil size={16} />}
                  ></Button>
                  <Button
                    variant="subtle"
                    color="red"
                    onClick={() => deleteInvoice(inv.id ?? "")}
                    leftSection={<IconTrash size={16} />}
                  ></Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Purchase Invoice" : "Create Purchase Invoice"}
        centered
        size="80%"
      >
        <div style={{ display: "grid", gap: 10 }}>
          <Group>
            <TextInput
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
            />
            <TextInput
              label="Invoice Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </Group>

          <Group>
            <TextInput
              label="Party Bill No"
              value={partyBillNo}
              onChange={(e) => setPartyBillNo(e.currentTarget.value)}
            />
            <TextInput
              label="Party Bill Date"
              type="date"
              value={partyBillDate}
              onChange={(e) => setPartyBillDate(e.currentTarget.value)}
            />
          </Group>

          <Group>
            <Select
              label="Supplier (Purchase Party)"
              data={purchasePartyOptions.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              value={supplierNo}
              onChange={(val) => {
                const sel = purchasePartyOptions.find((p) => p.value === val);
                if (sel) {
                  setSupplierNo(sel.account.code);
                  setSupplierTitle(sel.account.name);
                } else {
                  setSupplierNo("");
                  setSupplierTitle("");
                }
              }}
              searchable
              styles={{ input: { width: 220 } }}
            />
            <TextInput
              label="Supplier Title"
              value={supplierTitle}
              onChange={(e) => setSupplierTitle(e.currentTarget.value)}
            />
            <Select
              label="Purchase Account (Inventory)"
              data={inventoryOptions.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
              value={purchaseAccount}
              onChange={(val) => {
                const sel = inventoryOptions.find((p) => p.value === val);
                if (sel) {
                  setPurchaseAccount(sel.account.code);
                  setPurchaseTitle(sel.account.name);
                } else {
                  setPurchaseAccount("");
                  setPurchaseTitle("");
                }
              }}
              searchable
              styles={{ input: { width: 220 } }}
            />
            <TextInput
              label="Purchase Title"
              value={purchaseTitle}
              onChange={(e) => setPurchaseTitle(e.currentTarget.value)}
            />
            <Select
              label="Province"
              data={[
                { value: "Punjab", label: "Punjab" },
                { value: "Sindh", label: "Sindh" },
              ]}
              value={province}
              onChange={(val) => val && setProvince(val as Province)}
            />
            <TextInput
              label="NTN No"
              value={ntnNo}
              onChange={(e) => setNtnNo(e.currentTarget.value)}
            />
          </Group>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <strong>Items</strong>
              <Button size="xs" onClick={addItem}>
                + Add
              </Button>
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8,
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Code</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    Product Name
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    HS Code
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    Quantity
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>Rate</th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    Net Amount
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    GST %
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    EX.GST Rate
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}>
                    EX.GST Amount
                  </th>
                  <th style={{ border: "1px solid #ddd", padding: 6 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const qty = Number(it.qty || 0);
                  const rate = Number(it.rate || 0);
                  const net = qty * rate;
                  const gstPct = getTaxRate(String(it.hsCode || ""), province);
                  const exGSTRate = gstPct; // kept same naming
                  const exGSTAmount = (net * exGSTRate) / 100;
                  return (
                    <tr key={String(it.id)}>
                      <td style={{ border: "1px solid #ddd", padding: 6 }}>
                        <Select
                          data={productOptions}
                          value={it.code || ""}
                          onChange={(val) => {
                            const selected = productOptions.find(
                              (p) => p.value === val
                            );
                            updateItem(it.id, "code", val ?? "");
                            if (selected) {
                              updateItem(
                                it.id,
                                "product",
                                selected.productName
                              );
                              if (selected.rate !== undefined)
                                updateItem(
                                  it.id,
                                  "rate",
                                  selected.rate as number
                                );
                              if (selected.description)
                                updateItem(
                                  it.id,
                                  "description",
                                  selected.description
                                );
                            }
                          }}
                          searchable
                          styles={{ input: { width: 100 } }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 6 }}>
                        <Select
                          data={productOptions.map((p) => ({
                            value: p.value,
                            label: p.label,
                          }))}
                          value={
                            productOptions.find(
                              (p) => p.value === (it.code || "")
                            )?.value ?? ""
                          }
                          onChange={(val) => {
                            const selected = productOptions.find(
                              (p) => p.value === val
                            );
                            if (selected) {
                              updateItem(it.id, "code", selected.value);
                              updateItem(
                                it.id,
                                "product",
                                selected.productName
                              );
                              if (selected.rate !== undefined)
                                updateItem(
                                  it.id,
                                  "rate",
                                  selected.rate as number
                                );
                              if (selected.description)
                                updateItem(
                                  it.id,
                                  "description",
                                  selected.description
                                );
                            }
                          }}
                          searchable
                          styles={{ input: { width: "100%" } }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 6 }}>
                        <Select
                          data={hsOptions}
                          value={it.hsCode || ""}
                          onChange={(val) =>
                            updateItem(it.id, "hsCode", val ?? "")
                          }
                          searchable
                          styles={{ input: { width: 120 } }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 6 }}>
                        <input
                          type="number"
                          value={it.qty ?? 0}
                          onChange={(e) =>
                            updateItem(it.id, "qty", Number(e.target.value))
                          }
                          style={{ width: 80 }}
                        />
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 6 }}>
                        <input
                          type="number"
                          value={it.rate ?? 0}
                          onChange={(e) =>
                            updateItem(it.id, "rate", Number(e.target.value))
                          }
                          style={{ width: 120 }}
                        />
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 6,
                          textAlign: "right",
                        }}
                      >
                        {net.toFixed(2)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 6,
                          textAlign: "center",
                        }}
                      >
                        {gstPct.toFixed(2)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 6,
                          textAlign: "center",
                        }}
                      >
                        {exGSTRate.toFixed(2)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #ddd",
                          padding: 6,
                          textAlign: "right",
                        }}
                      >
                        {exGSTAmount.toFixed(2)}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: 6 }}>
                        <Button
                          color="red"
                          size="xs"
                          onClick={() => removeItem(it.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />

          <Group>
            <TextInput
              label="Discount"
              type="number"
              value={String(discount)}
              onChange={(e) => setDiscount(Number(e.currentTarget.value))}
            />
          </Group>

          <Group justify="flex-end" gap={8}>
            <Button
              variant="outline"
              leftSection={<IconPrinter size={16} />}
              onClick={onModalPrint}
            >
              Print
            </Button>
            <Button color="#0A6802" onClick={save}>
              {editing ? "Update" : "Create"}
            </Button>
          </Group>
        </div>
      </Modal>

      {/* Hidden DOM printable template for window.print fallback */}
      <div
        style={{ position: "fixed", left: -9999, top: 0, width: 900 }}
        ref={printRef}
      />
    </div>
  );
}
