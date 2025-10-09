/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useMemo, useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  SaleReturnsProvider,
  useSaleReturns,
} from "../../Context/Invoicing/SaleReturnsContext";
import {
  type SaleReturn,
  type SaleReturnItem,
} from "../../Context/Invoicing/SaleReturnsContext";
import { useProducts } from "../../Context/Inventory/ProductsContext";
import axios from "axios";
import { notifications } from "@mantine/notifications";

function SaleReturnsInner() {
  const { returns, setReturns } = useSaleReturns(); // Updated to use setReturns instead of addReturn, updateReturn, deleteReturn

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

  // Get products from inventory context
  const { products = [] } = useProducts();

  // Prepare dropdown options for code and product name
  const productCodeOptions = products.map((p) => ({
    value: p.code,
    label: p.code,
  }));

  const productNameOptions = products.map((p) => ({
    value: p.productName,
    label: p.productName,
  }));

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

  // PDF Export: remove reason, add Discount and Net Amount columns
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
          "Discount (%)",
          "Net Amount",
        ],
      ],
      body:
        row.items && row.items.length > 0
          ? row.items.map((item) => [
              item.code,
              item.productName,
              item.description,
              item.unit ?? "-",
              item.quantity,
              item.rate,
              item.amount,
              item.discount ?? 0,
              (item.amount ?? 0) -
                ((item.amount ?? 0) * (item.discount ?? 0)) / 100,
            ])
          : [["-", "-", "-", "-", "-", "-", "-", "-", "-"]],
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
    setInvoiceNumber(getNextInvoiceNumber(returns)); // auto-generate invoice #
    setDate(new Date().toISOString().slice(0, 10)); // auto-set today's date
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

  const openDelete = (id: string) => {
    setDeleteId(id);
  };

  // Add useEffect to fetch sale returns from backend on component mount
  useEffect(() => {
    fetchSaleReturns();
  }, []);

  // Function to fetch all sale returns from backend
  const fetchSaleReturns = async () => {
    try {
      const response = await axios.get(
        "https://chemtronics-backend.onrender.com/sale-return"
      ); // Changed path
      setReturns(response.data);
    } catch (error) {
      console.error("Error fetching sale returns:", error);
      notifications.show({
        title: "Error",
        message: "Failed to fetch sale returns",
        color: "red",
      });
    }
  };

  // Function to create sale return in backend
  const createSaleReturn = async (returnData: SaleReturn) => {
    try {
      const payload = {
        id: returnData.id,
        customer: returnData.customer,
        customerTitle: returnData.customerTitle,
        saleAccount: returnData.saleAccount,
        saleTitle: returnData.saleTitle,
        salesman: returnData.salesman,
        date: returnData.date,
        items: returnData.items,
        notes: returnData.notes,
        amount: returnData.amount,
      };

      const response = await axios.post(
        "https://chemtronics-backend.onrender.com/sale-return", // Changed path
        payload
      );

      if (response.data) {
        // Add to local state after successful backend save
        setReturns((prev) => [response.data, ...prev]);

        notifications.show({
          title: "Success",
          message: "Sale return created successfully",
          color: "green",
        });

        setOpened(false);
        resetForm();
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message || "Failed to create sale return",
        color: "red",
      });
      console.error("Error creating sale return:", error);
    }
  };

  // Function to update sale return
  const updateSaleReturn = async (returnData: SaleReturn) => {
    try {
      const payload = {
        id: returnData.id,
        customer: returnData.customer,
        customerTitle: returnData.customerTitle,
        saleAccount: returnData.saleAccount,
        saleTitle: returnData.saleTitle,
        salesman: returnData.salesman,
        date: returnData.date,
        items: returnData.items,
        notes: returnData.notes,
        amount: returnData.amount,
      };

      const response = await axios.put(
        `https://chemtronics-backend.onrender.com/sale-return/${returnData.id}`, // Changed path
        payload
      );

      if (response.data) {
        // Update local state after successful backend update
        setReturns((prev) =>
          prev.map((r) => (r.id === returnData.id ? response.data : r))
        );

        notifications.show({
          title: "Success",
          message: "Sale return updated successfully",
          color: "green",
        });

        setOpened(false);
        setEditData(null);
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message || "Failed to update sale return",
        color: "red",
      });
      console.error("Error updating sale return:", error);
    }
  };

  // Function to delete sale return
  const deleteSaleReturn = async (returnId: string) => {
    try {
      await axios.delete(
        `https://chemtronics-backend.onrender.com/sale-return/${returnId}`
      ); // Changed path

      // Remove from local state after successful backend deletion
      setReturns((prev) => prev.filter((r) => r.id !== returnId));

      notifications.show({
        title: "Success",
        message: "Sale return deleted successfully",
        color: "green",
      });

      setDeleteId(null);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message || "Failed to delete sale return",
        color: "red",
      });
      console.error("Error deleting sale return:", error);
    }
  };

  // Updated handleSave function to use backend
  const handleSave = async () => {
    try {
      if (!invoiceNumber || !date) {
        notifications.show({
          title: "Validation Error",
          message: "Please fill in required fields",
          color: "red",
        });
        return;
      }

      const normalized = items.map((i) => {
        const qty = Number(i.quantity) || 0;
        const rate = Number(i.rate) || 0;
        const amount = qty * rate;
        const discount = Number(i.discount) || 0;
        const netAmount = amount - (amount * discount) / 100;
        return { ...i, quantity: qty, rate, amount, discount, netAmount };
      });

      const returnData: SaleReturn = {
        id: invoiceNumber,
        customer,
        customerTitle,
        saleAccount,
        saleTitle,
        salesman,
        date,
        items: normalized,
        notes,
        number: invoiceNumber,
        accountTitle: customerTitle,
        amount: netTotal,
      };

      if (editData) {
        await updateSaleReturn(returnData);
      } else {
        await createSaleReturn(returnData);
      }
    } catch (error) {
      console.error("Error in handleSave:", error);
    }
  };

  // Updated confirmDelete function to use backend
  const confirmDelete = async () => {
    if (deleteId) {
      await deleteSaleReturn(deleteId);
    }
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

  function PrintableInvoiceContent(invoice: SaleReturn) {
    return `
    <html>
      <head>
        <title>Sale Return ${invoice.number}</title>
        <style>
          body { font-family: Arial; color: #222; padding: 24px; }
          h2 { margin-bottom: 8px; }
          p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <h2>Sale Return #${invoice.number}</h2>
        <p>Date: ${invoice.date}</p>
        <p>Account: ${invoice.accountTitle}</p>
        <p>Amount: $${invoice.amount?.toFixed(2)}</p>
        <!-- Add more details as needed -->
      </body>
    </html>
  `;
  }

  const printInvoiceWindow = (invoice: SaleReturn) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(PrintableInvoiceContent(invoice));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  // Calculate net total for all items (sum of net amounts after discount)
  const netTotal = items.reduce(
    (sum, item) =>
      sum +
      ((item.amount ?? 0) - ((item.amount ?? 0) * (item.discount ?? 0)) / 100),
    0
  );

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
                    <ActionIcon
                      variant="light"
                      color="#819E00"
                      onClick={() => printInvoiceWindow(row)}
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
        <div ref={useRef(null)}>
          <Group grow mb="md" w={"50%"}>
            <TextInput
              label="Invoice #"
              placeholder="Enter invoice number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
              readOnly
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
            <Select
              label="Sale Account"
              placeholder="Select sale account"
              data={saleAccountOptions}
              value={saleAccount}
              onChange={(value) => {
                setSaleAccount(value || "");
                setSaleTitle(saleAccountTitleMap[value || ""] || "");
              }}
            />
            <TextInput
              label="Sale Title"
              placeholder="Sale title"
              value={saleTitle}
              readOnly
            />
            <Select
              label="Salesman"
              placeholder="Enter salesman"
              value={salesman}
              onChange={(value) => setSalesman(value || "")}
            />
          </Group>
          <Card withBorder mb="md" p="md">
            <Group justify="space-between" align="center" mb="sm">
              <Text fw={600}>Return Items</Text>
              <Button
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
                      discount: 0,
                      netAmount: 0,
                    },
                  ])
                }
                style={{ minWidth: 20, padding: "0 10px" }}
              >
                + Add Item
              </Button>
            </Group>
            {items.map((item, idx) => (
              <Group key={idx} grow mb="xs" align="end">
                <Select
                  label="Code"
                  placeholder="Select product code"
                  data={productCodeOptions}
                  value={item.code}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].code = val ?? "";
                    setItems(next);
                  }}
                />
                <Select
                  label="Product Name"
                  placeholder="Select product name"
                  data={productNameOptions}
                  value={item.productName}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].productName = val ?? "";
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
                    next[idx].netAmount =
                      (next[idx].amount ?? 0) -
                      ((next[idx].amount ?? 0) * (next[idx].discount ?? 0)) /
                        100;
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
                    next[idx].netAmount =
                      (next[idx].amount ?? 0) -
                      ((next[idx].amount ?? 0) * (next[idx].discount ?? 0)) /
                        100;
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
                <NumberInput
                  label="Discount (%)"
                  placeholder="Discount %"
                  value={item.discount ?? 0}
                  onChange={(val) => {
                    const next = [...items];
                    next[idx].discount = Number(val) || 0;
                    next[idx].netAmount =
                      (next[idx].amount ?? 0) -
                      ((next[idx].amount ?? 0) * (next[idx].discount ?? 0)) /
                        100;
                    setItems(next);
                  }}
                  min={0}
                  max={100}
                />
                <NumberInput
                  label="Net Amount"
                  placeholder="Net Amount"
                  value={
                    (item.amount ?? 0) -
                    ((item.amount ?? 0) * (item.discount ?? 0)) / 100
                  }
                  readOnly
                />
                <Button
                  variant="light"
                  color="red"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                >
                  <IconTrash size={16} />
                </Button>
              </Group>
            ))}
            <Group mt="md" justify="flex-start">
              <Text fw={600} size="md" c="#000000ff">
                Net Total: {netTotal.toFixed(2)}
              </Text>
            </Group>
          </Card>
          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            mt="md"
          />
          <Group justify="flex-end" mt="md">
            <Button color="#819E00" onClick={handleSave}>
              {editData ? "Save Changes" : "Create"}
            </Button>
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button
              color="#0A6802"
              onClick={() =>
                printInvoiceWindow({
                  id: invoiceNumber,
                  customer,
                  customerTitle,
                  saleAccount,
                  saleTitle,
                  salesman,
                  date,
                  items,
                  notes,
                  number: invoiceNumber,
                  accountTitle: customerTitle,
                  amount: netTotal,
                })
              }
            >
              Print
            </Button>
          </Group>
        </div>
      </Modal>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Delete"
        centered
      >
        <Text>
          Are you sure you want to delete sale return <b>{deleteId}</b>?
        </Text>
        <Group mt="md" justify="flex-end">
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

export default function SaleReturnsPage() {
  return (
    <SaleReturnsProvider>
      <SaleReturnsInner />
    </SaleReturnsProvider>
  );
}

function getNextInvoiceNumber(returns: SaleReturn[]) {
  const numbers = returns
    .map((r) => {
      const match = r.id.match(/^SR-(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter((n) => n !== null) as number[];
  const max = numbers.length ? Math.max(...numbers) : 0;
  const next = max + 1;
  return `SR-${next.toString().padStart(3, "0")}`;
}

// Sale Account mapping
const saleAccountTitleMap: Record<string, string> = {
  "4111": "Sales Of Chemicals",
  "4112": "Sale Of Equipments",
  "4113": "Services",
  "4114": "Sale Of Chemicals and Equipments",
};

const saleAccountOptions = Object.entries(saleAccountTitleMap).map(
  ([code, title]) => ({
    value: code,
    label: `${code} - ${title}`,
  })
);
