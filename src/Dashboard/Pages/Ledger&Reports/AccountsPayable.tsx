import { useState } from "react";
import {
  Card,
  Text,
  Grid,
  Table,
  Group,
  Button,
  Pagination,
  TextInput,
  Select,
} from "@mantine/core";
import { Download, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";
import { IconAlertCircle, IconArrowDown, IconClock } from "@tabler/icons-react";
interface Vendor {
  name: string;
  contact: string;
  email: string;
  totalOutstanding: number;
  current: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  lastPayment: string;
  terms: string;
  invoices: Invoice[];
}

interface Invoice {
  invoiceNo: string;
  date: string;
  dueDate: string;
  amount: number;
  outstanding: number;
  daysOverdue: string;
}

const vendors: Vendor[] = [
  {
    name: "ABC Suppliers",
    contact: "Robert Brown",
    email: "robert@abcsuppliers.com",
    totalOutstanding: 95000,
    current: 40000,
    days31to60: 30000,
    days61to90: 15000,
    days90plus: 10000,
    lastPayment: "2024-01-05",
    terms: "Net 30",
    invoices: Array.from({ length: 12 }).map((_, i) => ({
      invoiceNo: `PI-00${i + 1}`,
      date: "2024-01-01",
      dueDate: "2024-01-15",
      amount: 10000 + i * 500,
      outstanding: 5000,
      daysOverdue: `${i} days`,
    })),
  },
  {
    name: "XYZ Trading",
    contact: "Lisa Davis",
    email: "lisa@xyztrading.com",
    totalOutstanding: 65000,
    current: 35000,
    days31to60: 20000,
    days61to90: 10000,
    days90plus: 0,
    lastPayment: "2024-01-12",
    terms: "Net 15",
    invoices: [
      {
        invoiceNo: "PI-013",
        date: "2024-01-06",
        dueDate: "2024-01-21",
        amount: 15000,
        outstanding: 7500,
        daysOverdue: "1 day",
      },
    ],
  },
];

export default function AccountsPayable() {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [activePage, setActivePage] = useState(1);
  const rowsPerPage = 2;

  const [invoicePage, setInvoicePage] = useState(1);
  const invoicesPerPage = 5;

  const [search, setSearch] = useState("");
  const [aging, setAging] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase());

    const matchesAging =
      !aging || aging === "All"
        ? true
        : aging === "0-30"
        ? v.current > 0
        : aging === "31-60"
        ? v.days31to60 > 0
        : aging === "61-90"
        ? v.days61to90 > 0
        : v.days90plus > 0;

    const vendorDate = new Date(v.lastPayment);
    const matchesDate =
      (!fromDate || vendorDate >= new Date(fromDate)) &&
      (!toDate || vendorDate <= new Date(toDate));

    return matchesSearch && matchesAging && matchesDate;
  });

  const start = (activePage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedVendors = filteredVendors.slice(start, end);

  const invoiceStart = (invoicePage - 1) * invoicesPerPage;
  const invoiceEnd = invoiceStart + invoicesPerPage;
  const paginatedInvoices =
    selectedVendor?.invoices.slice(invoiceStart, invoiceEnd) ?? [];

  const totalOutstanding = vendors.reduce((s, v) => s + v.totalOutstanding, 0);
  const totalCurrent = vendors.reduce((s, v) => s + v.current, 0);
  const total31to60 = vendors.reduce((s, v) => s + v.days31to60, 0);
  const total61to90 = vendors.reduce((s, v) => s + v.days61to90, 0);
  const total90plus = vendors.reduce((s, v) => s + v.days90plus, 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Accounts Payable Report", 14, 15);

    autoTable(doc, {
      head: [
        [
          "Vendor",
          "Contact",
          "Total Outstanding",
          "Current",
          "31-60 Days",
          "61-90 Days",
          "90+ Days",
          "Last Payment",
          "Terms",
        ],
      ],
      body: filteredVendors.map((v) => [
        v.name,
        v.contact,
        `₹${v.totalOutstanding.toLocaleString()}`,
        `₹${v.current.toLocaleString()}`,
        `₹${v.days31to60.toLocaleString()}`,
        `₹${v.days61to90.toLocaleString()}`,
        `₹${v.days90plus.toLocaleString()}`,
        v.lastPayment,
        v.terms,
      ]) as RowInput[],
      startY: 20,
    });

    doc.save("accounts_payable.pdf");
  };

  // PDF Export (Invoices)
  const exportInvoicesPDF = () => {
    if (!selectedVendor) return;

    const doc = new jsPDF();
    doc.text(`Invoices - ${selectedVendor.name}`, 14, 15);

    const totalAmount = selectedVendor.invoices.reduce(
      (sum, inv) => sum + inv.amount,
      0
    );
    const totalOutstanding = selectedVendor.invoices.reduce(
      (sum, inv) => sum + inv.outstanding,
      0
    );

    autoTable(doc, {
      head: [
        [
          "Invoice No.",
          "Date",
          "Due Date",
          "Amount",
          "Outstanding",
          "Days Overdue",
        ],
      ],
      body: [
        ...selectedVendor.invoices.map((inv) => [
          inv.invoiceNo,
          inv.date,
          inv.dueDate,
          `₹${inv.amount.toLocaleString()}`,
          `₹${inv.outstanding.toLocaleString()}`,
          inv.daysOverdue,
        ]),
        [
          { content: "Totals", colSpan: 3, styles: { halign: "right" } },
          { content: `₹${totalAmount.toLocaleString()}` },
          {
            content: `₹${totalOutstanding.toLocaleString()}`,
            styles: { textColor: "red" },
          },
          "",
        ],
      ] as RowInput[],
      startY: 20,
    });

    doc.save(`${selectedVendor.name}_invoices.pdf`);
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          Accounts Payable
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
        <Grid.Col span={3}>
          <Card withBorder bg={"#F1FCF0"} p="md">
            <Group>
              <IconArrowDown size={24} color="red" />
              <div>
                <Text>Total Outstanding</Text>
                <Text fw={700} c="red">
                  ₹{totalOutstanding.toLocaleString()}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder bg={"#F1FCF0"} p="md">
            <Group>
              <IconClock size={24} color="#0A6802" />
              <div>
                <Text>Current (0-30)</Text>
                <Text fw={700}>₹{totalCurrent.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder bg={"#F1FCF0"} p="md">
            <Group>
              <IconClock size={24} color="orange" />
              <div>
                <Text>31-60 Days</Text>
                <Text fw={700}>₹{total31to60.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder bg={"#F1FCF0"} p="md">
            <Group>
              <IconClock size={24} color="#F54900" />
              <div>
                <Text>61-90 Days</Text>
                <Text fw={700}>₹{total61to90.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder bg={"#F1FCF0"} p="md">
            <Group>
              <IconAlertCircle size={24} color="red" />
              <div>
                <Text>90+ Days</Text>
                <Text fw={700} c="red">
                  ₹{total90plus.toLocaleString()}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="md" mt="md" bg={"#F1FCF0"} withBorder>
        <Group grow>
          <TextInput
            label="Search"
            placeholder="Search vendor or invoice..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            label="Aging"
            placeholder="Select range"
            data={["All", "0-30", "31-60", "61-90", "90+"]}
            value={aging}
            onChange={setAging}
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
          <Button
            mt={23}
            color="#0A6802"
            leftSection={<Filter size={16} color="#fff" />}
          >
            Apply Filter
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="md" mt="md" withBorder bg={"#F1FCF0"}>
        <Text fw={600} mb="sm">
          Vendor Payables Aging
        </Text>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Vendor</Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Total Outstanding</Table.Th>
              <Table.Th>Current (0-30)</Table.Th>
              <Table.Th>31-60 Days</Table.Th>
              <Table.Th>61-90 Days</Table.Th>
              <Table.Th>90+ Days</Table.Th>
              <Table.Th>Last Payment</Table.Th>
              <Table.Th>Credit Terms</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedVendors.map((v, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <Text fw={500}>{v.name}</Text>
                  <Text size="sm" c="dimmed">
                    {v.email}
                  </Text>
                </Table.Td>
                <Table.Td>{v.contact}</Table.Td>
                <Table.Td c="red">
                  ₹{v.totalOutstanding.toLocaleString()}
                </Table.Td>
                <Table.Td c="#0A6802">₹{v.current.toLocaleString()}</Table.Td>
                <Table.Td c="orange">₹{v.days31to60.toLocaleString()}</Table.Td>
                <Table.Td c="#F54900">
                  ₹{v.days61to90.toLocaleString()}
                </Table.Td>
                <Table.Td c="red">₹{v.days90plus.toLocaleString()}</Table.Td>
                <Table.Td>{v.lastPayment}</Table.Td>
                <Table.Td>{v.terms}</Table.Td>
                <Table.Td>
                  <Button
                    color="#819E00"
                    size="xs"
                    variant="light"
                    onClick={() => {
                      setInvoicePage(1);
                      setSelectedVendor(
                        selectedVendor?.name === v.name ? null : v
                      );
                    }}
                  >
                    {selectedVendor?.name === v.name ? "Hide" : "Details"}
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination
            color="#0A6802"
            total={Math.ceil(filteredVendors.length / rowsPerPage)}
            value={activePage}
            onChange={setActivePage}
          />
        </Group>
      </Card>

      {selectedVendor && (
        <Card shadow="sm" p="md" mt="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Invoice Details - {selectedVendor.name}</Text>
            <Button
              size="xs"
              leftSection={<Download size={14} />}
              color="#0A6802"
              onClick={exportInvoicesPDF}
            >
              Export Invoices
            </Button>
          </Group>

          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Due Date</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Outstanding</Table.Th>
                <Table.Th>Days Overdue</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedInvoices.map((inv, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{inv.invoiceNo}</Table.Td>
                  <Table.Td>{inv.date}</Table.Td>
                  <Table.Td>{inv.dueDate}</Table.Td>
                  <Table.Td>₹{inv.amount.toLocaleString()}</Table.Td>
                  <Table.Td
                    c={inv.outstanding > 0 ? "red" : "green"}
                  >{`₹${inv.outstanding.toLocaleString()}`}</Table.Td>
                  <Table.Td>{inv.daysOverdue}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="center" mt="md">
            <Pagination
              color="#0A6802"
              total={Math.ceil(
                (selectedVendor?.invoices.length ?? 0) / invoicesPerPage
              )}
              value={invoicePage}
              onChange={setInvoicePage}
            />
          </Group>
        </Card>
      )}
    </div>
  );
}
