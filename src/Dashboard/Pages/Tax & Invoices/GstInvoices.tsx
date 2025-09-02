"use client";
import { useState } from "react";
import {
  Card,
  Text,
  Table,
  Group,
  Button,
  TextInput,
  Pagination,
  Select,
  Modal,
  Grid,
  Badge,
  Tabs,
  Stack,
  Divider,
} from "@mantine/core";
import { Download, Edit, Trash2, Filter, Plus, FileUp } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

interface GSTInvoice {
  invoiceNo: string;
  date: string;
  party: string;
  type: "Sales" | "Purchase";
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  total: number;
  status: "Filed" | "Pending";
}

interface GSTReturnRow {
  id: string;
  title: string;
  subtitle: string;
  status: "Filed" | "Pending";
  monthKey: string;
  type: "GSTR-1" | "GSTR-3B";
}

const initialInvoices: GSTInvoice[] = [
  {
    invoiceNo: "GST-001",
    date: "2024-01-15",
    party: "ABC Corporation",
    type: "Sales",
    taxableAmount: 2500,
    gstRate: 18,
    gstAmount: 450,
    total: 2950,
    status: "Filed",
  },
  {
    invoiceNo: "GST-002",
    date: "2024-01-14",
    party: "Office Supplies Co",
    type: "Purchase",
    taxableAmount: 1800,
    gstRate: 18,
    gstAmount: 324,
    total: 2124,
    status: "Pending",
  },
  {
    invoiceNo: "GST-003",
    date: "2024-01-13",
    party: "Tech Solutions Inc",
    type: "Sales",
    taxableAmount: 3200,
    gstRate: 18,
    gstAmount: 576,
    total: 3776,
    status: "Filed",
  },
];

const initialReturns: GSTReturnRow[] = [
  {
    id: "r1",
    title: "GSTR-1 - January 2024",
    subtitle: "Outward supplies return",
    status: "Filed",
    monthKey: "2024-01",
    type: "GSTR-1",
  },
  {
    id: "r2",
    title: "GSTR-3B - January 2024",
    subtitle: "Monthly summary return",
    status: "Filed",
    monthKey: "2024-01",
    type: "GSTR-3B",
  },
  {
    id: "r3",
    title: "GSTR-1 - February 2024",
    subtitle: "Outward supplies return",
    status: "Pending",
    monthKey: "2024-02",
    type: "GSTR-1",
  },
];

