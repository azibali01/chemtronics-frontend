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

type Invoice = {
  invoiceNo: string;
  date: string;
  dueDate: string;
  amount: number;
  outstanding: number;
  daysOverdue: number;
};

type Vendor = {
  name: string;
  email: string;
  contact: string;
  totalOutstanding: number;
  current: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  lastPayment: string;
  terms: string;
  invoices: Invoice[];
};

// Placeholder data for Company2
const vendors: Vendor[] = [
  {
    name: "Hydroworx Supplies",
    email: "hydro@supplies.com",
    contact: "9876543210",
    totalOutstanding: 120000,
    current: 50000,
    days31to60: 20000,
    days61to90: 30000,
    days90plus: 20000,
    lastPayment: "2024-05-10",
    terms: "Net 30",
    invoices: [
      {
        invoiceNo: "HW-INV-001",
        date: "2024-04-01",
        dueDate: "2024-04-30",
        amount: 50000,
        outstanding: 20000,
        daysOverdue: 10,
      },
      {
        invoiceNo: "HW-INV-002",
        date: "2024-03-15",
        dueDate: "2024-04-14",
        amount: 70000,
        outstanding: 50000,
        daysOverdue: 26,
      },
    ],
  },
  {
    name: "AquaTech Vendors",
    email: "contact@aquatech.com",
    contact: "9123456780",
    totalOutstanding: 80000,
    current: 30000,
    days31to60: 15000,
    days61to90: 20000,
    days90plus: 15000,
    lastPayment: "2024-05-05",
    terms: "Net 45",
    invoices: [
      {
        invoiceNo: "AT-INV-003",
        date: "2024-03-20",
        dueDate: "2024-04-19",
        amount: 40000,
        outstanding: 15000,
        daysOverdue: 21,
      },
      {
        invoiceNo: "AT-INV-004",
        date: "2024-04-10",
        dueDate: "2024-05-09",
        amount: 40000,
        outstanding: 30000,
        daysOverdue: 5,
      },
    ],
  },
];

export default function AccountsPayableCompany2() {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activePage, setActivePage] = useState(1);
  const rowsPerPage = 2;
  const [invoicePage, setInvoicePage] = useState(1);
  const invoicesPerPage = 5;
  const [search, setSearch] = useState("");
  const [aging, setAging] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredVendors = vendors.filter((v: Vendor) => {
    // ...same filtering logic as Company1
    return true;
  });

  const start = (activePage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedVendors = filteredVendors.slice(start, end);

  const invoiceStart = (invoicePage - 1) * invoicesPerPage;
  const invoiceEnd = invoiceStart + invoicesPerPage;
  const paginatedInvoices = selectedVendor
    ? selectedVendor.invoices.slice(invoiceStart, invoiceEnd)
    : [];

  const totalOutstanding = vendors.reduce(
    (s: number, v: Vendor) => s + v.totalOutstanding,
    0
  );
  const totalCurrent = vendors.reduce(
    (s: number, v: Vendor) => s + v.current,
    0
  );
  const total31to60 = vendors.reduce(
    (s: number, v: Vendor) => s + v.days31to60,
    0
  );
  const total61to90 = vendors.reduce(
    (s: number, v: Vendor) => s + v.days61to90,
    0
  );
  const total90plus = vendors.reduce(
    (s: number, v: Vendor) => s + v.days90plus,
    0
  );

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
      body: filteredVendors.map((v: Vendor) => [
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
    doc.save("accounts_payable_company2.pdf");
  };

  const exportInvoicesPDF = () => {
    if (!selectedVendor) return;
    const doc = new jsPDF();
    doc.text(`Invoices - ${selectedVendor.name}`, 14, 15);
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
        ...selectedVendor.invoices.map((inv: Invoice) => [
          inv.invoiceNo,
          inv.date,
          inv.dueDate,
          `₹${inv.amount.toLocaleString()}`,
          `₹${inv.outstanding.toLocaleString()}`,
          inv.daysOverdue,
        ]),
        [
          { content: "Totals", colSpan: 3, styles: { halign: "right" } },
          {
            content: `₹${selectedVendor.invoices
              .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0)
              .toLocaleString()}`,
          },
          {
            content: `₹${selectedVendor.invoices
              .reduce((sum: number, inv: Invoice) => sum + inv.outstanding, 0)
              .toLocaleString()}`,
            styles: { textColor: "red" },
          },
          "",
        ],
      ] as RowInput[],
      startY: 20,
    });
    doc.save(`${selectedVendor.name}_invoices_company2.pdf`);
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
                  ₹{v.totalOutstanding?.toLocaleString()}
                </Table.Td>
                <Table.Td c="#0A6802">₹{v.current?.toLocaleString()}</Table.Td>
                <Table.Td c="orange">
                  ₹{v.days31to60?.toLocaleString()}
                </Table.Td>
                <Table.Td c="#F54900">
                  ₹{v.days61to90?.toLocaleString()}
                </Table.Td>
                <Table.Td c="red">₹{v.days90plus?.toLocaleString()}</Table.Td>
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
                        selectedVendor && selectedVendor.name === v.name
                          ? null
                          : v
                      );
                    }}
                  >
                    {selectedVendor && selectedVendor.name === v.name
                      ? "Hide"
                      : "Details"}
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
              {paginatedInvoices.map((inv: Invoice, i: number) => (
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
                selectedVendor.invoices.length / invoicesPerPage
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
