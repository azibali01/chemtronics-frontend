import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Text,
  Grid,
  Table,
  Group,
  Button,
  TextInput,
  Select,
  Pagination,
} from "@mantine/core";
import { Download, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import api from "../../../api_configuration/api";

interface Account {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  debit: number;
  credit: number;
  date: string;
}

interface JournalVoucherEntry {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface JournalVoucher {
  _id: string;
  voucherNumber: string;
  date: string;
  entries: JournalVoucherEntry[];
}

export default function TrialBalance() {
  const { accounts: chartAccounts } = useChartOfAccounts();
  const [journalVouchers, setJournalVouchers] = useState<JournalVoucher[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accountType, setAccountType] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchJournalVouchers = async () => {
      try {
        const response = await api.get("/journal-vouchers");
        console.log("Journal Vouchers API response:", response.data);
        setJournalVouchers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch journal vouchers:", error);
        setJournalVouchers([]);
      }
    };

    fetchJournalVouchers();
  }, []);

  const getAccountType = (
    code: string
  ): "Asset" | "Liability" | "Equity" | "Revenue" | "Expense" => {
    const firstDigit = code.charAt(0);
    switch (firstDigit) {
      case "1":
        return "Asset";
      case "2":
        return "Liability";
      case "3":
        return "Equity";
      case "4":
        return "Revenue";
      case "5":
        return "Expense";
      default:
        return "Asset";
    }
  };

  interface ChartAccount {
    accountCode: string;
    accountName: string;
    accountType: string;
    openingBalance?: { debit: number; credit: number };
    createdAt?: string;
    children?: ChartAccount[];
  }

  const flattenAccounts = useCallback(
    (accounts: ChartAccount[]): ChartAccount[] => {
      let result: ChartAccount[] = [];
      accounts.forEach((account) => {
        result.push(account);
        if (account.children && account.children.length > 0) {
          result = result.concat(flattenAccounts(account.children));
        }
      });
      return result;
    },
    []
  );

  const trialBalanceData: Account[] = useMemo(() => {
    const flatAccounts = flattenAccounts(chartAccounts);

    return flatAccounts
      .filter((account) => account.accountType === "Detail")
      .map((account) => {
        const openingDebit = account.openingBalance?.debit || 0;
        const openingCredit = account.openingBalance?.credit || 0;

        let totalDebit = openingDebit;
        let totalCredit = openingCredit;
        let lastTransactionDate = account.createdAt || new Date().toISOString();

        journalVouchers.forEach((voucher) => {
          voucher.entries?.forEach((entry) => {
            if (entry.accountCode === account.accountCode) {
              totalDebit += entry.debit || 0;
              totalCredit += entry.credit || 0;
              if (voucher.date) {
                lastTransactionDate = voucher.date;
              }
            }
          });
        });

        return {
          code: account.accountCode || "N/A",
          name: account.accountName || "Unknown",
          type: getAccountType(account.accountCode || "1"),
          debit: totalDebit,
          credit: totalCredit,
          date: lastTransactionDate.split("T")[0],
        };
      })
      .filter((account) => account.debit > 0 || account.credit > 0);
  }, [chartAccounts, journalVouchers, flattenAccounts]);

  const [filteredData, setFilteredData] = useState<Account[]>(trialBalanceData);

  useEffect(() => {
    setFilteredData(trialBalanceData);
  }, [trialBalanceData]);

  const applyFilter = () => {
    let result = trialBalanceData;

    if (fromDate) {
      result = result.filter((a) => new Date(a.date) >= new Date(fromDate));
    }
    if (toDate) {
      result = result.filter((a) => new Date(a.date) <= new Date(toDate));
    }
    if (accountType) {
      result = result.filter((a) => a.type === accountType);
    }
    if (search) {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.code.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredData(result);
    setActivePage(1);
  };

  const totalDebit = filteredData.reduce((s, a) => s + a.debit, 0);
  const totalCredit = filteredData.reduce((s, a) => s + a.credit, 0);
  const balanced = totalDebit === totalCredit;

  const assets = filteredData
    .filter((a) => a.type === "Asset")
    .reduce((s, a) => s + a.debit - a.credit, 0);
  const liabilities = filteredData
    .filter((a) => a.type === "Liability")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const equity = filteredData
    .filter((a) => a.type === "Equity")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const revenue = filteredData
    .filter((a) => a.type === "Revenue")
    .reduce((s, a) => s + a.credit - a.debit, 0);
  const expenses = filteredData
    .filter((a) => a.type === "Expense")
    .reduce((s, a) => s + a.debit - a.credit, 0);

  const start = (activePage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedAccounts = filteredData.slice(start, end);

  const exportPDF = () => {
    const logoUrl = "/Logo.png";
    const headerUrl = "/Header.jpg";
    const footerUrl = "/Footer.jpg";
    const logoImg = new window.Image();
    const headerImg = new window.Image();
    const footerImg = new window.Image();
    let loaded = 0;

    function tryDraw() {
      loaded++;
      if (loaded === 3) {
        drawPDF();
      }
    }

    logoImg.src = logoUrl;
    headerImg.src = headerUrl;
    footerImg.src = footerUrl;
    logoImg.onload = tryDraw;
    headerImg.onload = tryDraw;
    footerImg.onload = tryDraw;
    logoImg.onerror = tryDraw;
    headerImg.onerror = tryDraw;
    footerImg.onerror = tryDraw;

    function drawPDF() {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, 25);

      const logoWidth = 40;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoImg, "PNG", logoX, 27, logoWidth, logoHeight);

      doc.setFontSize(16);
      doc.text("Trial Balance Report", pageWidth / 2, 52, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text("Date: " + new Date().toLocaleDateString(), pageWidth / 2, 59, {
        align: "center",
      });

      autoTable(doc, {
        head: [["Code", "Account Name", "Type", "Debit", "Credit", "Date"]],
        body: [
          ...filteredData.map((a) => [
            a.code,
            a.name,
            a.type,
            `Rs. ${a.debit.toLocaleString()}`,
            `Rs. ${a.credit.toLocaleString()}`,
            a.date,
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
            "",
          ],
        ] as RowInput[],
        startY: 65,
        theme: "grid",
        headStyles: {
          fillColor: [10, 104, 2],
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          fillColor: [241, 252, 240],
          textColor: 0,
        },
        didDrawPage: function (data) {
          const pageSize = doc.internal.pageSize;
          doc.addImage(
            footerImg,
            "JPEG",
            0,
            pageSize.getHeight() - 25,
            pageSize.getWidth(),
            25
          );
          doc.setFontSize(9);
          doc.text(
            `Page ${data.pageNumber}`,
            pageSize.getWidth() - 40,
            pageSize.getHeight() - 10
          );
        },
      });

      doc.save("trial_balance.pdf");
    }
  };

  return (
    <div className="p-6">
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>
          Trial Balance
        </Text>
        <Button
          leftSection={<Download size={16} />}
          color="#0A6802"
          onClick={exportPDF}
        >
          Export Report
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={2}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Assets</Text>
            <Text fw={700}>Rs. {assets.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Liabilities</Text>
            <Text fw={700}>Rs. {liabilities.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={2}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Equity</Text>
            <Text fw={700}>Rs. {equity.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Revenue</Text>
            <Text fw={700}>Rs. {revenue.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card withBorder p="md" bg="#F1FCF0">
            <Text>Expenses</Text>
            <Text fw={700}>Rs. {expenses.toLocaleString()}</Text>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="md" mt="md" bg="#F1FCF0" withBorder>
        <Group grow>
          <TextInput
            label="Search"
            placeholder="Search by account code or name"
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
          <Select
            label="Account Type"
            placeholder="Select type"
            data={["Asset", "Liability", "Equity", "Revenue", "Expense"]}
            value={accountType}
            onChange={setAccountType}
            clearable
          />
          <Button
            mt={23}
            color="#0A6802"
            leftSection={<Filter size={16} color="white" />}
            onClick={applyFilter}
          >
            Generate Report
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="md" mt="md" withBorder bg="#F1FCF0">
        <Text fw={600} mb="sm">
          Trial Balance (Filtered)
        </Text>
        <Table striped highlightOnHover withTableBorder bg={"#F1FCF0"}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Account Name</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Debit</Table.Th>
              <Table.Th>Credit</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedAccounts.map((a, i) => (
              <Table.Tr key={i}>
                <Table.Td>{a.code}</Table.Td>
                <Table.Td>{a.name}</Table.Td>
                <Table.Td>{a.type}</Table.Td>
                <Table.Td c="#0A6802">Rs. {a.debit.toLocaleString()}</Table.Td>
                <Table.Td c="red">Rs. {a.credit.toLocaleString()}</Table.Td>
                <Table.Td>{a.date}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
          <Table.Tfoot>
            <Table.Tr>
              <Table.Th colSpan={3}>Totals</Table.Th>
              <Table.Th>Rs. {totalDebit.toLocaleString()}</Table.Th>
              <Table.Th>Rs. {totalCredit.toLocaleString()}</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Tfoot>
        </Table>

        <Text mt="sm" c={balanced ? "#0A6802" : "red"} fw={700}>
          {balanced ? "Balanced" : "Unbalanced"}
        </Text>

        <Group justify="space-between">
          <Group gap="xs">
            <Text size="sm">Rows per page:</Text>
            <Select
              value={rowsPerPage.toString()}
              onChange={(value) => {
                setRowsPerPage(Number(value));
                setActivePage(1);
              }}
              data={["5", "10", "20", "50"]}
              w={80}
            />
          </Group>

          <Pagination
            color="#0A6802"
            total={Math.ceil(filteredData.length / rowsPerPage)}
            value={activePage}
            onChange={setActivePage}
            withEdges
          />
        </Group>
      </Card>
    </div>
  );
}
