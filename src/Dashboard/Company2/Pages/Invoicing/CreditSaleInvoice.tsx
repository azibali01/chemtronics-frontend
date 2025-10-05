import {
  Card,
  Group,
  Button,
  Table,
  ActionIcon,
  Modal,
  TextInput,
  Pagination,
  Select,
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconCreditCard,
  IconDownload,
  IconSearch,
} from "@tabler/icons-react";
import { useState, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CreditSalesProviderCompany2,
  useCreditSalesCompany2,
  type CreditSaleCompany2,
  type CreditSaleItemCompany2,
} from "../../../Context/Invoicing/CreditSalesContextCompany2";

function CreditSaleInvoiceInnerCompany2() {
  const { sales, addSale, updateSale, deleteSale } = useCreditSalesCompany2();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");

  const filteredData = sales.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) &&
      (!fromDate || new Date(d.date) >= new Date(fromDate)) &&
      (!toDate || new Date(d.date) <= new Date(toDate))
  );

  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);

  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<CreditSaleCompany2 | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [saleDate, setSaleDate] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [customerTitle, setCustomerTitle] = useState<string>("");
  const [saleAccount, setSaleAccount] = useState<string>("");
  const [saleTitle, setSaleTitle] = useState<string>("");
  const [salesman, setSalesman] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  const [items, setItems] = useState<CreditSaleItemCompany2[]>([]);

  const activeSales = sales.length;

  const exportPDF = (row: CreditSaleCompany2) => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Hydroworx Solutions";
    const reportTitle = "Credit Sale Invoice";
    const currentDate = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(16);
    doc.text(companyName, 40, 30);
    doc.setFontSize(14);
    doc.text(reportTitle, 40, 55);

    // Invoice Info
    doc.setFontSize(11);
    doc.text(`Date: ${currentDate}`, 480, 30);
    doc.text(`Invoice #: ${row.id}`, 40, 75);
    doc.text(`Sale Date: ${row.date}`, 250, 75);
    doc.text(`Customer: ${row.customer || "-"}`, 40, 95);
    doc.text(`Customer Title: ${row.customerTitle || "-"}`, 250, 95);
    doc.text(`Sale Account: ${row.saleAccount || "-"}`, 40, 115);
    doc.text(`Sale Title: ${row.saleTitle || "-"}`, 250, 115);
    doc.text(`Salesman: ${row.salesman || "-"}`, 40, 135);

    // Items Table
    autoTable(doc, {
      startY: 155,
      head: [
        [
          "Code",
          "Product Name",
          "Description",
          "Quantity",
          "Rate",
          "Amount",
          "Discount",
          "Net Amount",
        ],
      ],
      body:
        row.items && row.items.length > 0
          ? row.items.map((item) => [
              item.code,
              item.productName,
              item.description,
              item.quantity,
              item.rate,
              item.amount,
              item.discount,
              item.netAmount,
            ])
          : [["-", "-", "-", "-", "-", "-", "-", "-"]],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        // Footer: current date and total pages
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
    let totalDiscount = 0;
    let totalNetAmount = 0;
    if (row.items && row.items.length > 0) {
      row.items.forEach((item) => {
        totalQty += Number(item.quantity) || 0;
        totalAmount += Number(item.amount) || 0;
        totalDiscount += Number(item.discount) || 0;
        totalNetAmount += Number(item.netAmount) || 0;
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
    doc.text(`Total Amount: ${totalAmount.toFixed(2)}`, 150, finalY);
    doc.text(`Total Discount: ${totalDiscount.toFixed(2)}`, 300, finalY);
    doc.text(`Total Net Amount: ${totalNetAmount.toFixed(2)}`, 450, finalY);

    doc.save(`${row.id}-company2.pdf`);
  };

  const exportFilteredPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Hydroworx Solutions";
    const reportTitle = "Credit Sales Report";
    const currentDate = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(16);
    doc.text(companyName, 40, 30);
    doc.setFontSize(14);
    doc.text(reportTitle, 40, 55);

    // From/To Date
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

    // Table
    autoTable(doc, {
      startY: dateText ? 95 : 80,
      head: [
        [
          "Invoice#",
          "Date",
          "Customer",
          "Customer Title",
          "Sale Account",
          "Sale Title",
          "Salesman",
          "Total Qty",
          "Total Amount",
          "Total Discount",
          "Total Net Amount",
        ],
      ],
      body: filteredData.map((row) => {
        let totalQty = 0;
        let totalAmount = 0;
        let totalDiscount = 0;
        let totalNetAmount = 0;
        if (row.items && row.items.length > 0) {
          row.items.forEach((item) => {
            totalQty += Number(item.quantity) || 0;
            totalAmount += Number(item.amount) || 0;
            totalDiscount += Number(item.discount) || 0;
            totalNetAmount += Number(item.netAmount) || 0;
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
          totalQty,
          totalAmount.toFixed(2),
          totalDiscount.toFixed(2),
          totalNetAmount.toFixed(2),
        ];
      }),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        // Footer: current date and total pages
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
    let grandDiscount = 0;
    let grandNetAmount = 0;
    filteredData.forEach((row) => {
      if (row.items && row.items.length > 0) {
        row.items.forEach((item) => {
          grandQty += Number(item.quantity) || 0;
          grandAmount += Number(item.amount) || 0;
          grandDiscount += Number(item.discount) || 0;
          grandNetAmount += Number(item.netAmount) || 0;
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
    doc.text(`Grand Total Amount: ${grandAmount.toFixed(2)}`, 180, finalY);
    doc.text(`Grand Total Discount: ${grandDiscount.toFixed(2)}`, 340, finalY);
    doc.text(
      `Grand Total Net Amount: ${grandNetAmount.toFixed(2)}`,
      500,
      finalY
    );

    doc.save("credit_sales_report_company2.pdf");
  };

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (row: CreditSaleCompany2) => {
    setEditData(row);
    setSaleDate(row.date);
    setCustomer(row.customer || "");
    setCustomerTitle(row.customerTitle || "");
    setSaleAccount(row.saleAccount || "");
    setSaleTitle(row.saleTitle || "");
    setSalesman(row.salesman || "");
    setInvoiceNumber(row.id || "");
    setItems(row.items ? [...row.items] : []);
    setOpened(true);
  };

  const handleSave = () => {
    if (!saleDate) return;
    const newSale: CreditSaleCompany2 = {
      id: invoiceNumber || `CS-${Math.floor(Math.random() * 1000)}`,
      date: saleDate,
      customer,
      customerTitle,
      saleAccount,
      saleTitle,
      salesman,
      items: [...items],
    };
    if (editData) {
      updateSale(newSale);
    } else {
      addSale(newSale);
      setItems([]);
    }
    setOpened(false);
    resetForm();
  };

  const openDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (deleteId) deleteSale(deleteId);
    setDeleteId(null);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        code: "",
        productName: "",
        description: "",
        quantity: 0,
        rate: 0,
        amount: 0,
        discount: 0,
        netAmount: 0,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof CreditSaleItemCompany2,
    value: string | number
  ) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSaleDate("");
    setCustomer("");
    setCustomerTitle("");
    setSaleAccount("");
    setSaleTitle("");
    setSalesman("");
    setInvoiceNumber("");
    setItems([]);
  };

  // Sale Account mapping logic (same as SaleReturns)
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

  function handleSaleAccountSelect(selectedValue: string | null) {
    setSaleAccount(selectedValue || "");
    setSaleTitle(selectedValue ? saleAccountTitleMap[selectedValue] : "");
  }

  return (
    <div>
      <Group justify="space-between" mb="md">
        <h2>Credit Sales (Hydroworx)</h2>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          Create Credit Sale
        </Button>
      </Group>

      <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
        <Group justify="space-between">
          <span>Active Credit Sales</span>
          <span style={{ color: "#819E00" }}>
            <IconCreditCard size={20} />
          </span>
        </Group>
        <h3 style={{ marginTop: 15 }}>{activeSales}</h3>
      </Card>

      <div
        style={{
          marginBottom: "1rem",
          border: "1px solid #e0e0e0",
          paddingTop: "1rem",
          marginTop: "1rem",
          borderRadius: "10px",
          backgroundColor: "#F1FCF0",
        }}
      >
        <div style={{ padding: "0.5rem" }}>
          <strong>Credit Sales Overview</strong>
          <p style={{ color: "gray", fontSize: "0.9em" }}>
            Manage credit sales and payment terms
          </p>
        </div>
        <Group gap="xs" style={{ padding: "0.5rem" }}>
          <TextInput
            style={{ padding: "0.5rem" }}
            placeholder="Search by ID"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            w={220}
          />
          <TextInput
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
            style={{ minWidth: 140, marginLeft: 8 }}
          />
          <TextInput
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
            style={{ minWidth: 140, marginLeft: 8 }}
          />
          <Button
            variant="outline"
            color="gray"
            style={{ marginLeft: 8 }}
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
            style={{ marginLeft: 8 }}
            leftSection={<IconDownload size={16} />}
            onClick={exportFilteredPDF}
          >
            Export
          </Button>
        </Group>
        <Card withBorder radius="md" shadow="sm" p="md" bg={"#F1FCF0"}>
          <Group mb="sm" gap={"xs"} justify="flex-end">
            <span>Rows per page:</span>
            <Select
              data={["5", "10", "20", "50"]}
              value={pageSize.toString()}
              onChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
              w={100}
            />
          </Group>
          <Group mb="sm">
            <IconCreditCard size={20} />
            <strong>Credit Sales List</strong>
          </Group>
          <Table highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Invoice#</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Customer</Table.Th>
                <Table.Th>Customer Title</Table.Th>
                <Table.Th>Sale Account</Table.Th>
                <Table.Th>Sale Title</Table.Th>
                <Table.Th>Salesman</Table.Th>
                <Table.Th>Items</Table.Th>
                <Table.Td>Actions</Table.Td>
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
                  <Table.Td>
                    {Array.isArray(row.items) ? (
                      <Table withTableBorder>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Code</Table.Th>
                            <Table.Th>Product Name</Table.Th>
                            <Table.Th>Description</Table.Th>
                            <Table.Th>Quantity</Table.Th>
                            <Table.Th>Rate</Table.Th>
                            <Table.Th>Amount</Table.Th>
                            <Table.Th>Discount</Table.Th>
                            <Table.Th>Net Amount</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {row.items.map((item, idx) => (
                            <Table.Tr key={idx}>
                              <Table.Td>{item.code}</Table.Td>
                              <Table.Td>{item.productName}</Table.Td>
                              <Table.Td>{item.description}</Table.Td>
                              <Table.Td>{item.quantity}</Table.Td>
                              <Table.Td>{item.rate}</Table.Td>
                              <Table.Td>{item.amount}</Table.Td>
                              <Table.Td>{item.discount}</Table.Td>
                              <Table.Td>{item.netAmount}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    ) : null}
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
      </div>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          editData ? (
            <strong>Edit Credit Sale</strong>
          ) : (
            <strong>Create New Credit Sale</strong>
          )
        }
        centered
        size="70%"
      >
        <div ref={useRef(null)}>
          <form>
            <Group grow mb="md" w={"50%"}>
              <TextInput
                label="Invoice #"
                placeholder="Enter invoice number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
              />
              <TextInput
                label="Invoice Date"
                placeholder="mm/dd/yyyy"
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.currentTarget.value)}
              />
            </Group>
            <Group mb="md" grow>
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
              {/* Sale Account Select Dropdown */}
              <Select
                label="Sale Account"
                placeholder="Select sale account"
                data={saleAccountOptions}
                value={saleAccount}
                onChange={handleSaleAccountSelect}
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
            <Table withTableBorder highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Product Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Quantity</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Discount</Table.Th>
                  <Table.Th>Net Amount</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>
                      <TextInput
                        value={item.code}
                        onChange={(e) =>
                          updateItem(idx, "code", e.currentTarget.value)
                        }
                        placeholder="Code"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.productName}
                        onChange={(e) =>
                          updateItem(idx, "productName", e.currentTarget.value)
                        }
                        placeholder="Product Name"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.currentTarget.value)
                        }
                        placeholder="Description"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "quantity",
                            Number(e.currentTarget.value)
                          )
                        }
                        placeholder="Quantity"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(idx, "rate", Number(e.currentTarget.value))
                        }
                        placeholder="Rate"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "amount",
                            Number(e.currentTarget.value)
                          )
                        }
                        placeholder="Amount"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="number"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "discount",
                            Number(e.currentTarget.value)
                          )
                        }
                        placeholder="Discount"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        type="number"
                        value={item.netAmount}
                        onChange={(e) =>
                          updateItem(
                            idx,
                            "netAmount",
                            Number(e.currentTarget.value)
                          )
                        }
                        placeholder="Net Amount"
                      />
                    </Table.Td>
                    <Table.Td>
                      <Button
                        color="red"
                        size="xs"
                        onClick={() => removeItem(idx)}
                      >
                        Remove
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </form>
        </div>

        <Button color="#0A6802" mb="md" onClick={addItem}>
          Add Item
        </Button>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSave}>
            {editData ? "Update Credit Sale" : "Create Credit Sale"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Credit Sale"
        centered
      >
        <p style={{ marginBottom: "1rem" }}>
          Are you sure you want to delete this record?
        </p>
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

export default function CreditSaleInvoiceCompany2() {
  return (
    <CreditSalesProviderCompany2>
      <CreditSaleInvoiceInnerCompany2 />
    </CreditSalesProviderCompany2>
  );
}
