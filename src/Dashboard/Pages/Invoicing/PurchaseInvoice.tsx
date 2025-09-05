import { useState } from "react";
import {
  Card,
  Text,
  Group,
  Badge,
  Button,
  Table,
  Menu,
  ActionIcon,
  TextInput,
  Grid,
  Modal,
  Select,
  NumberInput,
  Textarea,
  Switch,
} from "@mantine/core";
import {
  IconSearch,
  IconDots,
  IconTrash,
  IconPencil,
  IconDownload,
  IconCircle,
  IconFileText,
  IconShoppingCart,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Invoice = {
  id: number;
  number: string;
  vendor: string;
  date: string;
  dueDate: string;
  status: "pending" | "paid" | "overdue";
  amount: number;
  items?: Item[];
  notes?: string;
  gst?: boolean;
};

type Item = {
  id: number;
  code: number;
  product: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

export default function PurchaseInvoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      number: "PUR-001",
      vendor: "Office Supplies Co.",
      date: "3/15/2024",
      dueDate: "4/15/2024",
      status: "pending",
      amount: 850,
    },
    {
      id: 2,
      number: "PUR-002",
      vendor: "Tech Equipment Ltd.",
      date: "3/14/2024",
      dueDate: "4/14/2024",
      status: "paid",
      amount: 2500,
    },
    {
      id: 3,
      number: "PUR-003",
      vendor: "Maintenance Services",
      date: "3/13/2024",
      dueDate: "4/13/2024",
      status: "overdue",
      amount: 450,
    },
  ]);

  const [search, setSearch] = useState("");
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("PUR-004");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [includeGST, setIncludeGST] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");

  const totalPurchases = invoices.length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
  // Add item
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        code: 1,
        product: "",
        description: "",
        unit: "",
        qty: 0,
        rate: 0,
      },
    ]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: number, field: keyof Item, value: any) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.rate, 0);
  const gst = includeGST ? subtotal * 0.18 : 0;
  const total = subtotal + gst;

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.vendor.toLowerCase().includes(search.toLowerCase())
  );

  const exportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    doc.text(`Invoice: {invoice.number}`, 14, 20);
    doc.text(`Vendor: {invoice.vendor}`, 14, 30);
    doc.text(`Date: {invoice.date}`, 14, 40);
    doc.text(`Due Date: {invoice.dueDate}`, 14, 50);

    if (invoice.items && invoice.items.length > 0) {
      const tableData = invoice.items.map((i) => [
        i.product,
        i.description,
        i.qty,
        i.rate,
        i.qty * i.rate,
      ]);
      (doc as any).autoTable({
        head: [["Product", "Description", "Qty", "Rate", "Amount"]],
        body: tableData,
        startY: 60,
      });
    }

    doc.text(`Subtotal: {subtotal}`, 14, 200);
    doc.text(`GST: {gst}`, 14, 210);
    doc.text(`Total: {invoice.amount}`, 14, 220);

    if (invoice.notes) doc.text(`Notes: {invoice.notes}`, 14, 230);

    doc.save(`{invoice.number}.pdf`);
  };

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Text size="xl" fw={700}>
          Purchase Invoice
        </Text>
        <Button
          color="#0A6802"
          onClick={() => {
            setInvoiceNumber(
              "PUR-" + (invoices.length + 1).toString().padStart(3, "0")
            );
            setVendor("");
            setDate("");
            setDueDate("");
            setIncludeGST(true);
            setItems([]);
            setNotes("");
            setCreateOpen(true);
          }}
        >
          + Create Purchase Invoice
        </Button>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder bg={"#F1FCF0"}>
            <Group justify="space-between">
              <Text>Total Purchases</Text>
              <IconShoppingCart size={20} />
            </Group>
            <div style={{ marginTop: 10 }}>
              <Text fw={700}>{totalPurchases}</Text>
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder bg={"#F1FCF0"}>
            <Group justify="space-between">
              <Text>Paid</Text> <IconCircle color="#0A6802" size={20} />
            </Group>
            <div style={{ marginTop: 10 }}>
              <Text fw={700}>{paidCount}</Text>
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder bg={"#F1FCF0"}>
            <Group justify="space-between">
              <Text>Pending</Text> <IconCircle color="blue" size={20} />
            </Group>
            <div style={{ marginTop: 10 }}>
              <Text fw={700}>{pendingCount}</Text>
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder bg={"#F1FCF0"}>
            <Group justify="space-between">
              <Text>Total Amount</Text> <IconFileText size={20} />
            </Group>
            <div style={{ marginTop: 10 }}>
              <Text fw={700}>{totalAmount}</Text>
            </div>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" radius="md" p="lg" bg={"#F1FCF0"} withBorder>
        <Text fw={600} mb="md">
          Purchase Invoices
        </Text>
        <TextInput
          placeholder="Search purchase invoices..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          mb="md"
          leftSection={<IconSearch size={16} />}
        />
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Vendor</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredInvoices.map((inv) => (
              <Table.Tr key={inv.id}>
                <Table.Td>{inv.number}</Table.Td>
                <Table.Td>{inv.vendor}</Table.Td>
                <Table.Td>{inv.date}</Table.Td>
                <Table.Td>{inv.dueDate}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      inv.status === "paid"
                        ? "#0A6802"
                        : inv.status === "pending"
                        ? "blue"
                        : "red"
                    }
                  >
                    {inv.status}
                  </Badge>
                </Table.Td>
                <Table.Td>{inv.amount}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={180}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="#0A6802">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconPencil size={14} />}
                        onClick={() => {
                          setInvoiceNumber(inv.number);
                          setVendor(inv.vendor);
                          setDate(inv.date);
                          setDueDate(inv.dueDate);
                          setIncludeGST(inv.gst ?? true);
                          setItems(inv.items || []);
                          setNotes(inv.notes || "");
                          setEditInvoice(inv);
                        }}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconDownload size={14} />}
                        onClick={() => exportPDF(inv)}
                      >
                        Export PDF
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => setDeleteInvoice(inv)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={createOpen || !!editInvoice}
        onClose={() => {
          setCreateOpen(false);
          setEditInvoice(null);
        }}
        title={editInvoice ? "Edit Invoice" : "Create Purchase Invoice"}
        size="70%"
        centered
      >
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Invoice Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput label="Supplier" />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Supplier"
              placeholder="Supplier Title"
              data={[
                "MBL 05120109086371 CHEMTRONIX ENGINEERING SOLUTION",
                "MBL 05120104085906 Hydro Worx",
              ]}
              value={vendor}
              onChange={(val) => setVendor(val || "")}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput label="Purchase A/C" type="number" />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Purchase Title"
              data={["Stock"]}
              defaultValue={"Stock"}
            />
          </Grid.Col>
        </Grid>

        <Switch
          mt="md"
          label="Include GST (18%)"
          color={"#0A6802"}
          checked={includeGST}
          onChange={(e) => setIncludeGST(e.currentTarget.checked)}
        />

        <Group justify="space-between" mt="md" mb="xs">
          <Text fw={600}>Invoice Items</Text>
          <Button size="xs" onClick={addItem} color="#0A6802">
            + Add Item
          </Button>
        </Group>
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Product Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Rate</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <TextInput value={item.code} />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="Product name"
                    value={item.product}
                    onChange={(e) =>
                      updateItem(item.id, "product", e.currentTarget.value)
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.currentTarget.value)
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput value={item.unit} />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    min={1}
                    value={item.qty}
                    onChange={(val) => updateItem(item.id, "qty", Number(val))}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    min={0}
                    value={item.rate}
                    onChange={(val) => updateItem(item.id, "rate", Number(val))}
                  />
                </Table.Td>
                <Table.Td>{(item.qty * item.rate).toFixed(2)}</Table.Td>
                <Table.Td>
                  <ActionIcon color="red" onClick={() => removeItem(item.id)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end" mt="md">
          <div>
            <Text>Subtotal: {subtotal.toFixed(2)}</Text>
            <Text>Discount %</Text>
            <TextInput placeholder="Enter Discount "></TextInput>
            <Text>GST (18%): {gst.toFixed(2)}</Text>
            <Text fw={700}>Total: {total.toFixed(2)}</Text>
          </div>
        </Group>

        <Textarea
          label="Notes (Optional)"
          placeholder="Additional notes or terms..."
          mt="md"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Group justify="flex-end" mt="lg">
          <Button
            color="#0A6802"
            onClick={() => {
              if (editInvoice) {
                setInvoices((prev) =>
                  prev.map((i) =>
                    i.id === editInvoice.id
                      ? {
                          ...i,
                          number: invoiceNumber,
                          vendor,
                          date,
                          dueDate,
                          amount: total,
                          items,
                          notes,
                          gst: includeGST,
                        }
                      : i
                  )
                );
                setEditInvoice(null);
              } else {
                const newInvoice: Invoice = {
                  id: Date.now(),
                  number: invoiceNumber,
                  vendor,
                  date,
                  dueDate,
                  status: "pending",
                  amount: total,
                  items,
                  notes,
                  gst: includeGST,
                };
                setInvoices((prev) => [...prev, newInvoice]);
                setCreateOpen(false);
              }
            }}
          >
            {editInvoice ? "Update Invoice" : "Create Invoice"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        title="Confirm Delete"
        centered
      >
        <Text mb="md">
          Are you sure you want to delete{" "}
          <strong>{deleteInvoice?.number}</strong>?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteInvoice(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (deleteInvoice) {
                setInvoices((prev) =>
                  prev.filter((i) => i.id !== deleteInvoice.id)
                );
                setDeleteInvoice(null);
              }
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
