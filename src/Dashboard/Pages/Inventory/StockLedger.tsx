import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Pagination,
  Select,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TxType = "Sale" | "Purchase" | "Return" | "Adjustment";
type LedgerRow = {
  id: string;
  date: string;
  productName: string;
  sku: string;
  transaction: TxType;
  reference: string;
  qtyIn: number;
  qtyOut: number;
  balance: string;
  remarks: string;
};

const LEDGER_DATA: LedgerRow[] = [
  {
    id: "1",
    date: "2024-01-15",
    productName: "Wireless Mouse",
    sku: "PRD-001",
    transaction: "Sale",
    reference: "SI-001",
    qtyIn: 0,
    qtyOut: 5,
    balance: "45 pcs",
    remarks: "Sold to ABC Corporation",
  },
  {
    id: "2",
    date: "2024-01-14",
    productName: "Office Chair",
    sku: "PRD-002",
    transaction: "Purchase",
    reference: "PI-046",
    qtyIn: 3,
    qtyOut: 0,
    balance: "8 pcs",
    remarks: "Purchased from Furniture World",
  },
  {
    id: "3",
    date: "2024-01-13",
    productName: "Printer Paper A4",
    sku: "PRD-003",
    transaction: "Sale",
    reference: "SI-003",
    qtyIn: 0,
    qtyOut: 20,
    balance: "5 reams",
    remarks: "Sold to Tech Solutions Inc",
  },
  {
    id: "4",
    date: "2024-01-12",
    productName: "Wireless Mouse",
    sku: "PRD-001",
    transaction: "Return",
    reference: "SR-001",
    qtyIn: 2,
    qtyOut: 0,
    balance: "50 pcs",
    remarks: "Sales return from ABC Corp",
  },
  {
    id: "5",
    date: "2024-01-11",
    productName: "Ballpoint Pens",
    sku: "PRD-004",
    transaction: "Adjustment",
    reference: "ADJ-001",
    qtyIn: 0,
    qtyOut: 2,
    balance: "8 packs",
    remarks: "Stock adjustment - damage",
  },
];

const productOptions = [
  { value: "ALL", label: "All Products" },
  ...Array.from(
    new Map(
      LEDGER_DATA.map((r) => [`${r.productName} (${r.sku})`, r])
    ).entries()
  ).map(([key]) => ({ value: key, label: key })),
];

const txOptions = [
  { value: "ALL", label: "All Types" },
  { value: "Sale", label: "Sale" },
  { value: "Purchase", label: "Purchase" },
  { value: "Return", label: "Return" },
  { value: "Adjustment", label: "Adjustment" },
];

const toDate = (s: string) => new Date(s + "T00:00:00");
const inRange = (d: string, from: string, to: string) => {
  const dt = toDate(d).getTime();
  const fromOk = from ? dt >= toDate(from).getTime() : true;
  const toOk = to ? dt <= toDate(to).getTime() : true;
  return fromOk && toOk;
};

function TxBadge({ type }: { type: TxType }) {
  switch (type) {
    case "Sale":
      return (
        <Badge color="red" variant="light">
          Sale
        </Badge>
      );
    case "Purchase":
      return (
        <Badge color="green" variant="light">
          Purchase
        </Badge>
      );
    case "Return":
      return (
        <Badge color="yellow" variant="light">
          Return
        </Badge>
      );
    case "Adjustment":
      return (
        <Badge color="gray" variant="light">
          Adjustment
        </Badge>
      );
  }
}

export default function StockLedger() {
  // filters UI state
  const [product, setProduct] = useState<string | null>("ALL");
  const [txType, setTxType] = useState<string | null>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [applied, setApplied] = useState({
    product: "ALL",
    txType: "ALL",
    fromDate: "",
    toDate: "",
  });

  const applyFilter = () =>
    setApplied({
      product: product ?? "ALL",
      txType: txType ?? "ALL",
      fromDate,
      toDate,
    });

  const clearFilter = () => {
    setProduct("ALL");
    setTxType("ALL");
    setFromDate("");
    setToDate("");
    setApplied({ product: "ALL", txType: "ALL", fromDate: "", toDate: "" });
    setPage(1);
  };

  const [page, setPage] = useState(1);
  const pageSize = 6;

  // filtered data memo
  const filtered = useMemo(() => {
    const rows = LEDGER_DATA.filter((r) => {
      const matchesProduct =
        applied.product === "ALL"
          ? true
          : `${r.productName} (${r.sku})` === applied.product;
      const matchesType =
        applied.txType === "ALL"
          ? true
          : r.transaction === (applied.txType as TxType);
      const matchesDates = inRange(r.date, applied.fromDate, applied.toDate);
      return matchesProduct && matchesType && matchesDates;
    }).sort((a, b) => (a.date < b.date ? 1 : -1));

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page > totalPages) setPage(1);
    return rows;
  }, [applied, page]);

  const start = (page - 1) * pageSize;
  const paginatedData = filtered.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Stock Ledger", 14, 18);

    const filterLine = [
      applied.product === "ALL" ? "All Products" : applied.product,
      applied.txType === "ALL" ? "All Types" : applied.txType,
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
          "Product",
          "Transaction",
          "Reference",
          "Qty In",
          "Qty Out",
          "Balance",
          "Remarks",
        ],
      ],
      body: filtered.map((r) => [
        r.date,
        `${r.productName} (${r.sku})`,
        r.transaction,
        r.reference,
        r.qtyIn ? `+${r.qtyIn}` : "",
        r.qtyOut ? `-${r.qtyOut}` : "",
        r.balance,
        r.remarks,
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
          <div style={{ minWidth: 220 }}>
            <Text fw={600} size="sm" mb={6}>
              Product
            </Text>
            <Select
              data={productOptions}
              value={product}
              onChange={setProduct}
              allowDeselect={false}
            />
          </div>

          <div style={{ minWidth: 200 }}>
            <Text fw={600} size="sm" mb={6}>
              Transaction Type
            </Text>
            <Select
              data={txOptions}
              value={txType}
              onChange={setTxType}
              allowDeselect={false}
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
        <Group mb="sm">
          <Text fw={600}>Stock Movement History</Text>
        </Group>

        <Table highlightOnHover withTableBorder verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Product</Table.Th>
              <Table.Th>Transaction</Table.Th>
              <Table.Th>Reference</Table.Th>
              <Table.Th ta="right">Qty In</Table.Th>
              <Table.Th ta="right">Qty Out</Table.Th>
              <Table.Th>Balance</Table.Th>
              <Table.Th>Remarks</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {paginatedData.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.date}</Table.Td>
                <Table.Td>
                  <Text fw={600}>{r.productName}</Text>
                  <Text size="xs" c="dimmed">
                    {r.sku}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <TxBadge type={r.transaction} />
                </Table.Td>
                <Table.Td>{r.reference}</Table.Td>
                <Table.Td ta="right">
                  {r.qtyIn ? <Text c="green">+{r.qtyIn}</Text> : "-"}
                </Table.Td>
                <Table.Td ta="right">
                  {r.qtyOut ? <Text c="red">-{r.qtyOut}</Text> : "-"}
                </Table.Td>
                <Table.Td>{r.balance}</Table.Td>
                <Table.Td>{r.remarks}</Table.Td>
              </Table.Tr>
            ))}

            {paginatedData.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={8}>
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
