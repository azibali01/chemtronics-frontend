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
  Table,
  Card,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconPencil,
  IconTrash,
  IconMinus,
  IconDownload,
  IconPrinter,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePurchaseReturns } from "../../Context/Invoicing/PurchaseReturnsContext";
import { useProducts } from "../../Context/Inventory/ProductsContext";

declare module "jspdf" {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}
jsPDF.prototype.autoTable = autoTable;

interface ReturnItem {
  product: string;
  quantity: number;
  rate: number;
  amount: number;
  code: string;
  unit: string;
  discount?: number; // always a number, never undefined
  netAmount?: number;
}

interface ReturnEntry {
  id: string;
  invoice: string;
  date: string;
  amount: number;
  notes: string;
  items: ReturnItem[];
  supplierNumber: string;
  supplierTitle: string;
  purchaseAccount: string;
  purchaseTitle: string;
}

// Helper to get next invoice number
function getNextReturnNumber(returns: ReturnEntry[]) {
  const numbers = returns
    .map((r) => {
      const match = r.id.match(/^PR-(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n) => n !== null) as number[];
  const max = numbers.length ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `PR-${next}`;
}

export default function PurchaseReturnModal() {
  // Use context for returns
  const { returns, setReturns } = usePurchaseReturns();
  const { products } = useProducts();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReturnEntry | null>(null);
  const [opened, setOpened] = useState(false);
  const [editOpened, setEditOpened] = useState(false);

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
    {
      product: "",
      quantity: 0,
      rate: 0,
      amount: 0,
      code: "",
      unit: "",
      discount: 0,
      netAmount: 0,
    },
  ]);

  const [editingReturn, setEditingReturn] = useState<ReturnEntry | null>(null);

  // Print logic state
  const [currentReturnForPrint, setCurrentReturnForPrint] =
    useState<ReturnEntry | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product: "",
        quantity: 0,
        rate: 0,
        amount: 0,
        code: "",
        unit: "",
        discount: 0,
        netAmount: 0,
      },
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

      if (field === "product" && typeof value === "string")
        item.product = value;
      if (field === "quantity" && typeof value === "number")
        item.quantity = value;
      if (field === "rate" && typeof value === "number") item.rate = value;
      if (field === "code" && typeof value === "string") item.code = value;
      if (field === "unit" && typeof value === "string") item.unit = value;
      if (field === "discount" && typeof value === "number")
        item.discount = value;

      item.amount = item.quantity * item.rate;
      item.netAmount = item.amount - (item.amount * (item.discount ?? 0)) / 100;

      newItems[index] = item;
      return newItems;
    });
  };

  const handleSubmit = () => {
    const newReturn: ReturnEntry = {
      id: getNextReturnNumber(returns),
      invoice,
      date: returnDate,
      notes,
      items,
      amount: items.reduce((acc, i) => acc + i.amount, 0),
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
    const itemsWithAllFields = entry.items.map((item) => ({
      code: item.code || "",
      product: item.product || "",
      unit: item.unit || "",
      quantity: item.quantity || 0,
      rate: item.rate || 0,
      amount: item.amount || 0,
      discount: typeof item.discount === "number" ? item.discount : 0,
      netAmount: typeof item.netAmount === "number" ? item.netAmount : 0,
    }));
    setItems(itemsWithAllFields);
    setEditOpened(true);
  };

  const handleEditSubmit = () => {
    if (!editingReturn) return;
    const updated: ReturnEntry = {
      ...editingReturn,
      invoice,
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

    // Header
    doc.setFontSize(18);
    doc.text("CHEMTRONIX ENGINEERING SOLUTION", 14, 14);
    doc.setFontSize(12);
    doc.text(`Purchase Return - ${entry.id}`, 14, 24);

    // Details Table
    autoTable(doc, {
      startY: 32,
      head: [["Field", "Value"]],
      body: [
        ["Invoice", entry.invoice],
        ["Date", entry.date],
        ["Supplier Number", entry.supplierNumber],
        ["Supplier Title", entry.supplierTitle],
        ["Purchase Account", entry.purchaseAccount],
        ["Purchase Title", entry.purchaseTitle],
        ["Notes", entry.notes],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    // Items Table
    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY?: number } })
        .lastAutoTable?.finalY
        ? ((doc as jsPDF & { lastAutoTable?: { finalY?: number } })
            .lastAutoTable?.finalY ?? 60) + 8
        : 60,
      head: [["Code", "Product", "Unit", "Quantity", "Rate", "Amount"]],
      body: entry.items.map((item) => [
        item.code,
        item.product,
        item.unit,
        item.quantity,
        item.rate,
        item.amount,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const finalY = (data.cursor?.y ?? 68) + 8;
        doc.setFontSize(12);
        doc.text(`Total: ${entry.amount.toFixed(2)}`, 14, finalY);
      },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setFontSize(10);
    doc.text(
      "*Computer generated invoice. No need for signature",
      14,
      pageHeight - 20
    );
    doc.setFontSize(11);
    doc.text(
      "HEAD OFFICE: 552 Mujtaba Canal View, Main Qasimpur Canal Road, Multan",
      14,
      pageHeight - 14
    );
    doc.text(
      "PLANT SITE: 108-1 Tufailabad Industrial Estate Multan",
      14,
      pageHeight - 8
    );

    doc.save(`${entry.id}.pdf`);
  };

  const filteredReturns = returns.filter((entry) => {
    const matchesSearch =
      entry.invoice.toLowerCase().includes(search.toLowerCase()) ||
      entry.supplierNumber.toLowerCase().includes(search.toLowerCase());

    const entryDate = new Date(entry.date).getTime();
    const fromOk = fromDate ? entryDate >= new Date(fromDate).getTime() : true;
    const toOk = toDate ? entryDate <= new Date(toDate).getTime() : true;

    return matchesSearch && fromOk && toOk;
  });

  // Pagination logic
  const paginatedReturns = filteredReturns.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const exportFilteredPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("CHEMTRONIX ENGINEERING SOLUTION", 14, 14);
    doc.setFontSize(12);
    doc.text("Purchase Returns", 14, 24);

    // Table
    autoTable(doc, {
      startY: 32,
      head: [
        [
          "Invoice",
          "Date",
          "Supplier Number",
          "Supplier Title",
          "Purchase Account",
          "Purchase Title",
          "Amount",
          "Notes",
        ],
      ],
      body: filteredReturns.map((entry) => [
        entry.invoice,
        entry.date,
        entry.supplierNumber,
        entry.supplierTitle,
        entry.purchaseAccount,
        entry.purchaseTitle,
        entry.amount.toFixed(2),
        entry.notes,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const finalY = (data.cursor?.y ?? 68) + 8;
        doc.setFontSize(12);
        doc.text(`Total Returns: ${filteredReturns.length}`, 14, finalY);
        doc.text(
          `Total Amount: ${filteredReturns
            .reduce((sum, entry) => sum + entry.amount, 0)
            .toFixed(2)}`,
          80,
          finalY
        );
      },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setFontSize(10);
    doc.text(
      "*Computer generated invoice. No need for signature",
      14,
      pageHeight - 20
    );
    doc.setFontSize(11);
    doc.text(
      "HEAD OFFICE: 552 Mujtaba Canal View, Main Qasimpur Canal Road, Multan",
      14,
      pageHeight - 14
    );
    doc.text(
      "PLANT SITE: 108-1 Tufailabad Industrial Estate Multan",
      14,
      pageHeight - 8
    );

    doc.save("purchase_returns.pdf");
  };

  // When opening the modal, set invoice number and date automatically
  const handleOpen = () => {
    setInvoice(getNextReturnNumber(returns));
    setReturnDate(new Date().toISOString().slice(0, 10)); // set today's date
    setSupplierNumber("");
    setSupplierTitle("");
    setPurchaseAccount("");
    setPurchaseTitle("");
    setNotes("");
    setItems([
      {
        product: "",
        quantity: 0,
        rate: 0,
        amount: 0,
        code: "",
        unit: "",
        discount: 0,
        netAmount: 0,
      },
    ]);
    setOpened(true);
  };

  const productCodeOptions = products.map((p) => ({
    value: p.code,
    label: p.code,
  }));

  const productNameOptions = products.map((p) => ({
    value: p.name,
    label: p.name,
  }));

  // Print logic using hidden div and window.print()
  const handlePrintReturn = (entry: ReturnEntry) => {
    setCurrentReturnForPrint(entry);
    setTimeout(() => {
      const printContent = document.getElementById(
        "return-print-content"
      )?.innerHTML;
      if (printContent) {
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(`
            <html>
              <head>
                <title>Purchase Return</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 24px; }
                </style>
              </head>
              <body>
                ${printContent}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 300);
        }
      }
      setCurrentReturnForPrint(null);
    }, 100);
  };

  const netTotal = items.reduce((sum, item) => sum + (item.netAmount ?? 0), 0);

  return (
    <div>
      {/* Printable return content (always rendered, hidden off-screen) */}
      <div
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          zIndex: -1,
          width: "800px",
        }}
      >
        {currentReturnForPrint && (
          <PurchaseReturnPrintTemplate entry={currentReturnForPrint} />
        )}
      </div>
      <div id="return-print-content" style={{ display: "none" }}>
        {currentReturnForPrint && (
          <PurchaseReturnPrintTemplate entry={currentReturnForPrint} />
        )}
      </div>

      <Card shadow="sm" p="lg" radius="md" withBorder mt={20} bg={"#F1FCF0"}>
        <Group justify="space-between" mb="md">
          <div>
            <h2>Purchase Returns</h2>
            <p>Manage purchase returns and refunds</p>
          </div>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleOpen}
            color="#0A6802"
          >
            New Purchase Return
          </Button>
        </Group>

        <Group mb="md" grow>
          <TextInput
            label="Search"
            w={220}
            placeholder="Search by Invoice No ..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <TextInput
            label="From Date"
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <TextInput
            label="To Date"
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <Group>
            <Button
              mt={22}
              variant="outline"
              color="#0A6802"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </Button>
            <Button
              mt={22}
              variant="filled"
              color="#0A6802"
              leftSection={<IconDownload size={16} />}
              onClick={exportFilteredPDF}
            >
              Export
            </Button>
          </Group>

          <Group justify="flex-end">
            <Select
              label="Rows per page"
              data={["5", "10", "20", "50"]}
              value={pageSize.toString()}
              onChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
              style={{ width: 120 }}
              size="xs"
            />
          </Group>
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
            {paginatedReturns.map((r) => (
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
                    <ActionIcon
                      variant="light"
                      color="#819E00"
                      onClick={() => handlePrintReturn(r)}
                      title="Print"
                    >
                      <IconPrinter size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group mt="md" justify="center">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.max(1, Math.ceil(filteredReturns.length / pageSize))}
            color="#0A6802"
            radius="md"
            size="md"
            withControls
          />
        </Group>
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
            readOnly
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
          productCodeOptions={productCodeOptions}
          productNameOptions={productNameOptions}
          netTotal={netTotal} // <-- Add this line
        />
        <Group justify="flex-end" mt="lg">
          <Button
            color="#819E00"
            onClick={() =>
              handlePrintReturn({
                id: invoice,
                invoice,
                date: returnDate,
                notes,
                items,
                amount: items.reduce((acc, i) => acc + i.amount, 0),
                supplierNumber,
                supplierTitle,
                purchaseAccount,
                purchaseTitle,
              })
            }
            leftSection={<IconPrinter size={16} />}
          >
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
          productCodeOptions={productCodeOptions}
          productNameOptions={productNameOptions}
          netTotal={0}
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

function PurchaseReturnPrintTemplate({ entry }: { entry: ReturnEntry }) {
  if (!entry) return null;
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#fff",
        padding: 24,
        minWidth: 900,
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h2 style={{ color: "#819E00", margin: "8px 0", fontSize: 32 }}>
          Purchase Return
        </h2>
      </div>
      <table style={{ width: "100%", fontSize: 14, marginBottom: 16 }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold" }}>Invoice #</td>
            <td>{entry.invoice}</td>
            <td style={{ fontWeight: "bold" }}>Date</td>
            <td>{entry.date}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Supplier Number</td>
            <td>{entry.supplierNumber}</td>
            <td style={{ fontWeight: "bold" }}>Supplier Title</td>
            <td>{entry.supplierTitle}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold" }}>Purchase Account</td>
            <td>{entry.purchaseAccount}</td>
            <td style={{ fontWeight: "bold" }}>Purchase Title</td>
            <td>{entry.purchaseTitle}</td>
          </tr>
        </tbody>
      </table>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        <thead>
          <tr style={{ background: "#F8FFF6" }}>
            <th style={{ border: "1px solid #222", padding: 4 }}>Code</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Product</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Unit</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Quantity</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Rate</th>
            <th style={{ border: "1px solid #222", padding: 4 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {entry.items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.code}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.product}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.unit}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.quantity}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.rate}
              </td>
              <td style={{ border: "1px solid #222", padding: 4 }}>
                {item.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 24, fontWeight: "bold", fontSize: 16 }}>
        Total: {entry.amount?.toFixed(2)}
      </div>
      <div>
        <b>Notes:</b> {entry.notes}
      </div>
      {/* Add footer, notes, etc. */}
    </div>
  );
}

interface ReturnFormProps {
  notes: string;
  setNotes: (notes: string) => void;
  items: ReturnItem[];
  updateItem: (
    index: number,
    field: keyof ReturnItem,
    value: string | number
  ) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  productCodeOptions: { value: string; label: string }[];
  productNameOptions: { value: string; label: string }[];
  netTotal: number; // <-- Add this line
}

function ReturnForm({
  notes,
  setNotes,
  items,
  updateItem,
  addItem,
  removeItem,
  productCodeOptions,
  productNameOptions,
  netTotal, // <-- Add this line
}: ReturnFormProps) {
  return (
    <>
      <div>
        <p className="font-medium mb-2">Return Items</p>
        {items.map((item: ReturnItem, index: number) => (
          <Group key={index} grow mb="xs">
            <Select
              label="Code"
              placeholder="Select product code"
              data={productCodeOptions}
              value={item.code}
              onChange={(val) => updateItem(index, "code", val ?? "")}
            />
            <Select
              label="Product"
              placeholder="Select product"
              data={productNameOptions}
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
            <NumberInput
              label="Discount (%)"
              placeholder="Discount"
              value={item.discount}
              onChange={(val) => updateItem(index, "discount", val ?? 0)}
            />
            <NumberInput
              label="Net Amount"
              placeholder="Net Amount"
              value={item.netAmount}
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

      {/* Net Total above Notes */}
      <Group mb="md">
        <div style={{ fontWeight: "bold", fontSize: 16, color: "#0A6802" }}>
          Net Total: {netTotal.toFixed(2)}
        </div>
      </Group>

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
