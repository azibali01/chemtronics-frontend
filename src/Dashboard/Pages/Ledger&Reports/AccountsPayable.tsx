import { useState, useEffect, useMemo } from "react";
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
  Badge,
  Stack,
} from "@mantine/core";
import { Download, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";
import { IconAlertCircle, IconArrowDown, IconClock } from "@tabler/icons-react";
import api from "../../../api_configuration/api";

type APVendor = {
  accountNumber: string;
  accountName: string;
  outstanding: number;
  current: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
};

type PurchaseInvoice = {
  _id?: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  partyBillDate?: string;
  date?: string;
  supplier?: { name?: string };
  grandTotal?: number;
  totalAmount?: number;
  products?: { qty?: number | string; rate?: number | string }[];
  items?: { qty?: number | string; rate?: number | string }[];
};

type PurchaseInvoiceRow = {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: "current" | "31-60" | "61-90" | "90+";
};

export default function AccountsPayable() {
  const [apData, setApData] = useState<APVendor[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(
    [],
  );

  const [activePage, setActivePage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [aging, setAging] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");

  const rowsPerPage = 5;
  const invoicesPerPage = 5;

  // ── Fetch AP summary + purchase invoices for drill-down ───────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [apRes, invRes] = await Promise.all([
          api.get("/reports/accounts-payable"),
          api.get("/purchase-invoice/all-purchase-invoices"),
        ]);
        setApData(Array.isArray(apRes.data) ? apRes.data : []);
        setPurchaseInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      } catch (e) {
        console.error("Failed to fetch AP data:", e);
      }
    };
    fetchAll();
  }, []);

  const applyFilters = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setActivePage(1);
  };

  // ── Client-side filter: search + aging bucket ─────────────────────────────
  const filteredVendors = useMemo(() => {
    return apData.filter((v) => {
      const matchesSearch = v.accountName
        .toLowerCase()
        .includes(search.toLowerCase());
      let matchesAging = true;
      if (aging === "0-30") matchesAging = v.current > 0;
      else if (aging === "31-60") matchesAging = v.days31to60 > 0;
      else if (aging === "61-90") matchesAging = v.days61to90 > 0;
      else if (aging === "90+") matchesAging = v.days90plus > 0;
      return matchesSearch && matchesAging;
    });
  }, [apData, search, aging]);

  const paginatedVendors = filteredVendors.slice(
    (activePage - 1) * rowsPerPage,
    activePage * rowsPerPage,
  );

  // ── Totals for summary cards ──────────────────────────────────────────────
  const totalOutstanding = filteredVendors.reduce(
    (s, v) => s + v.outstanding,
    0,
  );
  const totalCurrent = filteredVendors.reduce((s, v) => s + v.current, 0);
  const total31to60 = filteredVendors.reduce((s, v) => s + v.days31to60, 0);
  const total61to90 = filteredVendors.reduce((s, v) => s + v.days61to90, 0);
  const total90plus = filteredVendors.reduce((s, v) => s + v.days90plus, 0);

  // ── Expanded invoice drill-down (uses raw purchase-invoice API) ──────────
  const expandedInvoices = useMemo<PurchaseInvoiceRow[]>(() => {
    if (!expandedVendor) return [];
    const from = appliedFromDate ? new Date(appliedFromDate) : null;
    const to = appliedToDate ? new Date(appliedToDate) : null;

    return purchaseInvoices
      .filter((inv) => {
        const supplierName = inv.supplier?.name ?? "";
        if (supplierName.toLowerCase() !== expandedVendor.toLowerCase())
          return false;
        const dateStr = inv.invoiceDate ?? inv.partyBillDate ?? inv.date;
        if (!dateStr) return true;
        const d = new Date(dateStr);
        return (!from || d >= from) && (!to || d <= to);
      })
      .map((inv) => {
        const dateStr = inv.invoiceDate ?? inv.partyBillDate ?? inv.date ?? "";
        const amount =
          Number(inv.grandTotal) ||
          Number(inv.totalAmount) ||
          (inv.products ?? inv.items ?? []).reduce(
            (s, p) => s + (Number(p.qty) || 0) * (Number(p.rate) || 0),
            0,
          );
        const days = dateStr
          ? Math.floor(
              (Date.now() - new Date(dateStr).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;
        const status: PurchaseInvoiceRow["status"] =
          days <= 30
            ? "current"
            : days <= 60
              ? "31-60"
              : days <= 90
                ? "61-90"
                : "90+";
        return {
          id: inv._id ?? "",
          invoiceNumber: inv.invoiceNumber ?? inv.invoiceNo ?? "",
          date: dateStr ? dateStr.split("T")[0] : "",
          amount,
          status,
        };
      });
  }, [expandedVendor, purchaseInvoices, appliedFromDate, appliedToDate]);

  const expandedInvoicesPaginated = expandedInvoices.slice(
    (invoicePage - 1) * invoicesPerPage,
    invoicePage * invoicesPerPage,
  );

  const renderStatus = (status: PurchaseInvoiceRow["status"]) => {
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

  const exportPDF = () => {
    // Load images
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

      // Title
      doc.setFontSize(16);
      doc.text("Accounts Payable Report", pageWidth / 2, 52, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 59, {
        align: "center",
      });

      autoTable(doc, {
        head: [
          [
            "Vendor",
            "Total Outstanding",
            "Current",
            "31-60 Days",
            "61-90 Days",
            "90+ Days",
          ],
        ],
        body: filteredVendors.map((v) => [
          v.accountName,
          `Rs. ${v.outstanding.toLocaleString()}`,
          `Rs. ${v.current.toLocaleString()}`,
          `Rs. ${v.days31to60.toLocaleString()}`,
          `Rs. ${v.days61to90.toLocaleString()}`,
          `Rs. ${v.days90plus.toLocaleString()}`,
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

      doc.save("accounts_payable.pdf");
    }
  };

  // PDF Export (Invoices)
  const exportInvoicesPDF = (vendorName: string) => {
    const invs = expandedInvoices;

    const logoUrl = "/Logo.png";
    const headerUrl = "/Header.jpg";
    const footerUrl = "/Footer.jpg";
    const logoImg = new window.Image();
    const headerImg = new window.Image();
    const footerImg = new window.Image();
    let loaded = 0;

    function tryDraw() {
      loaded++;
      if (loaded === 3) drawPDF();
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

      doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, 25);
      const logoX = (pageWidth - 40) / 2;
      doc.addImage(logoImg, "PNG", logoX, 27, 40, 20);

      doc.setFontSize(16);
      doc.text(`Vendor Invoices - ${vendorName}`, pageWidth / 2, 52, {
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

      doc.save(`invoices_${vendorName}.pdf`);
    }
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
                  Rs. {totalOutstanding.toLocaleString()}
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
                <Text fw={700}>Rs. {totalCurrent.toLocaleString()}</Text>
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
                <Text fw={700}>Rs. {total31to60.toLocaleString()}</Text>
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
                <Text fw={700}>Rs. {total61to90.toLocaleString()}</Text>
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
                  Rs. {total90plus.toLocaleString()}
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
            onClick={applyFilters}
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
              <Table.Th>Total Outstanding</Table.Th>
              <Table.Th>Current (0-30)</Table.Th>
              <Table.Th>31-60 Days</Table.Th>
              <Table.Th>61-90 Days</Table.Th>
              <Table.Th>90+ Days</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedVendors.map((v) => (
              <Table.Tr key={v.accountNumber}>
                <Table.Td>{v.accountName}</Table.Td>
                <Table.Td c="red">
                  Rs. {Math.abs(v.outstanding).toLocaleString()}
                </Table.Td>
                <Table.Td c="#0A6802">
                  Rs. {Math.abs(v.current).toLocaleString()}
                </Table.Td>
                <Table.Td c="orange">
                  Rs. {Math.abs(v.days31to60).toLocaleString()}
                </Table.Td>
                <Table.Td c="#F54900">
                  Rs. {Math.abs(v.days61to90).toLocaleString()}
                </Table.Td>
                <Table.Td c="red">
                  Rs. {Math.abs(v.days90plus).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="#0A6802"
                      onClick={() => {
                        setInvoicePage(1);
                        setExpandedVendor(
                          expandedVendor === v.accountName
                            ? null
                            : v.accountName,
                        );
                      }}
                    >
                      {expandedVendor === v.accountName
                        ? "Hide Details"
                        : "View Details"}
                    </Button>
                    <Button
                      size="xs"
                      color="blue"
                      onClick={() => exportInvoicesPDF(v.accountName)}
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
            color="#0A6802"
            total={Math.ceil(filteredVendors.length / rowsPerPage)}
            value={activePage}
            onChange={setActivePage}
          />
        </Group>
      </Card>

      {expandedVendor && (
        <Card shadow="sm" p="md" mt="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Invoice Details — {expandedVendor}</Text>
            <Button
              size="xs"
              leftSection={<Download size={14} />}
              color="#0A6802"
              onClick={() => exportInvoicesPDF(expandedVendor)}
            >
              Export Invoices
            </Button>
          </Group>

          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Invoice No.</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {expandedInvoicesPaginated.map((inv) => (
                <Table.Tr key={inv.id}>
                  <Table.Td>{inv.date}</Table.Td>
                  <Table.Td>{inv.invoiceNumber}</Table.Td>
                  <Table.Td c="red">Rs. {inv.amount.toLocaleString()}</Table.Td>
                  <Table.Td>{renderStatus(inv.status)}</Table.Td>
                </Table.Tr>
              ))}
              {expandedInvoicesPaginated.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text c="dimmed" ta="center">
                      No invoices found for this vendor.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <Group justify="center" mt="md">
            <Pagination
              color="#0A6802"
              total={Math.ceil(expandedInvoices.length / invoicesPerPage)}
              value={invoicePage}
              onChange={setInvoicePage}
            />
          </Group>
        </Card>
      )}
    </div>
  );
}
