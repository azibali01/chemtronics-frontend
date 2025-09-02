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
  ThemeIcon,
  TextInput,
  Pagination,
  Stack,
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconCreditCard,
  IconCircle,
  IconCalendarTime,
  IconDownload,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type CreditSale = {
  id: string;
  customer: string;
  date: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  terms: string;
  status: "Paid" | "Partial" | "Due";
};

const dataInit: CreditSale[] = [
  {
    id: "CS-012",
    customer: "Global Inc",
    date: "2024-01-15",
    dueDate: "2024-03-15",
    total: 5200,
    paid: 2000,
    balance: 3200,
    terms: "60 Days",
    status: "Partial",
  },
  {
    id: "CS-013",
    customer: "Enterprise Corp",
    date: "2024-01-10",
    dueDate: "2024-02-09",
    total: 3800,
    paid: 0,
    balance: 3800,
    terms: "30 Days",
    status: "Due",
  },
  {
    id: "CS-014",
    customer: "Business Solutions",
    date: "2024-01-05",
    dueDate: "2024-02-04",
    total: 2400,
    paid: 2400,
    balance: 0,
    terms: "30 Days",
    status: "Paid",
  },
];

function StatusBadge({ status }: { status: CreditSale["status"] }) {
  switch (status) {
    case "Paid":
      return <Badge color="teal">Paid</Badge>;
    case "Partial":
      return <Badge color="yellow">Partial</Badge>;
    case "Due":
      return <Badge color="red">Due</Badge>;
  }
}

