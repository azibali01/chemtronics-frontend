import { useState } from "react";
import {
  Modal,
  Button,
  Select,
  Textarea,
  NumberInput,
  Group,
  TextInput,
  ActionIcon,
  Badge,
  Table,
  Card,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconMinus,
  IconDownload,
} from "@tabler/icons-react";
import jsPDF from "jspdf";

interface ReturnItem {
  product: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface ReturnEntry {
  id: string;
  vendor: string;
  invoice: string;
  date: string;
  amount: number;
  status: "pending" | "approved";
  reason: string;
  notes: string;
  items: ReturnItem[];
}

export default function PurchaseReturnModal() {
  const [opened, setOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);

  const [vendor, setVendor] = useState<string>("");
  const [invoice, setInvoice] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [items, setItems] = useState<ReturnItem[]>([
    { product: "", quantity: 0, rate: 0, amount: 0 },
  ]);

  const [returns, setReturns] = useState<ReturnEntry[]>([
    {
      id: "PR-001",
      vendor: "Vendor A",
      invoice: "Invoice #1",
      date: "2024-06-01",
      amount: 100,
      status: "pending",
      reason: "Damaged",
      notes: "Broken packaging",
      items: [{ product: "Product 1", quantity: 2, rate: 50, amount: 100 }],
    },
    {
      id: "PR-002",
      vendor: "Vendor B",
      invoice: "Invoice #2",
      date: "2024-06-02",
      amount: 200,
      status: "approved",
      reason: "Incorrect item",
      notes: "Wrong product delivered",
      items: [{ product: "Product 2", quantity: 4, rate: 50, amount: 200 }],
    },
  ]);

  const [editingReturn, setEditingReturn] = useState<ReturnEntry | null>(null);

  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? r.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { product: "", quantity: 0, rate: 0, amount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof ReturnItem,
    value: string | number
  ) => {
    setItems((prev) => {
      const newItems = [...prev];
      const item = { ...newItems[index] };

      if (field === "product" && typeof value === "string") {
        item.product = value;
      }
      if (field === "quantity" && typeof value === "number") {
        item.quantity = value;
      }
      if (field === "rate" && typeof value === "number") {
        item.rate = value;
      }

      item.amount = item.quantity * item.rate;

      newItems[index] = item;
      return newItems;
    });
  };

  const handleSubmit = () => {
    const newReturn: ReturnEntry = {
      id: `PR-${returns.length + 1}`,
      vendor,
      invoice,
      reason,
      date: returnDate,
      notes,
      items,
      amount: items.reduce((acc, i) => acc + i.amount, 0),
      status: "pending",
    };

    setReturns((prev) => [...prev, newReturn]);
    setOpened(false);
  };

  const handleDelete = (id: string) => {
    setReturns((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEdit = (entry: ReturnEntry) => {
    setEditingReturn(entry);
    setVendor(entry.vendor);
    setInvoice(entry.invoice);
    setReason(entry.reason);
    setReturnDate(entry.date);
    setNotes(entry.notes);
    setItems(entry.items);
    setEditOpened(true);
  };

  const handleEditSubmit = () => {
    if (!editingReturn) return;
    const updated: ReturnEntry = {
      ...editingReturn,
      vendor,
      invoice,
      reason,
      date: returnDate,
      notes,
      items,
      amount: items.reduce((acc, i) => acc + i.amount, 0),
    };

    setReturns((prev) =>
      prev.map((r) => (r.id === editingReturn.id ? updated : r))
    );
    setEditOpened(false);
  };

  const exportPDF = (entry: ReturnEntry) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Purchase Return - ${entry.id}`, 10, 10);

    doc.setFontSize(12);
    doc.text(`Vendor: ${entry.vendor}`, 10, 20);
    doc.text(`Invoice: ${entry.invoice}`, 10, 30);
    doc.text(`Date: ${entry.date}`, 10, 40);
    doc.text(`Reason: ${entry.reason}`, 10, 50);
    doc.text(`Notes: ${entry.notes}`, 10, 60);

    doc.text("Items:", 10, 80);
    entry.items.forEach((item, i) => {
      doc.text(
        `${i + 1}. ${item.product} | Qty: ${item.quantity} | Rate: ${
          item.rate
        } | Amount: ${item.amount}`,
        10,
        90 + i * 10
      );
    });

    doc.text(`Total: ${entry.amount}`, 10, 120);
    doc.save(`${entry.id}.pdf`);
  };

  return (
    <div>
      <Card shadow="sm" p="lg" radius="md" withBorder mt={20} bg={"#F1FCF0"}>
        <Group justify="space-between" mb="md">
          <div>
            <h2>Purchase Returns</h2>
            <p>Manage purchase returns and refunds</p>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setOpened(true)}
            color="#0A6802"
          >
            New Purchase Return
          </Button>
        </Group>

        <Group mb="md">
          <TextInput
            w={300}
            placeholder="Search by return number or vendor..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            w={300}
            placeholder="Filter by status"
            data={[
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
          />
        </Group>

        <Table highlightOnHover withColumnBorders>
          <Table.Thead style={{ alignItems: "flex-start" }}>
            <Table.Tr>
              <Table.Th>Return No.</Table.Th>
              <Table.Th>Vendor</Table.Th>
              <Table.Th>Original Invoice</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredReturns.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.id}</Table.Td>
                <Table.Td>{r.vendor}</Table.Td>
                <Table.Td>{r.invoice}</Table.Td>
                <Table.Td>{r.date}</Table.Td>
                <Table.Td>{r.amount}</Table.Td>
                <Table.Td>
                  <Badge color={r.status === "approved" ? "#0A6802" : "yellow"}>
                    {r.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color="#0A6802"
                      onClick={() => handleEdit(r)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(r.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="#819E00"
                      onClick={() => exportPDF(r)}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Create Purchase Return"
        size="xl"
        centered
      >
        <ReturnForm
          vendor={vendor}
          setVendor={setVendor}
          invoice={invoice}
          setInvoice={setInvoice}
          reason={reason}
          setReason={setReason}
          returnDate={returnDate}
          setReturnDate={setReturnDate}
          notes={notes}
          setNotes={setNotes}
          items={items}
          updateItem={updateItem}
          addItem={addItem}
          removeItem={removeItem}
        />

        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSubmit}>
            Create Return
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={editOpened}
        onClose={() => setEditOpened(false)}
        title="Edit Purchase Return"
        size="xl"
        centered
      >
        <ReturnForm
          vendor={vendor}
          setVendor={setVendor}
          invoice={invoice}
          setInvoice={setInvoice}
          reason={reason}
          setReason={setReason}
          returnDate={returnDate}
          setReturnDate={setReturnDate}
          notes={notes}
          setNotes={setNotes}
          items={items}
          updateItem={updateItem}
          addItem={addItem}
          removeItem={removeItem}
        />

        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setEditOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

function ReturnForm({
  vendor,
  setVendor,
  invoice,
  setInvoice,
  reason,
  setReason,
  returnDate,
  setReturnDate,
  notes,
  setNotes,
  items,
  updateItem,
  addItem,
  removeItem,
}: any) {
  return (
    <>
      <Group grow mb="md">
        <Select
          label="Vendor"
          placeholder="Select vendor"
          data={["Vendor A", "Vendor B", "Vendor C"]}
          value={vendor}
          onChange={(val) => setVendor(val ?? "")}
        />
        <Select
          label="Original Invoice"
          placeholder="Select invoice"
          data={["Invoice #1", "Invoice #2"]}
          value={invoice}
          onChange={(val) => setInvoice(val ?? "")}
        />
      </Group>

      <Group grow mb="md">
        <TextInput
          label="Return Date"
          placeholder="mm/dd/yyyy"
          value={returnDate}
          onChange={(e) => setReturnDate(e.currentTarget.value)}
        />
        <Select
          label="Return Reason"
          placeholder="Select reason"
          data={["Damaged", "Incorrect item", "Other"]}
          value={reason}
          onChange={(val) => setReason(val ?? "")}
        />
      </Group>

      <div>
        <p className="font-medium mb-2">Return Items</p>
        {items.map((item: ReturnItem, index: number) => (
          <Group key={index} grow mb="xs">
            <Select
              label="Product"
              placeholder="Select product"
              data={["Product 1", "Product 2"]}
              value={item.product}
              onChange={(val) => updateItem(index, "product", val ?? "")}
            />
            <NumberInput
              label="Quantity"
              placeholder="Qty"
              value={item.quantity}
              onChange={(val) => updateItem(index, "quantity", val ?? 0)}
            />
            <NumberInput
              label="Rate"
              placeholder="Rate"
              value={item.rate}
              onChange={(val) => updateItem(index, "rate", val ?? 0)}
            />
            <NumberInput
              label="Amount"
              placeholder="Amount"
              value={item.amount}
              readOnly
            />
            <ActionIcon mt={20} color="#0A6802" onClick={addItem}>
              <IconPlus size={16} />
            </ActionIcon>
            {items.length > 1 && (
              <ActionIcon mt={20} color="red" onClick={() => removeItem(index)}>
                <IconMinus size={16} />
              </ActionIcon>
            )}
          </Group>
        ))}
      </div>

      <Textarea
        label="Notes"
        placeholder="Additional notes..."
        value={notes}
        onChange={(e) => setNotes(e.currentTarget.value)}
        mt="md"
      />
    </>
  );
}
