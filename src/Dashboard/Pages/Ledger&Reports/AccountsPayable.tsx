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
} from "@mantine/core";
import { Download, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";
import { IconAlertCircle, IconArrowDown, IconClock } from "@tabler/icons-react";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import { getPayableAccounts } from "../../../utils/payableAccounts";
import api from "../../../api_configuration/api";
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

interface PurchaseInvoiceData {
  _id: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  date?: string;
  invoiceDate?: string;
  partyBillDate?: string;
  dueDate?: string;
  supplier?: {
    name: string;
    code?: string;
    email?: string;
    phone?: string;
  };
  products?: Array<{
    qty: number;
    rate: number;
  }>;
  items?: Array<{
    qty: number;
    rate: number;
  }>;
  grandTotal?: number;
  totalAmount?: number;
}

export default function AccountsPayable() {
  const { accounts } = useChartOfAccounts();
  const [purchaseInvoices, setPurchaseInvoices] = useState<
    PurchaseInvoiceData[]
  >([]);

  // Fetch purchase invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await api.get(
          "/purchase-invoice/all-purchase-invoices"
        );
        console.log("Purchase Invoices API response:", response.data);
        setPurchaseInvoices(response.data || []);
      } catch (error) {
        console.error("Failed to fetch purchase invoices:", error);
        setPurchaseInvoices([]);
      }
    };

    fetchInvoices();
  }, []);

  // Get payable accounts (vendors) from Chart of Accounts
  const payableAccountsList = useMemo(
    () => getPayableAccounts(accounts),
    [accounts]
  );

  // Build vendors data from payable accounts and purchase invoices
  const vendors: Vendor[] = useMemo(() => {
    console.log("Payable Accounts List:", payableAccountsList);
    console.log("Purchase Invoices:", purchaseInvoices);

    return payableAccountsList.map((account) => {
      const vendorName = account.accountName || "Unknown Vendor";

      // Filter invoices for this vendor - try multiple matching strategies
      const vendorInvoices = purchaseInvoices.filter((inv) => {
        const supplierName = inv.supplier?.name || "";

        // Debug log for each invoice
        console.log(`Checking invoice for vendor ${vendorName}:`, {
          invoiceNo: inv.invoiceNo,
          supplierName: supplierName,
          vendorName: vendorName,
          match: supplierName.toLowerCase() === vendorName.toLowerCase(),
        });

        // Try exact match first
        if (supplierName === vendorName) return true;
        // Try case-insensitive match
        if (supplierName.toLowerCase() === vendorName.toLowerCase())
          return true;
        // Try partial match (contains)
        if (supplierName.toLowerCase().includes(vendorName.toLowerCase()))
          return true;
        if (vendorName.toLowerCase().includes(supplierName.toLowerCase()))
          return true;
        return false;
      });

      console.log(`Vendor: ${vendorName}, Matched Invoices:`, vendorInvoices);
      console.log(
        `Vendor: ${vendorName}, Total matched before processing:`,
        vendorInvoices.length
      );

      // Calculate invoice amounts and aging
      const invoices: Invoice[] = vendorInvoices
        .filter((inv) => {
          // Check multiple possible date fields
          const dateValue = inv.date || inv.invoiceDate || inv.partyBillDate;
          const hasDate = !!dateValue;
          if (!hasDate) {
            console.warn(
              `Invoice ${
                inv.invoiceNo || inv.invoiceNumber || "unknown"
              } has no date field, skipping. Available fields:`,
              Object.keys(inv)
            );
          }
          return hasDate;
        })
        .map((inv) => {
          // Use whichever date field is available
          const dateValue =
            inv.date || inv.invoiceDate || inv.partyBillDate || "";

          const calculatedAmount =
            inv.grandTotal ||
            inv.totalAmount ||
            (inv.products || inv.items || []).reduce(
              (total, product) =>
                total + (product.qty || 0) * (product.rate || 0),
              0
            );

          const invoiceDate = new Date(dateValue);

          // Validate invoice date
          if (isNaN(invoiceDate.getTime())) {
            console.warn(
              `Invalid date for invoice ${inv.invoiceNo || inv.invoiceNumber}:`,
              dateValue
            );
            return null;
          }

          const dueDate = inv.dueDate
            ? new Date(inv.dueDate)
            : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          const today = new Date();
          const daysDiff = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            invoiceNo: inv.invoiceNo || inv.invoiceNumber || "N/A",
            date: invoiceDate.toISOString().split("T")[0],
            dueDate: dueDate.toISOString().split("T")[0],
            amount: calculatedAmount,
            outstanding: calculatedAmount, // Assuming full amount is outstanding
            daysOverdue: daysDiff > 0 ? `${daysDiff} days` : "Not overdue",
          };
        })
        .filter((inv): inv is Invoice => inv !== null); // Filter out null values

      // Calculate aging buckets
      let current = 0;
      let days31to60 = 0;
      let days61to90 = 0;
      let days90plus = 0;

      invoices.forEach((inv) => {
        const daysOverdueMatch = inv.daysOverdue.match(/(\d+)/);
        const daysNum = daysOverdueMatch ? parseInt(daysOverdueMatch[1]) : 0;

        if (daysNum <= 30) {
          current += inv.outstanding;
        } else if (daysNum <= 60) {
          days31to60 += inv.outstanding;
        } else if (daysNum <= 90) {
          days61to90 += inv.outstanding;
        } else {
          days90plus += inv.outstanding;
        }
      });

      const totalOutstanding = current + days31to60 + days61to90 + days90plus;

      // Get last payment date (most recent invoice date for now)
      let lastPaymentDate = "N/A";
      if (invoices.length > 0) {
        const validDates = invoices
          .map((inv) => inv.date)
          .filter((date) => date && date !== "Invalid Date");

        if (validDates.length > 0) {
          lastPaymentDate = validDates.reduce((latest, date) =>
            new Date(date) > new Date(latest) ? date : latest
          );
        }
      }

      return {
        name: vendorName,
        contact: account.phoneNo || "N/A",
        email: account.address || "N/A",
        totalOutstanding,
        current,
        days31to60,
        days61to90,
        days90plus,
        lastPayment: lastPaymentDate,
        terms: "Net 30", // Default terms
        invoices,
      };
    });
  }, [payableAccountsList, purchaseInvoices]);

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
          `Rs. ${v.totalOutstanding.toLocaleString()}`,
          `Rs. ${v.current.toLocaleString()}`,
          `Rs. ${v.days31to60.toLocaleString()}`,
          `Rs. ${v.days61to90.toLocaleString()}`,
          `Rs. ${v.days90plus.toLocaleString()}`,
          v.lastPayment,
          v.terms,
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

      doc.save("accounts_payable.pdf");
    }
  };

  // PDF Export (Invoices)
  const exportInvoicesPDF = () => {
    if (!selectedVendor) return;

    const vendor = selectedVendor; // Local variable to avoid null checks

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
      doc.text(`Invoices - ${vendor.name}`, pageWidth / 2, 52, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 59, {
        align: "center",
      });

      const totalAmount = vendor.invoices.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const totalOutstanding = vendor.invoices.reduce(
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
          ...vendor.invoices.map((inv) => [
            inv.invoiceNo,
            inv.date,
            inv.dueDate,
            `Rs. ${inv.amount.toLocaleString()}`,
            `Rs. ${inv.outstanding.toLocaleString()}`,
            inv.daysOverdue,
          ]),
          [
            {
              content: "Totals",
              colSpan: 3,
              styles: { halign: "right", fontStyle: "bold" },
            },
            { content: `Rs. ${totalAmount.toLocaleString()}` },
            {
              content: `Rs. ${totalOutstanding.toLocaleString()}`,
              styles: { textColor: [255, 0, 0] },
            },
            "",
          ],
        ] as RowInput[],
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

      doc.save(`${vendor.name}_invoices.pdf`);
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
                  Rs. {v.totalOutstanding.toLocaleString()}
                </Table.Td>
                <Table.Td c="#0A6802">
                  Rs. {v.current.toLocaleString()}
                </Table.Td>
                <Table.Td c="orange">
                  Rs. {v.days31to60.toLocaleString()}
                </Table.Td>
                <Table.Td c="#F54900">
                  Rs. {v.days61to90.toLocaleString()}
                </Table.Td>
                <Table.Td c="red">Rs. {v.days90plus.toLocaleString()}</Table.Td>
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
              {paginatedInvoices.length === 0 ? (
                <Table.Tr>
                  <Table.Td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    <Text c="dimmed">No invoices found for this vendor</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedInvoices.map((inv, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{inv.invoiceNo}</Table.Td>
                    <Table.Td>{inv.date}</Table.Td>
                    <Table.Td>{inv.dueDate}</Table.Td>
                    <Table.Td>Rs. {inv.amount.toLocaleString()}</Table.Td>
                    <Table.Td
                      c={inv.outstanding > 0 ? "red" : "green"}
                    >{`Rs. ${inv.outstanding.toLocaleString()}`}</Table.Td>
                    <Table.Td>{inv.daysOverdue}</Table.Td>
                  </Table.Tr>
                ))
              )}
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
