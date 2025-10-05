"use client";
import { useState } from "react";
import {
  Card,
  Text,
  Grid,
  Button,
  Table,
  Group,
  Badge,
  Stack,
  Pagination,
  TextInput,
  Select,
} from "@mantine/core";
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { Download, Filter } from "lucide-react";
import {
  IconAlertCircle,
  IconArrowUpRight,
  IconClock,
} from "@tabler/icons-react";

interface Customer {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  customerId: string;
  date: string;
  invoiceNo: string;
  amount: number;
  received: number;
  balance: number;
  status: "paid" | "partial" | "pending" | "overdue";
}

const customers: Customer[] = [
  { id: "c1", name: "ABC Company" },
  { id: "c2", name: "XYZ Industries" },
];

const invoices: Invoice[] = [
  {
    id: "i1",
    customerId: "c1",
    date: "2024-01-02",
    invoiceNo: "INV-001",
    amount: 20000,
    received: 10000,
    balance: 10000,
    status: "partial",
  },
  {
    id: "i2",
    customerId: "c1",
    date: "2024-01-10",
    invoiceNo: "INV-002",
    amount: 30000,
    received: 0,
    balance: 30000,
    status: "pending",
  },
  {
    id: "i3",
    customerId: "c2",
    date: "2024-01-05",
    invoiceNo: "INV-003",
    amount: 40000,
    received: 20000,
    balance: 20000,
    status: "partial",
  },
  {
    id: "i4",
    customerId: "c2",
    date: "2024-01-12",
    invoiceNo: "INV-004",
    amount: 35000,
    received: 0,
    balance: 35000,
    status: "overdue",
  },
];

