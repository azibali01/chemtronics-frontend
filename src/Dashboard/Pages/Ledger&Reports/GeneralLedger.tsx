import { useState } from "react";
import {
  Card,
  Grid,
  Text,
  Group,
  Table,
  Button,
  Select,
  TextInput,
  Badge,
  Pagination,
  Stack,
} from "@mantine/core";

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBook,
  IconFilter,
  IconDownload,
  IconSearch,
  IconCash,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

interface LedgerEntry {
  date: string;
  account: string;
  type: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

const ledgerData: LedgerEntry[] = [
  {
    date: "2024-01-01",
    account: "Cash",
    type: "asset",
    reference: "OP-001",
    description: "Opening Balance",
    debit: "₹100,000",
    credit: "-",
    balance: "₹100,000",
  },
  {
    date: "2024-01-02",
    account: "Sales Revenue",
    type: "revenue",
    reference: "SI-001",
    description: "Sales Invoice #001",
    debit: "-",
    credit: "₹50,000",
    balance: "₹50,000",
  },
  {
    date: "2024-01-02",
    account: "Accounts Receivable",
    type: "asset",
    reference: "SI-001",
    description: "Sales Invoice #001",
    debit: "₹50,000",
    credit: "-",
    balance: "₹50,000",
  },
  {
    date: "2024-01-03",
    account: "Purchase Expense",
    type: "expense",
    reference: "PI-001",
    description: "Purchase Invoice #001",
    debit: "₹30,000",
    credit: "-",
    balance: "₹30,000",
  },
  {
    date: "2024-01-03",
    account: "Accounts Payable",
    type: "liability",
    reference: "PI-001",
    description: "Purchase Invoice #001",
    debit: "-",
    credit: "₹30,000",
    balance: "₹30,000",
  },
  {
    date: "2024-01-05",
    account: "Cash",
    type: "asset",
    reference: "RC-001",
    description: "Cash Receipt from Customer",
    debit: "₹25,000",
    credit: "-",
    balance: "₹125,000",
  },
];

export default function GeneralLedger() {
  const [account, setAccount] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [search, setSearch] = useState("");

  const [activePage, setActivePage] = useState(1);
  const pageSize = 10;

  const filteredData = ledgerData.filter((entry) => {
    const entryDate = new Date(entry.date);

    const matchesSearch =
      search === "" ||
      entry.account.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.toLowerCase().includes(search.toLowerCase());

    const matchesAccount = !account || entry.account === account;
    const matchesType = !accountType || entry.type === accountType;

    const matchesFromDate = !fromDate || entryDate >= fromDate;
    const matchesToDate = !toDate || entryDate <= toDate;

    return (
      matchesSearch &&
      matchesAccount &&
      matchesType &&
      matchesFromDate &&
      matchesToDate
    );
  });

  const startIndex = (activePage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("General Ledger Report", 14, 15);

    autoTable(doc, {
      head: [
        [
          "Date",
          "Account",
          "Type",
          "Reference",
          "Description",
          "Debit",
          "Credit",
          "Balance",
        ],
      ],
      body: filteredData.map<RowInput>((entry) => [
        entry.date,
        entry.account,
        entry.type,
        entry.reference,
        entry.description,
        entry.debit,
        entry.credit,
        entry.balance,
      ]),
      startY: 20,
    });

    doc.save("general_ledger.pdf");
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Stack gap={0}>
          <Text size="xl" fw={700} mb="md">
            General Ledger
          </Text>
          <Text size="sm" c="dimmed" mb="lg">
            Complete record of all financial transactions
          </Text>
        </Stack>
        <Button
          color="#0A6802"
          leftSection={<IconDownload size={16} />}
          onClick={exportPDF}
        >
          Export Ledger
        </Button>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg={"#F1FCF0"}>
            <Group>
              <IconArrowDownRight size={30} color="green" />
              <div>
                <Text size="sm">Total Debits</Text>
                <Text fw={700} size="lg">
                  ₹205,000
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg={"#F1FCF0"}>
            <Group>
              <IconArrowUpRight size={30} color="red" />
              <div>
                <Text size="sm">Total Credits</Text>
                <Text fw={700} size="lg">
                  ₹80,000
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg={"#F1FCF0"}>
            <Group>
              <IconCash size={30} color="blue" />
              <div>
                <Text size="sm">Net Balance</Text>
                <Text fw={700} size="lg" c="#0A6802">
                  125,000
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg={"#F1FCF0"}>
            <Group>
              <IconBook size={30} />
              <div>
                <Text size="sm">Total Entries</Text>
                <Text fw={700} size="lg">
                  {filteredData.length}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="lg" bg={"#F1FCF0"}>
        <Group grow>
          <TextInput
            placeholder="Search accounts..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="All Accounts"
            data={[...new Set(ledgerData.map((d) => d.account))]}
            value={account}
            onChange={setAccount}
            clearable
          />
          <Select
            placeholder="All Types"
            data={["asset", "revenue", "expense", "liability"]}
            value={accountType}
            onChange={setAccountType}
            clearable
          />
          <TextInput
            type="date"
            placeholder="From Date"
            value={fromDate ? fromDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setFromDate(
                e.currentTarget.value ? new Date(e.currentTarget.value) : null
              )
            }
          />
          <TextInput
            type="date"
            placeholder="To Date"
            value={toDate ? toDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setToDate(
                e.currentTarget.value ? new Date(e.currentTarget.value) : null
              )
            }
          />
          <Button color="#0A6802" leftSection={<IconFilter size={16} />}>
            Apply Filter
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder bg={"#F1FCF0"}>
        <Text fw={600} mb="md">
          Ledger Entries
        </Text>
        <Table highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Account</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Reference</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Debit</Table.Th>
              <Table.Th>Credit</Table.Th>
              <Table.Th>Running Balance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((entry, index) => (
              <Table.Tr key={index}>
                <Table.Td>{entry.date}</Table.Td>
                <Table.Td>{entry.account}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      entry.type === "asset"
                        ? "blue"
                        : entry.type === "revenue"
                        ? "green"
                        : entry.type === "expense"
                        ? "orange"
                        : "red"
                    }
                  >
                    {entry.type}
                  </Badge>
                </Table.Td>
                <Table.Td>{entry.reference}</Table.Td>
                <Table.Td>{entry.description}</Table.Td>
                <Table.Td c="#0A6802">{entry.debit}</Table.Td>
                <Table.Td c="red">{entry.credit}</Table.Td>
                <Table.Td fw={600}>{entry.balance}</Table.Td>
              </Table.Tr>
            ))}
            {paginatedData.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: "center" }}>
                  No matching records found
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination
            color="#0A6802"
            total={Math.ceil(filteredData.length / pageSize)}
            value={activePage}
            onChange={setActivePage}
          />
        </Group>
      </Card>
    </div>
  );
}