export default function CreditSaleInvoice() {
  const [data, setData] = useState<CreditSale[]>(dataInit);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [search, setSearch] = useState("");

  const filteredData = data.filter(
    (d) =>
      d.customer.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase())
  );

  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);

  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<CreditSale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [customer, setCustomer] = useState<string | null>(null);
  const [saleDate, setSaleDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [total, setTotal] = useState<number | "">("");
  const [paid, setPaid] = useState<number | "">("");
  const [terms, setTerms] = useState<string | null>(null);

  const activeSales = data.filter((d) => d.status !== "Paid").length;
  const totalAmount = data.reduce((acc, d) => acc + d.total, 0);
  const avgPeriod = Math.round(
    data.reduce((acc, d) => acc + parseInt(d.terms), 0) / data.length
  );

  const exportPDF = (row: CreditSale) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Credit Sale Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Credit Sale #", row.id],
        ["Customer", row.customer],
        ["Sale Date", row.date],
        ["Due Date", row.dueDate],
        ["Total Amount", `$${row.total.toFixed(2)}`],
        ["Paid Amount", `$${row.paid.toFixed(2)}`],
        ["Balance", `$${row.balance.toFixed(2)}`],
        ["Payment Terms", row.terms],
        ["Status", row.status],
      ],
    });

    doc.save(`${row.id}.pdf`);
  };

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (row: CreditSale) => {
    setEditData(row);
    setCustomer(row.customer);
    setSaleDate(row.date);
    setDueDate(row.dueDate);
    setTotal(row.total);
    setPaid(row.paid);
    setTerms(row.terms);
    setOpened(true);
  };

  const handleSave = () => {
    if (!customer || !saleDate || !dueDate || !total) return;

    if (editData) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editData.id
            ? {
                ...d,
                customer,
                date: saleDate,
                dueDate: dueDate,
                total: Number(total),
                paid: Number(paid) || 0,
                balance: Number(total) - (Number(paid) || 0),
                terms: terms || "30 Days",
                status:
                  Number(paid) >= Number(total)
                    ? "Paid"
                    : Number(paid) > 0
                    ? "Partial"
                    : "Due",
              }
            : d
        )
      );
    } else {
      const newSale: CreditSale = {
        id: `CS-${Math.floor(Math.random() * 1000)}`,
        customer,
        date: saleDate,
        dueDate: dueDate,
        total: Number(total),
        paid: Number(paid) || 0,
        balance: Number(total) - (Number(paid) || 0),
        terms: terms || "30 Days",
        status:
          Number(paid) >= Number(total)
            ? "Paid"
            : Number(paid) > 0
            ? "Partial"
            : "Due",
      };
      setData((prev) => [...prev, newSale]);
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
    setSaleDate("");
    setDueDate("");
    setTotal("");
    setPaid("");
    setTerms(null);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Credit Sales</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          Create Credit Sale
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Active Credit Sales</Text>
            <ThemeIcon color="#819E00" variant="light">
              <IconCreditCard size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={15}>
            {activeSales}
          </Title>
        </Card>
        <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Total Credit Amount</Text>
            <ThemeIcon color="blue" variant="light">
              <IconCircle size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={15}>
            {totalAmount}
          </Title>
        </Card>
        <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Avg Credit Period</Text>
            <ThemeIcon color="#819E00" variant="light">
              <IconCalendarTime size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={15}>
            {avgPeriod} days
          </Title>
        </Card>
      </SimpleGrid>

      <Stack mb="md">
        <div>
          <Text fw={600}>Credit Sales Overview</Text>
          <Text c="dimmed" size="sm">
            Manage credit sales and payment terms
          </Text>
        </div>
        <TextInput
          placeholder="Search by Customer or ID"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          w={250}
        />
      </Stack>

      <Card withBorder radius="md" shadow="sm" p="md" bg={"#F1FCF0"}>
        <Group mb="sm">
          <IconCreditCard size={20} />
          <Text fw={600}>Credit Sales List</Text>
        </Group>
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Credit Sale #</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Total Amount</Table.Th>
              <Table.Th>Paid Amount</Table.Th>
              <Table.Th>Balance</Table.Th>
              <Table.Th>Terms</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.customer}</Table.Td>
                <Table.Td>{row.date}</Table.Td>
                <Table.Td>{row.dueDate}</Table.Td>
                <Table.Td>${row.total.toFixed(2)}</Table.Td>
                <Table.Td>${row.paid.toFixed(2)}</Table.Td>
                <Table.Td>${row.balance.toFixed(2)}</Table.Td>
                <Table.Td>
                  <Badge variant="light">{row.terms}</Badge>
                </Table.Td>
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
            {paginatedData.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={10} style={{ textAlign: "center" }}>
                  No results found
                </Table.Td>
              </Table.Tr>
            )}
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
            <strong>Edit Credit Sale</strong>
          ) : (
            <strong>Create New Credit Sale</strong>
          )
        }
        centered
        size="lg"
      >
        <Group grow mb="md">
          <Select
            label="Customer"
            placeholder="Select customer"
            data={["Global Inc", "Enterprise Corp", "Business Solutions"]}
            value={customer}
            onChange={setCustomer}
          />
          <TextInput
            label="Sale Date"
            placeholder="mm/dd/yyyy"
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.currentTarget.value)}
          />
        </Group>
        <Group grow mb="md">
          <NumberInput
            label="Total Amount"
            value={total}
            onChange={(val) => setTotal(val === null ? "" : Number(val))}
            min={0}
            decimalScale={2}
            fixedDecimalScale
          />
          <Select
            label="Payment Terms"
            placeholder="Select payment terms"
            data={["30 Days", "60 Days", "90 Days"]}
            value={terms}
            onChange={setTerms}
          />
        </Group>
        <Group grow mb="md">
          <TextInput
            label="Due Date"
            placeholder="mm/dd/yyyy"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.currentTarget.value)}
          />
          <NumberInput
            label="Paid Amount"
            value={paid}
            onChange={(val) => setPaid(val === null ? "" : Number(val))}
            min={0}
            decimalScale={2}
            fixedDecimalScale
          />
        </Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSave}>
            {editData ? "Update Credit Sale" : "Create Credit Sale"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Credit Sale"
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
