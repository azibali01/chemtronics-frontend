import { useState, useRef } from "react";
import {
  Modal,
  Button,
  Select,
  Textarea,
  NumberInput,
  Group,
  TextInput,
  ActionIcon,
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
import autoTable from "jspdf-autotable";

// Attach autoTable to jsPDF prototype for TypeScript
// Attach autoTable to jsPDF prototype for TypeScript
// @ts-ignore
jsPDF.prototype.autoTable = autoTable;

interface ReturnItem {
  product: string;
  quantity: number;
  rate: number;
  amount: number;
  code: string;
  unit: string;
}

interface ReturnEntry {
  id: string;
  vendor: string;
  invoice: string;
  date: string;
  amount: number;
  status: "pending" | "approved";
  notes: string;
  items: ReturnItem[];
  supplierNumber: string;
  supplierTitle: string;
  purchaseAccount: string;
  purchaseTitle: string;
}

export default function PurchaseReturnModal() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReturnEntry | null>(null);
  const [opened, setOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);

  const [reason, setReason] = useState<string>("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState<string>("");
  const [supplierNumber, setSupplierNumber] = useState("");
  const [supplierTitle, setSupplierTitle] = useState("");
  const [purchaseAccount, setPurchaseAccount] = useState("");
  const [purchaseTitle, setPurchaseTitle] = useState("");
  const [invoice, setInvoice] = useState("");

  const [search, setSearch] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [items, setItems] = useState<ReturnItem[]>([
    { product: "", quantity: 0, rate: 0, amount: 0, code: "", unit: "" },
  ]);

  const [returns, setReturns] = useState<ReturnEntry[]>([
    {
      id: "PR-001",
      vendor: "Vendor A",
      invoice: "Invoice #1",
      date: "2024-06-01",
      amount: 100,
      status: "pending",
      notes: "Broken packaging",
      items: [
        {
          product: "Product 1",
          quantity: 2,
          rate: 50,
          amount: 100,
          code: "",
          unit: "",
        },
      ],
      supplierNumber: "S-001",
      supplierTitle: "Supplier A",
      purchaseAccount: "PA-001",
      purchaseTitle: "Purchase A",
    },
    {
      id: "PR-002",
      vendor: "Vendor B",
      invoice: "Invoice #2",
      date: "2024-06-02",
      amount: 200,
      status: "approved",
      notes: "Wrong product delivered",
      items: [
        {
          product: "Product 2",
          quantity: 4,
          rate: 50,
          amount: 200,
          code: "",
          unit: "",
        },
      ],
      supplierNumber: "S-002",
      supplierTitle: "Supplier B",
      purchaseAccount: "PA-002",
      purchaseTitle: "Purchase B",
    },
  ]);

  const [editingReturn, setEditingReturn] = useState<ReturnEntry | null>(null);
  // Removed unused showPrint state

  const printRef = useRef<HTMLDivElement>(null);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { product: "", quantity: 0, rate: 0, amount: 0, code: "", unit: "" },
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
      vendor: "",
      invoice: "",
      date: returnDate,
      notes,
      items,
      amount: items.reduce((acc, i) => acc + i.amount, 0),
      status: "pending",
      supplierNumber,
      supplierTitle,
      purchaseAccount,
      purchaseTitle,
    };

    setReturns((prev) => [...prev, newReturn]);
    setOpened(false);
  };

  const handleDelete = (id: string) => {
    setReturns((prev) => prev.filter((r) => r.id !== id));
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleEdit = (entry: ReturnEntry) => {
    setEditingReturn(entry);
    setInvoice(entry.invoice);
    setReturnDate(entry.date);
    setSupplierNumber(entry.supplierNumber);
    setSupplierTitle(entry.supplierTitle);
    setPurchaseAccount(entry.purchaseAccount);
    setPurchaseTitle(entry.purchaseTitle);
    setNotes(entry.notes);
    // Ensure all item fields are present for editing
    const itemsWithAllFields = entry.items.map((item) => ({
      code: item.code || "",
      product: item.product || "",
      unit: item.unit || "",
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      amount: item.amount || 0,
    }));
    setItems(itemsWithAllFields);
    setEditOpened(true);
  };

  const handleEditSubmit = () => {
    if (!editingReturn) return;
    const updated: ReturnEntry = {
      ...editingReturn,
      vendor: "",
      invoice: "",
      date: returnDate,
      notes,
      items,
      amount: items.reduce((acc, i) => acc + i.amount, 0),
      supplierNumber,
      supplierTitle,
      purchaseAccount,
      purchaseTitle,
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

  const filteredReturns = returns.filter(
    (entry) =>
      (entry.invoice.toLowerCase().includes(search.toLowerCase()) ||
        entry.supplierNumber.toLowerCase().includes(search.toLowerCase())) &&
      (!fromDate || new Date(entry.date) >= new Date(fromDate)) &&
      (!toDate || new Date(entry.date) <= new Date(toDate))
  );

  const exportFilteredPDF = () => {
    const doc = new jsPDF();
    doc.text("Purchase Returns", 14, 20);
    if (filteredReturns.length > 0) {
      const tableData = filteredReturns.map((entry) => [
        entry.invoice,
        entry.date,
        entry.vendor,
        entry.amount?.toFixed(2) || "0.00",
        entry.supplierNumber || "",
        entry.supplierTitle || "",
        entry.purchaseAccount || "",
        entry.purchaseTitle || "",
      ]);
      // @ts-ignore
      doc.autoTable({
        head: [
          [
            "Invoice",
            "Date",
            "Vendor",
            "Amount",
            "Supplier No",
            "Supplier Title",
            "Purchase A/C",
            "Purchase Title",
          ],
        ],
        body: tableData,
        startY: 30,
      });
    } else {
      doc.text("No returns found for selected filters.", 14, 30);
    }
    doc.save("purchase_returns.pdf");
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
            w={220}
            placeholder="Search by return number or vendor..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <TextInput
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <TextInput
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <Button
            variant="outline"
            color="gray"
            onClick={() => {
              setSearch("");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear
          </Button>
          <Button
            variant="filled"
            color="#0A6802"
            leftSection={<IconDownload size={16} />}
            onClick={exportFilteredPDF}
          >
            Export
          </Button>
        </Group>

        <Table highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Supplier Number</Table.Th>
              <Table.Th>Supplier Title</Table.Th>
              <Table.Th>Purchase Account</Table.Th>
              <Table.Th>Purchase Title</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredReturns.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.invoice}</Table.Td>
                <Table.Td>{r.date}</Table.Td>
                <Table.Td>{r.supplierNumber}</Table.Td>
                <Table.Td>{r.supplierTitle}</Table.Td>
                <Table.Td>{r.purchaseAccount}</Table.Td>
                <Table.Td>{r.purchaseTitle}</Table.Td>
                <Table.Td>{r.amount}</Table.Td>
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
                      onClick={() => {
                        setDeleteTarget(r);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                    <Modal
                      opened={deleteModalOpen}
                      onClose={() => setDeleteModalOpen(false)}
                      title="Confirm Delete"
                      centered
                    >
                      <p>
                        Are you sure you want to delete{" "}
                        <b>{deleteTarget?.invoice}</b>?
                      </p>
                      <Group justify="flex-end" mt="md">
                        <Button
                          variant="default"
                          onClick={() => setDeleteModalOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          color="red"
                          onClick={() =>
                            deleteTarget && handleDelete(deleteTarget.id)
                          }
                        >
                          Delete
                        </Button>
                      </Group>
                    </Modal>
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
        size="70%"
        centered
      >
        <Group grow mb="md" w={"50%"}>
          <TextInput
            label="Invoice Number"
            placeholder="Enter invoice number"
            value={invoice}
            onChange={(e) => setInvoice(e.currentTarget.value)}
          />
          <TextInput
            label="Date"
            type="date"
            placeholder="mm/dd/yyyy"
            value={returnDate}
            onChange={(e) => setReturnDate(e.currentTarget.value)}
          />
        </Group>
        <Group grow mb="md">
          <TextInput
            label="Supplier Number"
            placeholder="Enter supplier number"
            value={supplierNumber}
            onChange={(e) => setSupplierNumber(e.currentTarget.value)}
          />
          <TextInput
            label="Supplier Title"
            placeholder="Enter supplier name/title"
            value={supplierTitle}
            onChange={(e) => setSupplierTitle(e.currentTarget.value)}
          />
          <TextInput
            label="Purchase Account"
            placeholder="Enter purchase account"
            value={purchaseAccount}
            onChange={(e) => setPurchaseAccount(e.currentTarget.value)}
          />
          <TextInput
            label="Purchase Title"
            placeholder="Enter purchase title"
            value={purchaseTitle}
            onChange={(e) => setPurchaseTitle(e.currentTarget.value)}
          />
        </Group>
        <div ref={printRef}>
          <ReturnForm
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
        </div>
        <Group justify="flex-end" mt="lg">
          <Button color="#819E00" onClick={() => window.print()}>
            Print
          </Button>
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
        size="70%"
        centered
      >
        <Group grow mb="md" w={"50%"}>
          <TextInput
            label="Invoice Number"
            placeholder="Enter invoice number"
            value={invoice}
            onChange={(e) => setInvoice(e.currentTarget.value)}
          />
          <TextInput
            label="Date"
            type="date"
            placeholder="mm/dd/yyyy"
            value={returnDate}
            onChange={(e) => setReturnDate(e.currentTarget.value)}
          />
        </Group>
        <Group grow mb="md">
          <TextInput
            label="Supplier Number"
            placeholder="Enter supplier number"
            value={supplierNumber}
            onChange={(e) => setSupplierNumber(e.currentTarget.value)}
          />
          <TextInput
            label="Supplier Title"
            placeholder="Enter supplier name/title"
            value={supplierTitle}
            onChange={(e) => setSupplierTitle(e.currentTarget.value)}
          />
          <TextInput
            label="Purchase Account"
            placeholder="Enter purchase account"
            value={purchaseAccount}
            onChange={(e) => setPurchaseAccount(e.currentTarget.value)}
          />
          <TextInput
            label="Purchase Title"
            placeholder="Enter purchase title"
            value={purchaseTitle}
            onChange={(e) => setPurchaseTitle(e.currentTarget.value)}
          />
        </Group>
        <ReturnForm
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
  notes,
  setNotes,
  items,
  updateItem,
  addItem,
  removeItem,
}: // ...existing props...
any) {
  return (
    <>
      <div>
        <p className="font-medium mb-2">Return Items</p>
        {items.map((item: ReturnItem, index: number) => (
          <Group key={index} grow mb="xs">
            <TextInput
              label="Code"
              value={item.code || ""}
              onChange={(e) => updateItem(index, "code", e.currentTarget.value)}
            />
            <Select
              label="Product"
              placeholder="Select product"
              data={["Product 1", "Product 2"]}
              value={item.product}
              onChange={(val) => updateItem(index, "product", val ?? "")}
            />
            <TextInput
              label="Unit"
              value={item.unit || ""}
              onChange={(e) => updateItem(index, "unit", e.currentTarget.value)}
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
