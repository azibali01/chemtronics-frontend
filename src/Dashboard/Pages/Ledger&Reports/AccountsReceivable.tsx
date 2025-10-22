"use client";
import { useState, useEffect } from "react";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import { getReceivableAccounts } from "../../../utils/receivableAccounts";
import api from "../../../api_configuration/api";
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

interface Product {
  qty: number | string;
  rate: number | string;
  // Add other fields as needed
}

interface Invoice {
  id: string;
  _id?: string;
  customerId: string;
  accountTitle: string;
  date: string;
  invoiceNo: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  netAmount: number;
  received: number;
  balance: number;
  status: "paid" | "partial" | "pending" | "overdue";
  products?: Product[];
}

export default function AccountsReceivable() {
  // Use ChartOfAccountsContext to get receivable accounts as customers
  const { accounts } = useChartOfAccounts();

  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);

  // Fetch sales invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get("/sale-invoice");

        setSalesInvoices(response.data || []);
      } catch (error) {
        console.error("Error fetching sales invoices:", error);
        setSalesInvoices([]);
      }
    };
    fetchInvoices();
  }, []);

  // Use getReceivableAccounts to get all accounts under 1410 (including 14101, etc.)
  const receivableAccounts = getReceivableAccounts(accounts ?? []);
  const customers: Customer[] = receivableAccounts.map((acc) => ({
    id: acc._id,
    name: acc.accountName,
  }));

  // Map sales invoices to Invoice format
  const invoices: Invoice[] = salesInvoices.map((inv: Invoice) => {
    // Find customer by accountTitle
    const customer = customers.find((c) => c.name === inv.accountTitle);

    // Calculate total amount from products
    const calculatedAmount = (inv.products || []).reduce(
      (total: number, product: Product) => {
        const qty = parseFloat(product.qty as string) || 0;
        const rate = parseFloat(product.rate as string) || 0;
        return total + qty * rate;
      },
      0
    );

    // Calculate aging based on invoice date
    const invoiceDate = new Date(inv.invoiceDate);
    const today = new Date();
    const daysDiff = Math.floor(
      (today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let status: "paid" | "partial" | "pending" | "overdue";
    if (daysDiff <= 30) {
      status = "pending"; // Current (0-30 days)
    } else if (daysDiff <= 60) {
      status = "partial"; // 31-60 days
    } else if (daysDiff <= 90) {
      status = "overdue"; // 61-90 days
    } else {
      status = "paid"; // 90+ days (using 'paid' as placeholder for 90+)
    }

    return {
      id: inv.id || inv._id || "",
      customerId: customer?.id || "",
      accountTitle: inv.accountTitle || "",
      date: inv.invoiceDate || "",
      invoiceNo: inv.invoiceNumber || "",
      invoiceNumber: inv.invoiceNumber || "",
      invoiceDate: inv.invoiceDate || "",
      amount: calculatedAmount,
      netAmount: calculatedAmount,
      received: 0, // Will need to calculate from payments later
      balance: calculatedAmount,
      status: status,
    };
  });

  const [page, setPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agingFilter, setAgingFilter] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [appliedFromDate, setAppliedFromDate] = useState<string>("");
  const [appliedToDate, setAppliedToDate] = useState<string>("");

  const pageSize = 5;
  const invoicePageSize = 5;

  const applyFilters = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setPage(1); // Reset to first page when applying filters
  };

  const filteredInvoices = invoices.filter((inv: Invoice) => {
    const invDate = new Date(inv.date);
    const from = appliedFromDate ? new Date(appliedFromDate) : null;
    const to = appliedToDate ? new Date(appliedToDate) : null;

    const matchesDate = (!from || invDate >= from) && (!to || invDate <= to);

    return matchesDate;
  });

  const customerData = customers.map((cust: Customer) => {
    const custInvoices = filteredInvoices.filter(
      (inv: Invoice) => inv.customerId === cust.id
    );

    const outstanding = custInvoices.reduce(
      (s: number, i: Invoice) => s + i.balance,
      0
    );
    const current = custInvoices
      .filter((i: Invoice) => i.status === "pending")
      .reduce((s: number, i: Invoice) => s + i.balance, 0);
    const d30 = custInvoices
      .filter((i: Invoice) => i.status === "partial")
      .reduce((s: number, i: Invoice) => s + i.balance, 0);
    const d60 = custInvoices
      .filter((i: Invoice) => i.status === "overdue")
      .reduce((s: number, i: Invoice) => s + i.balance, 0);
    const d90 = custInvoices
      .filter((i: Invoice) => i.status === "paid")
      .reduce((s: number, i: Invoice) => s + i.balance, 0);

    return { ...cust, outstanding, current, d30, d60, d90 };
  });

  const filteredCustomers = customerData.filter(
    (
      c: Customer & {
        outstanding: number;
        current: number;
        d30: number;
        d60: number;
        d90: number;
      }
    ) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      let matchesAging = true;

      if (agingFilter === "current") matchesAging = c.current > 0;
      else if (agingFilter === "31-60") matchesAging = c.d30 > 0;
      else if (agingFilter === "61-90") matchesAging = c.d60 > 0;
      else if (agingFilter === "90+") matchesAging = c.d90 > 0;

      return matchesSearch && matchesAging;
    }
  );

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
    const logoUrl = "/Logo.png";
    const headerUrl = "/Header.jpg";
    const footerUrl = "/Footer.jpg";
    const logoImg = new window.Image();
    const headerImg = new window.Image();
    const footerImg = new window.Image();
    let loaded = 0;
    function tryDraw() {
      loaded++;
      if (loaded === 3) {
        drawPDF();
      }
    }
    logoImg.src = logoUrl;
    headerImg.src = headerUrl;
    footerImg.src = footerUrl;
    logoImg.onload = tryDraw;
    headerImg.onload = tryDraw;
    footerImg.onload = tryDraw;
    logoImg.onerror = tryDraw;
    headerImg.onerror = tryDraw;
    footerImg.onerror = tryDraw;

    function drawPDF() {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      // Header design asset
      doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, 25);
      // Centered logo below header
      const logoWidth = 40;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoImg, "PNG", logoX, 27, logoWidth, logoHeight);

      // Header text below logo
      doc.setFontSize(16);
      doc.text("Accounts Receivable Report", pageWidth / 2, 52, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 59, {
        align: "center",
      });

      // Table with color theme
      autoTable(doc, {
        head: [["Customer", "Outstanding", "Current", "31-60", "61-90", "90+"]],
        body: [
          ...filteredCustomers.map((c) => [
            c.name,
            `Rs. ${c.outstanding.toLocaleString()}`,
            `Rs. ${c.current.toLocaleString()}`,
            `Rs. ${c.d30.toLocaleString()}`,
            `Rs. ${c.d60.toLocaleString()}`,
            `Rs. ${c.d90.toLocaleString()}`,
          ]),
          [
            {
              content: "Totals",
              colSpan: 1,
              styles: { halign: "right", fontStyle: "bold" },
            },
            `Rs. ${totalOutstanding.toLocaleString()}`,
            `Rs. ${totalCurrent.toLocaleString()}`,
            `Rs. ${total30.toLocaleString()}`,
            `Rs. ${total60.toLocaleString()}`,
            `Rs. ${total90.toLocaleString()}`,
          ],
        ],
        startY: 65,
        theme: "grid",
        headStyles: {
          fillColor: [10, 104, 2], // #0A6802
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          fillColor: [241, 252, 240], // #F1FCF0
          textColor: 0,
        },
        footStyles: {
          fillColor: [10, 104, 2],
          textColor: 255,
          fontStyle: "bold",
        },
        didDrawPage: function (data) {
          // Footer design asset
          const pageSize = doc.internal.pageSize;
          doc.addImage(
            footerImg,
            "JPEG",
            0,
            pageSize.getHeight() - 25,
            pageSize.getWidth(),
            25
          );
          doc.setFontSize(9);
          doc.text(
            `Page ${data.pageNumber}`,
            pageSize.getWidth() - 40,
            pageSize.getHeight() - 10
          );
        },
      });

      doc.save("accounts_receivable.pdf");
    }
  };

  const exportInvoicesPDF = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    const invs = filteredInvoices.filter((i) => i.customerId === custId);

    const logoUrl = "/Logo.png";
    const headerUrl = "/Header.jpg";
    const footerUrl = "/Footer.jpg";
    const logoImg = new window.Image();
    const headerImg = new window.Image();
    const footerImg = new window.Image();
    let loaded = 0;

    function tryDraw() {
      loaded++;
      if (loaded === 3) {
        drawInvoicePDF();
      }
    }

    logoImg.src = logoUrl;
    headerImg.src = headerUrl;
    footerImg.src = footerUrl;
    logoImg.onload = tryDraw;
    headerImg.onload = tryDraw;
    footerImg.onload = tryDraw;
    logoImg.onerror = tryDraw;
    headerImg.onerror = tryDraw;
    footerImg.onerror = tryDraw;

    function drawInvoicePDF() {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header design asset
      doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, 25);
      // Centered logo below header
      const logoWidth = 40;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoImg, "PNG", logoX, 27, logoWidth, logoHeight);

      // Header text below logo
      doc.setFontSize(16);
      doc.text(`Customer Invoices - ${cust?.name}`, pageWidth / 2, 52, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 59, {
        align: "center",
      });

      autoTable(doc, {
        head: [
          ["Date", "Invoice No.", "Amount", "Received", "Balance", "Status"],
        ],
        body: invs.map((i) => [
          i.date,
          i.invoiceNo,
          `Rs. ${(i.netAmount || i.amount).toLocaleString()}`,
          `Rs. ${i.received.toLocaleString()}`,
          `Rs. ${i.balance.toLocaleString()}`,
          i.status,
        ]) as RowInput[],
        startY: 65,
        theme: "grid",
        headStyles: {
          fillColor: [10, 104, 2], // #0A6802
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          fillColor: [241, 252, 240], // #F1FCF0
          textColor: 0,
        },
        didDrawPage: function (data) {
          // Footer design asset
          const pageSize = doc.internal.pageSize;
          doc.addImage(
            footerImg,
            "JPEG",
            0,
            pageSize.getHeight() - 25,
            pageSize.getWidth(),
            25
          );
          doc.setFontSize(9);
          doc.text(
            `Page ${data.pageNumber}`,
            pageSize.getWidth() - 40,
            pageSize.getHeight() - 10
          );
        },
      });

      doc.save(`invoices_${cust?.name}.pdf`);
    }
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
                <Text fw={700}>Rs. {totalOutstanding.toLocaleString()}</Text>
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
                <Text fw={700}>Rs. {totalCurrent.toLocaleString()}</Text>
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
                <Text fw={700}>Rs. {total30.toLocaleString()}</Text>
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
                <Text fw={700}>Rs. {total60.toLocaleString()}</Text>
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
                  Rs. {total90.toLocaleString()}
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
          <Button
            mt={23}
            color="#0A6802"
            leftSection={<Filter size={16} />}
            onClick={applyFilters}
          >
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
                <Table.Td>Rs. {c.outstanding.toLocaleString()}</Table.Td>
                <Table.Td>Rs. {c.current.toLocaleString()}</Table.Td>
                <Table.Td>Rs. {c.d30.toLocaleString()}</Table.Td>
                <Table.Td>Rs. {c.d60.toLocaleString()}</Table.Td>
                <Table.Td>Rs. {c.d90.toLocaleString()}</Table.Td>
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
                    <Table.Td>
                      Rs. {(i.netAmount || i.amount).toLocaleString()}
                    </Table.Td>
                    <Table.Td c="#0A6802">
                      Rs. {i.received.toLocaleString()}
                    </Table.Td>
                    <Table.Td c={i.balance > 0 ? "red" : "#0A6802"}>
                      Rs. {i.balance.toLocaleString()}
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
}
