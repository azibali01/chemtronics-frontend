import { useState } from "react";
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
import { Download, Edit, Trash2, Filter, Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

interface JournalVoucher {
  voucherNo: string;
  date: string;
  account: string;
  debit: number;
  credit: number;
  description: string;
  status: "Draft" | "Posted";
}

const initialVouchers: JournalVoucher[] = [
  {
    voucherNo: "JV-001",
    date: "2024-01-02",
    account: "Cash",
    debit: 10000,
    credit: 0,
    description: "Initial Capital",
    status: "Draft",
  },
  {
    voucherNo: "JV-002",
    date: "2024-01-05",
    account: "Sales Revenue",
    debit: 0,
    credit: 5000,
    description: "Sale of goods",
    status: "Posted",
  },
  {
    voucherNo: "JV-003",
    date: "2024-01-10",
    account: "Rent Expense",
    debit: 2000,
    credit: 0,
    description: "Office rent",
    status: "Draft",
  },
];

export default function JournalVoucherList() {
  const [vouchers, setVouchers] = useState<JournalVoucher[]>(initialVouchers);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredData, setFilteredData] = useState<JournalVoucher[]>(vouchers);

  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openedCreate, setOpenedCreate] = useState(false);
  const [openedEdit, setOpenedEdit] = useState(false);
  const [editVoucher, setEditVoucher] = useState<JournalVoucher | null>(null);

  const applyFilter = () => {
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
    setFilteredData(result);
    setActivePage(1);
  };

  const start = (activePage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedData = filteredData.slice(start, end);

  const exportRowPDF = (voucher: JournalVoucher) => {
    const doc = new jsPDF();
    doc.text(`Journal Voucher - ${voucher.voucherNo}`, 14, 15);

    autoTable(doc, {
      head: [
        [
          "Voucher No",
          "Date",
          "Account",
          "Debit",
          "Credit",
          "Description",
          "Status",
        ],
      ],
      body: [
        [
          voucher.voucherNo,
          voucher.date,
          voucher.account,
          `₹${voucher.debit.toLocaleString()}`,
          `₹${voucher.credit.toLocaleString()}`,
          voucher.description,
          voucher.status,
        ],
      ] as RowInput[],
      startY: 20,
    });

    doc.save(`${voucher.voucherNo}.pdf`);
  };

  const exportAllPDF = () => {
    const doc = new jsPDF();
    doc.text("Journal Vouchers Report", 14, 15);

    const totalDebit = filteredData.reduce((sum, v) => sum + v.debit, 0);
    const totalCredit = filteredData.reduce((sum, v) => sum + v.credit, 0);

    autoTable(doc, {
      head: [
        [
          "Voucher No",
          "Date",
          "Account",
          "Debit",
          "Credit",
          "Description",
          "Status",
        ],
      ],
      body: [
        ...filteredData.map((v) => [
          v.voucherNo,
          v.date,
          v.account,
          `${v.debit.toLocaleString()}`,
          `${v.credit.toLocaleString()}`,
          v.description,
          v.status,
        ]),
        [
          {
            content: "Totals",
            colSpan: 3,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: `${totalDebit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
          {
            content: `${totalCredit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
          { content: "", colSpan: 2 },
        ],
      ] as RowInput[],
      startY: 20,
    });

    doc.save("journal_vouchers.pdf");
  };

  const toggleStatus = (voucherNo: string) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.voucherNo === voucherNo
          ? { ...v, status: v.status === "Draft" ? "Posted" : "Draft" }
          : v
      )
    );
    setFilteredData((prev) =>
      prev.map((v) =>
        v.voucherNo === voucherNo
          ? { ...v, status: v.status === "Draft" ? "Posted" : "Draft" }
          : v
      )
    );
  };

  const deleteVoucher = (voucherNo: string) => {
    const updated = vouchers.filter((v) => v.voucherNo !== voucherNo);
    setVouchers(updated);
    setFilteredData(updated);
  };

  const handleCreate = (newVoucher: JournalVoucher) => {
    const updated = [...vouchers, newVoucher];
    setVouchers(updated);
    setFilteredData(updated);
    setOpenedCreate(false);
  };

  const handleEdit = (updatedVoucher: JournalVoucher) => {
    const updated = vouchers.map((v) =>
      v.voucherNo === updatedVoucher.voucherNo ? updatedVoucher : v
    );
    setVouchers(updated);
    setFilteredData(updated);
    setOpenedEdit(false);
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
        <Group grow>
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
          <Button
            mt={23}
            leftSection={<Filter size={16} />}
            color="#0A6802"
            onClick={applyFilter}
          >
            Apply Filter
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="md" mt="md" withBorder bg="#F1FCF0">
        <Group justify="space-between" mb={15}>
          <Stack>
            <Text fw={600}>Journal Entries</Text>
          </Stack>

          <Button
            leftSection={<Download size={16} />}
            color="#819E00"
            onClick={exportAllPDF}
          >
            Export All
          </Button>
        </Group>

        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Voucher No</Table.Th>
              <Table.Th>Date</Table.Th>
              <Table.Th>Account</Table.Th>
              <Table.Th>Debit</Table.Th>
              <Table.Th>Credit</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((v, i) => (
              <Table.Tr key={i}>
                <Table.Td>{v.voucherNo}</Table.Td>
                <Table.Td>{v.date}</Table.Td>
                <Table.Td>{v.account}</Table.Td>
                <Table.Td c="#0A6802">{v.debit.toLocaleString()}</Table.Td>
                <Table.Td c="red">{v.credit.toLocaleString()}</Table.Td>
                <Table.Td>{v.description}</Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    color={v.status === "Draft" ? "orange" : "#0A6802"}
                    onClick={() => toggleStatus(v.voucherNo)}
                  >
                    {v.status}
                  </Button>
                </Table.Td>
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

        <Group justify="space-between" mt="md">
          <Select
            label="Rows per page"
            data={["5", "10", "20"]}
            value={rowsPerPage.toString()}
            onChange={(value) => {
              setRowsPerPage(Number(value));
              setActivePage(1);
            }}
            w={120}
          />
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
      debit: 0,
      credit: 0,
      description: "",
      status: "Draft",
    }
  );

  const handleChange = (field: keyof JournalVoucher, value: any) => {
    setVoucher((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(voucher);
      }}
    >
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
      <TextInput
        label="Account"
        value={voucher.account}
        onChange={(e) => handleChange("account", e.currentTarget.value)}
        required
      />
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
        onChange={(e) => handleChange("credit", Number(e.currentTarget.value))}
      />
      <TextInput
        label="Description"
        value={voucher.description}
        onChange={(e) => handleChange("description", e.currentTarget.value)}
      />

      <Group justify="flex-end" mt="md">
        <Button type="submit" color="#0A6802">
          Save
        </Button>
      </Group>
    </form>
  );
}
