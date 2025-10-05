import { useMemo, useRef, useState } from "react";
import {
  Card,
  Group,
  Button,
  Table,
  Badge,
  ActionIcon,
  Title,
  Text,
  Modal,
  Select,
  TextInput,
  NumberInput,
  Pagination,
  SimpleGrid,
  ThemeIcon,
} from "@mantine/core";
import {
  IconPencil,
  IconTrash,
  IconPlus,
  IconTruck,
  IconDownload,
  IconCheck,
  IconClock,
  IconPackageExport,
  IconSearch,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DeliveryChallanProviderCompany2,
  useDeliveryChallanCompany2,
  type DeliveryItemCompany2,
  type DeliveryChallanCompany2,
} from "../../../Context/Invoicing/DeliveryChallanContextCompany2";

function DeliveryChallansInnerCompany2() {
  const { challans, addChallan, updateChallan, deleteChallan } =
    useDeliveryChallanCompany2();

  const [items, setItems] = useState<DeliveryItemCompany2[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<DeliveryChallanCompany2 | null>(
    null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteChallanId, setDeleteChallanId] = useState<string | null>(null);

  const [poNo, setPoNo] = useState<string>("");
  const [poDate, setPoDate] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [partyAddress, setPartyAddress] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] =
    useState<DeliveryChallanCompany2["status"]>("Pending");
  const [challanId, setChallanId] = useState<string>("");

  const today = new Date().toISOString().slice(0, 10);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredData = useMemo(
    () =>
      challans.filter((row) => {
        const matchesSearch =
          row.id.toLowerCase().includes(search.toLowerCase()) ||
          row.poNo.toLowerCase().includes(search.toLowerCase()) ||
          row.partyName.toLowerCase().includes(search.toLowerCase());

        const deliveryDateValue = new Date(row.deliveryDate).getTime();
        const fromOk = fromDate
          ? deliveryDateValue >= new Date(fromDate).getTime()
          : true;
        const toOk = toDate
          ? deliveryDateValue <= new Date(toDate).getTime()
          : true;
        return matchesSearch && fromOk && toOk;
      }),
    [challans, search, fromDate, toDate]
  );

  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);

  const activeCount = challans.filter((d) => d.status !== "Delivered").length;
  const deliveredCount = challans.filter(
    (d) => d.status === "Delivered"
  ).length;
  const pendingCount = challans.filter((d) => d.status === "Pending").length;

  const openCreate = () => {
    setEditData(null);
    resetForm();
    setChallanId(getNextChallanNumberCompany2(challans));
    setOpened(true);
  };

  const openEdit = (row: DeliveryChallanCompany2) => {
    setEditData(row);
    setChallanId(row.id);
    setPoNo(row.poNo);
    setPoDate(row.poDate);
    setPartyName(row.partyName);
    setPartyAddress(row.partyAddress);
    setDeliveryDate(row.deliveryDate);
    setStatus(row.status);
    setItems(row.items || []);
    setOpened(true);
  };

  const handleSave = () => {
    if (
      !challanId ||
      !poNo ||
      !poDate ||
      !partyName ||
      !partyAddress ||
      !deliveryDate
    )
      return;
    const newChallan: DeliveryChallanCompany2 = {
      id: challanId,
      poNo,
      poDate,
      partyName,
      partyAddress,
      date: new Date().toISOString().slice(0, 10),
      deliveryDate,
      status,
      items: [...items],
    };
    if (editData) {
      updateChallan(newChallan);
    } else {
      addChallan(newChallan);
    }
    setOpened(false);
    resetForm();
  };

  const resetForm = () => {
    setChallanId("");
    setPoNo("");
    setPoDate("");
    setPartyName("");
    setPartyAddress("");
    setDeliveryDate(today);
    setStatus("Pending");
    setItems([]);
  };

  const handleAddItem = () => {
    setItems((prev) => {
      const newItems = [
        ...prev,
        {
          sr: prev.length + 1,
          itemCode: "",
          particulars: "",
          unit: "",
          length: "",
          width: "",
          qty: "",
          amount: 0,
        },
      ];
      return newItems.map((item, idx) => ({
        ...item,
        sr: idx + 1,
        amount: item.amount ?? 0,
      }));
    });
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((item, i) => ({ ...item, sr: i + 1 }));
    });
  };

  function StatusBadge({
    status,
  }: {
    status: DeliveryChallanCompany2["status"];
  }) {
    switch (status) {
      case "Delivered":
        return <Badge color="green">Delivered</Badge>;
      case "In Transit":
        return <Badge color="yellow">In Transit</Badge>;
      case "Pending":
        return <Badge color="gray">Pending</Badge>;
    }
  }

  // Helper function for next challan number
  function getNextChallanNumberCompany2(
    challans: DeliveryChallanCompany2[]
  ): string {
    if (!challans.length) return "DC-0001";
    const numbers = challans
      .map((c) => {
        const match = c.id.match(/DC-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = Math.max(...numbers, 0);
    const next = max + 1;
    return `DC-${next.toString().padStart(4, "0")}`;
  }

  return (
    <div>
      <Group justify="space-between" mb="md">
        <Title order={2}>Delivery Challans (Hydroworx)</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          color="#0A6802"
          onClick={openCreate}
        >
          Create Challan
        </Button>
      </Group>

      <SimpleGrid cols={3} spacing="md" mb="md">
        <Card withBorder radius="md" shadow="sm" bg="#F1FCF0">
          <Group justify="space-between">
            <Text fw={600}>Active</Text>
            <ThemeIcon color="#819E00" size="lg" radius="xl">
              <IconTruck size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3}>{activeCount}</Title>
        </Card>
        <Card withBorder radius="md" shadow="sm" bg="#F1FCF0">
          <Group justify="space-between">
            <Text fw={600}>Delivered</Text>
            <ThemeIcon color="green" size="lg" radius="xl">
              <IconCheck size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3}>{deliveredCount}</Title>
        </Card>
        <Card withBorder radius="md" shadow="sm" bg="#F1FCF0">
          <Group justify="space-between">
            <Text fw={600}>Pending</Text>
            <ThemeIcon color="gray" size="lg" radius="xl">
              <IconClock size={20} />
            </ThemeIcon>
          </Group>
          <Title order={3}>{pendingCount}</Title>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="md" shadow="sm" mb="lg" bg="#F1FCF0">
        <Group gap="md" align="flex-end" wrap="wrap">
          <TextInput
            placeholder="Search by Challan, PO, Party"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            leftSection={<IconSearch size={16} />}
            w={220}
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
        </Group>
      </Card>

      <Card withBorder radius="md" shadow="sm" p="md" bg="#F1FCF0">
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
        <Table highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Challan#</Table.Th>
              <Table.Th>PO#</Table.Th>
              <Table.Th>Party</Table.Th>
              <Table.Th>Delivery Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Items</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.poNo}</Table.Td>
                <Table.Td>{row.partyName}</Table.Td>
                <Table.Td>{row.deliveryDate}</Table.Td>
                <Table.Td>
                  <StatusBadge status={row.status} />
                </Table.Td>
                <Table.Td>
                  {Array.isArray(row.items) ? (
                    <Table withTableBorder>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>SR</Table.Th>
                          <Table.Th>Item Code</Table.Th>
                          <Table.Th>Particulars</Table.Th>
                          <Table.Th>Unit</Table.Th>
                          <Table.Th>Length</Table.Th>
                          <Table.Th>Width</Table.Th>
                          <Table.Th>Qty</Table.Th>
                          <Table.Th>Amount</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {row.items.map((item, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>{item.sr}</Table.Td>
                            <Table.Td>{item.itemCode}</Table.Td>
                            <Table.Td>{item.particulars}</Table.Td>
                            <Table.Td>{item.unit}</Table.Td>
                            <Table.Td>{item.length}</Table.Td>
                            <Table.Td>{item.width}</Table.Td>
                            <Table.Td>{item.qty}</Table.Td>
                            <Table.Td>{item.amount}</Table.Td>
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
                      onClick={() => {
                        setDeleteChallanId(row.id);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <IconTrash size={16} />
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

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          editData ? (
            <strong>Edit Challan</strong>
          ) : (
            <strong>Create New Challan</strong>
          )
        }
        centered
        size="70%"
      >
        <div ref={printRef}>
          <form>
            <Group grow mb="md" w={"50%"}>
              <TextInput
                label="Challan #"
                placeholder="Enter challan number"
                value={challanId}
                onChange={(e) => setChallanId(e.currentTarget.value)}
              />
              <TextInput
                label="PO #"
                placeholder="Enter PO number"
                value={poNo}
                onChange={(e) => setPoNo(e.currentTarget.value)}
              />
              <TextInput
                label="PO Date"
                type="date"
                value={poDate}
                onChange={(e) => setPoDate(e.currentTarget.value)}
              />
            </Group>
            <Group mb="md" grow>
              <TextInput
                label="Party Name"
                placeholder="Enter party name"
                value={partyName}
                onChange={(e) => setPartyName(e.currentTarget.value)}
              />
              <TextInput
                label="Party Address"
                placeholder="Enter party address"
                value={partyAddress}
                onChange={(e) => setPartyAddress(e.currentTarget.value)}
              />
              <TextInput
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.currentTarget.value)}
              />
              <Select
                label="Status"
                data={["Pending", "In Transit", "Delivered"]}
                value={status}
                onChange={(value) =>
                  setStatus(value as DeliveryChallanCompany2["status"])
                }
              />
            </Group>
            <Table withTableBorder highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>SR</Table.Th>
                  <Table.Th>Item Code</Table.Th>
                  <Table.Th>Particulars</Table.Th>
                  <Table.Th>Unit</Table.Th>
                  <Table.Th>Length</Table.Th>
                  <Table.Th>Width</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((item, idx) => (
                  <Table.Tr key={idx}>
                    <Table.Td>{item.sr}</Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.itemCode}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, itemCode: val } : it
                            )
                          );
                        }}
                        placeholder="Item Code"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.particulars}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, particulars: val } : it
                            )
                          );
                        }}
                        placeholder="Particulars"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.unit}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, unit: val } : it
                            )
                          );
                        }}
                        placeholder="Unit"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.length}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, length: val } : it
                            )
                          );
                        }}
                        placeholder="Length"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.width}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, width: val } : it
                            )
                          );
                        }}
                        placeholder="Width"
                      />
                    </Table.Td>
                    <Table.Td>
                      <TextInput
                        value={item.qty}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, qty: val } : it
                            )
                          );
                        }}
                        placeholder="Qty"
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={item.amount}
                        onChange={(val) => {
                          setItems((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, amount: Number(val) } : it
                            )
                          );
                        }}
                        placeholder="Amount"
                        min={0}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Button
                        color="red"
                        size="xs"
                        onClick={() => handleRemoveItem(idx)}
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
        <Button color="#0A6802" mb="md" onClick={handleAddItem}>
          Add Item
        </Button>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Cancel
          </Button>
          <Button color="#0A6802" onClick={handleSave}>
            {editData ? "Update Challan" : "Create Challan"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Challan"
        centered
      >
        <p style={{ marginBottom: "1rem" }}>
          Are you sure you want to delete this record?
        </p>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              if (deleteChallanId) deleteChallan(deleteChallanId);
              setDeleteModalOpen(false);
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

export default function DeliveryChallansCompany2() {
  return (
    <DeliveryChallanProviderCompany2>
      <DeliveryChallansInnerCompany2 />
    </DeliveryChallanProviderCompany2>
  );
}