export default function GSTInvoicesAndReturns() {
  const [invoices, setInvoices] = useState<GSTInvoice[]>(initialInvoices);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredData, setFilteredData] = useState<GSTInvoice[]>(invoices);

  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openedCreate, setOpenedCreate] = useState(false);
  const [openedEdit, setOpenedEdit] = useState(false);
  const [editInvoice, setEditInvoice] = useState<GSTInvoice | null>(null);

  const [returnsRows, setReturnsRows] =
    useState<GSTReturnRow[]>(initialReturns);

  const applyFilter = () => {
    let result = invoices;
    if (fromDate)
      result = result.filter((i) => new Date(i.date) >= new Date(fromDate));
    if (toDate)
      result = result.filter((i) => new Date(i.date) <= new Date(toDate));
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.invoiceNo.toLowerCase().includes(s) ||
          i.party.toLowerCase().includes(s)
      );
    }
    setFilteredData(result);
    setActivePage(1);
  };

  const start = (activePage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  /* -------- Invoices: PDF (table export) -------- */
  const exportPDF_AllInvoices = () => {
    const doc = new jsPDF();
    doc.text("GST Invoice Register", 14, 15);
    autoTable(doc, {
      head: [
        [
          "Invoice No",
          "Date",
          "Party",
          "Type",
          "Taxable Amount",
          "GST Rate",
          "GST Amount",
          "Total",
          "Status",
        ],
      ],
      body: filteredData.map((i) => [
        i.invoiceNo,
        i.date,
        i.party,
        i.type,
        `₹${i.taxableAmount.toLocaleString()}`,
        `${i.gstRate}%`,
        `₹${i.gstAmount.toLocaleString()}`,
        `₹${i.total.toLocaleString()}`,
        i.status,
      ]) as RowInput[],
      startY: 20,
    });
    doc.save("gst_invoices.pdf");
  };

  // --- Export one invoice as formatted PDF with LOGO ---
  const exportPDF_OneInvoice = (inv: GSTInvoice) => {
    const doc = new jsPDF();

    // === Company Logo ===
    // NOTE: replace "logoBase64" with your actual Base64 string (or import an image and convert)
    const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."; // <-- put your logo here
    doc.addImage(logoBase64, "PNG", 14, 10, 30, 30); // (image, type, x, y, width, height)

    // --- Header Text next to Logo ---
    doc.setFontSize(16);
    doc.text("Your Company Pvt Ltd", 50, 20);
    doc.setFontSize(11);
    doc.text("123 Business Street, City", 50, 26);
    doc.text("GSTIN: 22AAAAA0000A1Z5", 50, 32);

    // --- Invoice Title ---
    doc.setFontSize(18);
    doc.text("TAX INVOICE", 200, 20, { align: "right" });

    // --- Invoice details ---
    doc.setFontSize(11);
    doc.text(`Invoice No: ${inv.invoiceNo}`, 150, 40);
    doc.text(`Date: ${inv.date}`, 150, 46);
    doc.text(`Status: ${inv.status}`, 150, 52);

    // --- Bill To ---
    doc.setFontSize(12);
    doc.text("Bill To:", 14, 60);
    doc.setFontSize(11);
    doc.text(inv.party, 14, 68);

    // --- Table of items ---
    autoTable(doc, {
      startY: 80,
      head: [
        ["Description", "Taxable Amount", "GST Rate", "GST Amount", "Total"],
      ],
      body: [
        [
          `Invoice ${inv.invoiceNo}`,
          `₹${inv.taxableAmount.toLocaleString()}`,
          `${inv.gstRate}%`,
          `₹${inv.gstAmount.toLocaleString()}`,
          `₹${inv.total.toLocaleString()}`,
        ],
      ] as RowInput[],
      theme: "grid",
    });

    // --- Totals ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Total Amount:", 150, finalY, { align: "right" });
    doc.text(`₹${inv.total.toLocaleString()}`, 200, finalY, { align: "right" });

    // --- Footer ---
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });

    doc.save(`${inv.invoiceNo}.pdf`);
  };

  /* -------- Invoices: CRUD -------- */
  const handleCreate = (newInvoice: GSTInvoice) => {
    const updated = [...invoices, newInvoice];
    setInvoices(updated);
    setFilteredData(updated);
    setOpenedCreate(false);
  };

  const handleEdit = (updatedInvoice: GSTInvoice) => {
    const updated = invoices.map((i) =>
      i.invoiceNo === updatedInvoice.invoiceNo ? updatedInvoice : i
    );
    setInvoices(updated);
    setFilteredData(updated);
    setOpenedEdit(false);
  };

  const deleteInvoice = (invoiceNo: string) => {
    const updated = invoices.filter((i) => i.invoiceNo !== invoiceNo);
    setInvoices(updated);
    setFilteredData(updated);
  };

  const outputTax = filteredData
    .filter((i) => i.type === "Sales")
    .reduce((s, i) => s + i.gstAmount, 0);
  const inputTax = filteredData
    .filter((i) => i.type === "Purchase")
    .reduce((s, i) => s + i.gstAmount, 0);
  const netTax = outputTax - inputTax;
  const filingStatus = filteredData.some((i) => i.status === "Pending")
    ? "Pending"
    : "Filed";

  const fileReturn = (row: GSTReturnRow) => {
    setReturnsRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: "Filed" } : r))
    );
  };

  const exportReturnRowPDF = (row: GSTReturnRow) => {
    const doc = new jsPDF();
    doc.text(`${row.type} – ${row.title.split(" - ")[1]}`, 14, 15);
    autoTable(doc, {
      head: [["Form", "Period", "Title", "Subtitle", "Status"]],
      body: [
        [row.type, row.monthKey, row.title, row.subtitle, row.status],
      ] as RowInput[],
      startY: 20,
    });
    doc.save(`${row.type}_${row.monthKey}.pdf`);
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          GST
        </Text>
        <Group>
          <Button
            leftSection={<Plus size={16} />}
            color="#0A6802"
            onClick={() => setOpenedCreate(true)}
          >
            Add GST Invoice
          </Button>
          <Button
            leftSection={<Download size={16} />}
            color="#0A6802"
            onClick={exportPDF_AllInvoices}
          >
            Export Invoices
          </Button>
        </Group>
      </Group>

      <Grid mb="md">
        <Grid.Col span={3}>
          <Card withBorder p="md" bg={"#F1FCF0"}>
            <Text>Output Tax</Text>
            <Text fw={700} c="green">
              ₹{outputTax.toLocaleString()}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg={"#F1FCF0"}>
            <Text>Input Tax</Text>
            <Text fw={700} c="blue">
              ₹{inputTax.toLocaleString()}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg={"#F1FCF0"}>
            <Text>Net Tax</Text>
            <Text fw={700} c="violet">
              ₹{netTax.toLocaleString()}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg={"#F1FCF0"}>
            <Text>Filing Status</Text>
            <Text fw={700} c={filingStatus === "Pending" ? "orange" : "green"}>
              {filingStatus}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs defaultValue="invoices" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="invoices">GST Invoices</Tabs.Tab>
          <Tabs.Tab value="returns">GST Returns</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="invoices" pt="md">
          <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
            <Group grow>
              <TextInput
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
              />
              <TextInput
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.currentTarget.value)}
              />
              <TextInput
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.currentTarget.value)}
              />
              <Button
                mt={23}
                leftSection={<Filter size={16} />}
                color="#0A6802"
                onClick={applyFilter}
              >
                Apply Filter
              </Button>
            </Group>
          </Card>

          <Card shadow="sm" p="md" mt="md" withBorder bg="#F1FCF0">
            <Text fw={600} mb="sm">
              GST Invoice Register
            </Text>
            <Table highlightOnHover withTableBorder bg={"#F1FCF0"}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Invoice No</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Party</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Taxable Amount</Table.Th>
                  <Table.Th>GST Rate</Table.Th>
                  <Table.Th>GST Amount</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.map((i, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>{i.invoiceNo}</Table.Td>
                    <Table.Td>{i.date}</Table.Td>
                    <Table.Td>{i.party}</Table.Td>
                    <Table.Td>
                      <Badge color={i.type === "Sales" ? "green" : "orange"}>
                        {i.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td>₹{i.taxableAmount.toLocaleString()}</Table.Td>
                    <Table.Td>{i.gstRate}%</Table.Td>
                    <Table.Td c="violet">
                      ₹{i.gstAmount.toLocaleString()}
                    </Table.Td>
                    <Table.Td fw={700}>₹{i.total.toLocaleString()}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={i.status === "Filed" ? "green" : "orange"}
                        variant="filled"
                      >
                        {i.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          variant="light"
                          color="blue"
                          leftSection={<Edit size={14} />}
                          onClick={() => {
                            setEditInvoice(i);
                            setOpenedEdit(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          leftSection={<Trash2 size={14} />}
                          onClick={() => deleteInvoice(i.invoiceNo)}
                        >
                          Delete
                        </Button>
                        <Button
                          size="xs"
                          variant="light"
                          color="teal"
                          leftSection={<Download size={14} />}
                          onClick={() => exportPDF_OneInvoice(i)}
                        >
                          PDF
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Group justify="space-between" mt="md">
              <Select
                label="Rows per page"
                data={["5", "10", "20"]}
                value={rowsPerPage.toString()}
                onChange={(val) => {
                  setRowsPerPage(Number(val));
                  setActivePage(1);
                }}
                w={120}
              />
              <Pagination
                total={Math.ceil(filteredData.length / rowsPerPage)}
                value={activePage}
                onChange={setActivePage}
                color="#0A6802"
              />
            </Group>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="returns" pt="md">
          <Stack gap="sm">
            <Card withBorder p="md" bg="#F1FCF0">
              <Group>
                <Text fw={600}>GST Return Filing</Text>
              </Group>
              <Divider my="sm" />
              <Stack gap="sm">
                {returnsRows.map((r) => (
                  <Card key={r.id} withBorder>
                    <Group justify="space-between" align="center">
                      <div>
                        <Text fw={600}>{r.title}</Text>
                        <Text size="sm" c="dimmed">
                          {r.subtitle}
                        </Text>
                      </div>
                      <Group>
                        <Badge
                          color={r.status === "Filed" ? "green" : "orange"}
                          variant="filled"
                        >
                          {r.status}
                        </Badge>
                        {r.status === "Pending" && (
                          <Button
                            leftSection={<FileUp size={16} />}
                            color="#0A6802"
                            onClick={() => fileReturn(r)}
                          >
                            File Return
                          </Button>
                        )}
                        <Button
                          variant="light"
                          leftSection={<Download size={16} />}
                          onClick={() => exportReturnRowPDF(r)}
                        >
                          PDF
                        </Button>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={openedCreate}
        onClose={() => setOpenedCreate(false)}
        title="Create GST Invoice"
      >
        <InvoiceForm onSubmit={handleCreate} />
      </Modal>

      <Modal
        opened={openedEdit}
        onClose={() => setOpenedEdit(false)}
        title="Edit GST Invoice"
      >
        {editInvoice && (
          <InvoiceForm initialData={editInvoice} onSubmit={handleEdit} />
        )}
      </Modal>
    </div>
  );
}

/* =========================
   Invoice Form
========================= */
function InvoiceForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: GSTInvoice) => void;
  initialData?: GSTInvoice;
}) {
  const [invoice, setInvoice] = useState<GSTInvoice>(
    initialData || {
      invoiceNo: "",
      date: "",
      party: "",
      type: "Sales",
      taxableAmount: 0,
      gstRate: 18,
      gstAmount: 0,
      total: 0,
      status: "Pending",
    }
  );

  const handleChange = (field: keyof GSTInvoice, value: any) => {
    const updated = { ...invoice, [field]: value };
    if (field === "taxableAmount" || field === "gstRate") {
      updated.gstAmount = (updated.taxableAmount * updated.gstRate) / 100;
      updated.total = updated.taxableAmount + updated.gstAmount;
    }
    setInvoice(updated);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(invoice);
      }}
    >
      <TextInput
        label="Invoice No"
        value={invoice.invoiceNo}
        onChange={(e) => handleChange("invoiceNo", e.currentTarget.value)}
        required
      />
      <TextInput
        label="Date"
        type="date"
        value={invoice.date}
        onChange={(e) => handleChange("date", e.currentTarget.value)}
        required
      />
      <TextInput
        label="Party"
        value={invoice.party}
        onChange={(e) => handleChange("party", e.currentTarget.value)}
        required
      />
      <Select
        label="Type"
        data={["Sales", "Purchase"]}
        value={invoice.type}
        onChange={(val) => handleChange("type", val)}
        required
      />
      <TextInput
        label="Taxable Amount"
        type="number"
        value={invoice.taxableAmount}
        onChange={(e) =>
          handleChange("taxableAmount", Number(e.currentTarget.value))
        }
      />
      <TextInput
        label="GST Rate (%)"
        type="number"
        value={invoice.gstRate}
        onChange={(e) => handleChange("gstRate", Number(e.currentTarget.value))}
      />
      <TextInput label="GST Amount" value={invoice.gstAmount} readOnly />
      <TextInput label="Total" value={invoice.total} readOnly />
      <Select
        label="Status"
        data={["Filed", "Pending"]}
        value={invoice.status}
        onChange={(val) => handleChange("status", val)}
      />
      <Group justify="flex-end" mt="md">
        <Button type="submit" color="#0A6802">
          Save
        </Button>
      </Group>
    </form>
  );
}
