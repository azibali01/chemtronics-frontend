import {
  ActionIcon,
  Button,
  Card,
  Group,
  Pagination,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useMemo, useState, useEffect } from "react";
import api from "../../../api_configuration/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type StockLedgerRow = {
  id: string;
  date: string;
  invid: string;
  particulars: string;
  productCode: string;
  productName: string;
  qtyIn: number;
  qtyOut: number;
  qtyBalance: number;
  rate: number;
  balance: number;
  type: "Sale" | "Purchase";
};

const toDate = (s: string) => new Date(s + "T00:00:00");
const inRange = (d: string, from: string, to: string) => {
  const dt = toDate(d).getTime();
  const fromOk = from ? dt >= toDate(from).getTime() : true;
  const toOk = to ? dt <= toDate(to).getTime() : true;
  return fromOk && toOk;
};

export default function StockLedger() {
  const [stockLedgerData, setStockLedgerData] = useState<StockLedgerRow[]>([]);
  // Fetch sale invoices and map to stock ledger rows
  useEffect(() => {
    const fetchAndMapData = async () => {
      try {
        // Fetch products, sales, and purchase invoices
        const [productsRes, salesRes, purchaseRes] = await Promise.all([
          api.get("/products"),
          api.get("/sale-invoice"),
          api.get("/purchase-invoice/all-purchase-invoices"),
        ]);
        const products = Array.isArray(productsRes.data)
          ? productsRes.data
          : [];
        const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
        const purchases = Array.isArray(purchaseRes.data)
          ? purchaseRes.data
          : [];
        // Console log all data
        console.log("All Products:", products);
        console.log("All Sale Invoices:", sales);
        console.log("All Purchase Invoices:", purchases);
        // Types
        type Product = {
          code: string;
          productName: string;
          stockQuantity?: number;
          rate?: number;
        };
        type Invoice = {
          id: string;
          invoiceDate: string;
          invoiceNumber: string;
          accountTitle?: string;
          products?: Array<{
            id?: string | number;
            code: string;
            product: string;
            qty?: number;
            rate?: number;
          }>;
          items?: Array<{
            id?: string | number;
            code: string;
            product: string;
            qty?: number;
            rate?: number;
          }>;
        };
        const runningBalances: Record<string, number> = {};
        const runningRates: Record<string, number> = {};
        const rows: StockLedgerRow[] = [];

        // Collect all transactions first
        const allTransactions: Array<{
          date: string;
          productCode: string;
          productName: string;
          qtyIn: number;
          qtyOut: number;
          rate: number;
          invid: string;
          particulars: string;
          type: "Sale" | "Purchase";
          id: string;
        }> = [];

        // Opening Balances
        products.forEach((prod: Product) => {
          const qtyIn = prod.stockQuantity || 0;
          runningBalances[prod.code] = qtyIn;
          runningRates[prod.code] = prod.rate || 0;

          if (qtyIn > 0) {
            allTransactions.push({
              id: "opening-" + prod.code,
              date: "2024-01-01", // Opening balance date
              productCode: prod.code,
              productName: prod.productName,
              qtyIn,
              qtyOut: 0,
              rate: prod.rate || 0,
              invid: "",
              particulars: "Opening Balance",
              type: "Purchase",
            });
          }
        });

        // Purchases
        (purchases as Invoice[]).forEach((inv) => {
          const purchaseItems = Array.isArray(inv.products)
            ? inv.products
            : Array.isArray(inv.items)
            ? inv.items
            : [];
          purchaseItems.forEach((item, idx) => {
            allTransactions.push({
              id: inv.id + "-purchase-" + (item.id || idx),
              date: inv.invoiceDate,
              productCode: item.code,
              productName: item.product,
              qtyIn: item.qty || 0,
              qtyOut: 0,
              rate: item.rate || 0,
              invid: inv.invoiceNumber,
              particulars: inv.accountTitle || "Purchase Invoice",
              type: "Purchase",
            });
          });
        });

        // Sales
        (sales as Invoice[]).forEach((inv) => {
          const saleItems = Array.isArray(inv.products)
            ? inv.products
            : Array.isArray(inv.items)
            ? inv.items
            : [];
          saleItems.forEach((item, idx) => {
            allTransactions.push({
              id: inv.id + "-sale-" + (item.id || idx),
              date: inv.invoiceDate,
              productCode: item.code,
              productName: item.product,
              qtyIn: 0,
              qtyOut: item.qty || 0,
              rate: item.rate || 0,
              invid: inv.invoiceNumber,
              particulars: inv.accountTitle || "Sale Invoice",
              type: "Sale",
            });
          });
        });

        // Sort all transactions by date ascending
        allTransactions.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Now calculate running balances with correct weighted average
        allTransactions.forEach((txn) => {
          const prevBalance = runningBalances[txn.productCode] || 0;
          const prevRate = runningRates[txn.productCode] || 0;

          let newBalance = prevBalance;
          let newRate = prevRate;

          if (txn.qtyIn > 0) {
            // Purchase: Update weighted average rate
            const totalValue = prevBalance * prevRate + txn.qtyIn * txn.rate;
            newBalance = prevBalance + txn.qtyIn;
            newRate = newBalance > 0 ? totalValue / newBalance : txn.rate;
          } else if (txn.qtyOut > 0) {
            // Sale: Reduce quantity, keep rate same
            newBalance = prevBalance - txn.qtyOut;
            newRate = prevRate;
          }

          runningBalances[txn.productCode] = newBalance;
          runningRates[txn.productCode] = newRate;

          rows.push({
            id: txn.id,
            date: txn.date,
            invid: txn.invid,
            particulars: txn.particulars,
            productCode: txn.productCode,
            productName: txn.productName,
            qtyIn: txn.qtyIn,
            qtyOut: txn.qtyOut,
            qtyBalance: newBalance,
            rate: newRate,
            balance: newBalance * newRate,
            type: txn.type,
          });
        });

        setStockLedgerData(rows);
      } catch {
        setStockLedgerData([]);
      }
    };
    fetchAndMapData();
  }, []);
  // filters UI state
  const [productCode, setProductCode] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [applied, setApplied] = useState({
    productCode: "",
    productName: "",
    fromDate: "",
    toDate: "",
  });

  // Auto-fill product name when product code changes
  const handleProductCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.currentTarget.value;
    setProductCode(code);
    const found = stockLedgerData.find(
      (r) => r.productCode && r.productCode.toLowerCase() === code.toLowerCase()
    );
    setProductName(found ? found.productName : "");
  };

  const applyFilter = () =>
    setApplied({
      productCode,
      productName,
      fromDate,
      toDate,
    });

  const clearFilter = () => {
    setProductCode("");
    setProductName("");
    setFromDate("");
    setToDate("");
    setApplied({ productCode: "", productName: "", fromDate: "", toDate: "" });
    setPage(1);
  };

  const [page, setPage] = useState(1);
  const pageSize = 6;

  // filtered data memo
  const filtered = useMemo(() => {
    const rows = stockLedgerData
      .filter((r) => {
        const matchesCode = applied.productCode
          ? r.productCode.toLowerCase() === applied.productCode.toLowerCase()
          : true;
        const matchesDates = inRange(r.date, applied.fromDate, applied.toDate);
        return matchesCode && matchesDates;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page > totalPages) setPage(1);
    return rows;
  }, [applied, page, stockLedgerData]);

  const start = (page - 1) * pageSize;
  const paginatedData = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Stock Ledger", 14, 18);

    const filterLine = [
      applied.productCode
        ? `Product Code: ${applied.productCode}`
        : "All Products",
      applied.productName ? `Product Name: ${applied.productName}` : "",
      applied.fromDate ? `From: ${applied.fromDate}` : "",
      applied.toDate ? `To: ${applied.toDate}` : "",
    ]
      .filter(Boolean)
      .join("  •  ");
    if (filterLine) {
      doc.setFontSize(10);
      doc.text(filterLine, 14, 26);
    }

    autoTable(doc, {
      startY: filterLine ? 32 : 26,
      head: [
        [
          "Date",
          "Invoice Number",
          "Type",
          "Particulars",
          "Product Code",
          "Product Name",
          "Qty In",
          "Qty Out",
          "Qty Balance",
          "Rate",
          "Balance",
        ],
      ],
      body: filtered.map((r) => [
        r.date,
        r.invid,
        r.type,
        r.particulars,
        r.productCode,
        r.productName,
        r.qtyIn ? `+${r.qtyIn}` : "",
        r.qtyOut ? `-${r.qtyOut}` : "",
        r.qtyBalance,
        `Rs. ${r.rate.toLocaleString()}`,
        `Rs. ${r.balance.toLocaleString()}`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [10, 104, 2] }, // #0A6802
    });

    doc.save("stock-ledger.pdf");
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Stock Ledger</Title>
          <Text c="dimmed" size="sm">
            Track stock movements and transactions
          </Text>
        </div>
        <ActionIcon
          size="lg"
          variant="filled"
          color="#0A6802"
          onClick={exportPDF}
          title="Export PDF"
          aria-label="Export PDF"
        >
          <IconDownload size={18} />
        </ActionIcon>
      </Group>

      <Card withBorder radius="md" shadow="sm" mb="lg" bg="#F1FCF0">
        <Group gap="md" align="flex-end" grow wrap="wrap">
          <div style={{ minWidth: 180 }}>
            <Text fw={600} size="sm" mb={6}>
              Product Code
            </Text>
            <TextInput
              placeholder="Enter product code"
              value={productCode}
              onChange={handleProductCodeChange}
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <Text fw={600} size="sm" mb={6}>
              Product Name
            </Text>
            <TextInput
              placeholder="Product name will auto-fill"
              value={productName}
              readOnly
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <Text fw={600} size="sm" mb={6}>
              From Date
            </Text>
            <TextInput
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.currentTarget.value)}
            />
          </div>
          <div style={{ minWidth: 180 }}>
            <Text fw={600} size="sm" mb={6}>
              To Date
            </Text>
            <TextInput
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.currentTarget.value)}
            />
          </div>
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={clearFilter}>
              Clear
            </Button>
            <Button color="#0A6802" onClick={applyFilter}>
              Apply Filter
            </Button>
          </Group>
        </Group>
      </Card>

      <Card withBorder radius="md" shadow="sm" p="md" bg={"#F1FCF0"}>
        {(applied.productCode || applied.productName) && (
          <Group mb="md">
            <Text fw={600}>Product Code: {applied.productCode || "-"}</Text>
            <Text fw={600} ml="lg">
              Product Name: {applied.productName || "-"}
            </Text>
          </Group>
        )}
        <Group mb="sm">
          <Text fw={600}>Stock Movement History</Text>
        </Group>
        <Table
          highlightOnHover
          withTableBorder
          verticalSpacing="sm"
          withRowBorders
          withColumnBorders
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Invoice Number</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Particulars</Table.Th>
              <Table.Th>Qty In</Table.Th>
              <Table.Th>Qty Out</Table.Th>
              <Table.Th>Qty Balance</Table.Th>
              <Table.Th>Rate</Table.Th>
              <Table.Th>Balance</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.date}</Table.Td>
                <Table.Td>{r.invid}</Table.Td>
                <Table.Td>{r.type}</Table.Td>
                <Table.Td>{r.particulars}</Table.Td>
                <Table.Td c="#0A6802">
                  {r.qtyIn > 0 ? `+${r.qtyIn}` : ""}
                </Table.Td>
                <Table.Td c="red">
                  {r.qtyOut > 0 ? `-${r.qtyOut}` : ""}
                </Table.Td>
                <Table.Td fw={500}>{r.qtyBalance}</Table.Td>
                <Table.Td>Rs. {r.rate.toLocaleString()}</Table.Td>
                <Table.Td fw={500}>Rs. {r.balance.toLocaleString()}</Table.Td>
              </Table.Tr>
            ))}
            {paginatedData.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={9}>
                  <Text c="dimmed" ta="center">
                    No records match the current filters.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        <Group justify="center" mt="md">
          <Pagination
            total={totalPages}
            value={page}
            onChange={setPage}
            size="sm"
            color="#0A6802"
          />
        </Group>
      </Card>
    </div>
  );
}
