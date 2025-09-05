import { useState } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  Table,
  Modal,
  TextInput,
  Badge,
  ActionIcon,
  Pagination,
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
  customer: string;
  date: string;
  due: string;
  status: "paid" | "sent";
  amount: number;
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
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 1,
      number: "INV-001",
      customer: "Acme Corporation",
      date: "3/15/2024",
      due: "4/15/2024",
      status: "sent",
      amount: 1180,
    },
    {
      id: 2,
      number: "INV-002",
      customer: "TechStart Solutions",
      date: "3/14/2024",
      due: "4/14/2024",
      status: "paid",
      amount: 1770,
    },
  ]);

  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [newInvoiceNumber, setNewInvoiceNumber] = useState("INV-003");
  const [newCustomer, setNewCustomer] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
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

  const [activePage, setActivePage] = useState(1);
  const pageSize = 5;

  const filteredInvoices = invoices.filter(
    (i) =>
      i.number.toLowerCase().includes(search.toLowerCase()) ||
      i.customer.toLowerCase().includes(search.toLowerCase())
  );

  const start = (activePage - 1) * pageSize;
  const paginatedInvoices = filteredInvoices.slice(start, start + pageSize);

  const subtotal = items.reduce((acc, i) => acc + i.qty * i.rate, 0);
  const gstAmount = includeGST ? subtotal * 0.18 : 0;
  const total = subtotal + gstAmount;

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
          <Text>Paid</Text>
          <Text fw={700} size="xl">
            {invoices.filter((i) => i.status === "paid").length}
          </Text>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder bg={"#F1FCF0"}>
          <Text>Pending</Text>
          <Text fw={700} size="xl">
            {invoices.filter((i) => i.status !== "paid").length}
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

        <TextInput
          placeholder="Search invoices..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setActivePage(1);
          }}
          mb="md"
        />

        <Table highlightOnHover withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Due Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((inv) => (
                <Table.Tr key={inv.id}>
                  <Table.Td>{inv.number}</Table.Td>
                  <Table.Td>{inv.customer}</Table.Td>
                  <Table.Td>{inv.date}</Table.Td>
                  <Table.Td>{inv.due}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={inv.status === "paid" ? "green" : "blue"}
                      variant="filled"
                    >
                      {inv.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>${inv.amount}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        color="#0A6802"
                        variant="light"
                        onClick={() => setEditInvoice(inv)}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        variant="light"
                        onClick={() => setDeleteInvoice(inv)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7} align="center">
                  <Text c="dimmed">No invoices found</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        {filteredInvoices.length > pageSize && (
          <Group justify="center" mt="md">
            <Pagination
              total={Math.ceil(filteredInvoices.length / pageSize)}
              value={activePage}
              onChange={setActivePage}
            />
          </Group>
        )}
      </Card>

      <Modal
        opened={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Sales Invoice"
        size="70%"
        // h="80%"
      >
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
          />
          <TextInput
            label="Delivery Date"
            type="date"
            placeholder="mm/dd/yyyy"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.currentTarget.value)}
          />
        </Group>
        <Group grow mb="sm" w={"50%"}>
          <TextInput label="Po No" placeholder="Po No" />
          <TextInput label="Po Date" type="date" placeholder="Po Date" />
        </Group>
        <Group grow>
          <TextInput label="Account No" placeholder="Account No" />
          <Select
            label="Account Title"
            placeholder="Select Account"
            data={[
              "Adv. Income Tax",
              "Ahmad Fine Weaing Limited (Unit-I)",
              "Ahmad Fine Weaing Limited (Unit-II)",
            ]}
            value={newCustomer}
            onChange={(v) => setNewCustomer(v || "")}
            mb="sm"
          />
          <TextInput label="Sale Account" />
          <Select
            label="Sale Account Title"
            data={[
              "Sale of Chemicals and Equipments",
              "Sale of Equipments",
              "Sales of Chemicals",
              "Services",
            ]}
          />
          <TextInput label="NTN No" />
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
                  customer: newCustomer,
                  date: newDate,
                  due: newDueDate,
                  status: "sent",
                  amount: total,
                },
              ]);
              setCreateModal(false);
            }}
          >
            Create & Send
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!editInvoice}
        onClose={() => setEditInvoice(null)}
        title="Edit Invoice"
        size="xl"
      >
        {editInvoice && (
          <>
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

            <Group grow mb="sm">
              <TextInput
                label="Invoice Date"
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
                label="Due Date"
                placeholder="mm/dd/yyyy"
                value={editInvoice.due}
                onChange={(e) =>
                  setEditInvoice({ ...editInvoice, due: e.currentTarget.value })
                }
              />
            </Group>

            <TextInput
              label="Customer"
              value={editInvoice.customer}
              onChange={(e) =>
                setEditInvoice({
                  ...editInvoice,
                  customer: e.currentTarget.value,
                })
              }
              mb="sm"
            />

            <Select
              label="Status"
              data={[
                { value: "paid", label: "Paid" },
                { value: "sent", label: "Sent" },
              ]}
              value={editInvoice.status}
              onChange={(v) =>
                setEditInvoice({
                  ...editInvoice,
                  status: (v as "paid" | "sent") || "sent",
                })
              }
              mb="sm"
            />

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
                  <Table.Th>Product/Service</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th>Rate</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Remove</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item, index) => (
                  <Table.Tr key={item.id}>
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
                          ? { ...editInvoice, amount: total }
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
