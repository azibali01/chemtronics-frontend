import { useMemo, useRef, useState, useEffect } from "react";
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
  Autocomplete,
  Loader,
  Alert,
  Center,
  Stack,
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
  DeliveryChallanProvider,
  useDeliveryChallan,
  type DeliveryItem,
  type DeliveryChallan,
} from "../../Context/Invoicing/DeliveryChallanContext";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import type { AccountNode } from "../../Context/ChartOfAccountsContext";
import { useBrand } from "../../Context/BrandContext";
import { PrintableChallan } from "./PrintableChallan";
import { getReceivableAccounts } from "../../utils/receivableAccounts";
import api from "../../../api_configuration/api";

type ProductLookup = {
  code: string;
  name: string;
  description: string;
};

// Helper function to generate next challan number
function getNextChallanNumber(challans: DeliveryChallan[]): string {
  if (!challans.length) return "DC-0001";
  // Extract numbers from existing IDs (assumes format DC-XXXX)
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

function DeliveryChallansInner() {
  const {
    challans,
    isLoading,
    error,
    addChallan,
    updateChallan,
    deleteChallan,
    searchChallans,
  } = useDeliveryChallan();
  const { brand } = useBrand();

  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<DeliveryChallan | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteChallanId, setDeleteChallanId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [productLookup, setProductLookup] = useState<ProductLookup[]>([]);

  const [poNo, setPoNo] = useState<string>("");
  const [poDate, setPoDate] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [partyAddress, setPartyAddress] = useState<string>("");

  // derive party options from chart of accounts
  const { accounts } = useChartOfAccounts();
  const receivablePartyAccounts = useMemo(
    () =>
      getReceivableAccounts(accounts as AccountNode[]).filter(
        (account) => account.isParty,
      ),
    [accounts],
  );
  const partyOptions = useMemo(() => {
    return Array.from(
      new Map(
        receivablePartyAccounts.map((account) => [
          account.accountName,
          { name: account.accountName, address: account.address || "" },
        ]),
      ).values(),
    );
  }, [receivablePartyAccounts]);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<DeliveryChallan["status"]>("Pending");
  const [challanId, setChallanId] = useState<string>("");

  // Always use today's date as default
  const today = new Date().toISOString().slice(0, 10);

  // Only one set of refs and handlers!
  const printRef = useRef<HTMLDivElement>(null);

  // Debounced backend search (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim()) {
        searchChallans(search);
      } else {
        // If search is empty, refetch all challans
        searchChallans();
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        if (!Array.isArray(response.data)) {
          setProductLookup([]);
          return;
        }

        const normalizedProducts = response.data
          .map((product: Record<string, unknown>) => ({
            code: String(product.code || "").trim(),
            name: String(
              product.name || product.productname || product.productName || "",
            ).trim(),
            description: String(
              product.description || product.productDescription || "",
            ).trim(),
          }))
          .filter((product: ProductLookup) => product.code || product.name);

        setProductLookup(normalizedProducts);
      } catch (fetchError) {
        console.error(
          "Failed to load products for delivery challan",
          fetchError,
        );
        setProductLookup([]);
      }
    };

    fetchProducts();
  }, []);

  const productCodeOptions = useMemo(
    () =>
      Array.from(
        new Set(productLookup.map((product) => product.code).filter(Boolean)),
      ),
    [productLookup],
  );

  const productNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          productLookup
            .map((product) => product.name || product.description)
            .filter(Boolean),
        ),
      ),
    [productLookup],
  );

  const syncItemWithProduct = (
    index: number,
    field: "itemCode" | "particulars",
    value: string,
  ) => {
    const trimmedValue = value.trim();
    const matchedProduct = productLookup.find((product) =>
      field === "itemCode"
        ? product.code.toLowerCase() === trimmedValue.toLowerCase()
        : [product.name, product.description]
            .filter(Boolean)
            .some(
              (candidate) =>
                candidate.toLowerCase() === trimmedValue.toLowerCase(),
            ),
    );

    setItems((prev) =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (!matchedProduct) {
          return { ...item, [field]: value };
        }

        return {
          ...item,
          itemCode: matchedProduct.code || item.itemCode,
          particulars:
            matchedProduct.name ||
            matchedProduct.description ||
            item.particulars,
        };
      }),
    );
  };

  // Filtered Data (now only handles date filtering, search is done on backend)
  const filteredData = useMemo(
    () =>
      challans.filter((row) => {
        const deliveryDateValue = new Date(row.deliveryDate).getTime();
        const fromOk = fromDate
          ? deliveryDateValue >= new Date(fromDate).getTime()
          : true;
        const toOk = toDate
          ? deliveryDateValue <= new Date(toDate).getTime()
          : true;

        return fromOk && toOk;
      }),
    [challans, fromDate, toDate],
  );

  const start = (page - 1) * pageSize;
  const paginatedData = filteredData.slice(start, start + pageSize);

  // Stats
  const activeCount = challans.filter((d) => d.status !== "Delivered").length;
  const deliveredCount = challans.filter(
    (d) => d.status === "Delivered",
  ).length;
  const pendingCount = challans.filter((d) => d.status === "Pending").length;

  // CRUD
  const openCreate = () => {
    setEditData(null);
    resetForm();
    setChallanId(getNextChallanNumber(challans)); // <-- Auto generate
    setOpened(true);
  };

  const openEdit = (row: DeliveryChallan) => {
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

  const handleSave = async () => {
    if (
      !challanId ||
      !poNo ||
      !poDate ||
      !partyName ||
      !partyAddress ||
      !deliveryDate
    )
      return;

    const newChallan: DeliveryChallan = {
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

    try {
      if (editData) {
        await updateChallan(newChallan);
      } else {
        await addChallan(newChallan);
      }
      setOpened(false);
      resetForm();
    } catch (error) {
      // Error is handled in context with notifications
      console.error("Failed to save challan:", error);
    }
  };

  const resetForm = () => {
    setChallanId("");
    setPoNo("");
    setPoDate("");
    setPartyName("");
    setPartyAddress("");
    setDeliveryDate(today); // <-- always set to today
    setStatus("Pending");
    setItems([]);
  };

  // Items
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
          amount: 0, // <-- Add this line to match DeliveryItem type
        },
      ];
      // Recalculate SR for all items
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
      // Recalculate SR for all items
      return filtered.map((item, i) => ({ ...item, sr: i + 1 }));
    });
  };

  function StatusBadge({ status }: { status: DeliveryChallan["status"] }) {
    switch (status) {
      case "Delivered":
        return <Badge color="green">Delivered</Badge>;
      case "In Transit":
        return <Badge color="yellow">In Transit</Badge>;
      case "Pending":
        return <Badge color="gray">Pending</Badge>;
    }
  }

  const exportPDF = (row: DeliveryChallan) => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Chemtronix Engineering Solutions";
    const reportTitle = "Delivery Challan";
    const currentDate = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(16);
    doc.text(companyName, 40, 30); // Company name at top
    doc.setFontSize(14);
    doc.text(reportTitle, 40, 55);

    // Challan Info
    doc.setFontSize(11);
    doc.text(`Date: ${currentDate}`, 480, 30);
    doc.text(`Challan #: ${row.id}`, 40, 75);
    doc.text(`Delivery Date: ${row.deliveryDate}`, 250, 75);
    doc.text(`PO No: ${row.poNo}`, 40, 95);
    doc.text(`PO Date: ${row.poDate}`, 250, 95);
    doc.text(`Party Name: ${row.partyName}`, 40, 115);
    doc.text(`Party Address: ${row.partyAddress}`, 250, 115);

    // Table
    autoTable(doc, {
      startY: 135,
      head: [
        ["SR", "Item Code", "Particulars", "Unit", "Length", "Width", "Qty"],
      ],
      body:
        row.items && row.items.length > 0
          ? row.items.map((item) => [
              item.sr,
              item.itemCode,
              item.particulars,
              item.unit,
              item.length,
              item.width,
              item.qty,
            ])
          : [["-", "-", "-", "-", "-", "-", "-"]],
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
          doc.internal.pageSize.height - 30,
        );
      },
    });

    // Totals
    let totalQty = 0;
    if (row.items && row.items.length > 0) {
      row.items.forEach((item) => {
        const qtyNum = Number(item.qty);
        if (!isNaN(qtyNum)) totalQty += qtyNum;
      });
    }

    doc.setFontSize(12);
    doc.setTextColor("#0A6802");
    // Define a type for jsPDF with lastAutoTable
    type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };
    const docWithAutoTable = doc as JsPDFWithAutoTable;
    const finalY =
      docWithAutoTable.lastAutoTable && docWithAutoTable.lastAutoTable.finalY
        ? docWithAutoTable.lastAutoTable.finalY + 20
        : doc.internal.pageSize.height - 60;
    doc.text(`Total Qty: ${totalQty}`, 40, finalY);

    doc.save(`${row.id}.pdf`);
  };

  // New function to export filtered data to PDF
  const exportFilteredPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Chemtronix Engineering Solutions";
    const reportTitle = "Delivery Challans List";
    const currentDate = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(16);
    doc.text(companyName, 40, 30); // Company name at top
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
          "Challan #",
          "Delivery Date",
          "PO No",
          "PO Date",
          "Party Name",
          "Party Address",
          "Particulars",
          "Qty",
          "Status",
        ],
      ],
      body: filteredData.map((row) => [
        row.id,
        row.deliveryDate,
        row.poNo,
        row.poDate,
        row.partyName,
        row.partyAddress,
        row.items && row.items.length > 0
          ? row.items.map((item) => item.particulars).join(", ")
          : "-",
        row.items && row.items.length > 0
          ? row.items.map((item) => item.qty).join(", ")
          : "-",
        row.status,
      ]),
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
          doc.internal.pageSize.height - 30,
        );
      },
    });

    // Totals
    let totalQty = 0;
    filteredData.forEach((row) => {
      if (row.items && row.items.length > 0) {
        row.items.forEach((item) => {
          const qtyNum = Number(item.qty);
          if (!isNaN(qtyNum)) totalQty += qtyNum;
        });
      }
    });

    doc.setFontSize(12);
    doc.setTextColor("#0A6802");
    // Define a type for jsPDF with lastAutoTable
    type JsPDFWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };
    const docWithAutoTable = doc as JsPDFWithAutoTable;
    const finalY =
      docWithAutoTable.lastAutoTable && docWithAutoTable.lastAutoTable.finalY
        ? docWithAutoTable.lastAutoTable.finalY + 20
        : doc.internal.pageSize.height - 60;
    doc.text(`Total Challans: ${filteredData.length}`, 40, finalY);
    doc.text(`Total Qty: ${totalQty}`, 200, finalY);

    doc.save("delivery_challans.pdf");
  };

  // Safe print function using window.print() with CSS media queries
  const handlePrint = () => {
    setIsPrinting(true);
    // Use setTimeout to ensure React has rendered the print component
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // Open delete modal
  const openDeleteModal = (id: string) => {
    setDeleteChallanId(id);
    setDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDeleteChallan = async () => {
    if (deleteChallanId) {
      try {
        await deleteChallan(deleteChallanId);
        setDeleteChallanId(null);
        setDeleteModalOpen(false);
      } catch (error) {
        // Error is handled in context with notifications
        console.error("Failed to delete challan:", error);
      }
    }
  };

  // Cancel delete
  const cancelDeleteChallan = () => {
    setDeleteChallanId(null);
    setDeleteModalOpen(false);
  };

  return (
    <>
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .printable-challan-container {
            display: block !important;
            visibility: visible !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            min-height: 100vh;
            background: white;
            z-index: 99999;
          }

          .printable-challan-container * {
            visibility: visible !important;
          }

          /* Reset all margins and padding for print */
          @page {
            margin: 0.5cm;
            size: A4;
          }
        }
        @media screen {
          .printable-challan-container {
            display: none !important;
          }
        }
      `}</style>

      {/* Print-only view */}
      {isPrinting && (
        <div className="printable-challan-container">
          <PrintableChallan
            challan={{
              challanId,
              deliveryDate,
              poNo,
              poDate,
              partyName,
              partyAddress,
            }}
            items={items}
            brand={brand}
          />
        </div>
      )}

      <div className="screen-content">
        {/* Loading State */}
        {isLoading && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <Loader color="#0A6802" size="lg" />
              <Text c="dimmed">Loading delivery challans...</Text>
            </Stack>
          </Center>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert
            color="red"
            title="Error"
            mb="md"
            withCloseButton
            onClose={() => {}}
          >
            {error}
          </Alert>
        )}

        {/* Content - only show when not loading */}
        {!isLoading && (
          <>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={2}>Delivery Challans</Title>
                <Text c="dimmed" size="sm">
                  Create and manage delivery challans for shipments
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                color="#0A6802"
                onClick={openCreate}
              >
                Create Delivery Challan
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="lg">
              <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
                <Group justify="space-between">
                  <Text>Active Challans</Text>
                  <ThemeIcon color="teal" variant="light">
                    <IconPackageExport size={20} />
                  </ThemeIcon>
                </Group>
                <Title order={3} mt={8}>
                  {activeCount}
                </Title>
              </Card>

              <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
                <Group justify="space-between">
                  <Text>Delivered</Text>
                  <ThemeIcon color="#0A6802" variant="light">
                    <IconCheck size={20} />
                  </ThemeIcon>
                </Group>
                <Title order={3} mt={8}>
                  {deliveredCount}
                </Title>
              </Card>

              <Card shadow="sm" radius="md" withBorder bg={"#F1FCF0"}>
                <Group justify="space-between">
                  <Text>Pending</Text>
                  <ThemeIcon color="gray" variant="light">
                    <IconClock size={20} />
                  </ThemeIcon>
                </Group>
                <Title order={3} mt={8}>
                  {pendingCount}
                </Title>
              </Card>
            </SimpleGrid>

            <Card withBorder radius="md" shadow="sm" p="md" bg={"#F1FCF0"}>
              <Group mb="sm">
                <IconTruck size={20} />
                <Text fw={600}>Delivery Challans List</Text>
              </Group>

              <Group mb="md" gap="xs" grow>
                <TextInput
                  label="Search"
                  placeholder="Search by Challan #"
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.currentTarget.value);
                    setPage(1);
                  }}
                />
                <TextInput
                  label="From Date"
                  type="date"
                  placeholder="From Date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.currentTarget.value);
                    setPage(1);
                  }}
                  style={{ minWidth: 140 }}
                />
                <TextInput
                  label="To Date"
                  type="date"
                  placeholder="To Date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.currentTarget.value);
                    setPage(1);
                  }}
                  style={{ minWidth: 140 }}
                />
                <Group mt={24} gap="xs">
                  {/* Print button removed from here */}
                  <Button
                    variant="outline"
                    color="#0A6802"
                    onClick={() => {
                      setSearch("");
                      setFromDate("");
                      setToDate("");
                      setPage(1);
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
              {/* Printable Table */}
              <div ref={printRef}>
                <Table highlightOnHover withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Challan #</Table.Th>
                      <Table.Th>Delivery Date</Table.Th>
                      <Table.Th>PO No</Table.Th>
                      <Table.Th>PO Date</Table.Th>
                      <Table.Th>Party Name</Table.Th>
                      <Table.Th>Party Address</Table.Th>
                      <Table.Th>Particulars</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedData.map((row) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>{row.id}</Table.Td>
                        <Table.Td>{row.deliveryDate}</Table.Td>
                        <Table.Td>{row.poNo}</Table.Td>
                        <Table.Td>{row.poDate}</Table.Td>
                        <Table.Td>{row.partyName}</Table.Td>
                        <Table.Td>{row.partyAddress}</Table.Td>
                        <Table.Td>
                          {row.items && row.items.length > 0 ? (
                            row.items.map((item) => item.particulars).join(", ")
                          ) : (
                            <Text c="dimmed" size="sm">
                              -
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {row.items && row.items.length > 0 ? (
                            row.items.map((item) => item.qty).join(", ")
                          ) : (
                            <Text c="dimmed" size="sm">
                              -
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge status={row.status} />
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
                              onClick={() => openDeleteModal(row.id)}
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
              </div>
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
          </>
        )}

        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title={
            editData ? (
              <strong>Edit Delivery Challan</strong>
            ) : (
              <strong>Create New Delivery Challan</strong>
            )
          }
          centered
          size="70%"
        >
          {/* Only one print template block */}
          <Group mb="md" w="50%" grow>
            <TextInput
              label="Challan #"
              placeholder="Enter Challan Number"
              value={challanId}
              onChange={(e) => setChallanId(e.currentTarget.value)}
            />
            <TextInput
              label="Delivery Date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.currentTarget.value)}
            />
          </Group>

          <Group grow mb="md">
            <TextInput
              label="PO No"
              placeholder="Enter PO Number"
              value={poNo}
              onChange={(e) => setPoNo(e.currentTarget.value)}
            />
            <TextInput
              label="PO Date"
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.currentTarget.value)}
            />
            <Autocomplete
              label="Party Name"
              placeholder="Search or enter party name"
              data={partyOptions.map((p) => p.name)}
              value={partyName}
              onChange={(val) => {
                setPartyName(val);
                const match = partyOptions.find((p) => p.name === val);
                if (match) setPartyAddress(match.address || "");
              }}
            />
            <TextInput
              label="Party Address"
              placeholder="Enter Party Address"
              value={partyAddress}
              onChange={(e) => setPartyAddress(e.currentTarget.value)}
            />
          </Group>

          <Group mb="md">
            <Button color="#0A6802" onClick={handleAddItem}>
              Add Item
            </Button>
          </Group>
          {items.length > 0 &&
            (() => {
              // REMOVE totalAmount calculation
              // const totalAmount = items.reduce((sum, item) => {
              //   return sum + (typeof item.amount === "number" ? item.amount : 0);
              // }, 0);

              return (
                <Table withTableBorder highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>SR</Table.Th>
                      <Table.Th>Item Code</Table.Th>
                      <Table.Th style={{ minWidth: 230 }}>Particulars</Table.Th>
                      <Table.Th>Unit</Table.Th>
                      <Table.Th>Length</Table.Th>
                      <Table.Th>Width</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      {/* <Table.Th>Amount</Table.Th> REMOVE this column */}
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {items.map((item, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td style={{ textAlign: "center" }}>
                          {item.sr}
                        </Table.Td>
                        <Table.Td>
                          <Autocomplete
                            value={item.itemCode ?? ""}
                            data={productCodeOptions}
                            onChange={(value) =>
                              syncItemWithProduct(idx, "itemCode", value)
                            }
                            placeholder="Item Code"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Autocomplete
                            value={item.particulars ?? ""}
                            data={productNameOptions}
                            onChange={(value) =>
                              syncItemWithProduct(idx, "particulars", value)
                            }
                            placeholder="Particulars"
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={item.unit ?? ""}
                            onChange={(e) => {
                              const value = e?.currentTarget?.value ?? "";
                              setItems((prev) =>
                                prev.map((itm, i) =>
                                  i === idx ? { ...itm, unit: value } : itm,
                                ),
                              );
                            }}
                            placeholder="Unit"
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={
                              item.length ? Number(item.length) : undefined
                            }
                            onChange={(value) =>
                              setItems((prev) =>
                                prev.map((itm, i) =>
                                  i === idx
                                    ? {
                                        ...itm,
                                        length: value?.toString() || "",
                                      }
                                    : itm,
                                ),
                              )
                            }
                            placeholder="Length"
                            min={0}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={item.width ? Number(item.width) : undefined}
                            onChange={(value) =>
                              setItems((prev) =>
                                prev.map((itm, i) =>
                                  i === idx
                                    ? { ...itm, width: value?.toString() || "" }
                                    : itm,
                                ),
                              )
                            }
                            placeholder="Width"
                            min={0}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={item.qty ? Number(item.qty) : undefined}
                            onChange={(value) =>
                              setItems((prev) =>
                                prev.map((itm, i) =>
                                  i === idx
                                    ? { ...itm, qty: value?.toString() || "" }
                                    : itm,
                                ),
                              )
                            }
                            placeholder="Qty"
                            min={0}
                          />
                        </Table.Td>
                        {/* REMOVE Amount cell */}
                        <Table.Td style={{ textAlign: "center" }}>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleRemoveItem(idx)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {/* REMOVE total amount row */}
                  </Table.Tbody>
                </Table>
              );
            })()}

          <Group justify="right" mt="md">
            <Button color="#819E00" variant="outline" onClick={handlePrint}>
              Print
            </Button>
            <Button color="#0A6802" onClick={handleSave}>
              {editData ? "Update Challan" : "Create Challan"}
            </Button>
            <Button
              variant="outline"
              color="#0A6802"
              onClick={() => setOpened(false)}
            >
              Cancel
            </Button>
          </Group>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpen}
          onClose={cancelDeleteChallan}
          title={<strong>Delete Delivery Challan</strong>}
          centered
          size="sm"
        >
          <Text mb="md">
            Are you sure you want to delete this delivery challan?
          </Text>
          <Group justify="right">
            <Button
              variant="outline"
              color="gray"
              onClick={cancelDeleteChallan}
            >
              Cancel
            </Button>
            <Button color="red" onClick={confirmDeleteChallan}>
              Delete
            </Button>
          </Group>
        </Modal>
      </div>
    </>
  );
}

// At the end of the file, wrap your main component with DeliveryChallanProvider
function DeliveryChallans() {
  return (
    <DeliveryChallanProvider>
      <DeliveryChallansInner />
    </DeliveryChallanProvider>
  );
}

export default DeliveryChallans;
