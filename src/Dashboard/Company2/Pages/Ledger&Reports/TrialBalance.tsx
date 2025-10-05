import { useState } from "react";
import {
  Card,
  Text,
  Grid,
  Table,
  Group,
  Button,
  TextInput,
  Select,
  Pagination,
} from "@mantine/core";
import { Download, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

// You should fetch Company2 data from /trial-balance-company2 endpoint here
const accounts: any[] = [
  // ...use static or fetched data for demo, update to use Company2 data
];

export default function TrialBalanceCompany2() {
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState(accounts);

  const applyFilter = () => {
    let result = accounts;

    if (fromDate) {
      result = result.filter((a) => new Date(a.date) >= new Date(fromDate));
    }
    if (toDate) {
      result = result.filter((a) => new Date(a.date) <= new Date(toDate));
    }
    if (accountType) {
      result = result.filter((a) => a.type === accountType);
    }
    if (search) {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredData(result);
    setActivePage(1);
  };

  const totalDebit = filteredData.reduce((s, a) => s + a.debit, 0);
  const totalCredit = filteredData.reduce((s, a) => s + a.credit, 0);
  const balanced = totalDebit === totalCredit;

  const assets = filteredData
    .filter((a) => a.type === "Asset")
    .reduce((s, a) => s + a.debit - a.credit, 0);
  const liabilities = filteredData
    .filter((a) => a.type === "Liability")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const equity = filteredData
    .filter((a) => a.type === "Equity")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const revenue = filteredData
    .filter((a) => a.type === "Revenue")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const expenses = filteredData
    .filter((a) => a.type === "Expense")
    .reduce((s, a) => s + a.debit - a.credit, 0);

  const start = (activePage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedAccounts = filteredData.slice(start, end);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Trial Balance Report", 14, 15);

    autoTable(doc, {
      head: [["Code", "Account Name", "Type", "Debit", "Credit", "Date"]],
      body: [
        ...filteredData.map((a) => [
          a.code,
          a.name,
          a.type,
          `₹${a.debit.toLocaleString()}`,
          `₹${a.credit.toLocaleString()}`,
          a.date,
        ]),
        [
          {
            content: "Totals",
            colSpan: 3,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: `₹${totalDebit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
          {
            content: `₹${totalCredit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
          "",
        ],
      ] as RowInput[],
      startY: 20,
    });

    doc.save("trial_balance_company2.pdf");
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          Trial Balance
        </Text>
        <Button
          leftSection={<Download size={16} />}
          color="#0A6802"
          onClick={exportPDF}
        >
          Export Report
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={2}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Assets</Text>
            <Text fw={700}>₹{assets.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Liabilities</Text>
            <Text fw={700}>₹{liabilities.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Equity</Text>
            <Text fw={700}>₹{equity.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Revenue</Text>
            <Text fw={700}>₹{revenue.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Expenses</Text>
            <Text fw={700}>₹{expenses.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="md" mt="md" bg="#F1FCF0" withBorder>
        <Group grow>
          <TextInput
            label="Search"
            placeholder="Search by account code or name"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <TextInput
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <TextInput
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <Select
            label="Account Type"
            placeholder="Select type"
            data={["Asset", "Liability", "Equity", "Revenue", "Expense"]}
            value={accountType}
            onChange={setAccountType}
            clearable
          />
          <Button
            mt={23}
            color="#0A6802"
            leftSection={<Filter size={16} color="white" />}
            onClick={applyFilter}
          >
            Generate Report
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="md" mt="md" withBorder bg="#F1FCF0">
        <Text fw={600} mb="sm">
          Trial Balance (Filtered)
        </Text>
        <Table striped highlightOnHover withTableBorder bg={"#F1FCF0"}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Account Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Debit</Table.Th>
              <Table.Th>Credit</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedAccounts.map((a, i) => (
              <Table.Tr key={i}>
                <Table.Td>{a.code}</Table.Td>
                <Table.Td>{a.name}</Table.Td>
                <Table.Td>{a.type}</Table.Td>
                <Table.Td c="#0A6802">₹{a.debit.toLocaleString()}</Table.Td>
                <Table.Td c="red">₹{a.credit.toLocaleString()}</Table.Td>
                <Table.Td>{a.date}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
          <Table.Tfoot>
            <Table.Tr>
              <Table.Th colSpan={3}>Totals</Table.Th>
              <Table.Th>₹{totalDebit.toLocaleString()}</Table.Th>
              <Table.Th>₹{totalCredit.toLocaleString()}</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Tfoot>
        </Table>

        <Text mt="sm" c={balanced ? "#0A6802" : "red"} fw={700}>
          {balanced ? "Balanced" : "Unbalanced"}
        </Text>

        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm">Rows per page:</Text>
            <Select
              value={rowsPerPage.toString()}
              onChange={(value) => {
                setRowsPerPage(Number(value));
                setActivePage(1);
              }}
              data={["5", "10", "20", "50"]}
              w={80}
            />
          </Group>

          <Pagination
            color="#0A6802"
            total={Math.ceil(filteredData.length / rowsPerPage)}
            value={activePage}
            onChange={setActivePage}
            withEdges
          />
        </Group>
      </Card>
    </div>
  );
}
