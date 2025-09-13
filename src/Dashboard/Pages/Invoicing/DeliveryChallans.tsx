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
  DeliveryChallanProvider,
  useDeliveryChallan,
  type DeliveryItem,
  type DeliveryChallan,
} from "../../Context/Invoicing/DeliveryChallanContext";

function DeliveryChallansInner() {
  const { challans, addChallan, updateChallan, deleteChallan } =
    useDeliveryChallan();

  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [opened, setOpened] = useState(false);
  const [editData, setEditData] = useState<DeliveryChallan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [poNo, setPoNo] = useState<string>("");
  const [poDate, setPoDate] = useState<string>("");
  const [partyName, setPartyName] = useState<string>("");
  const [partyAddress, setPartyAddress] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [status, setStatus] = useState<DeliveryChallan["status"]>("Pending");
  const [challanId, setChallanId] = useState<string>("");

  // Only one set of refs and handlers!
  const printRef = useRef<HTMLDivElement>(null);
  const modalPrintRef = useRef<HTMLDivElement>(null);

  // Filtered Data
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

  // Stats
  const activeCount = challans.filter((d) => d.status !== "Delivered").length;
  const deliveredCount = challans.filter(
    (d) => d.status === "Delivered"
  ).length;
  const pendingCount = challans.filter((d) => d.status === "Pending").length;

  // CRUD
  const openCreate = () => {
    setEditData(null);
    resetForm();
    setChallanId("");
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

    if (editData) {
      updateChallan(newChallan);
    } else {
      addChallan(newChallan);
    }
    setOpened(false);
    resetForm();
  };

  const openDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (deleteId) deleteChallan(deleteId);
    setDeleteId(null);
  };

  const resetForm = () => {
    setChallanId("");
    setPoNo("");
    setPoDate("");
    setPartyName("");
    setPartyAddress("");
    setDeliveryDate("");
    setStatus("Pending");
    setItems([]);
  };

  // Items
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        sr: prev.length + 1,
        itemCode: "",
        particulars: "",
        unit: "",
        length: "",
        width: "",
        qty: "",
      },
    ]);
  };

  const handleItemChange = (
    idx: number,
    field: keyof DeliveryItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
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

  function ChallanPrintTemplate({
    challan,
    items,
  }: {
    challan: {
      challanId: string;
      deliveryDate: string;
      poNo: string;
      poDate: string;
      partyName: string;
      partyAddress: string;
      contactPerson?: string;
      partyPhone?: string;
      other?: string;
    };
    items: DeliveryItem[];
  }) {
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          background: "#fff",
          padding: 24,
          minWidth: 900,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 60 }} />
          <h2 style={{ color: "#819E00", margin: "8px 0" }}>
            Delivery Challan
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: 4,
          }}
        >
          <table style={{ border: "1px solid #222", fontSize: 12 }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #222", padding: "2px 8px" }}>
                  Original
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #222", padding: "2px 8px" }}>
                  Duplicate
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #222", padding: "2px 8px" }}>
                  Triplicate
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Party Info */}
        <table style={{ width: "100%", fontSize: 14, marginBottom: 8 }}>
          <tbody>
            <tr>
              <td style={{ color: "#0A6802", fontWeight: "bold", width: 120 }}>
                Party Name
              </td>
              <td style={{ color: "#222" }}>{challan.partyName}</td>
              <td style={{ color: "#0A6802", fontWeight: "bold", width: 120 }}>
                Delivery Date
              </td>
              <td style={{ color: "#222" }}>{challan.deliveryDate}</td>
            </tr>
            <tr>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>
                Party Address
              </td>
              <td style={{ color: "#222" }}>{challan.partyAddress}</td>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>DC No#</td>
              <td style={{ color: "#222" }}>{challan.challanId}</td>
            </tr>
            <tr>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>PO No#</td>
              <td style={{ color: "#222" }}>{challan.poNo}</td>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>PO Date</td>
              <td style={{ color: "#222" }}>{challan.poDate}</td>
            </tr>
            <tr>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>
                Contact Person
              </td>
              <td style={{ color: "#222" }}>{challan.contactPerson || "-"}</td>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>
                Party Phone #
              </td>
              <td style={{ color: "#222" }}>{challan.partyPhone || "-"}</td>
            </tr>
            <tr>
              <td style={{ color: "#0A6802", fontWeight: "bold" }}>Other</td>
              <td style={{ color: "#222" }}>{challan.other || "-"}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          <thead>
            <tr style={{ background: "#F8FFF6" }}>
              <th style={{ border: "1px solid #222", padding: 4 }}>SR.</th>
              <th style={{ border: "1px solid #222", padding: 4 }}>
                Item Code
              </th>
              <th
                style={{ border: "1px solid #222", padding: 4, minWidth: 180 }}
              >
                Particulars
              </th>
              <th style={{ border: "1px solid #222", padding: 4 }}>Unit</th>
              <th style={{ border: "1px solid #222", padding: 4 }}>Length</th>
              <th style={{ border: "1px solid #222", padding: 4 }}>Width</th>
              <th style={{ border: "1px solid #222", padding: 4 }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    border: "1px solid #222",
                    padding: 4,
                    textAlign: "center",
                  }}
                >
                  {item.sr}
                </td>
                <td style={{ border: "1px solid #222", padding: 4 }}>
                  {item.itemCode}
                </td>
                <td style={{ border: "1px solid #222", padding: 4 }}>
                  {item.particulars}
                </td>
                <td style={{ border: "1px solid #222", padding: 4 }}>
                  {item.unit}
                </td>
                <td style={{ border: "1px solid #222", padding: 4 }}>
                  {item.length}
                </td>
                <td style={{ border: "1px solid #222", padding: 4 }}>
                  {item.width}
                </td>
                <td style={{ border: "1px solid #222", padding: 4 }}>
                  {item.qty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Footer */}
        <div style={{ marginTop: 24 }}>
          <table style={{ width: "100%", fontSize: 13 }}>
            <tbody>
              <tr>
                <td style={{ width: "33%", textAlign: "center" }}>
                  Prepared By
                </td>
                <td style={{ width: "33%", textAlign: "center" }}>
                  Checked By
                </td>
                <td style={{ width: "33%", textAlign: "center" }}>Manager</td>
              </tr>
            </tbody>
          </table>
          <div style={{ margin: "16px 0", fontSize: 12 }}>
            Please receive the above material and return duplicate of this
            challan duly received and signed for record
          </div>
          <div
            style={{
              textAlign: "right",
              fontWeight: "bold",
              color: "#0A6802",
              fontSize: 13,
            }}
          >
            Receiver Signature
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#222" }}>
            <div>
              <strong>HEAD OFFICE:</strong> 45-B, PECHS, 42-Faced Canal View
              Phase-II, Multan &nbsp; Tel: 922-345129-271-3
            </div>
            <div>
              <strong>RAWALPINDI:</strong> S-6, Rawat Plaza, Main Model Town,
              Tel: 051-609-1611
            </div>
            <div>
              <strong>FAISALABAD:</strong> Filter Colony, Sargodha Road, Tel:
              0345-862-2246
            </div>
            <div>
              <strong>KARACHI:</strong> E-86, Ground Floor, Block 2, Tel:
              021-3375-0175
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ref for printable table
  // Duplicate refs removed

  // Print handler
  // Duplicate handlers removed

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
          doc.internal.pageSize.height - 30
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
    const finalY =
      (doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY
        ? (doc as any).lastAutoTable.finalY + 20
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
          doc.internal.pageSize.height - 30
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
    // Fix: Use doc.lastAutoTable.finalY safely
    const finalY =
      (doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY
        ? (doc as any).lastAutoTable.finalY + 20
        : doc.internal.pageSize.height - 60;
    doc.text(`Total Challans: ${filteredData.length}`, 40, finalY);
    doc.text(`Total Qty: ${totalQty}`, 200, finalY);

    doc.save("delivery_challans.pdf");
  };

  function PrintableChallanContent(challan: any) {
    return `
    <html>
      <head>
        <title>Delivery Challan ${challan.number}</title>
        <style>
          body { font-family: Arial; color: #222; padding: 24px; }
          h2 { margin-bottom: 8px; }
          p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <h2>Delivery Challan #${challan.number}</h2>
        <p>Date: ${challan.date}</p>
        <p>Account: ${challan.accountTitle}</p>
        <p>Amount: $${challan.amount?.toFixed(2)}</p>
        <!-- Add more details as needed -->
      </body>
    </html>
  `;
  }

  const printChallanWindow = (challan: any) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(PrintableChallanContent(challan));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  return (
    <div>
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
            <Button
              variant="outline"
              color="#0A6802"
              onClick={printChallanWindow}
            >
              Print
            </Button>
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
        <div
          ref={modalPrintRef}
          style={{
            height: 0,
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
            position: "absolute",
            zIndex: -1,
          }}
        >
          <ChallanPrintTemplate
            challan={{
              challanId,
              deliveryDate,
              poNo,
              poDate,
              partyName,
              partyAddress,
            }}
            items={items}
          />
        </div>
        <Group mb="md" w="50%">
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
          <TextInput
            label="Party Name"
            placeholder="Enter Party Name"
            value={partyName}
            onChange={(e) => setPartyName(e.currentTarget.value)}
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
        {items.length > 0 && (
          <Table withTableBorder highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>SR</Table.Th>
                <Table.Th>Item Code</Table.Th>
                <Table.Th style={{ minWidth: 180 }}>Particulars</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>{item.sr}</Table.Td>
                  <Table.Td>{item.itemCode}</Table.Td>
                  <Table.Td>{item.particulars}</Table.Td>
                  <Table.Td>{item.unit}</Table.Td>
                  <Table.Td>{item.length}</Table.Td>
                  <Table.Td>{item.width}</Table.Td>
                  <Table.Td>{item.qty}</Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Modal>
    </div>
  );
}
