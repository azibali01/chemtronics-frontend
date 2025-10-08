import { useState, useRef, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  Table,
  Modal,
  TextInput,
  ActionIcon,
  NumberInput,
  Textarea,
  Select,
  Switch,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconSearch,
  IconDownload,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSalesInvoice } from "../../Context/Invoicing/SalesInvoiceContext";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import axios from "axios";
import { notifications } from "@mantine/notifications";

export interface InvoiceItem {
  id: number;
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
  id: number;
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

import type { AccountNode as ChartAccountNode } from "../../Context/ChartOfAccountsContext";
import { getReceivableAccounts } from "../../utils/receivableAccounts";
type AccountNode = ChartAccountNode;

const saleAccountTitleMap: Record<string, string> = {
  "4114": "Sale Of Chemicals and Equipments",
  "4112": "Sale Of Equipments",
  "4111": "Sales Of Chemicals",
  "4113": "Services",
};

const hsCodeTypeMap: Record<
  string,
  "Chemicals" | "Equipments" | "Pumps" | "Services"
> = {
  "3824": "Chemicals",
  "8421": "Equipments",
  "8413": "Pumps",
  "9833": "Services",
};

function getTaxRate(hsCode: string, province: "Punjab" | "Sindh") {
  const type = hsCodeTypeMap[hsCode];
  if (!type) return 0;
  if (type === "Services") {
    return province === "Punjab" ? 16 : 15;
  }
  return 18;
}

function addHeaderFooter(doc: jsPDF, title: string) {
  doc.setFontSize(18);
  doc.text("CHEMTRONIX ENGINEERING SOLUTION", 14, 14);
  doc.setFontSize(12);
  doc.text(title, 14, 24);

  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setFontSize(10);
  doc.text(
    "*Computer generated invoice. No need for signature",
    14,
    pageHeight - 20
  );
  doc.setFontSize(11);
  doc.text(
    "HEAD OFFICE: 552 Mujtaba Canal View, Main Qasimpur Canal Road, Multan",
    14,
    pageHeight - 14
  );
  doc.text(
    "PLANT SITE: 108-1 Tufailabad Industrial Estate Multan",
    14,
    pageHeight - 8
  );
}

function PrintableInvoice({ invoice }: { invoice: Invoice | null }) {
  if (!invoice) return <div>No invoice to print</div>;
  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial",
        background: "#fff",
        color: "#222",
      }}
    >
      <h2>Invoice #{invoice.invoiceNumber}</h2>
      <p>Date: {invoice.invoiceDate}</p>
      <p>Account: {invoice.accountTitle}</p>
      <p>Amount: ${invoice.amount?.toFixed(2)}</p>
    </div>
  );
}

