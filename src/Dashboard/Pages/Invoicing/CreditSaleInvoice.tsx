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
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

type Item = {
  code: string;
  productName: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  netAmount: number;
};

type CreditSale = {
  id: string;
  date: string;
  customer?: string;
  customerTitle?: string;
  saleAccount?: string;
  saleTitle?: string;
  salesman?: string;
  items?: Item[];
};

const dataInit: CreditSale[] = [
  {
    id: "CS-012",
    date: "2024-01-15",
  },
  {
    id: "CS-013",
    date: "2024-01-10",
  },
  {
    id: "CS-014",
    date: "2024-01-05",
  },
];

export default function CreditSaleInvoice() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<CreditSale[]>(dataInit);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [search, setSearch] = useState("");

  const filteredData = data.filter(
    (d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) &&
      (!fromDate || new Date(d.date) >= new Date(fromDate)) &&
      (!toDate || new Date(d.date) <= new Date(toDate))
  );

  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);

  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<CreditSale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [saleDate, setSaleDate] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [customerTitle, setCustomerTitle] = useState<string>("");
  const [saleAccount, setSaleAccount] = useState<string>("");
  const [saleTitle, setSaleTitle] = useState<string>("");
  const [salesman, setSalesman] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  const [items, setItems] = useState<
    Array<{
      code: string;
      productName: string;
      description: string;
      quantity: number;
      rate: number;
      amount: number;
      discount: number;
      netAmount: number;
    }>
  >([]);

  const activeSales = data.length;

  const exportPDF = (row: CreditSale) => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Credit Sale Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Field", "Value"]],
      body: [
        ["Invoice #", row.id],
        ["Sale Date", row.date],
      ],
    });

    doc.save(`${row.id}.pdf`);
  };

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setOpened(true);
  };

  const openEdit = (row: CreditSale) => {
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
    if (editData) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editData.id
            ? {
                ...d,
                id: invoiceNumber,
                date: saleDate,
                customer,
                customerTitle,
                saleAccount,
                saleTitle,
                salesman,
                items: [...items],
              }
            : d
        )
      );
    } else {
      const newSale: CreditSale = {
        id: invoiceNumber || `CS-${Math.floor(Math.random() * 1000)}`,
        date: saleDate,
        customer,
        customerTitle,
        saleAccount,
        saleTitle,
        salesman,
        items: [...items],
      };
      setData((prev) => [...prev, newSale]);
      setItems([]); // Reset items after adding
    }
    setOpened(false);
    resetForm();
  };

  const openDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (deleteId) setData((prev) => prev.filter((d) => d.id !== deleteId));
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

  const updateItem = (index: number, field: string, value: any) => {
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

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: invoiceNumber || "Credit Sale Invoice",
  } as any);

  return (
    <div>
      <Group justify="space-between" mb="md">
        <h2>Credit Sales</h2>
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
            onClick={() => {
              // Export filtered data to PDF
              const doc = new jsPDF();
              doc.text("Credit Sales", 14, 20);
              const filtered = data.filter(
                (sale: any) =>
                  (!search ||
                    sale.invoice
                      .toLowerCase()
                      .includes(search.toLowerCase())) &&
                  (!fromDate || new Date(sale.date) >= new Date(fromDate)) &&
                  (!toDate || new Date(sale.date) <= new Date(toDate))
              );
              if (filtered.length > 0) {
                const tableData = filtered.map((sale: any) => [
                  sale.invoice,
                  sale.date,
                  sale.customer,
                  sale.amount?.toFixed(2) || "0.00",
                  sale.status || "",
                ]);

                autoTable(doc, {
                  head: [["Invoice#", "Date", "Customer", "Amount", "Status"]],
                  body: tableData,
                  startY: 30,
                });
              } else {
                doc.text("No sales found for selected filters.", 14, 30);
              }
              doc.save("credit_sales.pdf");
            }}
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
        <div ref={printRef}>
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
          <Button color="#0A6802" onClick={handlePrint}>
            Print
          </Button>
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
