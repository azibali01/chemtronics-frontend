// src/pages/CashBook.tsx
import {
  Title,
  Text,
  Group,
  Button,
  Card,
  SimpleGrid,
  Table,
  Badge,
  Modal,
  Textarea,
  Select,
  NumberInput,
  TextInput,
  Pagination,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconDownload,
  IconArrowDown,
  IconArrowUp,
  IconSearch,
  IconFilter,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "@mantine/form";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Entry = {
  date: string;
  particulars: string;
  voucher: string;
  type: "Receipt" | "Payment";
  amount: number;
};

type EntryWithBalance = Entry & { balance: number };

export default function CashBook() {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      date: new Date().toISOString().split("T")[0],
      type: "Cash Receipt",
      particulars: "",
      amount: 0,
    },

    validate: {
      particulars: (value) =>
        value.trim().length === 0 ? "Please enter particulars" : null,
      amount: (value) => (value <= 0 ? "Amount must be greater than 0" : null),
    },
  });

  const [entries, setEntries] = useState<Entry[]>([
    {
      date: "2024-01-15",
      particulars: "Sales payment received from ABC Corp",
      voucher: "CR-001",
      type: "Receipt",
      amount: 2500,
    },
    {
      date: "2024-01-14",
      particulars: "Office rent payment",
      voucher: "CP-001",
      type: "Payment",
      amount: -3000,
    },
    {
      date: "2024-01-13",
      particulars: "Utility bill payment",
      voucher: "CP-002",
      type: "Payment",
      amount: -450,
    },
    {
      date: "2024-01-12",
      particulars: "Cash sales",
      voucher: "CR-002",
      type: "Receipt",
      amount: 1800,
    },
  ]);

  const [query, setQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Receipt" | "Payment">(
    "All"
  );

  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, dateRange, pageSize]);

  const toDate = (value: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const filteredSorted: Entry[] = useMemo(() => {
    const [startStr, endStr] = dateRange;
    const start = toDate(startStr);
    const end = toDate(endStr);

    const byFilters = entries.filter((e) => {
      if (typeFilter !== "All" && e.type !== typeFilter) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const hit =
          e.particulars.toLowerCase().includes(q) ||
          e.voucher.toLowerCase().includes(q);
        if (!hit) return false;
      }

      const d = new Date(e.date);
      if (start && d < start) return false;
      if (end && d > end) return false;

      return true;
    });

    return byFilters.sort(
      (a: Entry, b: Entry) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries, query, typeFilter, dateRange]);

  const withBalance: EntryWithBalance[] = useMemo(() => {
    let bal = 0;
    return filteredSorted.map((e) => {
      bal += e.amount;
      return { ...e, balance: bal };
    });
  }, [filteredSorted]);

  const pageCount = Math.max(1, Math.ceil(withBalance.length / pageSize));
  const pagedRows = withBalance.slice((page - 1) * pageSize, page * pageSize);

  const totalReceipts = filteredSorted
    .filter((e) => e.type === "Receipt")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPayments = Math.abs(
    filteredSorted
      .filter((e) => e.type === "Payment")
      .reduce((sum, e) => sum + e.amount, 0)
  );

  const closingBalance = withBalance[0]?.balance ?? 0;

  const handleSubmit = (values: typeof form.values) => {
    const newEntry: Entry = {
      date: values.date,
      particulars: values.particulars,
      voucher: values.type === "Cash Receipt" ? "CR-NEW" : "CP-NEW",
      type: values.type === "Cash Receipt" ? "Receipt" : "Payment",
      amount: values.type === "Cash Receipt" ? values.amount : -values.amount,
    };

    setEntries((prev) => [...prev, newEntry]);
    close();
    form.reset();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Cash Book Report", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const filterLineParts: string[] = [];
    if (query.trim()) filterLineParts.push(`Search="${query.trim()}"`);
    if (typeFilter !== "All") filterLineParts.push(`Type=${typeFilter}`);
    if (dateRange[0] || dateRange[1]) {
      filterLineParts.push(
        `Range=${dateRange[0] ?? "—"} to ${dateRange[1] ?? "—"}`
      );
    }
    if (filterLineParts.length) {
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(filterLineParts.join("  |  "), 14, 36);
    }

    autoTable(doc, {
      startY: filterLineParts.length ? 42 : 40,
      head: [
        ["Date", "Particulars", "Voucher No.", "Type", "Amount", "Balance"],
      ],
      body: withBalance.map((e) => [
        e.date,
        e.particulars,
        e.voucher,
        e.type,
        e.amount > 0 ? `+₹${e.amount}` : `-₹${Math.abs(e.amount)}`,
        `₹${e.balance}`,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [34, 139, 230] },
    });

    const lastY =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY ?? 50;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total Receipts: ₹${totalReceipts.toLocaleString()}`,
      14,
      lastY + 10
    );
    doc.text(
      `Total Payments: ₹${totalPayments.toLocaleString()}`,
      14,
      lastY + 17
    );

    doc.setTextColor(34, 139, 34);
    doc.text(
      `Closing Balance: ₹${closingBalance.toLocaleString()}`,
      14,
      lastY + 24
    );

    doc.save("cashbook.pdf");
  };

  const allClosingBalance = useMemo(() => {
    let bal = 0;
    [...entries]
      .sort(
        (a: Entry, b: Entry) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .forEach((e) => {
        bal += e.amount;
      });
    return bal;
  }, [entries]);

  const allReceipts = useMemo(
    () =>
      entries
        .filter((e) => e.type === "Receipt")
        .reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );

  const allPayments = useMemo(
    () =>
      Math.abs(
        entries
          .filter((e) => e.type === "Payment")
          .reduce((sum, e) => sum + e.amount, 0)
      ),
    [entries]
  );

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Cash Book</Title>
          <Text c="dimmed">Record all cash receipts and payments</Text>
        </div>
        <Group>
          <Button
            leftSection={<IconPlus size={16} />}
            color="#0A6802"
            onClick={open}
          >
            Add Entry
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
          <Group>
            <IconArrowUp color="green" />
            <div>
              <Text size="xs" c="dimmed">
                Total Receipts
              </Text>
              <Text fw={500}>₹{allReceipts.toLocaleString()}</Text>
            </div>
          </Group>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
          <Group>
            <IconArrowDown color="red" />
            <div>
              <Text size="xs" c="dimmed">
                Total Payments
              </Text>
              <Text fw={500}>₹{allPayments.toLocaleString()}</Text>
            </div>
          </Group>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
          <Group>
            <div>
              <Text size="xs" c="dimmed">
                Closing Balance
              </Text>
              <Text fw={500}>₹{allClosingBalance.toLocaleString()}</Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        mb="md"
        bg={"#F1FCF0"}
      >
        <Group mb="sm" gap="sm">
          <TextInput
            label="Search"
            leftSection={<IconSearch size={16} />}
            placeholder="Search particulars or voucher..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            label="Filter Type"
            leftSection={<IconFilter size={16} />}
            data={["All", "Receipt", "Payment"]}
            value={typeFilter}
            onChange={(val) =>
              setTypeFilter((val as "All" | "Receipt" | "Payment") ?? "All")
            }
          />

          <Group gap="sm">
            <TextInput
              type="date"
              label="From"
              value={dateRange[0] ?? ""}
              onChange={(e) =>
                setDateRange([e.currentTarget.value || null, dateRange[1]])
              }
            />
            <TextInput
              type="date"
              label="To"
              value={dateRange[1] ?? ""}
              onChange={(e) =>
                setDateRange([dateRange[0], e.currentTarget.value || null])
              }
            />
          </Group>
        </Group>
      </Card>
      <Group justify="flex-end">
        <Button
          mb={20}
          color="#0A6802"
          leftSection={<IconDownload size={16} />}
          onClick={exportToPDF}
        >
          Export PDF
        </Button>
      </Group>

      <Table highlightOnHover withTableBorder withColumnBorders bg={"#F1FCF0"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Particulars</Table.Th>
            <Table.Th>Voucher No.</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Amount</Table.Th>
            <Table.Th>Balance</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pagedRows.map((e, idx) => (
            <Table.Tr key={idx}>
              <Table.Td>{e.date}</Table.Td>
              <Table.Td>{e.particulars}</Table.Td>
              <Table.Td>{e.voucher}</Table.Td>
              <Table.Td>
                <Badge color={e.type === "Receipt" ? "#0A6802" : "red"}>
                  {e.type}
                </Badge>
              </Table.Td>
              <Table.Td>
                {e.amount > 0 ? `+${e.amount}` : `-${Math.abs(e.amount)}`}
              </Table.Td>
              <Table.Td>{e.balance}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="space-between" mt="md">
        <Select
          data={["5", "10", "20", "50"]}
          value={pageSize.toString()}
          onChange={(v) => setPageSize(Number(v))}
          label="Rows per page"
          style={{ width: "100px" }}
        />
        <Pagination
          color="#0A6802"
          total={pageCount}
          value={page}
          onChange={setPage}
        />
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title={<strong>Add Cash Book Entry</strong>}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Date"
            type="date"
            value={form.values.date}
            onChange={(e) => form.setFieldValue("date", e.currentTarget.value)}
            required
            mb="md"
          />

          <Select
            label="Entry Type"
            data={["Cash Receipt", "Cash Payment"]}
            value={form.values.type}
            onChange={(v) => form.setFieldValue("type", v ?? "Cash Receipt")}
            mb="md"
          />

          <Textarea
            label="Particulars"
            placeholder="Description of transaction"
            {...form.getInputProps("particulars")}
            mb="md"
          />

          <NumberInput
            label="Amount"
            min={0}
            step={0.01}
            value={form.values.amount}
            onChange={(n) => form.setFieldValue("amount", Number(n) || 0)}
            mb="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" color="#0A6802">
              Add Entry
            </Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}
