import { useState, useMemo, useEffect } from "react";
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
  NumberInput,
  ActionIcon,
} from "@mantine/core";
import { Download, Edit, Trash2, Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import api from "../../../api_configuration/api";

interface JournalVoucherEntry {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface JournalVoucher {
  _id?: string;
  voucherNumber: string;
  date: string;
  description?: string;
  entries: JournalVoucherEntry[];
}

function JournalVoucherList() {
  const { accounts: chartAccounts } = useChartOfAccounts();
  const [vouchers, setVouchers] = useState<JournalVoucher[]>([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openedCreate, setOpenedCreate] = useState(false);
  const [openedEdit, setOpenedEdit] = useState(false);
  const [editVoucher, setEditVoucher] = useState<JournalVoucher | null>(null);
  const [nextVoucherNumber, setNextVoucherNumber] = useState<string>("");

  // Fetch journal vouchers from API
  useEffect(() => {
    const fetchJournalVouchers = async () => {
      try {
        const response = await api.get("/journal-vouchers");
        console.log("Journal Vouchers API response:", response.data);
        setVouchers(response.data || []);

        // Generate next voucher number
        generateNextVoucherNumber(response.data || []);
      } catch (error) {
        console.error("Failed to fetch journal vouchers:", error);
        setVouchers([]);
        setNextVoucherNumber("JV-0001");
      }
    };

    fetchJournalVouchers();
  }, []);

  const generateNextVoucherNumber = (vouchersList: JournalVoucher[]) => {
    if (vouchersList.length === 0) {
      setNextVoucherNumber("JV-0001");
      return;
    }

    // Extract numbers from voucher numbers and find the maximum
    const numbers = vouchersList
      .map((v) => {
        const match = v.voucherNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((num) => !isNaN(num));

    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    setNextVoucherNumber(`JV-${nextNumber.toString().padStart(4, "0")}`);
  };

  // Flatten accounts for dropdown
  const flattenAccounts = (accounts: Account[]): Account[] => {
    let result: Account[] = [];
    accounts.forEach((account) => {
      result.push(account);
      if (account.children && account.children.length > 0) {
        result = result.concat(flattenAccounts(account.children));
      }
    });
    return result;
  };

  interface Account {
    accountCode?: string;
    accountName?: string;
    children?: Account[];
  }

  const accountOptions = useMemo(() => {
    const flatAccounts = flattenAccounts(chartAccounts as Account[]);
    return flatAccounts
      .filter((acc) => acc.accountCode && acc.accountName)
      .map((acc) => ({
        value: acc.accountCode!,
        label: `${acc.accountCode} - ${acc.accountName}`,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartAccounts]);

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
          v.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
          (v.description &&
            v.description.toLowerCase().includes(search.toLowerCase()))
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
    doc.text(`Voucher No: ${voucher.voucherNumber}`, 40, 95);
    doc.text(`Date: ${voucher.date}`, 250, 95);
    doc.text(`Description: ${voucher.description || "N/A"}`, 40, 115);

    const totalDebit = voucher.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = voucher.entries.reduce((sum, e) => sum + e.credit, 0);

    autoTable(doc, {
      startY: 135,
      head: [["Account Code", "Account Name", "Debit", "Credit"]],
      body: [
        ...voucher.entries.map((entry) => [
          entry.accountCode,
          entry.accountName,
          `Rs. ${entry.debit.toLocaleString()}`,
          `Rs. ${entry.credit.toLocaleString()}`,
        ]),
        [
          { content: "Totals", colSpan: 2, styles: { fontStyle: "bold" } },
          `Rs. ${totalDebit.toLocaleString()}`,
          `Rs. ${totalCredit.toLocaleString()}`,
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

    doc.save(`${voucher.voucherNumber}.pdf`);
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

    const totalDebit = filteredData.reduce(
      (sum, v) => sum + v.entries.reduce((s, e) => s + e.debit, 0),
      0
    );
    const totalCredit = filteredData.reduce(
      (sum, v) => sum + v.entries.reduce((s, e) => s + e.credit, 0),
      0
    );

    autoTable(doc, {
      startY: dateText ? 110 : 90,
      head: [["Voucher No", "Date", "Description", "Debit", "Credit"]],
      body: [
        ...filteredData.map((v) => [
          v.voucherNumber,
          v.date,
          v.description || "N/A",
          `Rs. ${v.entries.reduce((s, e) => s + e.debit, 0).toLocaleString()}`,
          `Rs. ${v.entries.reduce((s, e) => s + e.credit, 0).toLocaleString()}`,
        ]),
        [
          {
            content: "Totals",
            colSpan: 3,
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: `Rs. ${totalDebit.toLocaleString()}`,
            styles: { fontStyle: "bold" },
          },
          {
            content: `Rs. ${totalCredit.toLocaleString()}`,
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

  const handleCreate = async (newVoucher: JournalVoucher) => {
    try {
      await api.post("/journal-vouchers", newVoucher);
      const response = await api.get("/journal-vouchers");
      setVouchers(response.data || []);
      generateNextVoucherNumber(response.data || []);
      setOpenedCreate(false);
    } catch (error) {
      console.error("Failed to create journal voucher:", error);
    }
  };

  const handleEdit = async (updatedVoucher: JournalVoucher) => {
    try {
      await api.put(`/journal-vouchers/${updatedVoucher._id}`, updatedVoucher);
      const response = await api.get("/journal-vouchers");
      setVouchers(response.data || []);
      generateNextVoucherNumber(response.data || []);
      setOpenedEdit(false);
    } catch (error) {
      console.error("Failed to update journal voucher:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/journal-vouchers/${id}`);
      const response = await api.get("/journal-vouchers");
      setVouchers(response.data || []);
      generateNextVoucherNumber(response.data || []);
    } catch (error) {
      console.error("Failed to delete journal voucher:", error);
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
              <Table.Th>Description</Table.Th>
              <Table.Th>Debit</Table.Th>
              <Table.Th>Credit</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedData.map((v, i) => (
              <Table.Tr key={i}>
                <Table.Td>{v.voucherNumber}</Table.Td>
                <Table.Td>{v.date}</Table.Td>
                <Table.Td>{v.description || "N/A"}</Table.Td>
                <Table.Td c="#0A6802">
                  Rs.{" "}
                  {v.entries.reduce((s, e) => s + e.debit, 0).toLocaleString()}
                </Table.Td>
                <Table.Td c="red">
                  Rs.{" "}
                  {v.entries.reduce((s, e) => s + e.credit, 0).toLocaleString()}
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
                      onClick={() => v._id && handleDelete(v._id)}
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
        size="xl"
      >
        <VoucherForm
          onSubmit={handleCreate}
          accountOptions={accountOptions}
          autoVoucherNumber={nextVoucherNumber}
        />
      </Modal>

      <Modal
        opened={openedEdit}
        onClose={() => setOpenedEdit(false)}
        title={<strong>Edit Journal Voucher</strong>}
        size="xl"
      >
        {editVoucher && (
          <VoucherForm
            initialData={editVoucher}
            onSubmit={handleEdit}
            accountOptions={accountOptions}
          />
        )}
      </Modal>
    </div>
  );
}

function VoucherForm({
  onSubmit,
  initialData,
  accountOptions,
  autoVoucherNumber,
}: {
  onSubmit: (data: JournalVoucher) => void;
  initialData?: JournalVoucher;
  accountOptions: { value: string; label: string }[];
  autoVoucherNumber?: string;
}) {
  const [voucher, setVoucher] = useState<JournalVoucher>(
    initialData || {
      voucherNumber: autoVoucherNumber || "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      entries: [
        { accountCode: "", accountName: "", debit: 0, credit: 0 },
        { accountCode: "", accountName: "", debit: 0, credit: 0 },
      ],
    }
  );

  // Update voucher number when autoVoucherNumber changes
  useEffect(() => {
    if (autoVoucherNumber && !initialData) {
      setVoucher((prev) => ({ ...prev, voucherNumber: autoVoucherNumber }));
    }
  }, [autoVoucherNumber, initialData]);

  const handleVoucherChange = (field: string, value: string) => {
    setVoucher((prev) => ({ ...prev, [field]: value }));
  };

  const handleEntryChange = (
    index: number,
    field: keyof JournalVoucherEntry,
    value: string | number
  ) => {
    const newEntries = [...voucher.entries];

    if (field === "accountCode") {
      const selectedAccount = accountOptions.find((acc) => acc.value === value);
      newEntries[index] = {
        ...newEntries[index],
        accountCode: value as string,
        accountName: selectedAccount
          ? selectedAccount.label.split(" - ")[1]
          : "",
      };
    } else {
      newEntries[index] = { ...newEntries[index], [field]: value };
    }

    setVoucher((prev) => ({ ...prev, entries: newEntries }));
  };

  const addEntry = () => {
    setVoucher((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        { accountCode: "", accountName: "", debit: 0, credit: 0 },
      ],
    }));
  };

  const removeEntry = (index: number) => {
    if (voucher.entries.length > 2) {
      setVoucher((prev) => ({
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index),
      }));
    }
  };

  const totalDebit = voucher.entries.reduce(
    (sum, e) => sum + Number(e.debit),
    0
  );
  const totalCredit = voucher.entries.reduce(
    (sum, e) => sum + Number(e.credit),
    0
  );
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("Debit and Credit must be equal and greater than 0!");
      return;
    }
    onSubmit(voucher);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Group grow mb="md">
        <TextInput
          label="Voucher Number"
          value={voucher.voucherNumber}
          onChange={(e) =>
            handleVoucherChange("voucherNumber", e.currentTarget.value)
          }
          readOnly={!initialData}
          disabled={!initialData}
          required
        />
        <TextInput
          label="Date"
          type="date"
          value={voucher.date}
          onChange={(e) => handleVoucherChange("date", e.currentTarget.value)}
          required
        />
      </Group>

      <TextInput
        label="Description"
        value={voucher.description}
        onChange={(e) =>
          handleVoucherChange("description", e.currentTarget.value)
        }
        mb="md"
      />

      <Text fw={600} mb="sm">
        Journal Entries
      </Text>

      {voucher.entries.map((entry, index) => (
        <Card key={index} shadow="sm" p="sm" mb="sm" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Entry {index + 1}
            </Text>
            {voucher.entries.length > 2 && (
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => removeEntry(index)}
              >
                <Trash2 size={16} />
              </ActionIcon>
            )}
          </Group>

          <Select
            label="Account"
            placeholder="Select account"
            data={accountOptions}
            value={entry.accountCode}
            onChange={(value) =>
              handleEntryChange(index, "accountCode", value || "")
            }
            searchable
            required
            mb="xs"
          />

          <Group grow>
            <NumberInput
              label="Debit"
              value={entry.debit}
              onChange={(value) =>
                handleEntryChange(index, "debit", Number(value) || 0)
              }
              min={0}
              step={0.01}
            />
            <NumberInput
              label="Credit"
              value={entry.credit}
              onChange={(value) =>
                handleEntryChange(index, "credit", Number(value) || 0)
              }
              min={0}
              step={0.01}
            />
          </Group>
        </Card>
      ))}

      <Button
        variant="light"
        color="#0A6802"
        leftSection={<Plus size={16} />}
        onClick={addEntry}
        mb="md"
        fullWidth
      >
        Add Entry
      </Button>

      <Card shadow="sm" p="md" mb="md" withBorder bg="#F1FCF0">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Total Debit
            </Text>
            <Text fw={700} c="#0A6802">
              Rs. {totalDebit.toLocaleString()}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Total Credit
            </Text>
            <Text fw={700} c="red">
              Rs. {totalCredit.toLocaleString()}
            </Text>
          </div>
          <div>
            <Text size="sm" c="dimmed">
              Status
            </Text>
            <Text fw={700} c={isBalanced ? "#0A6802" : "orange"}>
              {isBalanced ? "✓ Balanced" : "⚠ Not Balanced"}
            </Text>
          </div>
        </Group>
      </Card>

      <Group justify="flex-end" mt="md">
        <Button type="submit" color="#0A6802" disabled={!isBalanced}>
          Save Voucher
        </Button>
      </Group>
    </form>
  );
}

export default function JournalVouchers() {
  return <JournalVoucherList />;
}
