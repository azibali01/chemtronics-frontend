import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Chip,
  Group,
  Menu,
  Modal,
  NumberInput,
  Pagination,
  Select,
  SimpleGrid,
  Table,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconDots,
  IconEdit,
  IconPlus,
  IconSquareCheck,
  IconSquareX,
  IconTrash,
  IconBox,
  IconAlertTriangle,
  IconTrendingUp,
  IconCategory2,
  IconDownload,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  costPrice: number;
  status: "active" | "inactive";
};

const seed: Product[] = [
  {
    id: "p1",
    name: "Wireless Headphones",
    code: "PRD-001",
    category: "Electronics",
    description: "Noise-cancelling over-ear wireless headphones.",
    stock: 45,
    minStock: 10,
    unitPrice: 199.99,
    costPrice: 120,
    status: "active",
  },
  {
    id: "p2",
    name: "Office Chair",
    code: "PRD-002",
    category: "Furniture",
    description: "Ergonomic adjustable office chair.",
    stock: 8,
    minStock: 5,
    unitPrice: 299.99,
    costPrice: 180,
    status: "active",
  },
  {
    id: "p3",
    name: "Laptop Stand",
    code: "PRD-003",
    category: "Accessories",
    description: "Aluminium cooling laptop stand.",
    stock: 3,
    minStock: 10,
    unitPrice: 79.99,
    costPrice: 35,
    status: "active",
  },
  {
    id: "p4",
    name: "Desk Lamp",
    code: "PRD-004",
    category: "Lighting",
    description: "LED desk lamp with adjustable arm.",
    stock: 25,
    minStock: 8,
    unitPrice: 89.99,
    costPrice: 40,
    status: "inactive",
  },
];

const money = (n: number) =>
  `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function stockStatus(p: Product) {
  if (p.stock <= p.minStock) return { label: "Low", color: "red" as const };
  if (p.stock <= p.minStock * 2)
    return { label: "Medium", color: "yellow" as const };
  return { label: "Good", color: "green" as const };
}

export default function Products() {
  const [rows, setRows] = useState<Product[]>(seed);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [catModal, setCatModal] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [minStock, setMinStock] = useState<number | "">("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [categories, setCategories] = useState([
    "Electronics",
    "Furniture",
    "Accessories",
    "Lighting",
  ]);
  const [newCategory, setNewCategory] = useState("");

  const totalProducts = rows.length;
  const activeCount = rows.filter((r) => r.status === "active").length;
  const lowStockCount = rows.filter((r) => r.stock <= r.minStock).length;
  const stockValue = rows.reduce((sum, r) => sum + r.stock * r.unitPrice, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      const matchC = cat ? r.category === cat : true;
      const matchS = statusFilter === "all" ? true : r.status === statusFilter;
      return matchQ && matchC && matchS;
    });
  }, [rows, query, cat, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setCode(p.code);
    setCategory(p.category);
    setDescription(p.description || "");
    setUnitPrice(p.unitPrice);
    setCostPrice(p.costPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setStatus(p.status);
    setOpened(true);
  };

  const saveProduct = () => {
    if (
      !name ||
      !code ||
      !category ||
      unitPrice === "" ||
      costPrice === "" ||
      stock === "" ||
      minStock === ""
    )
      return;

    const payload: Product = {
      id: editing ? editing.id : `p-${Math.random().toString(36).slice(2, 8)}`,
      name,
      code,
      category,
      description,
      unitPrice: Number(unitPrice),
      costPrice: Number(costPrice),
      stock: Number(stock),
      minStock: Number(minStock),
      status,
    };

    if (editing) {
      setRows((prev) => prev.map((r) => (r.id === editing.id ? payload : r)));
    } else {
      setRows((prev) => [payload, ...prev]);
    }

    setOpened(false);
    resetForm();
  };

  const toggleStatus = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "active" ? "inactive" : "active" }
          : r
      )
    );
  };

  const confirmDelete = () => {
    if (delId) setRows((prev) => prev.filter((r) => r.id !== delId));
    setDelId(null);
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setCategory(null);
    setDescription("");
    setUnitPrice("");
    setCostPrice("");
    setStock("");
    setMinStock("");
    setStatus("active");
  };

  const exportPDF = (p: Product) => {
    const content = `${p.name} (${p.code})
