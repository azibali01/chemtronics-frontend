import {
  Card,
  Group,
  Button,
  Table,
  // Badge removed (unused)
  ActionIcon,
  Title,
  Text,
  Modal,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconDownload,
  IconSearch,
} from "@tabler/icons-react";
import { useMemo, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useReactToPrint } from "react-to-print";

type ReturnItem = {
  code: string;
  productName: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  netAmount: number;
};
type SaleReturn = {
  id: string;
  customer: string;
  customerTitle: string;
  saleAccount: string;
  saleTitle: string;
  salesman: string;
  date: string;
  items: ReturnItem[];
  notes?: string;
};

const dataInit: SaleReturn[] = [
  {
    id: "SR-001",
    customer: "John Doe",
    customerTitle: "Mr.",
    saleAccount: "Account 1",
    saleTitle: "Retail",
    salesman: "Ali",
    date: "2024-01-15",
    items: [],
    notes: "Return due to damage",
  },
  {
    id: "SR-002",
    customer: "Jane Smith",
    customerTitle: "Ms.",
    saleAccount: "Account 2",
    saleTitle: "Wholesale",
    salesman: "Ahmed",
    date: "2024-01-14",
    items: [],
    notes: "Wrong size delivered",
  },
  {
    id: "SR-003",
    customer: "Global Inc",
    customerTitle: "Company",
    saleAccount: "Account 3",
    saleTitle: "Corporate",
    salesman: "Sara",
    date: "2024-01-10",
    items: [],
  },
];

const toNumber = (v: string | number | null | undefined) =>
  typeof v === "number" ? v : v ? Number(v) : 0;

