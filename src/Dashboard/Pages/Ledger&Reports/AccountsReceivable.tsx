"use client";
import { useState, useEffect, useMemo } from "react";
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
import { useBrand } from "../../Context/BrandContext";
import { getHeaderImage, getFooterImage } from "../../../utils/assetPaths";
import {
  IconAlertCircle,
  IconArrowUpRight,
  IconClock,
} from "@tabler/icons-react";

type ARCustomer = {
  accountNumber: string;
  accountName: string;
  outstanding: number;
  current: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
};

type SaleInvoice = {
  _id?: string;
  accountTitle: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  netAmount?: number;
  products?: { qty?: number | string; rate?: number | string }[];
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: "current" | "31-60" | "61-90" | "90+";
};

export default function AccountsReceivable() {
  const [arData, setArData] = useState<ARCustomer[]>([]);
  const [saleInvoices, setSaleInvoices] = useState<SaleInvoice[]>([]);

  const [page, setPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null); // accountName
  const [search, setSearch] = useState("");
  const [agingFilter, setAgingFilter] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [appliedFromDate, setAppliedFromDate] = useState<string>("");
  const [appliedToDate, setAppliedToDate] = useState<string>("");

  const pageSize = 5;
  const invoicePageSize = 5;

  // ── Fetch AR summary from backend + sale invoices for drill-down ──────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [arRes, invRes] = await Promise.all([
          api.get("/reports/accounts-receivable"),
          api.get("/sale-invoice"),
        ]);
        setArData(Array.isArray(arRes.data) ? arRes.data : []);
        setSaleInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      } catch (e) {
        console.error("Failed to fetch AR data:", e);
      }
    };
    fetchAll();
  }, []);

  const applyFilters = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setPage(1);
  };

  // ── Client-side filter: search + aging bucket ─────────────────────────────
  const filteredCustomers = useMemo(() => {
    return arData.filter((c) => {
      const matchesSearch = c.accountName
        .toLowerCase()
        .includes(search.toLowerCase());
      let matchesAging = true;
      if (agingFilter === "current") matchesAging = c.current > 0;
      else if (agingFilter === "31-60") matchesAging = c.days31to60 > 0;
      else if (agingFilter === "61-90") matchesAging = c.days61to90 > 0;
      else if (agingFilter === "90+") matchesAging = c.days90plus > 0;
      return matchesSearch && matchesAging;
    });
  }, [arData, search, agingFilter]);

  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // ── Totals for summary cards ──────────────────────────────────────────────
  const totalOutstanding = filteredCustomers.reduce(
    (s, c) => s + c.outstanding,
    0,
  );
  const totalCurrent = filteredCustomers.reduce((s, c) => s + c.current, 0);
  const total30 = filteredCustomers.reduce((s, c) => s + c.days31to60, 0);
  const total60 = filteredCustomers.reduce((s, c) => s + c.days61to90, 0);
  const total90 = filteredCustomers.reduce((s, c) => s + c.days90plus, 0);

  // ── Expanded invoice drill-down (uses raw sale-invoice API) ──────────────
  const expandedInvoices = useMemo<InvoiceRow[]>(() => {
    if (!expandedCustomer) return [];
    const from = appliedFromDate ? new Date(appliedFromDate) : null;
    const to = appliedToDate ? new Date(appliedToDate) : null;

    return saleInvoices
      .filter((inv) => {
        if (inv.accountTitle !== expandedCustomer) return false;
        if (!inv.invoiceDate) return true;
        const d = new Date(inv.invoiceDate);
        return (!from || d >= from) && (!to || d <= to);
      })
      .map((inv) => {
        const amount =
          Number(inv.netAmount) ||
          (inv.products ?? []).reduce(
            (s, p) => s + (Number(p.qty) || 0) * (Number(p.rate) || 0),
            0,
          );
        const days = inv.invoiceDate
          ? Math.floor(
              (Date.now() - new Date(inv.invoiceDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const status: InvoiceRow["status"] =
          days <= 30
            ? "current"
            : days <= 60
              ? "31-60"
              : days <= 90
                ? "61-90"
                : "90+";
        return {
          id: inv._id ?? "",
          invoiceNumber: inv.invoiceNumber ?? "",
          date: inv.invoiceDate?.split("T")[0] ?? "",
          amount,
          status,
        };
      });
  }, [expandedCustomer, saleInvoices, appliedFromDate, appliedToDate]);

  const expandedInvoicesPaginated = expandedInvoices.slice(
    (invoicePage - 1) * invoicePageSize,
    invoicePage * invoicePageSize,
  );

  const exportPDF = () => {
    const { brand } = useBrand();
    const logoUrl = "/Logo.png";
    const headerUrl = getHeaderImage(brand);
    const footerUrl = getFooterImage(brand);
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
            c.accountName,
            `Rs. ${c.outstanding.toLocaleString()}`,
            `Rs. ${c.current.toLocaleString()}`,
            `Rs. ${c.days31to60.toLocaleString()}`,
            `Rs. ${c.days61to90.toLocaleString()}`,
            `Rs. ${c.days90plus.toLocaleString()}`,
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
            25,
          );
          doc.setFontSize(9);
          doc.text(
            `Page ${data.pageNumber}`,
            pageSize.getWidth() - 40,
            pageSize.getHeight() - 10,
          );
        },
      });

      doc.save("accounts_receivable.pdf");
    }
  };

  const exportInvoicesPDF = (custName: string) => {
    const invs = saleInvoices
      .filter((inv) => inv.accountTitle === custName)
      .map((inv) => ({
        invoiceNumber: inv.invoiceNumber ?? "",
        date: inv.invoiceDate?.split("T")[0] ?? "",
        amount:
          Number(inv.netAmount) ||
          (inv.products ?? []).reduce(
            (s, p) => s + (Number(p.qty) || 0) * (Number(p.rate) || 0),
            0,
          ),
      }));

    const logoUrl = "/Logo.png";
    const { brand } = useBrand();
    const headerUrl = getHeaderImage(brand);
    const footerUrl = getFooterImage(brand);
    const logoImg = new window.Image();
    const headerImg = new window.Image();
    const footerImg = new window.Image();
    let loaded = 0;

    function tryDraw() {
      loaded++;
      if (loaded === 3) drawInvoicePDF();
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

      doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, 25);
      const logoX = (pageWidth - 40) / 2;
      doc.addImage(logoImg, "PNG", logoX, 27, 40, 20);

      doc.setFontSize(16);
      doc.text(`Customer Invoices - ${custName}`, pageWidth / 2, 52, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 59, {
        align: "center",
      });

      autoTable(doc, {
        head: [["Date", "Invoice No.", "Amount"]],
        body: invs.map((i) => [
          i.date,
          i.invoiceNumber,
          `Rs. ${i.amount.toLocaleString()}`,
        ]) as RowInput[],
        startY: 65,
        theme: "grid",
        headStyles: {
          fillColor: [10, 104, 2],
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: { fillColor: [241, 252, 240], textColor: 0 },
        didDrawPage: function (data) {
          const ps = doc.internal.pageSize;
          doc.addImage(
            footerImg,
            "JPEG",
            0,
            ps.getHeight() - 25,
            ps.getWidth(),
            25,
          );
          doc.setFontSize(9);
          doc.text(
            `Page ${data.pageNumber}`,
            ps.getWidth() - 40,
            ps.getHeight() - 10,
          );
        },
      });

      doc.save(`invoices_${custName}.pdf`);
    }
  };

  const renderStatus = (status: InvoiceRow["status"]) => {
    switch (status) {
      case "current":
        return <Badge color="blue">Current</Badge>;
      case "31-60":
        return <Badge color="yellow">31-60 Days</Badge>;
      case "61-90":
        return <Badge color="orange">61-90 Days</Badge>;
      case "90+":
        return <Badge color="red">90+ Days</Badge>;
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
              <Table.Tr key={c.accountNumber}>
                <Table.Td>{c.accountName}</Table.Td>
                <Table.Td>
                  Rs. {Math.abs(c.outstanding).toLocaleString()}
                </Table.Td>
                <Table.Td>Rs. {Math.abs(c.current).toLocaleString()}</Table.Td>
                <Table.Td>
                  Rs. {Math.abs(c.days31to60).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  Rs. {Math.abs(c.days61to90).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  Rs. {Math.abs(c.days90plus).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="#0A6802"
                      onClick={() =>
                        setExpandedCustomer(
                          expandedCustomer === c.accountName
                            ? null
                            : c.accountName,
                        )
                      }
                    >
                      {expandedCustomer === c.accountName
                        ? "Hide Details"
                        : "View Details"}
                    </Button>
                    <Button
                      size="xs"
                      color="blue"
                      onClick={() => exportInvoicesPDF(c.accountName)}
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
            Invoice Details — {expandedCustomer}
          </Text>
          <Table highlightOnHover withTableBorder striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {expandedInvoicesPaginated.map((i) => (
                <Table.Tr key={i.id}>
                  <Table.Td>{i.date}</Table.Td>
                  <Table.Td>{i.invoiceNumber}</Table.Td>
                  <Table.Td c="red">Rs. {i.amount.toLocaleString()}</Table.Td>
                  <Table.Td>{renderStatus(i.status)}</Table.Td>
                </Table.Tr>
              ))}
              {expandedInvoicesPaginated.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center">
                      No invoices found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Group justify="center" mt="md">
            <Pagination
              total={Math.ceil(expandedInvoices.length / invoicePageSize)}
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
