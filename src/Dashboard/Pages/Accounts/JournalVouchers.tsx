import { useState, useRef, useMemo } from "react";
import {
  Card,
  Text,
  Table,
  Group,
  Button,
  TextInput,
  Pagination,
  Select,
  Modal,
  Stack,
} from "@mantine/core";
import { Download, Edit, Trash2, Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";

import {
  JournalVouchersProvider,
  useJournalVouchers,
} from "../../Context/Accounts/JournalVouchersContext";
import type { JournalVoucher } from "../../Context/Accounts/JournalVouchersContext";

function JournalVoucherList() {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher } =
    useJournalVouchers();

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openedCreate, setOpenedCreate] = useState(false);
  const [openedEdit, setOpenedEdit] = useState(false);
  const [editVoucher, setEditVoucher] = useState<JournalVoucher | null>(null);

  const filteredData = useMemo(() => {
    let result = vouchers;
    if (fromDate) {
      result = result.filter((v) => new Date(v.date) >= new Date(fromDate));
    }
    if (toDate) {
      result = result.filter((v) => new Date(v.date) <= new Date(toDate));
    }
    if (search) {
      result = result.filter(
        (v) =>
          v.voucherNo.toLowerCase().includes(search.toLowerCase()) ||
          v.account.toLowerCase().includes(search.toLowerCase()) ||
          v.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    return result;
  }, [vouchers, fromDate, toDate, search]);

  const paginatedData = useMemo(() => {
    const start = (activePage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, activePage, rowsPerPage]);

  const exportRowPDF = (voucher: JournalVoucher) => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Chemtronix Engineering Solutions";
    const reportTitle = "Journal Voucher";
    const currentDate = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.setTextColor("#0A6802");
    doc.text(companyName, 40, 40);
    doc.setFontSize(14);
    doc.setTextColor("#222");
    doc.text(reportTitle, 40, 65);

    doc.setFontSize(11);
    doc.setTextColor("#444");
    doc.text(`Voucher No: ${voucher.voucherNo}`, 40, 95);
    doc.text(`Date: ${voucher.date}`, 250, 95);
    doc.text(`Account: ${voucher.account}`, 40, 115);
    doc.text(`Title: ${voucher.title}`, 250, 115);
    doc.text(`Description: ${voucher.description}`, 40, 135);

    autoTable(doc, {
      startY: 155,
      head: [["Debit", "Credit"]],
      body: [
        [
          `₹${voucher.debit.toLocaleString()}`,
          `₹${voucher.credit.toLocaleString()}`,
        ],
      ] as RowInput[],
      styles: { fontSize: 12 },
      headStyles: { fillColor: [10, 104, 2], textColor: 255 },
      theme: "grid",
      margin: { left: 40, right: 40 },
    });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated on: ${currentDate}`,
      40,
      doc.internal.pageSize.height - 30
    );
    doc.text(`Page 1 of 1`, 480, doc.internal.pageSize.height - 30);

    doc.save(`${voucher.voucherNo}.pdf`);
  };

  const exportAllPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    const companyName = "Chemtronix Engineering Solutions";
    const reportTitle = "Journal Vouchers Report";
    const currentDate = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.setTextColor("#0A6802");
    doc.text(companyName, 40, 40);
    doc.setFontSize(14);
    doc.setTextColor("#222");
    doc.text(reportTitle, 40, 65);

    doc.setFontSize(11);
    doc.setTextColor("#444");
    let dateText = "";
    if (fromDate && toDate) {
      dateText = `From: ${fromDate}   To: ${toDate}`;
    } else if (fromDate) {
      dateText = `From: ${fromDate}`;
    } else if (toDate) {
      dateText = `To: ${toDate}`;
    }
    if (dateText) {
      doc.text(dateText, 40, 90);
    }

    const totalDebit = filteredData.reduce((sum, v) => sum + v.debit, 0);
    const totalCredit = filteredData.reduce((sum, v) => sum + v.credit, 0);

    autoTable(doc, {
      startY: dateText ? 110 : 90,
      head: [
        [
          "Voucher No",
          "Date",
          "Account",
          "Title",
          "Description",
          "Debit",
          "Credit",
        ],
      ],
      body: [
        ...filteredData.map((v) => [
          v.voucherNo,
          v.date,
          v.account,
          v.title,
          v.description,
          `₹${v.debit.toLocaleString()}`,
          `₹${v.credit.toLocaleString()}`,
        ]),
        [
          {
            content: "Totals",
            colSpan: 5,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: `₹${totalDebit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
          {
            content: `₹${totalCredit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
        ],
      ] as RowInput[],
      styles: { fontSize: 11 },
      headStyles: { fillColor: [10, 104, 2], textColor: 255 },
      theme: "grid",
      margin: { left: 40, right: 40 },
      didDrawPage: function () {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(
          `Generated on: ${currentDate}`,
          40,
          doc.internal.pageSize.height - 30
        );
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          480,
          doc.internal.pageSize.height - 30
        );
      },
    });

    doc.save("journal_vouchers.pdf");
  };

  const handleCreate = (newVoucher: JournalVoucher) => {
    addVoucher(newVoucher);
    setOpenedCreate(false);
  };

  const handleEdit = (updatedVoucher: JournalVoucher) => {
    updateVoucher(updatedVoucher);
    setOpenedEdit(false);
  };

  function PrintableVoucherContent(voucher: any) {
    return `
      <html>
        <head>
          <title>Journal Voucher ${voucher.number}</title>
          <style>
            body { font-family: Arial; color: #222; padding: 24px; }
            h2 { margin-bottom: 8px; }
            p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h2>Journal Voucher #${voucher.number}</h2>
          <p>Date: ${voucher.date}</p>
          <p>Account: ${voucher.accountTitle}</p>
          <p>Amount: $${voucher.amount?.toFixed(2)}</p>
          <!-- Add more details as needed -->
        </body>
      </html>
    `;
  }

  const printVoucherWindow = (voucher: any) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(PrintableVoucherContent(voucher));
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Stack gap={0}>
          <Text size="xl" fw={700}>
            Journal Vouchers
          </Text>
          <Text>Manage journal entries and adjustments</Text>
        </Stack>
        <Group>
          <Button
            leftSection={<Plus size={16} />}
            color="#0A6802"
            onClick={() => setOpenedCreate(true)}
          >
            Create Voucher
          </Button>
        </Group>
      </Group>

      <Card shadow="sm" p="md" withBorder bg="#F1FCF0">
        <Group>
          <Group grow w="55%">
            <TextInput
              label="Search"
              placeholder="Search by voucher, account, description"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <TextInput
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.currentTarget.value)}
            />
            <TextInput
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.currentTarget.value)}
            />
          </Group>
          <Group>
            <Button
              variant="outline"
              color="gray"
              mt={22}
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </Button>
          </Group>
          <Button
            leftSection={<Download size={16} />}
            color="#819E00"
            onClick={exportAllPDF}
            mt={22}
          >
            Export All
          </Button>
          <Group justify="end" ml="auto">
            <Select
              label="Rows per page"
              data={["5", "10", "20"]}
              value={rowsPerPage.toString()}
              onChange={(value) => {
                setRowsPerPage(Number(value));
                setActivePage(1);
              }}
              w={120}
              mt={22}
            />
          </Group>
        </Group>
      </Card>

      <Card shadow="sm" p="md" mt="md" withBorder bg="#F1FCF0">
        <Group justify="space-between" mb={15}>
          <Stack>
            <Text fw={600}>Journal Entries</Text>
          </Stack>
        </Group>

        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Voucher No</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Account</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Debit</Table.Th>
              <Table.Th>Credit</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((v, i) => (
              <Table.Tr key={i}>
                <Table.Td>{v.voucherNo}</Table.Td>
                <Table.Td>{v.date}</Table.Td>
                <Table.Td>{v.account}</Table.Td>
                <Table.Td>{v.title}</Table.Td>
                <Table.Td c="#0A6802">{v.debit.toLocaleString()}</Table.Td>
                <Table.Td c="red">{v.credit.toLocaleString()}</Table.Td>
                <Table.Td>{v.description}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      color="#0A6802"
                      leftSection={<Edit size={14} />}
                      onClick={() => {
                        setEditVoucher(v);
                        setOpenedEdit(true);
                      }}
                    ></Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<Trash2 size={14} />}
                      onClick={() => deleteVoucher(v.voucherNo)}
                    ></Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="#819E00"
                      leftSection={<Download size={14} />}
                      onClick={() => exportRowPDF(v)}
                    ></Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="center" mt="md">
          <Pagination
            total={Math.ceil(filteredData.length / rowsPerPage)}
            value={activePage}
            onChange={setActivePage}
            color="#0A6802"
          />
        </Group>
      </Card>

      <Modal
        opened={openedCreate}
        onClose={() => setOpenedCreate(false)}
        title={<strong>Create Journal Voucher</strong>}
      >
        <VoucherForm onSubmit={handleCreate} />
      </Modal>

      <Modal
        opened={openedEdit}
        onClose={() => setOpenedEdit(false)}
        title={<strong>Edit Journal Voucher</strong>}
      >
        {editVoucher && (
          <VoucherForm initialData={editVoucher} onSubmit={handleEdit} />
        )}
      </Modal>
    </div>
  );
}

function VoucherForm({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: JournalVoucher) => void;
  initialData?: JournalVoucher;
}) {
  const [voucher, setVoucher] = useState<JournalVoucher>(
    initialData || {
      voucherNo: "",
      date: "",
      account: "",
      title: "",
      debit: 0,
      credit: 0,
      description: "",
    }
  );

  const printRef = useRef<HTMLDivElement>(null);

  const handleChange = (
    field: keyof JournalVoucher,
    value: string | number
  ) => {
    setVoucher((prev) => ({ ...prev, [field]: value }));
  };

  function printVoucherWindow(voucher: JournalVoucher): void {
    const printContent = `
      <html>
        <head>
          <title>Journal Voucher ${voucher.voucherNo}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #222; padding: 24px; }
            h2 { margin-bottom: 8px; }
            p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h2>Journal Voucher</h2>
          <p><strong>Voucher No:</strong> ${voucher.voucherNo}</p>
          <p><strong>Date:</strong> ${voucher.date}</p>
          <p><strong>Account:</strong> ${voucher.account}</p>
          <p><strong>Title:</strong> ${voucher.title}</p>
          <p><strong>Debit:</strong> ₹${voucher.debit.toLocaleString()}</p>
          <p><strong>Credit:</strong> ₹${voucher.credit.toLocaleString()}</p>
          <p><strong>Description:</strong> ${voucher.description}</p>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(voucher);
      }}
    >
      {/* Hidden printable area */}
      <div
        ref={printRef}
        style={{
          height: 0,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
          position: "absolute",
          zIndex: -1,
        }}
      >
        <div style={{ padding: 24, fontFamily: "Arial" }}>
          <h2>Journal Voucher</h2>
          <p>
            <strong>Voucher No:</strong> {voucher.voucherNo}
          </p>
          <p>
            <strong>Date:</strong> {voucher.date}
          </p>
          <p>
            <strong>Account:</strong> {voucher.account}
          </p>
          <p>
            <strong>Title:</strong> {voucher.title}
          </p>
          <p>
            <strong>Debit:</strong> {voucher.debit}
          </p>
          <p>
            <strong>Credit:</strong> {voucher.credit}
          </p>
          <p>
            <strong>Description:</strong> {voucher.description}
          </p>
        </div>
      </div>
      <Group grow>
        <TextInput
          label="Voucher No"
          value={voucher.voucherNo}
          onChange={(e) => handleChange("voucherNo", e.currentTarget.value)}
          required
        />
        <TextInput
          label="Date"
          type="date"
          value={voucher.date}
          onChange={(e) => handleChange("date", e.currentTarget.value)}
          required
        />
      </Group>
      <Group grow mt={"md"}>
        <TextInput
          label="Account Code"
          value={voucher.account}
          onChange={(e) => handleChange("account", e.currentTarget.value)}
          required
        />
        <Select
          label="Title"
          value={voucher.title}
          onChange={(value) => handleChange("title", value ?? "")}
          required
        />
      </Group>
      <Group grow mt={"md"}>
        <TextInput
          label="Debit"
          type="number"
          value={voucher.debit}
          onChange={(e) => handleChange("debit", Number(e.currentTarget.value))}
        />

        <TextInput
          label="Credit"
          type="number"
          value={voucher.credit}
          onChange={(e) =>
            handleChange("credit", Number(e.currentTarget.value))
          }
        />
      </Group>
      <TextInput
        mt={"md"}
        label="Description"
        value={voucher.description}
        onChange={(e) => handleChange("description", e.currentTarget.value)}
      />

      <Group justify="flex-end" mt="md">
        <Button
          color="#819E00"
          variant="outline"
          onClick={() => printVoucherWindow(voucher)}
        >
          Print
        </Button>
        <Button type="submit" color="#0A6802">
          Save
        </Button>
      </Group>
    </form>
  );
}

export default function JournalVouchers() {
  return (
    <JournalVouchersProvider>
      <JournalVoucherList />
    </JournalVouchersProvider>
  );
}
