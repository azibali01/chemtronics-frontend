import {
  Card,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Title,
  Text,
  Modal,
  Select,
  NumberInput,
  SimpleGrid,
  TextInput,
  Textarea,
  ThemeIcon,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconDownload,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReturnItem = {
  product: string;
  qty: number | "";
  rate: number | "";
  amount: number;
};
type SaleReturn = {
  id: string;
  customer: string;
  invoice: string;
  date: string;
  reason: string;
  items: ReturnItem[];
  notes?: string;
  amount: number;
  status: "pending" | "approved" | "refunded";
};

const dataInit: SaleReturn[] = [
  {
    id: "SR-001",
    customer: "John Doe",
    invoice: "SI-2024-001",
    date: "2024-01-15",
    reason: "Damaged product",
    items: [
      { product: "Keyboard", qty: 2, rate: 3000, amount: 6000 },
      { product: "Mouse", qty: 2, rate: 3000, amount: 6000 },
    ],
    amount: 12000,
    status: "pending",
    notes: "Return due to damage",
  },
  {
    id: "SR-002",
    customer: "Jane Smith",
    invoice: "SI-2024-002",
    date: "2024-01-14",
    reason: "Incorrect item",
    items: [{ product: "Monitor", qty: 1, rate: 5500, amount: 5500 }],
    amount: 5500,
    status: "approved",
    notes: "Wrong size delivered",
  },
  {
    id: "SR-003",
    customer: "Global Inc",
    invoice: "SI-2024-003",
    date: "2024-01-10",
    reason: "Refund processed",
    items: [{ product: "Printer", qty: 1, rate: 12000, amount: 12000 }],
    amount: 12000,
    status: "refunded",
  },
];

function StatusBadge({ status }: { status: SaleReturn["status"] }) {
  switch (status) {
    case "pending":
      return <Badge color="yellow">pending</Badge>;
    case "approved":
      return <Badge color="#0A6802">approved</Badge>;
    case "refunded":
      return <Badge color="blue">refunded</Badge>;
  }
}
const toNumber = (v: string | number | null | undefined) =>
  typeof v === "number" ? v : v ? Number(v) : 0;

export default function SaleReturns() {
  const [data, setData] = useState<SaleReturn[]>(dataInit);

  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<SaleReturn | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [customer, setCustomer] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [reason, setReason] = useState<string | null>(null);
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [notes, setNotes] = useState<string>("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const pending = useMemo(
    () => data.filter((d) => d.status === "pending").length,
    [data]
  );
  const approved = useMemo(
    () => data.filter((d) => d.status === "approved").length,
    [data]
  );
  const refunded = useMemo(
    () => data.filter((d) => d.status === "refunded").length,
    [data]
  );
  const totalValue = useMemo(
    () => data.reduce((acc, d) => acc + d.amount, 0),
    [data]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((d) => {
      const matchQ =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q);
      const matchStatus = statusFilter ? d.status === statusFilter : true;
      return matchQ && matchStatus;
    });
  }, [data, search, statusFilter]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page]);

  const exportPDF = (row: SaleReturn) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sale Return Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Return #", row.id],
        ["Customer", row.customer],
        ["Invoice", row.invoice],
        ["Date", row.date],
        ["Reason", row.reason],
        ["Amount", `₹${row.amount.toLocaleString()}`],
        ["Status", row.status],
        ["Notes", row.notes || "-"],
      ],
    });

    autoTable(doc, {
      startY:
        (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 10,
      head: [["Product", "Qty", "Rate", "Amount"]],
      body: row.items.map((i) => [
        i.product,
        String(i.qty),
        `₹${toNumber(i.rate).toLocaleString()}`,
        `₹${i.amount.toLocaleString()}`,
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
    setCustomer(row.customer);
    setInvoice(row.invoice);
    setDate(row.date);
    setReason(row.reason);
    setItems(row.items.map((i) => ({ ...i })));
    setNotes(row.notes || "");
    setOpened(true);
  };

  const handleSave = () => {
    if (!customer || !invoice || !date) return;

    const normalized = items.map((i) => {
      const qty = toNumber(i.qty);
      const rate = toNumber(i.rate);
      return { ...i, qty, rate, amount: qty * rate };
    });
    const totalAmount = normalized.reduce((acc, i) => acc + i.amount, 0);

    if (editData) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editData.id
            ? {
                ...d,
                customer,
                invoice,
                date,
                reason: reason || "",
                items: normalized,
                notes,
                amount: totalAmount,
              }
            : d
        )
      );
    } else {
      const newReturn: SaleReturn = {
        id: `SR-${Math.floor(Math.random() * 1000)}`,
        customer,
        invoice,
        date,
        reason: reason || "",
        items: normalized,
        notes,
        amount: totalAmount,
        status: "pending",
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
    setCustomer(null);
    setInvoice(null);
    setDate("");
    setReason(null);
    setItems([]);
    setNotes("");
  };

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

      {/* Stats */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" mb="lg">
        <Card withBorder shadow="sm" bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Pending Returns</Text>
            <ThemeIcon color="yellow" variant="light">
              <IconRefresh size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={10}>
            {pending}
          </Title>
        </Card>
        <Card withBorder shadow="sm" bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Approved Returns</Text>
            <ThemeIcon color="#0A6802" variant="light">
              <IconRefresh size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={10}>
            {approved}
          </Title>
        </Card>
        <Card withBorder shadow="sm" bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Refunded</Text>
            <ThemeIcon color="blue" variant="light">
              <IconRefresh size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={10}>
            {refunded}
          </Title>
        </Card>
        <Card withBorder shadow="sm" bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Total Value</Text>
            <ThemeIcon color="#0A6802" variant="light">
              <IconRefresh size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={10}>
            ₹{totalValue.toLocaleString()}
          </Title>
        </Card>
      </SimpleGrid>

      <Card withBorder shadow="sm" radius="md" p="md">
        <Text fw={600} mb="sm">
          Sale Returns List
        </Text>

        <Group mb="md">
          <TextInput
            w={300}
            placeholder="Search by return number or customer..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Select
            w={300}
            placeholder="Filter by status"
            data={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "refunded", label: "Refunded" },
            ]}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            clearable
          />
        </Group>
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Return #</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Original Invoice</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.customer}</Table.Td>
                <Table.Td>{row.invoice}</Table.Td>
                <Table.Td>{row.date}</Table.Td>
                <Table.Td>₹{row.amount.toLocaleString()}</Table.Td>
                <Table.Td>
                  <StatusBadge status={row.status} />
                </Table.Td>
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
        size="lg"
        centered
      >
        <Group grow mb="md">
          <Select
            label="Customer"
            placeholder="Select customer"
            data={["John Doe", "Jane Smith", "Global Inc"]}
            value={customer}
            onChange={setCustomer}
          />
          <Select
            label="Original Invoice"
            placeholder="Select invoice"
            data={["SI-2024-001", "SI-2024-002", "SI-2024-003"]}
            value={invoice}
            onChange={setInvoice}
          />
        </Group>

        <Group grow mb="md">
          <TextInput
            label="Return Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
          <Select
            label="Return Reason"
            placeholder="Select reason"
            data={[
              "Damaged product",
              "Incorrect item",
              "Refund processed",
              "Other",
            ]}
            value={reason}
            onChange={setReason}
          />
        </Group>

        <Card withBorder mb="md" p="md">
          <Text fw={600} mb="sm">
            Return Items
          </Text>

          {items.map((item, idx) => (
            <Group key={idx} grow mb="xs" align="end">
              <TextInput
                label="Product"
                placeholder="Product name"
                value={item.product}
                onChange={(e) => {
                  const next = [...items];
                  next[idx].product = e.currentTarget.value;
                  setItems(next);
                }}
              />
              <NumberInput
                label="Quantity"
                placeholder="Qty"
                value={item.qty}
                onChange={(val) => {
                  const next = [...items];
                  next[idx].qty = val === "" ? "" : Number(val);
                  const q = toNumber(next[idx].qty);
                  const r = toNumber(next[idx].rate);
                  next[idx].amount = q * r;
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
                  next[idx].rate = val === "" ? "" : Number(val);
                  const q = toNumber(next[idx].qty);
                  const r = toNumber(next[idx].rate);
                  next[idx].amount = q * r;
                  setItems(next);
                }}
                min={0}
              />
              <TextInput
                label="Amount"
                placeholder="Amount"
                value={item.amount.toString()}
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
            mt="xs"
            variant="light"
            color="#0A6802"
            onClick={() =>
              setItems([
                ...items,
                { product: "", qty: 1, rate: 0, amount: 1 * 0 },
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

        <Group justify="flex-end" mt="md">
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
