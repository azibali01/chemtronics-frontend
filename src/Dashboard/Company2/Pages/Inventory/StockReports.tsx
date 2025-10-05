import {
  Card,
  Group,
  Title,
  Text,
  Table,
  Badge,
  Button,
  Select,
  Tabs,
  Menu,
  TextInput,
  Pagination,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconDownload,
  IconBox,
  IconSearch,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useEffect } from "react";
import { StockReportsProviderCompany2, useStockReportsCompany2 } from "../../../Context/Inventory/StockReportsContextCompany2";

export function StockReportsInnerCompany2() {
  const {
    lowStockReports,
    categoryReports,
    frequency,
    setFrequency,
    fetchReports,
    lowSearch,
    setLowSearch,
    catSearch,
    setCatSearch,
    lowPage,
    setLowPage,
    catPage,
    setCatPage,
    pageSize,
  } = useStockReportsCompany2();

  useEffect(() => {
    fetchReports();
  }, [frequency, fetchReports]);

  const filteredLow = lowStockReports.filter(
    (d) =>
      d.productCode.toLowerCase().includes(lowSearch.toLowerCase()) ||
      d.productName.toLowerCase().includes(lowSearch.toLowerCase()) ||
      d.category.toLowerCase().includes(lowSearch.toLowerCase())
  );
  const filteredCat = categoryReports.filter((d) =>
    d.category.toLowerCase().includes(catSearch.toLowerCase())
  );

  const lowData = filteredLow.slice(
    (lowPage - 1) * pageSize,
    lowPage * pageSize
  );
  const catData = filteredCat.slice(
    (catPage - 1) * pageSize,
    catPage * pageSize
  );

  const exportLowStockPDF = () => {
    const doc = new jsPDF();
    doc.text("Low Stock Alerts", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Code",
          "Product",
          "Category",
          "Stock",
          "Min Stock",
          "Value",
          "Last Updated",
        ],
      ],
      body: lowStockReports.map((item) => [
        item.productCode,
        item.productName,
        item.category,
        item.stock,
        item.minStock,
        item.unitPrice,
        item.lastUpdated,
      ]),
    });

    doc.save("low-stock-report-company2.pdf");
  };

  const exportCategoryPDF = () => {
    const doc = new jsPDF();
    doc.text("Category-wise Stock Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Category", "Total Stock", "Total Value"]],
      body: categoryReports.map((c) => [
        c.category,
        c.totalStock,
        c.totalValue,
      ]),
    });

    doc.save("category-report-company2.pdf");
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Stock Reports (Hydroworx)</Title>
          <Text c="dimmed">View stock reports and alerts</Text>
        </div>
        <Group>
          <Select
            data={["Weekly", "Monthly"]}
            value={frequency}
            onChange={(value) => {
              if (value === "Weekly" || value === "Monthly") {
                setFrequency(value);
              }
            }}
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
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Tabs defaultValue="lowStock" color="#0A6802" variant="pills" radius="md">
        <Tabs.List
          style={{ border: "1px solid #0A6802", borderRadius: "10px" }}
          w={285}
        >
          <Tabs.Tab value="lowStock">Low Stock Alerts</Tabs.Tab>
          <Tabs.Tab value="category">Category Reports</Tabs.Tab>
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
                  <Table.Th>Unit Price</Table.Th>
                  <Table.Th>Last Updated</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lowData.map((row) => (
                  <Table.Tr key={row.id}>
                    <Table.Td>{row.productCode}</Table.Td>
                    <Table.Td>{row.productName}</Table.Td>
                    <Table.Td>
                      <Badge>{row.category}</Badge>
                    </Table.Td>
                    <Table.Td c="red">{row.stock}</Table.Td>
                    <Table.Td>{row.minStock}</Table.Td>
                    <Table.Td>{row.unitPrice}</Table.Td>
                    <Table.Td>{row.lastUpdated}</Table.Td>
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
                  <Table.Th>Total Stock</Table.Th>
                  <Table.Th>Total Value</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {catData.map((row) => (
                  <Table.Tr key={row.category}>
                    <Table.Td>{row.category}</Table.Td>
                    <Table.Td>{row.totalStock}</Table.Td>
                    <Table.Td>{row.totalValue}</Table.Td>
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
      </Tabs>
    </div>
  );
}

export default function StockReportsCompany2() {
  return (
    <StockReportsProviderCompany2>
      <StockReportsInnerCompany2 />
    </StockReportsProviderCompany2>
  );
}
