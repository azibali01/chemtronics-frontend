import {
  Card,
  Group,
  Button,
  Table,
  ActionIcon,
  Title,
  Text,
  Modal,
  Select,
  NumberInput,
  TextInput,
  Textarea,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconDownload,
  IconSearch,
} from "@tabler/icons-react";
import { useMemo, useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useReactToPrint } from "react-to-print";
import {
  SaleReturnsProvider,
  useSaleReturns,
  type SaleReturn,
  type SaleReturnItem,
} from "../../Context/Invoicing/SaleReturnsContext";

// Fix: Add missing 'unit' property to SaleReturnItem type if not present in context
// If your context does not have 'unit', add it there as well.

function SaleReturnsInner() {
  const { returns, addReturn, updateReturn, deleteReturn } = useSaleReturns();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<SaleReturn | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [customerTitle, setCustomerTitle] = useState<string>("");
  const [saleAccount, setSaleAccount] = useState<string>("");
  const [saleTitle, setSaleTitle] = useState<string>("");
  const [salesman, setSalesman] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [items, setItems] = useState<SaleReturnItem[]>([]);
  const [notes, setNotes] = useState<string>("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return returns.filter((d) => {
      const matchesSearch = !q || d.id.toLowerCase().includes(q);
      const matchesFromDate =
        !fromDate || new Date(d.date) >= new Date(fromDate);
      const matchesToDate = !toDate || new Date(d.date) <= new Date(toDate);
      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [returns, search, fromDate, toDate]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // PDF Export
  const exportPDF = (row: SaleReturn) => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Chemtronix Engineering Solutions";
    const reportTitle = "Sale Return Invoice";
    const currentDate = new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text(companyName, 40, 30);
    doc.setFontSize(14);
    doc.text(reportTitle, 40, 55);

    doc.setFontSize(11);
    doc.text(`Date: ${currentDate}`, 480, 30);
    doc.text(`Invoice #: ${row.id}`, 40, 75);
    doc.text(`Return Date: ${row.date}`, 250, 75);
    doc.text(`Customer: ${row.customer || "-"}`, 40, 95);
    doc.text(`Customer Title: ${row.customerTitle || "-"}`, 250, 95);
    doc.text(`Sale Account: ${row.saleAccount || "-"}`, 40, 115);
    doc.text(`Sale Title: ${row.saleTitle || "-"}`, 250, 115);
    doc.text(`Salesman: ${row.salesman || "-"}`, 40, 135);
    doc.text(`Notes: ${row.notes || "-"}`, 40, 155);

    autoTable(doc, {
      startY: 175,
      head: [
        [
          "Code",
          "Product Name",
          "Description",
          "Unit",
          "Quantity",
          "Rate",
          "Amount",
          "Reason",
        ],
      ],
      body:
        row.items && row.items.length > 0
          ? row.items.map((item) => [
              item.code,
              item.productName,
              item.description,
              item.unit ?? "-", // Fix: handle missing unit
              item.quantity,
              item.rate,
              item.amount,
              item.reason,
            ])
          : [["-", "-", "-", "-", "-", "-", "-", "-"]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${currentDate}`, 40, doc.internal.pageSize.height - 30);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          480,
          doc.internal.pageSize.height - 30
        );
      },
    });

    // Totals
    let totalQty = 0;
    let totalAmount = 0;
    if (row.items && row.items.length > 0) {
      row.items.forEach((item) => {
        totalQty += Number(item.quantity) || 0;
        totalAmount += Number(item.amount) || 0;
      });
    }

    doc.setFontSize(12);
    doc.setTextColor("#0A6802");
    type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };
    const docWithAutoTable = doc as JsPDFWithAutoTable;
    const finalY =
      docWithAutoTable.lastAutoTable && docWithAutoTable.lastAutoTable.finalY
        ? docWithAutoTable.lastAutoTable.finalY + 20
        : doc.internal.pageSize.height - 60;
    doc.text(`Total Qty: ${totalQty}`, 40, finalY);
    doc.text(`Total Amount: ${totalAmount.toFixed(2)}`, 200, finalY);

    doc.save(`${row.id}.pdf`);
  };

  const exportFilteredPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Chemtronix Engineering Solutions";
    const reportTitle = "Sale Returns Report";
    const currentDate = new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text(companyName, 40, 30);
    doc.setFontSize(14);
    doc.text(reportTitle, 40, 55);

    doc.setFontSize(11);
    let dateText = "";
    if (fromDate && toDate) {
      dateText = `From: ${fromDate}   To: ${toDate}`;
    } else if (fromDate) {
      dateText = `From: ${fromDate}`;
    } else if (toDate) {
      dateText = `To: ${toDate}`;
    }
    if (dateText) {
      doc.text(dateText, 40, 75);
    }

    autoTable(doc, {
      startY: dateText ? 95 : 80,
      head: [
        [
          "Invoice #",
          "Date",
          "Customer",
          "Customer Title",
          "Sale Account",
          "Sale Title",
          "Salesman",
          "Notes",
          "Total Qty",
          "Total Amount",
        ],
      ],
      body: filteredData.map((row) => {
        let totalQty = 0;
        let totalAmount = 0;
        if (row.items && row.items.length > 0) {
          row.items.forEach((item) => {
            totalQty += Number(item.quantity) || 0;
            totalAmount += Number(item.amount) || 0;
          });
        }
        return [
          row.id,
          row.date,
          row.customer || "-",
          row.customerTitle || "-",
          row.saleAccount || "-",
          row.saleTitle || "-",
          row.salesman || "-",
          row.notes || "-",
          totalQty,
          totalAmount.toFixed(2),
        ];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${currentDate}`, 40, doc.internal.pageSize.height - 30);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          480,
          doc.internal.pageSize.height - 30
        );
      },
    });

    // Grand Totals
    let grandQty = 0;
    let grandAmount = 0;
    filteredData.forEach((row) => {
      if (row.items && row.items.length > 0) {
        row.items.forEach((item) => {
          grandQty += Number(item.quantity) || 0;
          grandAmount += Number(item.amount) || 0;
        });
      }
    });

    doc.setFontSize(12);
    doc.setTextColor("#0A6802");
    type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };
    const docWithAutoTable = doc as JsPDFWithAutoTable;
    const finalY =
      docWithAutoTable.lastAutoTable && docWithAutoTable.lastAutoTable.finalY
        ? docWithAutoTable.lastAutoTable.finalY + 20
        : doc.internal.pageSize.height - 60;
    doc.text(`Grand Total Qty: ${grandQty}`, 40, finalY);
    doc.text(`Grand Total Amount: ${grandAmount.toFixed(2)}`, 200, finalY);

    doc.save("sale_returns_report.pdf");
  };

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (row: SaleReturn) => {
    setEditData(row);
    setInvoiceNumber(row.id);
    setCustomer(row.customer);
    setCustomerTitle(row.customerTitle);
    setSaleAccount(row.saleAccount);
    setSaleTitle(row.saleTitle);
    setSalesman(row.salesman);
    setDate(row.date);
    setItems(row.items.map((i) => ({ ...i })));
    setNotes(row.notes || "");
    setOpened(true);
  };

  const handleSave = () => {
    if (!invoiceNumber || !date) return;

    const normalized = items.map((i) => {
      const qty = Number(i.quantity) || 0;
      const rate = Number(i.rate) || 0;
      return { ...i, quantity: qty, rate, amount: qty * rate };
    });

    if (editData) {
      updateReturn({
        ...editData,
        id: invoiceNumber,
        customer,
        customerTitle,
        saleAccount,
        saleTitle,
        salesman,
        date,
        items: normalized,
        notes,
      });
    } else {
      const newReturn: SaleReturn = {
        id: invoiceNumber,
        customer,
        customerTitle,
        saleAccount,
        saleTitle,
        salesman,
        date,
        items: normalized,
        notes,
      };
      addReturn(newReturn);
    }

    setOpened(false);
    resetForm();
  };

  const openDelete = (id: string) => setDeleteId(id);
  const confirmDelete = () => {
    if (deleteId) deleteReturn(deleteId);
    setDeleteId(null);
  };

  const resetForm = () => {
    setInvoiceNumber("");
    setCustomer("");
    setCustomerTitle("");
    setSaleAccount("");
    setSaleTitle("");
    setSalesman("");
    setDate("");
    setItems([]);
    setNotes("");
  };

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: invoiceNumber || "Sale Return Invoice",
  });

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Sale Returns</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          New Sale Return
        </Button>
      </Group>

      <Card withBorder shadow="sm" radius="md" p="md">
        <Text fw={600} mb="sm">
          Sale Returns List
        </Text>

        <Group mb="md" gap={"xs"} justify="space-between">
          <Group>
            <TextInput
              w={220}
              placeholder="Search by invoice number..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
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
          <Group>
            <Select
              w={120}
              data={["5", "10", "20", "50"]}
              value={String(pageSize)}
              onChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
              label="Rows per page"
            />
          </Group>
        </Group>
        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Invoice Date</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Customer Title</Table.Th>
              <Table.Th>Sale Account</Table.Th>
              <Table.Th>Sale Title</Table.Th>
              <Table.Th>Salesman</Table.Th>
              <Table.Th>Notes</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.date}</Table.Td>
                <Table.Td>{row.customer}</Table.Td>
                <Table.Td>{row.customerTitle}</Table.Td>
                <Table.Td>{row.saleAccount}</Table.Td>
                <Table.Td>{row.saleTitle}</Table.Td>
                <Table.Td>{row.salesman}</Table.Td>
                <Table.Td>{row.notes}</Table.Td>
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
            <strong>Edit Sale Return</strong>
          ) : (
            <strong>Create Sale Return</strong>
          )
        }
        size="70%"
        centered
      >
        <div ref={printRef}>
          <Group grow mb="md" w={"50%"}>
            <TextInput
              label="Invoice #"
              placeholder="Enter invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
            />
            <TextInput
              label="Invoice Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </Group>
          <Group grow mb="md">
            <TextInput
              label="Customer"
              placeholder="Enter customer"
              value={customer}
              onChange={(e) => setCustomer(e.currentTarget.value)}
            />
            <Select
              label="Customer Title"
              placeholder="Enter customer title"
              value={customerTitle}
              onChange={(value) => setCustomerTitle(value || "")}
            />
            <TextInput
              label="Sale Account"
              placeholder="Enter sale account"
              value={saleAccount}
              onChange={(e) => setSaleAccount(e.currentTarget.value)}
            />
            <Select
              label="Sale Title"
              placeholder="Enter sale title"
              value={saleTitle}
              onChange={(value) => setSaleTitle(value || "")}
            />
            <Select
              label="Salesman"
              placeholder="Enter salesman"
              value={salesman}
              onChange={(value) => setSalesman(value || "")}
            />
          </Group>
          <Card withBorder mb="md" p="md">
            <Text fw={600} mb="sm">
              Return Items
            </Text>

            {items.map((item, idx) => (
              <Group key={idx} grow mb="xs" align="end">
                <TextInput
                  label="Code"
                  placeholder="Code"
                  value={item.code}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].code = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <TextInput
                  label="Product Name"
                  placeholder="Product Name"
                  value={item.productName}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].productName = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <TextInput
                  label="Description"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].description = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <TextInput
                  label="Unit"
                  placeholder="Unit"
                  value={item.unit}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].unit = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <NumberInput
                  label="Quantity"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].quantity = Number(val) || 0;
                    next[idx].amount = next[idx].quantity * next[idx].rate;
                    setItems(next);
                  }}
                  min={0}
                />
                <NumberInput
                  label="Rate"
                  placeholder="Rate"
                  value={item.rate}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].rate = Number(val) || 0;
                    next[idx].amount = next[idx].quantity * next[idx].rate;
                    setItems(next);
                  }}
                  min={0}
                />
                <NumberInput
                  label="Amount"
                  placeholder="Amount"
                  value={item.amount}
                  readOnly
                />
                <TextInput
                  label="Reason"
                  placeholder="Reason"
                  value={item.reason || ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].reason = e.currentTarget.value;
                    setItems(next);
                  }}
                />
                <Button
                  variant="light"
                  color="red"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                >
                  Remove
                </Button>
              </Group>
            ))}

            <Button
              w={"5%"}
              mt="xs"
              color="#0A6802"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    code: "",
                    productName: "",
                    description: "",
                    unit: "",
                    quantity: 0,
                    rate: 0,
                    amount: 0,
                    reason: "",
                  },
                ])
              }
            >
              + Add Item
            </Button>
          </Card>

          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />
        </div>
        <Group justify="flex-end" mt="md">
          <Button color="#0A6802" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSave}>
            {editData ? "Update Return" : "Create Return"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={<strong>Delete Sale Return</strong>}
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

export default function SaleReturns() {
  return (
    <SaleReturnsProvider>
      <SaleReturnsInner />
    </SaleReturnsProvider>
  );
}