export default function SaleReturns() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<SaleReturn[]>(dataInit);
  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<SaleReturn | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [customerTitle, setCustomerTitle] = useState<string>("");
  const [saleAccount, setSaleAccount] = useState<string>("");
  const [saleTitle, setSaleTitle] = useState<string>("");
  const [salesman, setSalesman] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [notes, setNotes] = useState<string>("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      const matchesSearch = !q || d.id.toLowerCase().includes(q);
      const matchesFromDate =
        !fromDate || new Date(d.date) >= new Date(fromDate);
      const matchesToDate = !toDate || new Date(d.date) <= new Date(toDate);
      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [data, search, fromDate, toDate]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const exportPDF = (row: SaleReturn) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sale Return Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Invoice #", row.id],
        ["Customer", row.customer],
        ["Customer Title", row.customerTitle],
        ["Sale Account", row.saleAccount],
        ["Sale Title", row.saleTitle],
        ["Salesman", row.salesman],
        ["Date", row.date],
        ["Notes", row.notes || "-"],
      ],
    });

    autoTable(doc, {
      startY:
        (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 10,
      head: [["Product", "Qty", "Rate", "Amount"]],
      body: row.items.map((i) => [
        i.productName,
        String(i.quantity),
        `${i.rate}`,
        `${i.amount}`,
      ]),
    });

    doc.save(`${row.id}.pdf`);
  };

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (row: SaleReturn) => {
    setEditData(row);
    setInvoiceNumber(row.id);
    setCustomer(row.customer);
    setCustomerTitle(row.customerTitle);
    setSaleAccount(row.saleAccount);
    setSaleTitle(row.saleTitle);
    setSalesman(row.salesman);
    setDate(row.date);
    setItems(row.items.map((i) => ({ ...i })));
    setNotes(row.notes || "");
    setOpened(true);
  };

  const handleSave = () => {
    if (!invoiceNumber || !date) return;

    const normalized = items.map((i) => {
      const qty = toNumber(i.quantity);
      const rate = toNumber(i.rate);
      return { ...i, quantity: qty, rate, amount: qty * rate };
    });

    if (editData) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editData.id
            ? {
                ...d,
                id: invoiceNumber,
                customer,
                customerTitle,
                saleAccount,
                saleTitle,
                salesman,
                date,
                items: normalized,
                notes,
              }
            : d
        )
      );
    } else {
      const newReturn: SaleReturn = {
        id: invoiceNumber,
        customer,
        customerTitle,
        saleAccount,
        saleTitle,
        salesman,
        date,
        items: normalized,
        notes,
      };
      setData((prev) => [newReturn, ...prev]);
    }

    setOpened(false);
    resetForm();
  };

  const openDelete = (id: string) => setDeleteId(id);
  const confirmDelete = () => {
    if (deleteId) setData((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
  };

  const resetForm = () => {
    setInvoiceNumber("");
    setCustomer("");
    setCustomerTitle("");
    setSaleAccount("");
    setSaleTitle("");
    setSalesman("");
    setDate("");
    setItems([]);
    setNotes("");
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    // Use 'contentRef' instead of 'content' for latest react-to-print types
    contentRef: printRef,
    documentTitle: invoiceNumber || "Sale Return Invoice",
  });

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Sale Returns</Title>

        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          New Sale Return
        </Button>
      </Group>

      <Card withBorder shadow="sm" radius="md" p="md">
        <Text fw={600} mb="sm">
          Sale Returns List
        </Text>

        <Group mb="md" gap={"xs"} justify="space-between">
          <Group>
            <TextInput
              w={220}
              placeholder="Search by invoice number..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
            />
            <TextInput
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.currentTarget.value)}
              style={{ minWidth: 140 }}
            />
            <TextInput
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.currentTarget.value)}
              style={{ minWidth: 140 }}
            />
            <Button
              variant="outline"
              color="gray"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </Button>
            <Button
              variant="filled"
              color="#0A6802"
              leftSection={<IconDownload size={16} />}
              onClick={() => {
                // Export filteredData to PDF for consistency
                const doc = new jsPDF();
                doc.text("Sale Returns", 14, 20);
                if (filteredData.length > 0) {
                  const tableData = filteredData.map((row: any) => [
                    row.id,
                    row.date,
                    row.customer,
                    row.customerTitle,
                    row.saleAccount,
                    row.saleTitle,
                    row.salesman,
                    row.notes || "",
                  ]);

                  autoTable(doc, {
                    head: [
                      [
                        "Invoice #",
                        "Invoice Date",
                        "Customer",
                        "Customer Title",
                        "Sale Account",
                        "Sale Title",
                        "Salesman",
                        "Notes",
                      ],
                    ],
                    body: tableData,
                    startY: 30,
                  });
                } else {
                  doc.text(
                    "No sale returns found for selected filters.",
                    14,
                    30
                  );
                }
                doc.save("sale_returns.pdf");
              }}
            >
              Export
            </Button>
          </Group>
          <Group>
            <Select
              w={120}
              data={["5", "10", "20", "50"]}
              value={String(pageSize)}
              onChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
              label="Rows per page"
            />
          </Group>
        </Group>
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Invoice Date</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Customer Title</Table.Th>
              <Table.Th>Sale Account</Table.Th>
              <Table.Th>Sale Title</Table.Th>
              <Table.Th>Salesman</Table.Th>

              <Table.Th>Notes</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.date}</Table.Td>
                <Table.Td>{row.customer}</Table.Td>
                <Table.Td>{row.customerTitle}</Table.Td>
                <Table.Td>{row.saleAccount}</Table.Td>
                <Table.Td>{row.saleTitle}</Table.Td>
                <Table.Td>{row.salesman}</Table.Td>

                <Table.Td>{row.notes}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="#0A6802"
                      onClick={() => openEdit(row)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => openDelete(row.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="#819E00"
                      onClick={() => exportPDF(row)}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination
            total={Math.ceil(filteredData.length / pageSize)}
            value={page}
            onChange={setPage}
            size="sm"
            color="#0A6802"
          />
        </Group>
      </Card>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          editData ? (
            <strong>Edit Sale Return</strong>
          ) : (
            <strong>Create Sale Return</strong>
          )
        }
        size="70%"
        centered
      >
        <div ref={printRef}>
          <Group grow mb="md" w={"50%"}>
            <TextInput
              label="Invoice #"
              placeholder="Enter invoice number"
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
          <Group grow mb="md">
            <TextInput
              label="Customer"
              placeholder="Enter customer"
              value={customer}
              onChange={(e) => setCustomer(e.currentTarget.value)}
            />
            <Select
              label="Customer Title"
              placeholder="Enter customer title"
              value={customerTitle}
              onChange={(value) => setCustomerTitle(value || "")}
            />
            <TextInput
              label="Sale Account"
              placeholder="Enter sale account"
              value={saleAccount}
              onChange={(e) => setSaleAccount(e.currentTarget.value)}
            />
            <Select
              label="Sale Title"
              placeholder="Enter sale title"
              value={saleTitle}
              onChange={(value) => setSaleTitle(value || "")}
            />
            <Select
              label="Salesman"
              placeholder="Enter salesman"
              value={salesman}
              onChange={(value) => setSalesman(value || "")}
            />
          </Group>
          <Card withBorder mb="md" p="md">
            <Text fw={600} mb="sm">
              Return Items
            </Text>

            {items.map((item, idx) => (
              <Group key={idx} grow mb="xs" align="end">
                <TextInput
                  label="Code"
                  placeholder="Code"
                  value={item.code}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].code = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <TextInput
                  label="Product Name"
                  placeholder="Product Name"
                  value={item.productName}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].productName = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <TextInput
                  label="Description"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].description = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <TextInput
                  label="Unit"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].unit = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <NumberInput
                  label="Quantity"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].quantity = Number(val) || 0;
                    next[idx].amount = next[idx].quantity * next[idx].rate;
                    next[idx].netAmount = next[idx].amount - next[idx].discount;
                    setItems(next);
                  }}
                  min={0}
                />
                <NumberInput
                  label="Rate"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].rate = Number(val) || 0;
                    next[idx].amount = next[idx].quantity * next[idx].rate;
                    next[idx].netAmount = next[idx].amount - next[idx].discount;
                    setItems(next);
                  }}
                  min={0}
                />
                <NumberInput
                  label="Amount"
                  placeholder="Amount"
                  value={item.amount}
                  readOnly
                />
                <NumberInput
                  label="Discount"
                  placeholder="Discount"
                  value={item.discount}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].discount = Number(val) || 0;
                    next[idx].netAmount = next[idx].amount - next[idx].discount;
                    setItems(next);
                  }}
                  min={0}
                />
                <NumberInput
                  label="Net Amount"
                  placeholder="Net Amount"
                  value={item.netAmount}
                  readOnly
                />
                <Button
                  variant="light"
                  color="red"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </Group>
            ))}

            <Button
              w={"5%"}
              mt="xs"
              color="#0A6802"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    code: "",
                    productName: "",
                    description: "",
                    unit: "",
                    quantity: 0,
                    rate: 0,
                    amount: 0,
                    discount: 0,
                    netAmount: 0,
                  },
                ])
              }
            >
              + Add Item
            </Button>
          </Card>

          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />
        </div>
        <Group justify="flex-end" mt="md">
          <Button color="#0A6802" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSave}>
            {editData ? "Update Return" : "Create Return"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={<strong>Delete Sale Return</strong>}
        centered
      >
        <Text mb="md">Are you sure you want to delete this record?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
