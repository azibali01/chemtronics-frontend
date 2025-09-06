import { useState } from "react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Card,
  Text,
  Group,
  Button,
  Table,
  Modal,
  TextInput,
  ActionIcon,
  NumberInput,
  Textarea,
  Select,
  Switch,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconSearch,
} from "@tabler/icons-react";

type Invoice = {
  id: number;
  number: string;
  date: string;
  deliveryNo?: string;
  deliveryDate?: string;
  poNo?: string;
  poDate?: string;
  accountNo?: string;
  accountTitle?: string;
  saleAccount?: string;
  saleAccountTitle?: string;
  ntnNo?: string;
  amount: number;
  items?: InvoiceItem[];
};

type InvoiceItem = {
  id: number;
  code: number;
  product: string;
  hsCode: string;
  description: string;
  qty: number;
  rate: number;
  exGSTRate: string;
  exGSTAmount: string;
};

export default function SalesInvoicePage() {
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Invoice",
  });
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      number: "INV-001",
      date: "3/15/2024",
      deliveryNo: "1001",
      deliveryDate: "3/16/2024",
      poNo: "PO-001",
      poDate: "3/10/2024",
      accountNo: "A-001",
      accountTitle: "Ahmad Fine Weaing Limited (Unit-I)",
      saleAccount: "Sale Account 1",
      saleAccountTitle: "Sale of Chemicals and Equipments",
      ntnNo: "1234567",
      amount: 1180,
      items: [
        {
          id: 1,
          code: 1,
          product: "Product A",
          hsCode: "HS001",
          description: "Desc A",
          qty: 10,
          rate: 100,
          exGSTRate: "90",
          exGSTAmount: "900",
        },
      ],
    },
    {
      id: 2,
      number: "INV-002",
      date: "3/14/2024",
      deliveryNo: "1002",
      deliveryDate: "3/15/2024",
      poNo: "PO-002",
      poDate: "3/11/2024",
      accountNo: "A-002",
      accountTitle: "Ahmad Fine Weaing Limited (Unit-II)",
      saleAccount: "Sale Account 2",
      saleAccountTitle: "Sale of Equipments",
      ntnNo: "7654321",
      amount: 1770,
      items: [
        {
          id: 2,
          code: 2,
          product: "Product B",
          hsCode: "HS002",
          description: "Desc B",
          qty: 5,
          rate: 200,
          exGSTRate: "180",
          exGSTAmount: "900",
        },
      ],
    },
  ]);

  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("INV-003");
  const [newDate, setNewDate] = useState("");
  const [newDeliveryNo, setNewDeliveryNo] = useState("");
  const [newDeliveryDate, setNewDeliveryDate] = useState("");
  const [newPoNo, setNewPoNo] = useState("");
  const [newPoDate, setNewPoDate] = useState("");
  const [newAccountNo, setNewAccountNo] = useState("");
  const [newAccountTitle, setNewAccountTitle] = useState("");
  const [newSaleAccount, setNewSaleAccount] = useState("");
  const [newSaleAccountTitle, setNewSaleAccountTitle] = useState("");
  const [newNtnNo, setNewNtnNo] = useState("");
  const [includeGST, setIncludeGST] = useState(true);
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      code: 1,
      product: "",
      hsCode: "",
      description: "",
      qty: 0,
      rate: 0,
      exGSTRate: "",
      exGSTAmount: "",
    },
  ]);
  const [notes, setNotes] = useState("");

  const [pageSize, setPageSize] = useState(8);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch = i.number.toLowerCase().includes(search.toLowerCase());
    const invoiceDate = new Date(i.date + "T00:00:00").getTime();
    const fromOk = fromDate
      ? invoiceDate >= new Date(fromDate + "T00:00:00").getTime()
      : true;
    const toOk = toDate
      ? invoiceDate <= new Date(toDate + "T00:00:00").getTime()
      : true;
    return matchesSearch && fromOk && toOk;
  });

  // Update filteredInvoices pagination
  const [page, setPage] = useState(1);
  const start = (page - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / pageSize));

  const subtotal = items.reduce((acc, i) => acc + i.qty * i.rate, 0);
  const gstAmount = includeGST ? subtotal * 0.18 : 0;
  const total = subtotal + gstAmount;

  // Add clearFilters function
  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setActivePage(1);
  };

  function setActivePage(arg0: number) {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="p-6 space-y-6">
      <Group justify="space-between" mb="lg">
        <Text size="xl" fw={600}>
          Sales Invoice
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreateModal(true)}
          color="#0A6802"
        >
          Create Invoice
        </Button>
      </Group>

      <Group grow>
        <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
          <Text>Total Invoices</Text>
          <Text fw={700} size="xl">
            {invoices.length}
          </Text>
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
          <Text>Total Amount</Text>
          <Text fw={700} size="xl">
            ${invoices.reduce((acc, i) => acc + i.amount, 0)}
          </Text>
        </Card>
      </Group>

      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        mt={20}
        bg={"#F1FCF0"}
      >
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={600}>Sales Invoices</Text>
            <Text size="sm" c="dimmed">
              Manage your sales invoices and track payments
            </Text>
          </div>
        </Group>

        <Group mb="md" gap="md">
          <TextInput
            placeholder="Search invoices..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setActivePage(1);
            }}
            w={250}
          />
          <TextInput
            type="date"
            placeholder="From date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
            w={150}
          />
          <TextInput
            type="date"
            placeholder="To date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
            w={150}
          />
          <Button variant="default" onClick={clearFilters}>
            Clear
          </Button>
        </Group>

        {/* Add row count selector above the table */}
        <Group mb="sm" gap="md" justify="flex-end">
          <Text fw={600}>Rows per page:</Text>
          <Select
            data={[
              { value: "8", label: "8" },
              { value: "15", label: "15" },
              { value: "30", label: "30" },
            ]}
            value={String(pageSize)}
            onChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
            w={80}
          />
        </Group>

        <Table highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Invoice Date</Table.Th>
              <Table.Th>Delivery No</Table.Th>
              <Table.Th>Delivery Date</Table.Th>
              <Table.Th>PO No</Table.Th>
              <Table.Th>PO Date</Table.Th>
              <Table.Th>Account No</Table.Th>
              <Table.Th>Account Title</Table.Th>
              <Table.Th>Sale Account</Table.Th>
              <Table.Th>Sale Account Title</Table.Th>
              <Table.Th>NTN No</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th>Product Name</Table.Th>
              <Table.Th>HS Code</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Rate</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Ex GST Rate</Table.Th>
              <Table.Th>Ex GST Amount</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedInvoices.map((i) => (
              <Table.Tr key={i.id}>
                <Table.Td>{i.number}</Table.Td>
                <Table.Td>{i.date}</Table.Td>
                <Table.Td>{i.deliveryNo || ""}</Table.Td>
                <Table.Td>{i.deliveryDate || ""}</Table.Td>
                <Table.Td>{i.poNo || ""}</Table.Td>
                <Table.Td>{i.poDate || ""}</Table.Td>
                <Table.Td>{i.accountNo || ""}</Table.Td>
                <Table.Td>{i.accountTitle || ""}</Table.Td>
                <Table.Td>{i.saleAccount || ""}</Table.Td>
                <Table.Td>{i.saleAccountTitle || ""}</Table.Td>
                <Table.Td>{i.ntnNo || ""}</Table.Td>
                {/* Show first item from items array for each invoice, or blank if not available */}
                <Table.Td>{i.items?.[0]?.code || ""}</Table.Td>
                <Table.Td>{i.items?.[0]?.product || ""}</Table.Td>
                <Table.Td>{i.items?.[0]?.hsCode || ""}</Table.Td>
                <Table.Td>{i.items?.[0]?.description || ""}</Table.Td>
                <Table.Td>{i.items?.[0]?.qty || ""}</Table.Td>
                <Table.Td>{i.items?.[0]?.rate || ""}</Table.Td>
                <Table.Td>
                  {i.items?.[0]?.qty && i.items?.[0]?.rate
                    ? i.items[0].qty * i.items[0].rate
                    : ""}
                </Table.Td>
                <Table.Td>{i.items?.[0]?.exGSTRate || ""}</Table.Td>
                <Table.Td>{i.items?.[0]?.exGSTAmount || ""}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      color="#0A6802"
                      variant="light"
                      onClick={() => {
                        setEditInvoice(i);
                        setItems(
                          i.items ? i.items.map((item) => ({ ...item })) : []
                        );
                      }}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => setDeleteInvoice(i)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
            {paginatedInvoices.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={20} align="center">
                  No invoices found.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
        {/* Add pagination at the end of the table */}
      </Card>

      <Modal
        opened={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Invoice"
        size="70%"
      >
        <div ref={printRef}>
          <Group grow mb="sm">
            <TextInput
              label="Invoice Number"
              value={newInvoiceNumber}
              onChange={(e) => setNewInvoiceNumber(e.currentTarget.value)}
              mb="sm"
            />

            <TextInput
              label="Invoice Date"
              type="date"
              placeholder="mm/dd/yyyy"
              value={newDate}
              onChange={(e) => setNewDate(e.currentTarget.value)}
            />
            <TextInput
              label="Delivery No"
              type="number"
              placeholder="Delivery No"
              value={newDeliveryNo}
              onChange={(e) => setNewDeliveryNo(e.currentTarget.value)}
            />
            <TextInput
              label="Delivery Date"
              type="date"
              placeholder="mm/dd/yyyy"
              value={newDeliveryDate}
              onChange={(e) => setNewDeliveryDate(e.currentTarget.value)}
            />
          </Group>
          <Group grow mb="sm" w={"50%"}>
            <TextInput
              label="Po No"
              placeholder="Po No"
              value={newPoNo}
              onChange={(e) => setNewPoNo(e.currentTarget.value)}
            />
            <TextInput
              label="Po Date"
              type="date"
              placeholder="Po Date"
              value={newPoDate}
              onChange={(e) => setNewPoDate(e.currentTarget.value)}
            />
          </Group>
          <Group grow>
            <TextInput
              label="Account No"
              placeholder="Account No"
              value={newAccountNo}
              onChange={(e) => setNewAccountNo(e.currentTarget.value)}
            />
            <Select
              label="Account Title"
              placeholder="Select Account"
              data={[
                "Adv. Income Tax",
                "Ahmad Fine Weaing Limited (Unit-I)",
                "Ahmad Fine Weaing Limited (Unit-II)",
              ]}
              value={newAccountTitle}
              onChange={(v) => setNewAccountTitle(v || "")}
              mb="sm"
            />
            <TextInput
              label="Sale Account"
              value={newSaleAccount}
              onChange={(e) => setNewSaleAccount(e.currentTarget.value)}
            />
            <Select
              label="Sale Account Title"
              data={[
                "Sale of Chemicals and Equipments",
                "Sale of Equipments",
                "Sales of Chemicals",
                "Services",
              ]}
              value={newSaleAccountTitle}
              onChange={(v) => setNewSaleAccountTitle(v || "")}
            />
            <TextInput
              label="NTN No"
              value={newNtnNo}
              onChange={(e) => setNewNtnNo(e.currentTarget.value)}
            />
          </Group>

          <Switch
            color="#0A6802"
            label="Include GST (18%)"
            checked={includeGST}
            onChange={(e) => setIncludeGST(e.currentTarget.checked)}
            mb="md"
          />

          <Table withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Code</Table.Th>
                <Table.Th>Product Name</Table.Th>
                <Table.Th>HS Code</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Qty</Table.Th>
                <Table.Th>Rate</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Ex GST Rate</Table.Th>
                <Table.Th>Ex GST Amount</Table.Th>
                <Table.Th>Remove</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item, index) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <TextInput value={item.code} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      placeholder="Product"
                      value={item.product}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].product = e.currentTarget.value;
                        setItems(newItems);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput value={item.hsCode} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].description = e.currentTarget.value;
                        setItems(newItems);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={item.qty}
                      min={1}
                      onChange={(val) => {
                        const newItems = [...items];
                        newItems[index].qty = Number(val) || 0;
                        setItems(newItems);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={item.rate}
                      min={0}
                      onChange={(val) => {
                        const newItems = [...items];
                        newItems[index].rate = Number(val) || 0;
                        setItems(newItems);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>{item.qty * item.rate}</Table.Td>
                  <Table.Td>
                    <TextInput value={item.exGSTRate} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput value={item.exGSTAmount} />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() =>
                        setItems((prev) => prev.filter((i) => i.id !== item.id))
                      }
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Button
            mt="sm"
            leftSection={<IconPlus size={16} />}
            color="#0A6802"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  id: prev.length + 1,
                  code: 1,
                  product: "",
                  hsCode: "",
                  description: "",
                  qty: 1,
                  rate: 0,
                  exGSTRate: "",
                  exGSTAmount: "",
                },
              ])
            }
          >
            Add Item
          </Button>

          <div className="mt-4 space-y-1">
            <Text>Ex GST Amount:</Text>
            <Text>Total GST:</Text>
            <Text>Subtotal: {subtotal.toFixed(2)}</Text>
            {includeGST && <Text>GST (18%): {gstAmount.toFixed(2)}</Text>}
            <Text fw={700}>Total: {total.toFixed(2)}</Text>
          </div>

          <Textarea
            label="Notes (Optional)"
            placeholder="Additional notes or terms..."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            mt="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" color="blue" onClick={handlePrint} mr={8}>
              Print
            </Button>
            <Button variant="default" onClick={() => setCreateModal(false)}>
              Save as Draft
            </Button>
            <Button
              color="#0A6802"
              onClick={() => {
                setInvoices((prev) => [
                  ...prev,
                  {
                    id: prev.length + 1,
                    number: newInvoiceNumber,
                    date: newDate,
                    deliveryNo: newDeliveryNo,
                    deliveryDate: newDeliveryDate,
                    poNo: newPoNo,
                    poDate: newPoDate,
                    accountNo: newAccountNo,
                    accountTitle: newAccountTitle,
                    saleAccount: newSaleAccount,
                    saleAccountTitle: newSaleAccountTitle,
                    ntnNo: newNtnNo,
                    amount: total,
                    items: items,
                  },
                ]);
                setCreateModal(false);
              }}
            >
              Create & Send
            </Button>
          </Group>
        </div>
      </Modal>

      <Modal
        opened={!!editInvoice}
        onClose={() => setEditInvoice(null)}
        title="Edit Invoice"
        size="70%"
      >
        {editInvoice && (
          <>
            <Group grow mb="sm">
              <TextInput
                label="Invoice Number"
                value={editInvoice.number}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    number: e.currentTarget.value,
                  })
                }
                mb="sm"
              />
              <TextInput
                label="Invoice Date"
                type="date"
                placeholder="mm/dd/yyyy"
                value={editInvoice.date}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    date: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                label="Delivery No"
                type="number"
                placeholder="Delivery No"
                value={editInvoice.deliveryNo || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    deliveryNo: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                label="Delivery Date"
                type="date"
                placeholder="mm/dd/yyyy"
                value={editInvoice.deliveryDate || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    deliveryDate: e.currentTarget.value,
                  })
                }
              />
            </Group>
            <Group grow mb="sm" w={"50%"}>
              <TextInput
                label="Po No"
                placeholder="Po No"
                value={editInvoice.poNo || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    poNo: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                label="Po Date"
                type="date"
                placeholder="Po Date"
                value={editInvoice.poDate || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    poDate: e.currentTarget.value,
                  })
                }
              />
            </Group>
            <Group grow>
              <TextInput
                label="Account No"
                placeholder="Account No"
                value={editInvoice.accountNo || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    accountNo: e.currentTarget.value,
                  })
                }
              />
              <Select
                label="Account Title"
                placeholder="Select Account"
                data={[
                  "Adv. Income Tax",
                  "Ahmad Fine Weaing Limited (Unit-I)",
                  "Ahmad Fine Weaing Limited (Unit-II)",
                ]}
                value={editInvoice.accountTitle || ""}
                onChange={(v) =>
                  setEditInvoice({ ...editInvoice, accountTitle: v || "" })
                }
                mb="sm"
              />
              <TextInput
                label="Sale Account"
                value={editInvoice.saleAccount || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    saleAccount: e.currentTarget.value,
                  })
                }
              />
              <Select
                label="Sale Account Title"
                data={[
                  "Sale of Chemicals and Equipments",
                  "Sale of Equipments",
                  "Sales of Chemicals",
                  "Services",
                ]}
                value={editInvoice.saleAccountTitle || ""}
                onChange={(v) =>
                  setEditInvoice({ ...editInvoice, saleAccountTitle: v || "" })
                }
              />
              <TextInput
                label="NTN No"
                value={editInvoice.ntnNo || ""}
                onChange={(e) =>
                  setEditInvoice({
                    ...editInvoice,
                    ntnNo: e.currentTarget.value,
                  })
                }
              />
            </Group>
            <Switch
              color="#0A6802"
              label="Include GST (18%)"
              checked={includeGST}
              onChange={(e) => setIncludeGST(e.currentTarget.checked)}
              mb="md"
            />
            <Table withColumnBorders highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Code</Table.Th>
                  <Table.Th>Product Name</Table.Th>
                  <Table.Th>HS Code</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Ex GST Rate</Table.Th>
                  <Table.Th>Ex GST Amount</Table.Th>
                  <Table.Th>Remove</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item, index) => (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <TextInput value={item.code} />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        placeholder="Product"
                        value={item.product}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].product = e.currentTarget.value;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput value={item.hsCode} />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].description = e.currentTarget.value;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.qty}
                        min={1}
                        onChange={(val) => {
                          const newItems = [...items];
                          newItems[index].qty = Number(val) || 0;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.rate}
                        min={0}
                        onChange={(val) => {
                          const newItems = [...items];
                          newItems[index].rate = Number(val) || 0;
                          setItems(newItems);
                        }}
                      />
                    </Table.Td>
                    <Table.Td>${item.qty * item.rate}</Table.Td>
                    <Table.Td>
                      <TextInput value={item.exGSTRate} />
                    </Table.Td>
                    <Table.Td>
                      <TextInput value={item.exGSTAmount} />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() =>
                          setItems((prev) =>
                            prev.filter((i) => i.id !== item.id)
                          )
                        }
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Button
              mt="sm"
              leftSection={<IconPlus size={16} />}
              color="#0A6802"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  {
                    id: prev.length + 1,
                    code: 1,
                    product: "",
                    hsCode: "",
                    description: "",
                    qty: 1,
                    rate: 0,
                    exGSTRate: "",
                    exGSTAmount: "",
                  },
                ])
              }
            >
              Add Item
            </Button>
            <div className="mt-4 space-y-1">
              <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
              {includeGST && <Text>GST (18%): ${gstAmount.toFixed(2)}</Text>}
              <Text fw={700}>Total: ${total.toFixed(2)}</Text>
            </div>
            <Group mt="md" justify="flex-end">
              <Button variant="default" onClick={() => setEditInvoice(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editInvoice) {
                    setInvoices((prev) =>
                      prev.map((i) =>
                        i.id === editInvoice.id
                          ? { ...editInvoice, amount: total, items: items }
                          : i
                      )
                    );
                    setEditInvoice(null);
                  }
                }}
              >
                Save Changes
              </Button>
            </Group>
          </>
        )}
      </Modal>

      <Modal
        opened={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        title="Confirm Delete"
      >
        <Text>
          Are you sure you want to delete invoice <b>{deleteInvoice?.number}</b>
          ?
        </Text>
        <Group mt="md" justify="flex-end">
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
function setActivePage(arg0: number) {
  throw new Error("Function not implemented.");
}