Category: ${p.category}
Stock: ${p.stock} | Min: ${p.minStock}
Unit Price: ${money(p.unitPrice)}
Cost Price: ${money(p.costPrice)}
Status: ${p.status}`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.name}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Product Management</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          Add Product
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="lg" mb="lg">
        <Card withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Total Products</Text>
            <ThemeIcon variant="light" color="#0A6802">
              <IconBox size={20} />
            </ThemeIcon>
          </Group>
          <Title order={2}>{totalProducts}</Title>
          <Text size="sm" c="dimmed">
            {activeCount} active
          </Text>
        </Card>

        <Card withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Low Stock Items</Text>
            <ThemeIcon variant="light" color="yellow">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
          </Group>
          <Title order={2}>{lowStockCount}</Title>
          <Text size="sm" c="dimmed">
            Need attention
          </Text>
        </Card>

        <Card withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Stock Value</Text>
            <ThemeIcon variant="light" color="teal">
              <IconTrendingUp size={20} />
            </ThemeIcon>
          </Group>
          <Title order={2}>{money(stockValue)}</Title>
          <Text size="sm" c="dimmed">
            Total inventory value
          </Text>
        </Card>

        <Card withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Categories</Text>
            <ThemeIcon variant="light" color="grape">
              <IconCategory2 size={20} />
            </ThemeIcon>
          </Group>
          <Title order={2}>{categories.length}</Title>
          <Button
            size="xs"
            mt="xs"
            variant="light"
            color="grape"
            onClick={() => setCatModal(true)}
          >
            Manage Categories
          </Button>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" p="md" style={{ background: "#F1FCF0" }}>
        <Text fw={600}>Products List</Text>
        <Text c={"dimmed"} mb={10}>
          Manage your product inventory and stock levels
        </Text>
        <Group mb="md" grow>
          <TextInput
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <Select
            placeholder="All Categories"
            data={categories}
            clearable
            value={cat}
            onChange={setCat}
          />
        </Group>

        <Group mb="md">
          <Chip.Group
            value={statusFilter}
            onChange={(val: any) => setStatusFilter(val)}
          >
            <Chip value="all" color="#819E00">
              All
            </Chip>
            <Chip value="active" color="#0A6802">
              Active
            </Chip>
            <Chip value="inactive" color="gray">
              Inactive
            </Chip>
          </Chip.Group>
        </Group>

        {/* ---- Table ---- */}
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Product</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Stock</Table.Th>
              <Table.Th>Unit Price</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Stock Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pageData.map((p) => {
              const ss = stockStatus(p);
              return (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text fw={500}>{p.name}</Text>
                    <Text size="xs" c="dimmed">
                      {p.code}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="grape">
                      {p.category}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text>{p.stock}</Text>
                    <Text size="xs" c="dimmed">
                      Min: {p.minStock}
                    </Text>
                  </Table.Td>
                  <Table.Td>{money(p.unitPrice)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={p.status === "active" ? "#0A6802" : "gray"}
                      variant="filled"
                    >
                      {p.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background:
                            ss.color === "green"
                              ? "#22c55e"
                              : ss.color === "yellow"
                              ? "#f59e0b"
                              : "#ef4444",
                          display: "inline-block",
                        }}
                      />
                      <Text size="sm">{ss.label}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Menu withinPortal shadow="sm" position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light" color="#0A6802">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEdit size={16} />}
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Item
                          leftSection={
                            p.status === "active" ? (
                              <IconSquareX size={16} />
                            ) : (
                              <IconSquareCheck size={16} />
                            )
                          }
                          onClick={() => toggleStatus(p.id)}
                        >
                          {p.status === "active"
                            ? "Mark Inactive"
                            : "Mark Active"}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconDownload size={16} />}
                          onClick={() => exportPDF(p)}
                        >
                          Download PDF
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={16} />}
                          onClick={() => setDelId(p.id)}
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>

        {/* ---- Pagination ---- */}
        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </Group>
        )}
      </Card>

      {/* Product Modal (create/edit) */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          editing ? (
            <strong>Edit Product</strong>
          ) : (
            <strong>Add New Product</strong>
          )
        }
        centered
        size="lg"
      >
        <SimpleGrid cols={2} mb="md">
          <TextInput
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <TextInput
            label="SKU"
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
          />
        </SimpleGrid>
        <SimpleGrid cols={2} mb="md">
          <Select
            label="Category"
            data={categories}
            value={category}
            onChange={setCategory}
            searchable
          />
          <div />
        </SimpleGrid>
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          mb="md"
        />
        <SimpleGrid cols={2} mb="md">
          <NumberInput
            label="Unit Price ($)"
            value={unitPrice}
            onChange={(v) => setUnitPrice(v === "" ? "" : Number(v))}
          />
          <NumberInput
            label="Cost Price ($)"
            value={costPrice}
            onChange={(v) => setCostPrice(v === "" ? "" : Number(v))}
          />
        </SimpleGrid>
        <SimpleGrid cols={2} mb="md">
          <NumberInput
            label="Stock Quantity"
            value={stock}
            onChange={(v) => setStock(v === "" ? "" : Number(v))}
          />
          <NumberInput
            label="Min Stock Level"
            value={minStock}
            onChange={(v) => setMinStock(v === "" ? "" : Number(v))}
          />
        </SimpleGrid>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={saveProduct}>
            {editing ? "Update Product" : "Create Product"}
          </Button>
        </Group>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        opened={!!delId}
        onClose={() => setDelId(null)}
        title="Delete Product"
        centered
      >
        <Text>Are you sure you want to delete this product?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setDelId(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>

      {/* Category Manager */}
      <Modal
        opened={catModal}
        onClose={() => setCatModal(false)}
        title="Manage Categories"
        centered
      >
        {categories.map((c) => (
          <Group key={c} mb="xs" justify="space-between">
            <Text>{c}</Text>
            <ActionIcon
              color="red"
              variant="light"
              onClick={() =>
                setCategories((prev) => prev.filter((x) => x !== c))
              }
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ))}
        <Group mt="sm">
          <TextInput
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.currentTarget.value)}
          />
          <Button
            color="green"
            onClick={() => {
              if (newCategory.trim()) {
                setCategories((prev) => [...prev, newCategory.trim()]);
                setNewCategory("");
              }
            }}
          >
            Add
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
