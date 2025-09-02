import {
  Card,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Title,
  Text,
  Modal,
  Select,
  NumberInput,
  TextInput,
  Pagination,
  SimpleGrid,
  ThemeIcon,
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconTruck,
  IconDownload,
  IconCheck,
  IconClock,
  IconPackageExport,
  IconSearch,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type DeliveryChallan = {
  id: string;
  customer: string;
  date: string;
  deliveryDate: string;
  items: string;
  quantity: number;
  vehicle: string;
  driver: string;
  status: "Delivered" | "In Transit" | "Pending";
};

const dataInit: DeliveryChallan[] = [
  {
    id: "DC-089",
    customer: "Global Inc",
    date: "2024-01-15",
    deliveryDate: "2024-01-17",
    items: "Office Supplies, Stationery",
    quantity: 25,
    vehicle: "MH-01-AB-1234",
    driver: "John Driver",
    status: "Delivered",
  },
  {
    id: "DC-090",
    customer: "Tech Solutions Inc",
    date: "2024-01-14",
    deliveryDate: "2024-01-16",
    items: "Computer Equipment",
    quantity: 5,
    vehicle: "MH-02-CD-5678",
    driver: "Mike Transport",
    status: "In Transit",
  },
  {
    id: "DC-091",
    customer: "Business Corp",
    date: "2024-01-13",
    deliveryDate: "2024-01-15",
    items: "Furniture Set",
    quantity: 12,
    vehicle: "MH-03-EF-9012",
    driver: "David Logistics",
    status: "Pending",
  },
];

function StatusBadge({ status }: { status: DeliveryChallan["status"] }) {
  switch (status) {
    case "Delivered":
      return <Badge color="#0A6802">Delivered</Badge>;
    case "In Transit":
      return <Badge color="yellow">In Transit</Badge>;
    case "Pending":
      return <Badge color="gray">Pending</Badge>;
  }
}

export default function DeliveryChallans() {
  const [data, setData] = useState<DeliveryChallan[]>(dataInit);

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [search, setSearch] = useState("");

  const filteredData = useMemo(
    () =>
      data.filter(
        (row) =>
          row.customer.toLowerCase().includes(search.toLowerCase()) ||
          row.id.toLowerCase().includes(search.toLowerCase()) ||
          row.driver.toLowerCase().includes(search.toLowerCase())
      ),
    [data, search]
  );

  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);

  // ---------- Stats ----------
  const activeCount = data.filter((d) => d.status !== "Delivered").length;
  const deliveredCount = data.filter((d) => d.status === "Delivered").length;
  const pendingCount = data.filter((d) => d.status === "Pending").length;

  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<DeliveryChallan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [customer, setCustomer] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [items, setItems] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [vehicle, setVehicle] = useState<string>("");
  const [driver, setDriver] = useState<string>("");
  const [status, setStatus] = useState<DeliveryChallan["status"]>("Pending");

  const exportPDF = (row: DeliveryChallan) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Delivery Challan Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Challan #", row.id],
        ["Customer", row.customer],
        ["Date", row.date],
        ["Delivery Date", row.deliveryDate],
        ["Items", row.items],
        ["Quantity", `${row.quantity} items`],
        ["Vehicle", row.vehicle],
        ["Driver", row.driver],
        ["Status", row.status],
      ],
    });

    doc.save(`${row.id}.pdf`);
  };

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (row: DeliveryChallan) => {
    setEditData(row);
    setCustomer(row.customer);
    setDate(row.date);
    setDeliveryDate(row.deliveryDate);
    setItems(row.items);
    setQuantity(row.quantity);
    setVehicle(row.vehicle);
    setDriver(row.driver);
    setStatus(row.status);
    setOpened(true);
  };

  const handleSave = () => {
    if (
      !customer ||
      !date ||
      !deliveryDate ||
      !items ||
      !quantity ||
      !vehicle ||
      !driver
    )
      return;

    if (editData) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editData.id
            ? {
                ...d,
                customer,
                date,
                deliveryDate,
                items,
                quantity: Number(quantity),
                vehicle,
                driver,
                status,
              }
            : d
        )
      );
    } else {
      const newChallan: DeliveryChallan = {
        id: `DC-${Math.floor(Math.random() * 1000)}`,
        customer,
        date,
        deliveryDate,
        items,
        quantity: Number(quantity),
        vehicle,
        driver,
        status,
      };
      setData((prev) => [...prev, newChallan]);
    }
    setOpened(false);
    resetForm();
  };

  const openDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (deleteId) setData((prev) => prev.filter((d) => d.id !== deleteId));
    setDeleteId(null);
  };

  const resetForm = () => {
    setCustomer(null);
    setDate("");
    setDeliveryDate("");
    setItems("");
    setQuantity("");
    setVehicle("");
    setDriver("");
    setStatus("Pending");
  };

  return (
    <div>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2}>Delivery Challans</Title>
          <Text c="dimmed" size="sm">
            Create and manage delivery challans for shipments
          </Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          Create Delivery Challan
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
        <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Active Challans</Text>
            <ThemeIcon color="teal" variant="light">
              <IconPackageExport size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={8}>
            {activeCount}
          </Title>
        </Card>

        <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Delivered</Text>
            <ThemeIcon color="#0A6802" variant="light">
              <IconCheck size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={8}>
            {deliveredCount}
          </Title>
        </Card>

        <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
          <Group justify="space-between">
            <Text>Pending</Text>
            <ThemeIcon color="gray" variant="light">
              <IconClock size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3} mt={8}>
            {pendingCount}
          </Title>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" shadow="sm" p="md" bg={"#F1FCF0"}>
        <Group mb="sm">
          <IconTruck size={20} />
          <Text fw={600}>Delivery Challans List</Text>
        </Group>

        <Group mb="md">
          <TextInput
            placeholder="Search by Challan #, Customer or Driver..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            style={{ flex: 1 }}
          />
        </Group>
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Challan #</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Delivery Date</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Quantity</Table.Th>
              <Table.Th>Vehicle</Table.Th>
              <Table.Th>Driver</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.customer}</Table.Td>
                <Table.Td>{row.date}</Table.Td>
                <Table.Td>{row.deliveryDate}</Table.Td>
                <Table.Td>{row.items}</Table.Td>
                <Table.Td>{row.quantity} items</Table.Td>
                <Table.Td>{row.vehicle}</Table.Td>
                <Table.Td>{row.driver}</Table.Td>
                <Table.Td>
                  <StatusBadge status={row.status} />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="#0A6802"
                      onClick={() => openEdit(row)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => openDelete(row.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="#819E00"
                      onClick={() => exportPDF(row)}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {paginatedData.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={10} style={{ textAlign: "center" }}>
                  No results found
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination
            total={Math.ceil(filteredData.length / pageSize)}
            value={page}
            onChange={setPage}
            size="sm"
            color="#0A6802"
          />
        </Group>
      </Card>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          editData ? (
            <strong>Edit Delivery Challan</strong>
          ) : (
            <strong>Create New Delivery Challan</strong>
          )
        }
        centered
        size="lg"
      >
        <Group grow mb="md">
          <TextInput
            label="Customer"
            placeholder="Enter customer name"
            value={customer || ""}
            onChange={(e) => setCustomer(e.currentTarget.value)}
          />
          <TextInput
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.currentTarget.value)}
          />
        </Group>
        <Group grow mb="md">
          <TextInput
            label="Delivery Date"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.currentTarget.value)}
          />
          <NumberInput
            label="Quantity"
            value={quantity}
            onChange={(val) => setQuantity(val === null ? "" : Number(val))}
            min={0}
          />
        </Group>
        <Group grow mb="md">
          <TextInput
            label="Items"
            placeholder="Enter items"
            value={items}
            onChange={(e) => setItems(e.currentTarget.value)}
          />
          <TextInput
            label="Vehicle"
            placeholder="Vehicle No."
            value={vehicle}
            onChange={(e) => setVehicle(e.currentTarget.value)}
          />
        </Group>
        <Group grow mb="md">
          <TextInput
            label="Driver"
            placeholder="Driver Name"
            value={driver}
            onChange={(e) => setDriver(e.currentTarget.value)}
          />
          <Select
            label="Status"
            data={["Delivered", "In Transit", "Pending"]}
            value={status}
            onChange={(val) =>
              setStatus((val || "Pending") as DeliveryChallan["status"])
            }
          />
        </Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSave}>
            {editData ? "Update Challan" : "Create Challan"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={<strong>Delete Delivery Challan</strong>}
        centered
      >
        <Text mb="md">Are you sure you want to delete this record?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
