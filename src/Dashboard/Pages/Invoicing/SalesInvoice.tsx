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
import { useProducts } from "../../Context/Inventory/ProductsContext";
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

// Types for Invoice and InvoiceItem
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
  deliveryNumber?: string; // <-- changed
  deliveryDate?: string;
  poNumber?: string; // <-- changed
  poDate?: string;
  accountNumber?: string; // <-- changed
  accountTitle: string;
  saleAccount?: string;
  saleAccountTitle?: string;
  ntnNumber?: string; // <-- changed
  amount: number;
  netAmount?: number;
  province?: "Punjab" | "Sindh";
  items?: InvoiceItem[];
}

// Add AccountNode type
type AccountNode = {
  code: string;
  name: string;
  children?: AccountNode[];
};

// Sale Account mapping
const saleAccountTitleMap: Record<string, string> = {
  "4114": "Sale Of Chemicals and Equipments",
  "4112": "Sale Of Equipments",
  "4111": "Sales Of Chemicals",
  "4113": "Services",
};

// HS Code mapping
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
  // Chemicals, Equipments, Pumps
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
      {/* Add more invoice details as needed */}
    </div>
  );
}

// Helper to get next invoice number
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

export default function SalesInvoicePage() {
  const printRef = useRef<HTMLDivElement>(null);

  // Use context for invoices
  const { invoices, setInvoices } = useSalesInvoice();
  const { accounts } = useChartOfAccounts();

  // Local UI state
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState(
    getNextInvoiceNumber(invoices)
  );
  const [newInvoiceDate, setNewInvoiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // Format: YYYY-MM-DD
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

  // Items state
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

  // Add state to track current invoice for printing
  const [currentInvoiceForPrint, setCurrentInvoiceForPrint] =
    useState<Invoice | null>(null);

  // Calculate subtotal from items
  const subtotal = items.reduce(
    (acc: number, i: InvoiceItem) => acc + i.qty * i.rate,
    0
  );

  // GST calculation
  const gstAmount = includeGST ? subtotal * 0.18 : 0;

  // Calculate net total
  const netTotal = subtotal + gstAmount;

  // Calculate Ex Gst Amount and Total GST from items (auto-calculated)
  const exGstAmount = items.reduce(
    (acc: number, i: InvoiceItem) =>
      acc + (i.qty * i.rate * getTaxRate(i.hsCode, province)) / 100,
    0
  );

  const totalGst = items.reduce(
    (acc: number, i: InvoiceItem) => acc + getTaxRate(i.hsCode, province),
    0
  );

  // Add useEffect to fetch invoices from backend on component mount
  useEffect(() => {
    fetchSalesInvoices();
  }, []);

  // Function to fetch all sales invoices from backend
  const fetchSalesInvoices = async () => {
    try {
      const response = await axios.get("http://localhost:3000/sales-invoices");
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching sales invoices:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch sales invoices",
        color: "red",
      });
    }
  };

  // Function to create sales invoice in backend
  const createSalesInvoice = async () => {
    try {
      // Validation
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
        items: items,
      };

      const response = await axios.post(
        "http://localhost:3000/sales-invoices/create",
        payload
      );

      if (response.data) {
        // Add to local state after successful backend save
        setInvoices((prev) => [response.data, ...prev]);

        // Show success notification
        notifications.show({
          title: "Success",
          message: "Sales invoice created successfully",
          color: "green",
        });

        // Close modal and reset form
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

  // Function to update sales invoice
  const updateSalesInvoice = async (invoiceData: Invoice) => {
    try {
      const payload = {
        ...invoiceData,
        amount: editTotal,
        netAmount: editNetAmount,
        province, // <-- Add province here as well
      };

      const response = await axios.put(
        `http://localhost:3000/sales-invoices/${editInvoice?.id}`,
        payload
      );

      if (response.data) {
        // Update local state after successful backend update
        setInvoices((prev) =>
          prev.map((i) => (i.id === editInvoice?.id ? response.data : i))
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

  // Function to delete sales invoice
  const deleteSalesInvoice = async (invoiceId: number) => {
    try {
      await axios.delete(`http://localhost:3000/sales-invoices/${invoiceId}`);

      // Remove from local state after successful backend deletion
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

  // Add reset form function
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

  // Print handler using hidden component
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
      .toLowerCase()
      .includes(search.toLowerCase());
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

    // Details table
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

  // Edit modal calculations
  const editSubtotal =
    editInvoice?.items?.reduce(
      (acc: number, i: InvoiceItem) => acc + i.qty * i.rate,
      0
    ) || 0;
  const editGstAmount = includeGST ? editSubtotal * 0.18 : 0;
  const editTotal = editSubtotal + editGstAmount;
  const editNetAmount = editTotal;

  // Calculate Ex Gst Amount and Total GST for edit modal
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

  // Update invoice number when modal opens
  const handleOpenCreateModal = () => {
    setNewInvoiceNumber(getNextInvoiceNumber(invoices));
    setCreateModal(true);
  };

  // Helper to flatten accounts for dropdowns
  function flattenAccounts(
    nodes: AccountNode[]
  ): { value: string; label: string }[] {
    return nodes.flatMap((n) => [
      { value: n.code, label: `${n.code} - ${n.name}` },
      ...(n.children ? flattenAccounts(n.children) : []),
    ]);
  }

  const accountNoOptions = flattenAccounts(accounts as AccountNode[]);
  const accountTitleOptions = accountNoOptions.map((acc) => ({
    value: acc.label.split(" - ")[1],
    label: acc.label.split(" - ")[1],
    code: acc.value,
  }));

  // Fetch products from backend for code dropdown
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:3000/products");
        setFetchedProducts(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        notifications.show({
          title: "Error",
          message: "Failed to fetch products",
          color: "red",
        });
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Printable invoice content (always rendered, hidden off-screen) */}
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
            ${invoices.reduce((acc, i) => acc + i.amount, 0)}
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
                <Table.Td>${i.amount.toFixed(2)}</Table.Td>
                <Table.Td>
                  $
                  {i.netAmount !== undefined
                    ? i.netAmount
                    : i.amount.toFixed(2)}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      color="#0A6802"
                      variant="light"
                      onClick={() => {
                        setEditInvoice(i);
                      }}
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
                <Table.Td colSpan={15} align="center">
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
          <TextInput label="Invoice Number" value={newInvoiceNumber} mb="sm" />
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
            data={accountNoOptions}
            value={newAccountNumber}
            // no disabled prop, always enabled
            onChange={(v) => {
              setNewAccountNumber(v || "");
              // Auto-set account title
              const found = accountNoOptions.find((opt) => opt.value === v);
              if (found) {
                setNewAccountTitle(found.label.split(" - ")[1]);
              } else {
                setNewAccountTitle("");
              }
            }}
          />
          <Select
            label="Account Title"
            placeholder="Select Account Title"
            data={accountTitleOptions}
            value={newAccountTitle}
            // no disabled prop, always enabled
            onChange={(v) => {
              setNewAccountTitle(v || "");
              // Auto-set account number
              const found = accountTitleOptions.find((opt) => opt.value === v);
              if (found) {
                setNewAccountNumber(found.code);
              } else {
                setNewAccountNumber("");
              }
            }}
            mb="sm"
          />
          <Select
            label="Sale Account"
            data={[
              { value: "4114", label: "4114" },
              { value: "4112", label: "4112" },
              { value: "4111", label: "4111" },
              { value: "4113", label: "4113" },
            ]}
            value={newSaleAccount}
            onChange={(v) => {
              setNewSaleAccount(v || "");
              setNewSaleAccountTitle(saleAccountTitleMap[v || ""] || "");
            }}
          />
          <TextInput
            label="Sale Account Title"
            value={newSaleAccountTitle}
            readOnly
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
              // Auto-calculate GST rate and amount
              const gstRate = getTaxRate(item.hsCode, province);
              const gstAmount = (item.qty * item.rate * gstRate) / 100;
              const amount = item.qty * item.rate;

              // Prepare product code options

              // Only unique codes
              const seenCodes = new Set<string>();
              const codeOptions = (fetchedProducts || [])
                .map((p: any) => ({
                  value: String(p.code),
                  label: String(p.code),
                }))
                .filter((opt) => {
                  if (seenCodes.has(opt.value)) return false;
                  seenCodes.add(opt.value);
                  return true;
                });

              return (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Select
                      searchable
                      placeholder="Select Code"
                      data={codeOptions}
                      value={item.code}
                      onChange={(v) => {
                        const newItems = [...items];
                        newItems[index].code = v || "";
                        // Auto-fill other fields based on selected code
                        const selectedProduct = (fetchedProducts || []).find(
                          (p: any) => String(p.code) === v
                        );
                        if (selectedProduct) {
                          newItems[index].product =
                            selectedProduct.productName ||
                            selectedProduct.name ||
                            "";
                          newItems[index].hsCode =
                            selectedProduct.hsCode ||
                            selectedProduct.hs_code ||
                            "";
                          newItems[index].description =
                            selectedProduct.productDescription ||
                            selectedProduct.description ||
                            "";
                          newItems[index].rate =
                            selectedProduct.unitPrice ||
                            selectedProduct.unit_price ||
                            0;
                        }
                        setItems(newItems);
                      }}
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
                        setItems((prev) => prev.filter((i) => i.id !== item.id))
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
                data={accountNoOptions}
                value={editInvoice.accountNumber || ""}
                onChange={(v) =>
                  setEditInvoice({ ...editInvoice, accountNumber: v || "" })
                }
              />
              <Select
                label="Account Title"
                placeholder="Select Account Title"
                data={accountTitleOptions}
                value={editInvoice.accountTitle || ""}
                onChange={(v) =>
                  setEditInvoice({ ...editInvoice, accountTitle: v || "" })
                }
                mb="sm"
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
              />
              <TextInput
                label="Sale Account Title"
                value={editInvoice.saleAccountTitle || ""}
                readOnly
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
                  // Auto-calculate GST rate and amount
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
                            setEditInvoice({ ...editInvoice, items: newItems });
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
                            setEditInvoice({ ...editInvoice, items: newItems });
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
                            setEditInvoice({ ...editInvoice, items: newItems });
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...(editInvoice.items || [])];
                            newItems[index].description = e.currentTarget.value;
                            setEditInvoice({ ...editInvoice, items: newItems });
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
                            setEditInvoice({ ...editInvoice, items: newItems });
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
                            setEditInvoice({ ...editInvoice, items: newItems });
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
                            setEditInvoice({ ...editInvoice, items: newItems });
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
            <div className="mt-4 space-y-1">
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
                deleteSalesInvoice(deleteInvoice.id); // Change this to call backend function
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
