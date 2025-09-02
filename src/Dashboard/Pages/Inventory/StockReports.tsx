import {
  Card,
  Group,
  Title,
  Text,
  Table,
  Badge,
  Button,
  Select,
  Progress,
  Tabs,
  Menu,
  TextInput,
  Pagination,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconDownload,
  IconBox,
  IconChartBar,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type LowStock = {
  code: string;
  name: string;
  category: string;
  currentStock: string;
  minStock: string;
  value: string;
  daysToStockout: number;
};

type CategoryReport = {
  category: string;
  totalProducts: number;
  totalValue: string;
  lowStock: number;
  avgStock: number;
  topProduct: string;
};

type StockMovement = {
  product: string;
  category: string;
  opening: number;
  purchases: number;
  sales: number;
  adjustments: number;
  closing: number;
  turnover: string;
};

const lowStockData: LowStock[] = [
  {
    code: "PRD-003",
    name: "Printer Paper A4",
    category: "Office Supplies",
    currentStock: "5 reams",
    minStock: "20 reams",
    value: "$27.50",
    daysToStockout: 3,
  },
  {
    code: "PRD-004",
    name: "Ballpoint Pens",
    category: "Stationery",
    currentStock: "8 packs",
    minStock: "50 packs",
    value: "$22.40",
    daysToStockout: 5,
  },
  {
    code: "PRD-005",
    name: "USB Cables",
    category: "Electronics",
    currentStock: "2 pcs",
    minStock: "15 pcs",
    value: "$19.98",
    daysToStockout: 1,
  },
];

const categoryReports: CategoryReport[] = [
  {
    category: "Electronics",
    totalProducts: 28,
    totalValue: "$89,200",
    lowStock: 3,
    avgStock: 85,
    topProduct: "Wireless Mouse",
  },
  {
    category: "Office Supplies",
    totalProducts: 45,
    totalValue: "$12,500",
    lowStock: 8,
    avgStock: 45,
    topProduct: "Printer Paper A4",
  },
  {
    category: "Furniture",
    totalProducts: 15,
    totalValue: "$34,600",
    lowStock: 1,
    avgStock: 92,
    topProduct: "Office Chair",
  },
  {
    category: "Stationery",
    totalProducts: 67,
    totalValue: "$8,900",
    lowStock: 12,
    avgStock: 35,
    topProduct: "Ballpoint Pens",
  },
];

const stockMovementData: StockMovement[] = [
  {
    product: "Wireless Mouse",
    category: "Electronics",
    opening: 50,
    purchases: 15,
    sales: -20,
    adjustments: -2,
    closing: 43,
    turnover: "2.3x",
  },
  {
    product: "Office Chair",
    category: "Furniture",
    opening: 10,
    purchases: 5,
    sales: -7,
    adjustments: 0,
    closing: 8,
    turnover: "1.8x",
  },
  {
    product: "Printer Paper A4",
    category: "Office Supplies",
    opening: 25,
    purchases: 0,
    sales: -20,
    adjustments: 0,
    closing: 5,
    turnover: "4.0x",
  },
];

export default function StockReports() {
  const [frequency, setFrequency] = useState<string | null>("Monthly");
  // Search states
  const [lowSearch, setLowSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [movSearch, setMovSearch] = useState("");

  // Pagination states
  const [lowPage, setLowPage] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const pageSize = 5;

  const filteredLow = lowStockData.filter(
    (d) =>
      d.code.toLowerCase().includes(lowSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(lowSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(lowSearch.toLowerCase())
  );
  const filteredCat = categoryReports.filter(
    (d) =>
      d.category.toLowerCase().includes(catSearch.toLowerCase()) ||
      d.topProduct.toLowerCase().includes(catSearch.toLowerCase())
  );
  const filteredMov = stockMovementData.filter(
    (d) =>
      d.product.toLowerCase().includes(movSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(movSearch.toLowerCase())
  );

  const lowData = filteredLow.slice(
    (lowPage - 1) * pageSize,
    lowPage * pageSize
  );
  const catData = filteredCat.slice(
    (catPage - 1) * pageSize,
    catPage * pageSize
  );
  const movData = filteredMov.slice(
    (movPage - 1) * pageSize,
    movPage * pageSize
  );

  const exportLowStockPDF = () => {
    const doc = new jsPDF();
    doc.text("Low Stock Alerts", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        ["Code", "Product", "Category", "Stock", "Min Stock", "Value", "Days"],
      ],
      body: lowStockData.map((item) => [
        item.code,
        item.name,
        item.category,
        item.currentStock,
        item.minStock,
        item.value,
        `${item.daysToStockout} days`,
      ]),
    });

    doc.save("low-stock-report.pdf");
  };

  const exportCategoryPDF = () => {
    const doc = new jsPDF();
    doc.text("Category-wise Stock Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Category",
          "Products",
          "Value",
          "Low Stock",
          "Avg Stock",
          "Top Product",
        ],
      ],
      body: categoryReports.map((c) => [
        c.category,
        c.totalProducts,
        c.totalValue,
        c.lowStock,
        `${c.avgStock}%`,
        c.topProduct,
      ]),
    });

    doc.save("category-report.pdf");
  };

  const exportMovementPDF = () => {
    const doc = new jsPDF();
    doc.text("Stock Movement Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Product",
          "Category",
          "Opening",
          "Purchases",
          "Sales",
          "Adjustments",
          "Closing",
          "Turnover",
        ],
      ],
      body: stockMovementData.map((row) => [
        row.product,
        row.category,
        row.opening,
        row.purchases,
        row.sales,
        row.adjustments,
        row.closing,
        row.turnover,
      ]),
    });

    doc.save("stock-movement-report.pdf");
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Stock Reports</Title>
          <Text c="dimmed">View stock reports and alerts</Text>
        </div>
        <Group>
          <Select
            data={["Weekly", "Monthly"]}
            value={frequency}
            onChange={setFrequency}
            size="sm"
          />

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button leftSection={<IconDownload size={16} />} color="#0A6802">
                Export Reports
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item onClick={exportLowStockPDF}>
                Low Stock Report
              </Menu.Item>
              <Menu.Item onClick={exportCategoryPDF}>Category Report</Menu.Item>
              <Menu.Item onClick={exportMovementPDF}>
                Stock Movement Report
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Tabs defaultValue="lowStock" color="#0A6802" variant="pills" radius="md">
        <Tabs.List
          style={{ border: "1px solid #0A6802", borderRadius: "10px" }}
          w={423}
        >
          <Tabs.Tab value="lowStock">Low Stock Alerts</Tabs.Tab>
          <Tabs.Tab value="category">Category Reports</Tabs.Tab>
          <Tabs.Tab value="movement">Stock Movement</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="lowStock" pt="md">
          <Card withBorder bg={"#F1FCF0"}>
            <Group mb="sm">
              <IconAlertTriangle color="red" />
              <Title order={4}>Low Stock Alerts</Title>
            </Group>
            <TextInput
              placeholder="Search low stock..."
              leftSection={<IconSearch size={16} />}
              value={lowSearch}
              onChange={(e) => {
                setLowSearch(e.currentTarget.value);
                setLowPage(1);
              }}
              mb="sm"
            />
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product Code</Table.Th>
                  <Table.Th>Product Name</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Current Stock</Table.Th>
                  <Table.Th>Min Stock</Table.Th>
                  <Table.Th>Stock Value</Table.Th>
                  <Table.Th>Days to Stockout</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lowData.map((row) => (
                  <Table.Tr key={row.code}>
                    <Table.Td>{row.code}</Table.Td>
                    <Table.Td>{row.name}</Table.Td>
                    <Table.Td>
                      <Badge>{row.category}</Badge>
                    </Table.Td>
                    <Table.Td c="red">{row.currentStock}</Table.Td>
                    <Table.Td>{row.minStock}</Table.Td>
                    <Table.Td>{row.value}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          row.daysToStockout <= 2
                            ? "red"
                            : row.daysToStockout <= 5
                            ? "orange"
                            : "yellow"
                        }
                      >
                        {row.daysToStockout} days
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button size="xs" color="#0A6802">
                        Reorder
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="center" mt="md">
              <Pagination
                color="#0A6802"
                total={Math.ceil(filteredLow.length / pageSize)}
                value={lowPage}
                onChange={setLowPage}
              />
            </Group>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="category" pt="md">
          <Card withBorder bg={"#F1FCF0"}>
            <Group mb="sm">
              <IconBox color="#0A6802" />
              <Title order={4}>Category-wise Stock Report</Title>
            </Group>
            <TextInput
              placeholder="Search categories..."
              leftSection={<IconSearch size={16} />}
              value={catSearch}
              onChange={(e) => {
                setCatSearch(e.currentTarget.value);
                setCatPage(1);
              }}
              mb="sm"
            />
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Total Products</Table.Th>
                  <Table.Th>Total Value</Table.Th>
                  <Table.Th>Low Stock Items</Table.Th>
                  <Table.Th>Average Stock Level</Table.Th>
                  <Table.Th>Top Product</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {catData.map((row) => (
                  <Table.Tr key={row.category}>
                    <Table.Td>{row.category}</Table.Td>
                    <Table.Td>{row.totalProducts}</Table.Td>
                    <Table.Td>{row.totalValue}</Table.Td>
                    <Table.Td>
                      <Badge color="red">{row.lowStock}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Progress
                        value={row.avgStock}
                        color={row.avgStock < 50 ? "red" : "#0A6802"}
                      />
                      {row.avgStock}%
                    </Table.Td>
                    <Table.Td>{row.topProduct}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="center" mt="md">
              <Pagination
                color="#0A6802"
                total={Math.ceil(filteredCat.length / pageSize)}
                value={catPage}
                onChange={setCatPage}
              />
            </Group>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="movement" pt="md">
          <Card withBorder bg={"#F1FCF0"}>
            <Group mb="sm">
              <IconChartBar color="green" />
              <Title order={4}>Stock Movement Report</Title>
            </Group>
            <TextInput
              placeholder="Search stock movement..."
              leftSection={<IconSearch size={16} />}
              value={movSearch}
              onChange={(e) => {
                setMovSearch(e.currentTarget.value);
                setMovPage(1);
              }}
              mb="sm"
            />
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Opening Stock</Table.Th>
                  <Table.Th>Purchases</Table.Th>
                  <Table.Th>Sales</Table.Th>
                  <Table.Th>Adjustments</Table.Th>
                  <Table.Th>Closing Stock</Table.Th>
                  <Table.Th>Turnover Ratio</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {movData.map((row) => (
                  <Table.Tr key={row.product}>
                    <Table.Td>{row.product}</Table.Td>
                    <Table.Td>
                      <Badge>{row.category}</Badge>
                    </Table.Td>
                    <Table.Td>{row.opening}</Table.Td>
                    <Table.Td c="green">{row.purchases}</Table.Td>
                    <Table.Td c="red">{row.sales}</Table.Td>
                    <Table.Td c={row.adjustments < 0 ? "red" : "green"}>
                      {row.adjustments}
                    </Table.Td>
                    <Table.Td>{row.closing}</Table.Td>
                    <Table.Td>{row.turnover}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="center" mt="md">
              <Pagination
                color="#0A6802"
                total={Math.ceil(filteredMov.length / pageSize)}
                value={movPage}
                onChange={setMovPage}
              />
            </Group>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