function getNextInvoiceNumber(invoices: Invoice[]) {
  const numbers = invoices
    .map((inv) => {
      const match = inv.invoiceNumber?.match(/^INV-(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n) => n !== null) as number[];
  const max = numbers.length ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `INV-${next.toString().padStart(3, "0")}`;
}

// (Removed duplicate/unused getSalesAccounts function)

export default function SalesInvoicePage() {
  // Always fetch latest Chart of Accounts on mount
  const { setAccounts } = useChartOfAccounts();
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axios.get("http://localhost:3000/chart-of-account");
        if (Array.isArray(res.data)) {
          setAccounts(res.data);
        }
      } catch {
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, [setAccounts]);
  // ...existing code...
  // ...existing code...
  const { invoices, setInvoices } = useSalesInvoice();
  const { accounts } = useChartOfAccounts();

  // Debug: log only Revenue accounts when accounts change
  useEffect(() => {
    const allRevenueAccounts: AccountNode[] = [];
    function collectRevenueAccounts(nodes: AccountNode[]) {
      if (!Array.isArray(nodes)) return;
      nodes.forEach((node) => {
        if (!node) return;
        if (String(node.accountType) === "REVENUE") {
          allRevenueAccounts.push(node);
        }
        if (node.children && node.children.length > 0) {
          collectRevenueAccounts(node.children);
        }
      });
    }
    collectRevenueAccounts(accounts);
    console.log("All Revenue accounts:", allRevenueAccounts);
  }, [accounts]);
  const printRef = useRef<HTMLDivElement>(null);

  // Debug: log only Revenue accounts when accounts change

  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState(
    getNextInvoiceNumber(invoices)
  );
  const [newInvoiceDate, setNewInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [newDeliveryNumber, setNewDeliveryNumber] = useState("");
  const [newDeliveryDate, setNewDeliveryDate] = useState("");
  const [newPoNumber, setNewPoNumber] = useState("");
  const [newPoDate, setNewPoDate] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountTitle, setNewAccountTitle] = useState("");
  const [newSaleAccount, setNewSaleAccount] = useState("");
  const [newSaleAccountTitle, setNewSaleAccountTitle] = useState("");
  const [newNtnNumber, setNewNtnNumber] = useState("");
  const [includeGST, setIncludeGST] = useState(true);
  const [province, setProvince] = useState<"Punjab" | "Sindh">("Punjab");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      code: "",
      product: "",
      hsCode: "",
      description: "",
      qty: 0,
      rate: 0,
      exGSTRate: 0,
      exGSTAmount: 0,
    },
  ]);
  const [notes, setNotes] = useState("");
  const [pageSize, setPageSize] = useState(8);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [currentInvoiceForPrint, setCurrentInvoiceForPrint] =
    useState<Invoice | null>(null);

  const [productCodes, setProductCodes] = useState<
    {
      value: string;
      label: string;
      productName: string;
      description: string;
      rate: number;
    }[]
  >([]);

  const subtotal = items.reduce(
    (acc: number, i: InvoiceItem) => acc + i.qty * i.rate,
    0
  );

  const gstAmount = includeGST ? subtotal * 0.18 : 0;

  const netTotal = subtotal + gstAmount;

  const exGstAmount = items.reduce(
    (acc: number, i: InvoiceItem) =>
      acc + (i.qty * i.rate * getTaxRate(i.hsCode, province)) / 100,
    0
  );

  const totalGst = items.reduce(
    (acc: number, i: InvoiceItem) => acc + getTaxRate(i.hsCode, province),
    0
  );

  useEffect(() => {
    fetchSalesInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    interface Product {
      code: string;
      productName?: string;
      name?: string;
      productDescription?: string;
      description?: string;
      unitPrice?: number;
    }
    const fetchProductCodes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/products");
        if (Array.isArray(res.data)) {
          setProductCodes(
            res.data.map((p: Product) => ({
              value: p.code,
              label: `${p.code} - ${p.productName || p.name || ""}`,
              productName: p.productName || p.name || "",
              description: p.productDescription || p.description || "",
              rate: p.unitPrice || 0,
            }))
          );
        }
      } catch {
        setProductCodes([]);
      }
    };
    fetchProductCodes();
  }, []);

  const salesAccountOptions = getSalesAccounts(accounts)
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((a) => ({
      ...a,
      value: a.code && a.accountName ? `${a.code}-${a.accountName}` : a.value,
    }));

  useEffect(() => {
    // (console.log removed)
  }, [accounts, salesAccountOptions]);

  const fetchSalesInvoices = async () => {
    try {
      const response = await axios.get("http://localhost:3000/sale-invoice");
      // Map backend 'products' to frontend 'items' for table compatibility
      const mapped = Array.isArray(response.data)
        ? response.data.map((inv) => ({
            ...inv,
            id: inv._id ? String(inv._id) : String(inv.id),
            items: inv.products || [], // Map products to items
            invoiceDate: inv.invoiceDate ? inv.invoiceDate.slice(0, 10) : "",
            deliveryDate: inv.deliveryDate ? inv.deliveryDate.slice(0, 10) : "",
            poDate: inv.poDate ? inv.poDate.slice(0, 10) : "",
          }))
        : [];
      setInvoices(mapped);
    } catch (error) {
      console.error("Error fetching sales invoices:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch sales invoices",
        color: "red",
      });
    }
  };

  const createSalesInvoice = async () => {
    try {
      if (!newInvoiceNumber || !newInvoiceDate || !newAccountTitle) {
        notifications.show({
          title: "Validation Error",
          message: "Please fill in all required fields",
          color: "red",
        });
        return;
      }

      const payload = {
        invoiceNumber: newInvoiceNumber,
        invoiceDate: newInvoiceDate,
        deliveryNumber: newDeliveryNumber,
        deliveryDate: newDeliveryDate,
        poNumber: newPoNumber,
        poDate: newPoDate,
        accountNumber: newAccountNumber,
        accountTitle: newAccountTitle,
        saleAccount: newSaleAccount,
        saleAccountTitle: newSaleAccountTitle,
        ntnNumber: newNtnNumber,
        amount: netTotal,
        netAmount: netTotal,
        province,
        products: items,
      };

      const response = await axios.post(
        "http://localhost:3000/sale-invoice",
        payload
      );

      if (response.data) {
        // Map _id to id for new invoice
        const newInvoice = {
          ...response.data,
          id: response.data._id
            ? String(response.data._id)
            : String(response.data.id),
        };
        setInvoices((prev) => [newInvoice, ...prev]);

        notifications.show({
          title: "Success",
          message: "Sales invoice created successfully",
          color: "green",
        });

        setCreateModal(false);
        resetForm();
      }
    } catch (error: unknown) {
      let message = "Failed to create sales invoice";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
      ) {
        message =
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? message;
      }
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
      console.error("Error creating sales invoice:", error);
    }
  };

  const updateSalesInvoice = async (invoiceData: Invoice) => {
    try {
      const payload = {
        ...invoiceData,
        amount: editTotal,
        netAmount: editNetAmount,
        province,
      };

      const response = await axios.put(
        `http://localhost:3000/sale-invoice/${editInvoice?.id}`,
        payload
      );

      if (response.data) {
        // Map _id to id for updated invoice
        const updatedInvoice = {
          ...response.data,
          id: response.data._id
            ? String(response.data._id)
            : String(response.data.id),
        };
        setInvoices((prev) =>
          prev.map((i) => (i.id === editInvoice?.id ? updatedInvoice : i))
        );

        notifications.show({
          title: "Success",
          message: "Sales invoice updated successfully",
          color: "green",
        });

        setEditInvoice(null);
      }
    } catch (error: unknown) {
      let message = "Failed to update sales invoice";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
      ) {
        message =
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? message;
      }
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
      console.error("Error updating sales invoice:", error);
    }
  };

  const deleteSalesInvoice = async (invoiceId: number) => {
    try {
      await axios.delete(`http://localhost:3000/sale-invoice/${invoiceId}`);

      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));

      notifications.show({
        title: "Success",
        message: "Sales invoice deleted successfully",
        color: "green",
      });

      setDeleteInvoice(null);
    } catch (error: unknown) {
      let message = "Failed to delete sales invoice";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
      ) {
        message =
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message ?? message;
      }
      notifications.show({
        title: "Error",
        message,
        color: "red",
      });
      console.error("Error deleting sales invoice:", error);
    }
  };

  const resetForm = () => {
    setNewInvoiceNumber(getNextInvoiceNumber(invoices));
    setNewInvoiceDate(() => {
      const today = new Date();
      return today.toISOString().slice(0, 10);
    });
    setNewDeliveryNumber("");
    setNewDeliveryDate("");
    setNewPoNumber("");
    setNewPoDate("");
    setNewAccountNumber("");
    setNewAccountTitle("");
    setNewSaleAccount("");
    setNewSaleAccountTitle("");
    setNewNtnNumber("");
    setItems([
      {
        id: 1,
        code: "",
        product: "",
        hsCode: "",
        description: "",
        qty: 0,
        rate: 0,
        exGSTRate: 0,
        exGSTAmount: 0,
      },
    ]);
    setNotes("");
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setCurrentInvoiceForPrint(invoice);
    setTimeout(() => {
      const printContent = document.getElementById(
        "invoice-print-content"
      )?.innerHTML;
      if (printContent) {
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(`
          <html>
            <head>
              <title>Sales Invoice</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 24px; }
                /* Add more print styles here if needed */
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 300);
        }
      }
      setCurrentInvoiceForPrint(null);
    }, 100);
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch = i.invoiceNumber
      ? i.invoiceNumber.toLowerCase().includes(search.toLowerCase())
      : false;

    const invoiceDate = new Date(i.invoiceDate + "T00:00:00").getTime();
    const fromOk = fromDate
      ? invoiceDate >= new Date(fromDate + "T00:00:00").getTime()
      : true;
    const toOk = toDate
      ? invoiceDate <= new Date(toDate + "T00:00:00").getTime()
      : true;
    return matchesSearch && fromOk && toOk;
  });

  const start = (page - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(start, start + pageSize);

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const exportInvoicesPDF = () => {
    const doc = new jsPDF();
    addHeaderFooter(doc, "Sales Invoices");

    autoTable(doc, {
      startY: 32,
      head: [
        [
          "Invoice #",
          "Invoice Date",
          "Delivery No",
          "Delivery Date",
          "PO No",
          "PO Date",
          "Account No",
          "Account Title",
          "Sale Account",
          "Sale Account Title",
          "NTN No",
          "Amount",
        ],
      ],
      body: filteredInvoices.map((i) => [
        i.invoiceNumber,
        i.invoiceDate,
        i.deliveryNumber || "",
        i.deliveryDate || "",
        i.poNumber || "",
        i.poDate || "",
        i.accountNumber || "",
        i.accountTitle || "",
        i.saleAccount || "",
        i.saleAccountTitle || "",
        i.ntnNumber || "",
        i.amount.toFixed(2),
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const finalY = (data.cursor?.y ?? 60) + 8;
        doc.setFontSize(12);
        doc.text(`Total Invoices: ${filteredInvoices.length}`, 14, finalY);
        doc.text(
          `Total Amount: ${filteredInvoices
            .reduce((sum, i) => sum + (i.amount || 0), 0)
            .toFixed(2)}`,
          80,
          finalY
        );
      },
    });

    doc.save("sales_invoices.pdf");
  };

  const exportSingleInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    addHeaderFooter(doc, `Invoice: ${invoice.invoiceNumber}`);

    autoTable(doc, {
      startY: 32,
      head: [["Field", "Value"]],
      body: [
        ["Invoice #", invoice.invoiceNumber],
        ["Invoice Date", invoice.invoiceDate],
        ["Delivery No", invoice.deliveryNumber || ""],
        ["Delivery Date", invoice.deliveryDate || ""],
        ["PO No", invoice.poNumber || ""],
        ["PO Date", invoice.poDate || ""],
        ["Account No", invoice.accountNumber || ""],
        ["Account Title", invoice.accountTitle || ""],
        ["Sale Account", invoice.saleAccount || ""],
        ["Sale Account Title", invoice.saleAccountTitle || ""],
        ["NTN No", invoice.ntnNumber || ""],
        ["Amount", `$${invoice.amount.toFixed(2)}`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    // Items table (after details table)
    if (invoice.items && invoice.items.length > 0) {
      const lastAutoTable = (
        doc as jsPDF & { lastAutoTable?: { finalY?: number } }
      ).lastAutoTable;
      const startY =
        lastAutoTable?.finalY !== undefined ? lastAutoTable.finalY + 8 : 60;
      autoTable(doc, {
        startY,
        head: [
          [
            "Code",
            "Product Name",
            "HS Code",
            "Description",
            "Qty",
            "Rate",
            "EX.GST Rate",
            "EX.GST Amt",
            "Amount",
          ],
        ],
        body: (invoice.items ?? []).map((item) => [
          item.code,
          item.product,
          item.hsCode,
          item.description,
          item.qty,
          item.rate,
          item.exGSTRate,
          item.exGSTAmount,
          (item.qty * item.rate).toFixed(2),
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [10, 104, 2] },
        theme: "grid",
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const finalY = (data.cursor?.y ?? 68) + 8;
          doc.setFontSize(12);
          const subtotal = (invoice.items ?? []).reduce(
            (acc, i) => acc + i.qty * i.rate,
            0
          );
          const gstAmount = invoice.amount - subtotal;
          doc.text(`Subtotal: ${subtotal.toFixed(2)}`, 14, finalY);
          doc.text(`GST: ${gstAmount.toFixed(2)}`, 60, finalY);
          doc.text(
            `Total: ${
              invoice.amount !== undefined ? invoice.amount.toFixed(2) : "0.00"
            }`,
            110,
            finalY
          );
        },
      });
    }

    doc.save(`invoice_${invoice.invoiceNumber}.pdf`);
  };

  const editSubtotal =
    editInvoice?.items?.reduce(
      (acc: number, i: InvoiceItem) => acc + i.qty * i.rate,
      0
    ) || 0;
  const editGstAmount = includeGST ? editSubtotal * 0.18 : 0;
  const editTotal = editSubtotal + editGstAmount;
  const editNetAmount = editTotal;

  const editExGstAmount =
    editInvoice?.items?.reduce(
      (acc: number, i: InvoiceItem) =>
        acc + (i.qty * i.rate * getTaxRate(i.hsCode, province)) / 100,
      0
    ) || 0;
  const editTotalGst =
    editInvoice?.items?.reduce(
      (acc: number, i: InvoiceItem) => acc + getTaxRate(i.hsCode, province),
      0
    ) || 0;

  const handleOpenCreateModal = () => {
    setNewInvoiceNumber(getNextInvoiceNumber(invoices));
    setCreateModal(true);
  };

  // Helper: Get all sales accounts (children under 4110 - Sales)
  function getSalesAccounts(nodes: AccountNode[]): {
    value: string;
    label: string;
    code: string;
    accountName: string;
    accountCode?: string;
  }[] {
    const result: {
      value: string;
      label: string;
      code: string;
      accountName: string;
      accountCode?: string;
    }[] = [];

    function walk(node: AccountNode) {
      if (!node) return;

      // Map all accounts where selectedAccountType1 === '4100'
      if (
        node.selectedAccountType1 === "4100" &&
        node.accountCode &&
        node.accountName
      ) {
        result.push({
          value: node.accountCode,
          label: `${node.accountCode} - ${node.accountName}`,
          code: node.accountCode,
          accountName: node.accountName,
          accountCode: node.accountCode,
        });
      }

      // Continue to children
      if (node.children && node.children.length > 0) {
        node.children.forEach(walk);
      }
    }

    // Traverse all nodes (including root level)
    if (Array.isArray(nodes)) {
      nodes.forEach(walk);
    }
    return result;
  }

  // Use utility to get all receivable accounts (1410 and children)
  const receivablesAccounts = getReceivableAccounts(accounts as AccountNode[]);

  const accountNoOptions = receivablesAccounts.map((acc: AccountNode) => ({
    value: acc.accountCode || acc.selectedCode,
    label: `${acc.accountCode || acc.selectedCode} - ${acc.accountName}`,
  }));
  const accountTitleOptions = receivablesAccounts.map((acc: AccountNode) => ({
    value: acc.accountName,
    label: acc.accountName,
    code: acc.accountCode || acc.selectedCode,
  }));

  // Remove empty/duplicate/invalid options for account selects
  const uniqueAccountNoOptions: { value: string; label: string }[] = Array.from(
    new Map(
      accountNoOptions
        .filter((a: { value: string; label: string }) => a.value && a.label)
        .map((a: { value: string; label: string }) => [a.value, a])
    ).values()
  ) as { value: string; label: string }[];
  const uniqueAccountTitleOptions = Array.from(
    new Map(
      accountTitleOptions
        .filter((a: { value: string; label: string }) => a.value && a.label)
        .map((a: { value: string; label: string; code: string }) => [
          a.value,
          a,
        ])
    ).values()
  ) as { value: string; label: string; code: string }[];

  // Sales account options are already formatted in getSalesAccounts

  return (
    <div className="p-6 space-y-6">
      <div
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            zIndex: -1,
            width: "800px",
          }}
          ref={printRef}
        >
          {currentInvoiceForPrint && (
            <PrintableInvoice invoice={currentInvoiceForPrint} />
          )}
        </div>
        <div id="invoice-print-content" style={{ display: "none" }}>
          {currentInvoiceForPrint && (
            <InvoicePrintTemplate invoice={currentInvoiceForPrint} />
          )}
        </div>

        <Group justify="space-between" mb="lg">
          <Text size="xl" fw={600}>
            Sales Invoice
          </Text>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenCreateModal}
            color="#0A6802"
          >
            Create Invoice
          </Button>
        </Group>

        <Group grow>
          <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
            <Text>Total Invoices</Text>
            <Text fw={700} size="xl">
              {invoices.length}
            </Text>
          </Card>
          <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
            <Text>Total Amount</Text>
            <Text fw={700} size="xl">
              $
              {invoices.reduce((acc, i) => acc + (i.amount || 0), 0).toFixed(2)}
            </Text>
          </Card>
        </Group>

        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          mt={20}
          bg={"#F1FCF0"}
        >
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={600}>Sales Invoices</Text>
              <Text size="sm" c="dimmed">
                Manage your sales invoices and track payments
              </Text>
            </div>
          </Group>

          <Group mb="md" gap="md" grow>
            <TextInput
              label="Search"
              placeholder="Search invoices..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              w={250}
            />
            <TextInput
              label="From Date"
              type="date"
              placeholder="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.currentTarget.value)}
              w={150}
            />
            <TextInput
              label="To Date"
              type="date"
              placeholder="To date"
              value={toDate}
              onChange={(e) => setToDate(e.currentTarget.value)}
              w={150}
            />
            <Group mt={24}>
              <Button variant="outline" color="#0A6802" onClick={clearFilters}>
                Clear
              </Button>
              <Button
                color="#0A6802"
                onClick={exportInvoicesPDF}
                leftSection={<IconDownload size={16} />}
              >
                Export
              </Button>
            </Group>
            <Group mb="sm" gap="md" justify="flex-end">
              <Text fw={500}>Rows per page:</Text>
              <Select
                data={[
                  { value: "8", label: "8" },
                  { value: "15", label: "15" },
                  { value: "30", label: "30" },
                ]}
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
                w={80}
              />
            </Group>
          </Group>

          <Table highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice #</Table.Th>
                <Table.Th>Invoice Date</Table.Th>
                <Table.Th>Delivery Number</Table.Th>
                <Table.Th>Delivery Date</Table.Th>
                <Table.Th>PO Number</Table.Th>
                <Table.Th>PO Date</Table.Th>
                <Table.Th>Account Number</Table.Th>
                <Table.Th>Account Title</Table.Th>
                <Table.Th>Sale Account</Table.Th>
                <Table.Th>Sale Account Title</Table.Th>
                <Table.Th>NTN Number</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Net Amount</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedInvoices.map((i) => (
                <Table.Tr key={i.id}>
                  <Table.Td>{i.invoiceNumber}</Table.Td>
                  <Table.Td>{i.invoiceDate}</Table.Td>
                  <Table.Td>{i.deliveryNumber || ""}</Table.Td>
                  <Table.Td>{i.deliveryDate || ""}</Table.Td>
                  <Table.Td>{i.poNumber || ""}</Table.Td>
                  <Table.Td>{i.poDate || ""}</Table.Td>
                  <Table.Td>{i.accountNumber || ""}</Table.Td>
                  <Table.Td>{i.accountTitle || ""}</Table.Td>
                  <Table.Td>{i.saleAccount || ""}</Table.Td>
                  <Table.Td>{i.saleAccountTitle || ""}</Table.Td>
                  <Table.Td>{i.ntnNumber || ""}</Table.Td>
                  <Table.Td>${(i.amount || 0).toFixed(2)}</Table.Td>
                  <Table.Td>
                    $
                    {i.netAmount !== undefined
                      ? (i.netAmount || 0).toFixed(2)
                      : (i.amount || 0).toFixed(2)}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        color="#0A6802"
                        variant="light"
                        onClick={() => setEditInvoice(i)}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => setDeleteInvoice(i)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="#819E00"
                        variant="light"
                        onClick={() => exportSingleInvoicePDF(i)}
                        title="Download PDF"
                      >
                        <IconDownload size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {paginatedInvoices.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={14} style={{ textAlign: "center" }}>
                    No invoices found.
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Group mt="md" justify="center">
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.max(1, Math.ceil(filteredInvoices.length / pageSize))}
              color="#0A6802"
              radius="md"
              size="md"
              withControls
            />
          </Group>
        </Card>

        {/* Create Invoice Modal */}
        <Modal
          opened={createModal}
          onClose={() => setCreateModal(false)}
          title="Create Invoice"
          size="100%"
        >
          <Group grow mb="sm">
            <TextInput
              label="Invoice Number"
              value={newInvoiceNumber}
              mb="sm"
            />
            <TextInput
              label="Invoice Date"
              type="date"
              placeholder="mm/dd/yyyy"
              value={newInvoiceDate}
              onChange={(e) => setNewInvoiceDate(e.currentTarget.value)}
            />
            <TextInput
              label="Delivery Number"
              type="number"
              placeholder="Delivery Number"
              value={newDeliveryNumber}
              onChange={(e) => setNewDeliveryNumber(e.currentTarget.value)}
            />
            <TextInput
              label="Delivery Date"
              type="date"
              placeholder="mm/dd/yyyy"
              value={newDeliveryDate}
              onChange={(e) => setNewDeliveryDate(e.currentTarget.value)}
            />
          </Group>
          <Group grow mb="sm" w={"50%"}>
            <TextInput
              label="PO Number"
              placeholder="PO Number"
              value={newPoNumber}
              onChange={(e) => setNewPoNumber(e.currentTarget.value)}
            />
            <TextInput
              label="PO Date"
              type="date"
              placeholder="PO Date"
              value={newPoDate}
              onChange={(e) => setNewPoDate(e.currentTarget.value)}
            />
          </Group>
          <Group grow>
            <Select
              label="Account Number"
              placeholder="Select Account Number"
              data={uniqueAccountNoOptions}
              value={newAccountNumber}
              onChange={(v) => {
                setNewAccountNumber(v || "");
                // Find account by accountCode from receivablesAccounts
                const acc = receivablesAccounts.find(
                  (a: AccountNode) => (a.accountCode || a.code) === v
                );
                if (acc) {
                  setNewAccountTitle(acc.accountName || "");
                } else {
                  setNewAccountTitle("");
                }
              }}
              clearable
            />
            <Select
              label="Account Title"
              placeholder="Select Account Title"
              data={uniqueAccountTitleOptions}
              value={newAccountTitle}
              onChange={(v) => {
                setNewAccountTitle(v || "");
                // Find account by name from receivablesAccounts
                const acc = receivablesAccounts.find(
                  (a: AccountNode) => a.accountName === v
                );
                if (acc) {
                  setNewAccountNumber(
                    acc.accountCode !== undefined
                      ? String(acc.accountCode)
                      : acc.code !== undefined
                      ? String(acc.code)
                      : ""
                  );
                } else {
                  setNewAccountNumber("");
                }
              }}
              mb="sm"
              clearable
            />
            <Select
              label="Sale Account"
              placeholder="Select Sale Account"
              data={salesAccountOptions}
              value={newSaleAccount}
              onChange={(v) => {
                setNewSaleAccount(v || "");
                // Auto-fill Sale Account Title
                const acc = salesAccountOptions.find((a) => a.value === v);
                if (acc) {
                  setNewSaleAccountTitle(acc.accountName);
                } else {
                  setNewSaleAccountTitle("");
                }
              }}
              description="Select from sales accounts under 4110 - Sales"
              clearable
              searchable
              error={
                salesAccountOptions.length === 0
                  ? "No sales accounts available. Create them in Chart of Accounts first."
                  : undefined
              }
            />
            <TextInput
              label="Sale Account Title"
              value={newSaleAccountTitle}
              readOnly
              description="Auto-filled based on selected sale account"
            />
            <TextInput
              label="NTN Number"
              value={newNtnNumber}
              onChange={(e) => setNewNtnNumber(e.currentTarget.value)}
            />
          </Group>

          <Switch
            color="#0A6802"
            label="Include GST (18%)"
            checked={includeGST}
            onChange={(e) => setIncludeGST(e.currentTarget.checked)}
            mb="md"
          />

          <Select
            label="Province"
            data={[
              { value: "Punjab", label: "Punjab" },
              { value: "Sindh", label: "Sindh" },
            ]}
            value={province}
            onChange={(v) => setProvince(v as "Punjab" | "Sindh")}
          />

          <Table withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Product Name</Table.Th>
                <Table.Th>HS Code</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Rate</Table.Th>
                <Table.Th>EX.GST Rate</Table.Th>
                <Table.Th>EX.GST Amt</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Remove</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item, index) => {
                const gstRate = getTaxRate(item.hsCode, province);
                const gstAmount = (item.qty * item.rate * gstRate) / 100;
                const amount = item.qty * item.rate;

                return (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Select
                        placeholder="Product Code"
                        data={Array.from(
                          new Map(
                            productCodes.map((p) => [
                              String(p.value),
                              {
                                value: String(p.value),
                                label: p.label,
                                productName: p.productName,
                                description: p.description,
                                rate: p.rate,
                              },
                            ])
                          ).values()
                        )}
                        value={item.code}
                        onChange={(v) => {
                          const selected = productCodes.find(
                            (p) => String(p.value) === v
                          );
                          const newItems = [...items];
                          newItems[index].code = v || "";
                          newItems[index].product = selected?.productName || "";
                          newItems[index].description =
                            selected?.description || "";
                          newItems[index].rate = selected?.rate || 0;
                          setItems(newItems);
                        }}
                        searchable
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        placeholder="Product"
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].product = e.currentTarget.value;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Select
                        placeholder="HS Code"
                        data={[
                          { value: "3824", label: "3824 Chemicals" },
                          { value: "8421", label: "8421 Equipment" },
                          { value: "8413", label: "8413 Pumps" },
                          { value: "9833", label: "9833 Service" },
                        ]}
                        value={item.hsCode}
                        onChange={(v) => {
                          const newItems = [...items];
                          newItems[index].hsCode = v || "";
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].description = e.currentTarget.value;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.qty}
                        min={1}
                        onChange={(val) => {
                          const newItems = [...items];
                          newItems[index].qty = Number(val) || 0;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.rate}
                        min={0}
                        onChange={(val) => {
                          const newItems = [...items];
                          newItems[index].rate = Number(val) || 0;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput value={gstRate} disabled />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput value={gstAmount} disabled />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput value={amount} disabled />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() =>
                          setItems((prev) =>
                            prev.filter((i) => i.id !== item.id)
                          )
                        }
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
          <Button
            mt="sm"
            leftSection={<IconPlus size={16} />}
            color="#0A6802"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  id: prev.length + 1,
                  code: "",
                  product: "",
                  hsCode: "",
                  description: "",
                  qty: 1,
                  rate: 0,
                  exGSTRate: 0,
                  exGSTAmount: 0,
                },
              ])
            }
          >
            Add Item
          </Button>

          <Text>Subtotal: {subtotal.toFixed(2)}</Text>
          <Text>Ex Gst Amount: {exGstAmount.toFixed(2)}</Text>
          <Text>Total GST: {totalGst.toFixed(2)}</Text>
          <Text fw={700}>Net Total: {netTotal.toFixed(2)}</Text>

          <Textarea
            label="Notes (Optional)"
            placeholder="Additional notes or terms..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            mt="md"
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="#819E00"
              onClick={() => {
                handlePrintInvoice({
                  id: invoices.length + 1,
                  invoiceNumber: newInvoiceNumber,
                  invoiceDate: newInvoiceDate,
                  accountTitle: newAccountTitle,
                  amount: netTotal,
                  netAmount: netTotal,
                  items,
                });
              }}
              mr={8}
            >
              Print
            </Button>
            <Button variant="default" onClick={() => setCreateModal(false)}>
              Save as Draft
            </Button>
            <Button
              color="#0A6802"
              onClick={createSalesInvoice} // Change this to call backend function
            >
              Create
            </Button>
          </Group>
        </Modal>

        {/* Edit Invoice Modal */}
        <Modal
          opened={!!editInvoice}
          onClose={() => setEditInvoice(null)}
          title="Edit Invoice"
          size="70%"
        >
          {editInvoice && (
            <>
              <Group grow mb="sm">
                <TextInput
                  label="Invoice Number"
                  value={editInvoice.invoiceNumber}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      invoiceNumber: e.currentTarget.value,
                    })
                  }
                  mb="sm"
                />
                <TextInput
                  label="Invoice Date"
                  type="date"
                  placeholder="mm/dd/yyyy"
                  value={editInvoice.invoiceDate}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      invoiceDate: e.currentTarget.value,
                    })
                  }
                />
                <TextInput
                  label="Delivery Number"
                  type="number"
                  placeholder="Delivery Number"
                  value={editInvoice.deliveryNumber || ""}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      deliveryNumber: e.currentTarget.value,
                    })
                  }
                />
                <TextInput
                  label="Delivery Date"
                  type="date"
                  placeholder="mm/dd/yyyy"
                  value={editInvoice.deliveryDate || ""}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      deliveryDate: e.currentTarget.value,
                    })
                  }
                />
              </Group>
              <Group grow mb="sm" w={"50%"}>
                <TextInput
                  label="PO Number"
                  placeholder="PO Number"
                  value={editInvoice.poNumber || ""}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      poNumber: e.currentTarget.value,
                    })
                  }
                />
                <TextInput
                  label="PO Date"
                  type="date"
                  placeholder="PO Date"
                  value={editInvoice.poDate || ""}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      poDate: e.currentTarget.value,
                    })
                  }
                />
              </Group>
              <Group grow>
                <Select
                  label="Account Number"
                  placeholder="Select Account Number"
                  data={uniqueAccountNoOptions}
                  value={editInvoice.accountNumber || ""}
                  onChange={(v) => {
                    const acc = accounts.find((a) => a.selectedCode === v);
                    setEditInvoice({
                      ...editInvoice,
                      accountNumber: v || "",
                      accountTitle: acc?.accountName || "",
                      ntnNumber: acc?.ntn || "",
                    });
                  }}
                  clearable
                />
                <Select
                  label="Account Title"
                  placeholder="Select Account Title"
                  data={uniqueAccountTitleOptions}
                  value={editInvoice.accountTitle || ""}
                  onChange={(v) => {
                    const acc = accounts.find((a) => a.accountName === v);
                    setEditInvoice({
                      ...editInvoice,
                      accountTitle: v || "",
                      accountNumber: acc?.selectedCode || "",
                      ntnNumber: acc?.ntn || "",
                    });
                  }}
                  mb="sm"
                  clearable
                />
                <Select
                  label="Sale Account"
                  data={[
                    { value: "4114", label: "4114" },
                    { value: "4112", label: "4112" },
                    { value: "4111", label: "4111" },
                    { value: "4113", label: "4113" },
                  ]}
                  value={editInvoice.saleAccount || ""}
                  onChange={(v) => {
                    setEditInvoice({
                      ...editInvoice,
                      saleAccount: v || "",
                      saleAccountTitle: saleAccountTitleMap[v || ""] || "",
                    });
                  }}
                  clearable
                />
                <TextInput
                  label="Sale Account Title"
                  value={editInvoice.saleAccountTitle || ""}
                />
                <TextInput
                  label="NTN Number"
                  value={editInvoice.ntnNumber || ""}
                  onChange={(e) =>
                    setEditInvoice({
                      ...editInvoice,
                      ntnNumber: e.currentTarget.value,
                    })
                  }
                />
              </Group>
              <Switch
                color="#0A6802"
                label="Include GST (18%)"
                checked={includeGST}
                onChange={(e) => setIncludeGST(e.currentTarget.checked)}
                mb="md"
              />
              <Select
                label="Province"
                data={[
                  { value: "Punjab", label: "Punjab" },
                  { value: "Sindh", label: "Sindh" },
                ]}
                value={province}
                onChange={(v) => setProvince(v as "Punjab" | "Sindh")}
              />
              <Table withColumnBorders highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Code</Table.Th>
                    <Table.Th>Product Name</Table.Th>
                    <Table.Th>HS Code</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Rate</Table.Th>
                    <Table.Th>EX.GST Rate</Table.Th>
                    <Table.Th>EX.GST Amt</Table.Th>
                    <Table.Th>Amount</Table.Th>
                    <Table.Th>Remove</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {editInvoice.items?.map((item, index) => {
                    const amount = item.qty * item.rate;
                    const gstRate = getTaxRate(item.hsCode, province);
                    const gstAmount = (item.qty * item.rate * gstRate) / 100;

                    return (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <TextInput
                            value={item.code}
                            onChange={(e) => {
                              const newItems = [...(editInvoice.items || [])];
                              newItems[index].code = e.currentTarget.value;
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            placeholder="Product"
                            value={item.product}
                            onChange={(e) => {
                              const newItems = [...(editInvoice.items || [])];
                              newItems[index].product = e.currentTarget.value;
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            placeholder="HS Code"
                            data={[
                              { value: "3824", label: "3824 Chemicals" },
                              { value: "8421", label: "8421 Equipment" },
                              { value: "8413", label: "8413 Pumps" },
                              { value: "9833", label: "9833 Service" },
                            ]}
                            value={item.hsCode}
                            onChange={(v) => {
                              const newItems = [...(editInvoice.items || [])];
                              newItems[index].hsCode = v || "";
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => {
                              const newItems = [...(editInvoice.items || [])];
                              newItems[index].description =
                                e.currentTarget.value;
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={item.qty}
                            min={1}
                            onChange={(val) => {
                              const newItems = [...(editInvoice.items || [])];
                              newItems[index].qty = Number(val) || 0;
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={item.rate}
                            min={0}
                            onChange={(val) => {
                              const newItems = [...(editInvoice.items || [])];
                              newItems[index].rate = Number(val) || 0;
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput value={gstRate} disabled />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput value={gstAmount} disabled />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput value={amount} disabled />
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => {
                              const newItems = (editInvoice.items || []).filter(
                                (i) => i.id !== item.id
                              );
                              setEditInvoice({
                                ...editInvoice,
                                items: newItems,
                              });
                            }}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
              <Button
                mt="sm"
                leftSection={<IconPlus size={16} />}
                color="#0A6802"
                onClick={() => {
                  setEditInvoice({
                    ...editInvoice,
                    items: [
                      ...(editInvoice.items || []),
                      {
                        id: (editInvoice.items?.length || 0) + 1,
                        code: "",
                        product: "",
                        hsCode: "",
                        description: "",
                        qty: 1,
                        rate: 0,
                        exGSTRate: 0,
                        exGSTAmount: 0,
                      },
                    ],
                  });
                }}
              >
                Add Item
              </Button>
              {/* Fix: Replace className with style object */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <Text>Subtotal: {editSubtotal.toFixed(2)}</Text>
                <Text>Ex Gst Amount: {editExGstAmount.toFixed(2)}</Text>
                <Text>Total GST: {editTotalGst.toFixed(2)}</Text>
                <Text fw={700}>Net Total: {editNetAmount.toFixed(2)}</Text>
              </div>
              <Group mt="md" justify="flex-end">
                <Button
                  variant="outline"
                  color="#819E00"
                  onClick={() => {
                    handlePrintInvoice({
                      ...editInvoice,
                      netAmount: editNetAmount,
                    });
                  }}
                  mr={8}
                >
                  Print
                </Button>
                <Button variant="default" onClick={() => setEditInvoice(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editInvoice) {
                      updateSalesInvoice(editInvoice); // Change this to call backend function
                    }
                  }}
                >
                  Save Changes
                </Button>
              </Group>
            </>
          )}
        </Modal>

        {/* Delete Invoice Modal */}
        <Modal
          opened={!!deleteInvoice}
          onClose={() => setDeleteInvoice(null)}
          title="Confirm Delete"
        >
          <Text>
            Are you sure you want to delete invoice{" "}
            <b>{deleteInvoice?.invoiceNumber}</b>?
          </Text>
          <Group mt="md" justify="flex-end">
            <Button variant="default" onClick={() => setDeleteInvoice(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (deleteInvoice) {
                  deleteSalesInvoice(deleteInvoice.id);
                }
              }}
            >
              Delete
            </Button>
          </Group>
        </Modal>

        {/* Invoice Print Template (for direct printing, hidden) */}
        <div style={{ display: "none" }}>
          {invoices.map((invoice) => (
            <InvoicePrintTemplate key={invoice.id} invoice={invoice} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Invoice print template component
function InvoicePrintTemplate({ invoice }: { invoice: Invoice }) {
  if (!invoice) return null;
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#fff",
        padding: 24,
        minWidth: 900,
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <img src="/CmLogo.png" alt="Logo" style={{ height: 60 }} />
        <h2 style={{ color: "#819E00", margin: "8px 0", fontSize: 32 }}>
          Sales Invoice
        </h2>
      </div>
      <table style={{ width: "100%", fontSize: 14, marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold" }}>Invoice #</td>
            <td>{invoice.invoiceNumber}</td>
            <td style={{ fontWeight: "bold" }}>Date</td>
            <td>{invoice.invoiceDate}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Province</td>
            <td>{invoice.province || ""}</td>
            <td style={{ fontWeight: "bold" }}>Account Title</td>
            <td>{invoice.accountTitle}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Amount</td>
            <td>${invoice.amount?.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Delivery Number</td>
            <td>{invoice.deliveryNumber || ""}</td>
            <td style={{ fontWeight: "bold" }}>PO Number</td>
            <td>{invoice.poNumber || ""}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Account Number</td>
            <td>{invoice.accountNumber || ""}</td>
            <td style={{ fontWeight: "bold" }}>NTN Number</td>
            <td>{invoice.ntnNumber || ""}</td>
          </tr>
        </tbody>
      </table>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <thead>
          <tr style={{ background: "#F8FFF6" }}>
            <th style={{ border: "1px solid #222", padding: 4 }}>Code</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Product</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>HS Code</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>
              Description
            </th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Qty</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Rate</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>
              EX.GST Rate
            </th>
            <th style={{ border: "1px solid #222", padding: 4 }}>EX.GST Amt</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items?.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.code}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.product}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.hsCode}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.description}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.qty}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.rate}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.exGSTRate}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.exGSTAmount}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {(item.qty * item.rate).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24, fontWeight: "bold", fontSize: 16 }}>
        Total: ${invoice.amount?.toFixed(2)}
      </div>
      {/* Add footer, notes, etc. */}
    </div>
  );
}