const AccountsReceivableCompany2 = () => {
  const [page, setPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agingFilter, setAgingFilter] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const pageSize = 5;
  const invoicePageSize = 5;

  const filteredInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const matchesDate = (!from || invDate >= from) && (!to || invDate <= to);
    return matchesDate;
  });

  const customerData = customers.map((cust) => {
    const custInvoices = filteredInvoices.filter(
      (inv) => inv.customerId === cust.id
    );
    const outstanding = custInvoices.reduce((s, i) => s + i.balance, 0);
    const current = custInvoices
      .filter((i) => i.status === "pending")
      .reduce((s, i) => s + i.balance, 0);
    const d30 = custInvoices
      .filter((i) => i.status === "partial")
      .reduce((s, i) => s + i.balance, 0);
    const d60 = custInvoices
      .filter((i) => i.status === "overdue")
      .reduce((s, i) => s + i.balance, 0);
    const d90 = custInvoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.balance, 0);
    return { ...cust, outstanding, current, d30, d60, d90 };
  });

  const filteredCustomers = customerData.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    let matchesAging = true;
    if (agingFilter === "current") matchesAging = c.current > 0;
    else if (agingFilter === "31-60") matchesAging = c.d30 > 0;
    else if (agingFilter === "61-90") matchesAging = c.d60 > 0;
    else if (agingFilter === "90+") matchesAging = c.d90 > 0;
    return matchesSearch && matchesAging;
  });

  const start = (page - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(start, start + pageSize);

  // --------- Totals ---------
  const totalOutstanding = filteredCustomers.reduce(
    (s, c) => s + c.outstanding,
    0
  );
  const totalCurrent = filteredCustomers.reduce((s, c) => s + c.current, 0);
  const total30 = filteredCustomers.reduce((s, c) => s + c.d30, 0);
  const total60 = filteredCustomers.reduce((s, c) => s + c.d60, 0);
  const total90 = filteredCustomers.reduce((s, c) => s + c.d90, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Accounts Receivable Report", 14, 15);
    autoTable(doc, {
      head: [["Customer", "Outstanding", "Current", "31-60", "61-90", "90+"]],
      body: filteredCustomers.map((c) => [
        c.name,
        `₹${c.outstanding.toLocaleString()}`,
        `₹${c.current.toLocaleString()}`,
        `₹${c.d30.toLocaleString()}`,
        `₹${c.d60.toLocaleString()}`,
        `₹${c.d90.toLocaleString()}`,
      ]) as RowInput[],
      startY: 20,
    });
    doc.save("accounts_receivable_company2.pdf");
  };

  const exportInvoicesPDF = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    const invs = filteredInvoices.filter((i) => i.customerId === custId);
    const doc = new jsPDF();
    doc.text(`Invoices - ${cust?.name}`, 14, 15);
    autoTable(doc, {
      head: [
        ["Date", "Invoice No.", "Amount", "Received", "Balance", "Status"],
      ],
      body: invs.map((i) => [
        i.date,
        i.invoiceNo,
        `₹${i.amount.toLocaleString()}`,
        `₹${i.received.toLocaleString()}`,
        `₹${i.balance.toLocaleString()}`,
        i.status,
      ]) as RowInput[],
      startY: 20,
    });
    doc.save(`invoices_${cust?.name}_company2.pdf`);
  };

  const renderStatus = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return <Badge color="#0A6802">Paid</Badge>;
      case "partial":
        return <Badge color="yellow">Partial</Badge>;
      case "pending":
        return <Badge color="blue">Pending</Badge>;
      case "overdue":
        return <Badge color="red">Overdue</Badge>;
    }
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Stack gap={0}>
          <Text size="xl" fw={700} mb="md">
            Accounts Receivable
          </Text>
          <Text c="dimmed">Track outstanding balances and aging</Text>
        </Stack>
        <Button
          leftSection={<Download size={16} />}
          color="#0A6802"
          onClick={exportPDF}
        >
          Export Report
        </Button>
      </Group>

      <Grid mb="md">
        <Grid.Col span={2}>
          <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
            <Group>
              <IconArrowUpRight size={30} color="green" />
              <Stack gap={0}>
                <Text>Outstanding</Text>
                <Text fw={700}>₹{totalOutstanding.toLocaleString()}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
            <Group>
              <IconArrowUpRight size={30} color="blue" />
              <Stack gap={0}>
                <Text>Current</Text>
                <Text fw={700}>₹{totalCurrent.toLocaleString()}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
            <Group>
              <IconClock size={30} color="#D08700" />
              <Stack gap={0}>
                <Text>31-60 Days</Text>
                <Text fw={700}>₹{total30.toLocaleString()}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
            <Group>
              <IconClock size={30} color="#A86500" />
              <Stack gap={0}>
                <Text>61-90 Days</Text>
                <Text fw={700}>₹{total60.toLocaleString()}</Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
            <Group>
              <IconAlertCircle size={30} color="red" />
              <Stack gap={0}>
                <Text>90+ Days</Text>
                <Text fw={700} c="red">
                  ₹{total90.toLocaleString()}
                </Text>
              </Stack>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="md" mb="md" withBorder bg="#F1FCF0">
        <Group grow>
          <TextInput
            label="Search Customer"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            label="Aging"
            placeholder="Select bucket"
            data={["current", "31-60", "61-90", "90+"]}
            value={agingFilter}
            onChange={setAgingFilter}
            clearable
          />
          <TextInput
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
          />
          <Button mt={23} color="#0A6802" leftSection={<Filter size={16} />}>
            Apply Filter
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
        <Text fw={600} mb="sm">
          Customer Receivables Aging
        </Text>
        <Table highlightOnHover withTableBorder striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Outstanding</Table.Th>
              <Table.Th>Current</Table.Th>
              <Table.Th>31-60</Table.Th>
              <Table.Th>61-90</Table.Th>
              <Table.Th>90+</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedCustomers.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>₹{c.outstanding.toLocaleString()}</Table.Td>
                <Table.Td>₹{c.current.toLocaleString()}</Table.Td>
                <Table.Td>₹{c.d30.toLocaleString()}</Table.Td>
                <Table.Td>₹{c.d60.toLocaleString()}</Table.Td>
                <Table.Td>₹{c.d90.toLocaleString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="#0A6802"
                      onClick={() =>
                        setExpandedCustomer(
                          expandedCustomer === c.id ? null : c.id
                        )
                      }
                    >
                      {expandedCustomer === c.id
                        ? "Hide Details"
                        : "View Details"}
                    </Button>
                    <Button
                      size="xs"
                      color="blue"
                      onClick={() => exportInvoicesPDF(c.id)}
                    >
                      Export Invoices
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination
            total={Math.ceil(filteredCustomers.length / pageSize)}
            value={page}
            onChange={setPage}
            size="sm"
            color="#0A6802"
          />
        </Group>
      </Card>

      {expandedCustomer && (
        <Card shadow="sm" p="md" mt="lg" withBorder bg="#F1FCF0">
          <Text fw={600} mb="sm">
            Invoice Details -{" "}
            {customers.find((c) => c.id === expandedCustomer)?.name}
          </Text>
          <Table highlightOnHover withTableBorder striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Received</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredInvoices
                .filter((i) => i.customerId === expandedCustomer)
                .slice(
                  (invoicePage - 1) * invoicePageSize,
                  invoicePage * invoicePageSize
                )
                .map((i) => (
                  <Table.Tr key={i.id}>
                    <Table.Td>{i.date}</Table.Td>
                    <Table.Td>{i.invoiceNo}</Table.Td>
                    <Table.Td>₹{i.amount.toLocaleString()}</Table.Td>
                    <Table.Td c="#0A6802">
                      ₹{i.received.toLocaleString()}
                    </Table.Td>
                    <Table.Td c={i.balance > 0 ? "red" : "#0A6802"}>
                      ₹{i.balance.toLocaleString()}
                    </Table.Td>
                    <Table.Td>{renderStatus(i.status)}</Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
          <Group justify="center" mt="md">
            <Pagination
              total={Math.ceil(
                filteredInvoices.filter(
                  (i) => i.customerId === expandedCustomer
                ).length / invoicePageSize
              )}
              value={invoicePage}
              onChange={setInvoicePage}
              size="sm"
              color="#0A6802"
            />
          </Group>
        </Card>
      )}
    </div>
  );
};
export default AccountsReceivableCompany2;
