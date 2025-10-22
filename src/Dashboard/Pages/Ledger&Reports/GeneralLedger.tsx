import { useState, useEffect } from "react";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import { useAccountsOpeningBalances } from "../../Context/AccountsOpeningbalancesContext";
import {
  Card,
  Grid,
  Text,
  Group,
  Table,
  Button,
  Select,
  TextInput,
  Badge,
  Pagination,
  Stack,
} from "@mantine/core";

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBook,
  IconFilter,
  IconDownload,
  IconSearch,
  IconCash,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

interface LedgerEntry {
  date: string;
  account: string;
  type: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
}

export default function GeneralLedger() {
  const { accounts } = useChartOfAccounts();
  const { balances } = useAccountsOpeningBalances();
  const [account, setAccount] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Convert Chart of Accounts to Ledger Entries
  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      setLoading(true);
      return;
    }

    interface AccountNode {
      accountCode?: string;
      selectedCode?: string;
      openingBalance?: string | { debit: number; credit: number };
      createdAt?: string;
      accountName?: string;
      children?: AccountNode[];
    }

    const flattenAccounts = (
      accountsList: AccountNode[],
      parentType = ""
    ): LedgerEntry[] => {
      const entries: LedgerEntry[] = [];

      accountsList.forEach((acc) => {
        // Determine account type from code or parent
        let type = parentType;
        if (!type) {
          const code = acc.accountCode || acc.selectedCode || "";
          if (code.startsWith("1")) type = "asset";
          else if (code.startsWith("2")) type = "liability";
          else if (code.startsWith("3")) type = "equity";
          else if (code.startsWith("4")) type = "revenue";
          else if (code.startsWith("5")) type = "expense";
          else type = "other";
        }

        // Get opening balance from AccountsOpeningBalances context
        const accountCode = String(acc.accountCode || acc.selectedCode || "");
        const openingBalanceData = balances[accountCode];

        let debitAmount = 0;
        let creditAmount = 0;

        if (openingBalanceData) {
          debitAmount = openingBalanceData.debit || 0;
          creditAmount = openingBalanceData.credit || 0;
        }

        const balance = debitAmount - creditAmount;

        const entry: LedgerEntry = {
          date: acc.createdAt || new Date().toISOString().split("T")[0],
          account: acc.accountName || "Unknown Account",
          type: type,
          reference: acc.accountCode || acc.selectedCode || "N/A",
          description: `Opening Balance - ${acc.accountName}`,
          debit:
            debitAmount > 0 ? `Rs. ${debitAmount.toLocaleString()}` : "Rs. 0",
          credit:
            creditAmount > 0 ? `Rs. ${creditAmount.toLocaleString()}` : "Rs. 0",
          balance: `Rs. ${Math.abs(balance).toLocaleString()}`,
        };

        entries.push(entry);

        // Recursively process child accounts
        if (acc.children && acc.children.length > 0) {
          entries.push(...flattenAccounts(acc.children, type));
        }
      });

      return entries;
    };

    const entries = flattenAccounts(accounts);
    setLedgerData(entries);
    setLoading(false);
  }, [accounts, balances]);

  const [activePage, setActivePage] = useState(1);
  const pageSize = 10;

  const filteredData = ledgerData.filter((entry) => {
    const entryDate = new Date(entry.date);

    const matchesSearch =
      search === "" ||
      entry.account.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.toLowerCase().includes(search.toLowerCase());

    const matchesAccount = !account || entry.account === account;
    const matchesType = !accountType || entry.type === accountType;

    const matchesFromDate = !fromDate || entryDate >= fromDate;
    const matchesToDate = !toDate || entryDate <= toDate;

    return (
      matchesSearch &&
      matchesAccount &&
      matchesType &&
      matchesFromDate &&
      matchesToDate
    );
  });

  const startIndex = (activePage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const exportPDF = () => {
    // Use only the correct PDF export logic (centered logo, header/footer assets)
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
      // Header design asset
      doc.addImage(headerImg, "JPEG", 0, 0, pageWidth, 25);
      // Centered logo below header
      const logoWidth = 40;
      const logoHeight = 20;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoImg, "PNG", logoX, 27, logoWidth, logoHeight);

      // Header text below logo
      doc.setFontSize(16);
      doc.text("General Ledger Report", pageWidth / 2, 52, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 59, {
        align: "center",
      });

      // Calculate totals
      const totalDebits = filteredData.reduce(
        (sum, entry) =>
          sum + (parseFloat(entry.debit.replace(/[^\d.-]/g, "")) || 0),
        0
      );
      const totalCredits = filteredData.reduce(
        (sum, entry) =>
          sum + (parseFloat(entry.credit.replace(/[^\d.-]/g, "")) || 0),
        0
      );
      const netBalance = totalDebits - totalCredits;

      // Table with color theme
      autoTable(doc, {
        head: [
          [
            "Date",
            "Account",
            "Type",
            "Reference",
            "Description",
            "Debit",
            "Credit",
            "Balance",
          ],
        ],
        body: [
          ...filteredData.map<RowInput>((entry) => [
            entry.date,
            entry.account,
            entry.type,
            entry.reference,
            entry.description,
            entry.debit,
            entry.credit,
            entry.balance,
          ]),
          [
            {
              content: "Totals",
              colSpan: 5,
              styles: { halign: "right", fontStyle: "bold" },
            },
            totalDebits.toLocaleString(),
            totalCredits.toLocaleString(),
            netBalance.toLocaleString(),
          ],
        ],
        startY: 65,
        theme: "grid",
        headStyles: {
          fillColor: [10, 104, 2], // #0A6802
          textColor: 255,
          fontStyle: "bold",
        },
        bodyStyles: {
          fillColor: [241, 252, 240], // #F1FCF0
          textColor: 0,
        },
        footStyles: {
          fillColor: [10, 104, 2],
          textColor: 255,
          fontStyle: "bold",
        },
        didDrawPage: function (data) {
          // Footer design asset
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

      doc.save("general_ledger.pdf");
    }
  };
  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Stack gap={0}>
          <Text size="xl" fw={700} mb="md">
            General Ledger
          </Text>
          <Text size="sm" c="dimmed" mb="lg">
            Complete record of all financial transactions
          </Text>
        </Stack>
        <Button
          color="#0A6802"
          leftSection={<IconDownload size={16} />}
          onClick={exportPDF}
        >
          Export Ledger
        </Button>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
            <Group>
              <IconArrowDownRight size={30} color="green" />
              <div>
                <Text size="sm">Total Debits</Text>
                <Text fw={700} size="lg">
                  {filteredData
                    .reduce(
                      (sum, entry) =>
                        sum +
                        (parseFloat(entry.debit.replace(/[^\d.-]/g, "")) || 0),
                      0
                    )
                    .toLocaleString()}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
            <Group>
              <IconArrowUpRight size={30} color="red" />
              <div>
                <Text size="sm">Total Credits</Text>
                <Text fw={700} size="lg">
                  {filteredData
                    .reduce(
                      (sum, entry) =>
                        sum +
                        (parseFloat(entry.credit.replace(/[^\d.-]/g, "")) || 0),
                      0
                    )
                    .toLocaleString()}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
            <Group>
              <IconCash size={30} color="blue" />
              <div>
                <Text size="sm">Net Balance</Text>
                <Text fw={700} size="lg" c="#0A6802">
                  {(() => {
                    const totalDebits = filteredData.reduce(
                      (sum, entry) =>
                        sum +
                        (parseFloat(entry.debit.replace(/[^\d.-]/g, "")) || 0),
                      0
                    );
                    const totalCredits = filteredData.reduce(
                      (sum, entry) =>
                        sum +
                        (parseFloat(entry.credit.replace(/[^\d.-]/g, "")) || 0),
                      0
                    );
                    return (totalDebits - totalCredits).toLocaleString();
                  })()}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
            <Group>
              <IconBook size={30} />
              <div>
                <Text size="sm">Total Entries</Text>
                <Text fw={700} size="lg">
                  {filteredData.length}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" p="lg" radius="md" withBorder mb="lg" bg="#F1FCF0">
        <Group grow>
          <TextInput
            placeholder="Search accounts..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <Select
            placeholder="All Accounts"
            data={[...new Set(ledgerData.map((d) => d.account))]}
            value={account}
            onChange={setAccount}
            clearable
          />
          <Select
            placeholder="All Types"
            data={["asset", "revenue", "expense", "liability"]}
            value={accountType}
            onChange={setAccountType}
            clearable
          />
          <TextInput
            type="date"
            placeholder="From Date"
            value={fromDate ? fromDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setFromDate(
                e.currentTarget.value ? new Date(e.currentTarget.value) : null
              )
            }
          />
          <TextInput
            type="date"
            placeholder="To Date"
            value={toDate ? toDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setToDate(
                e.currentTarget.value ? new Date(e.currentTarget.value) : null
              )
            }
          />
          <Button color="#0A6802" leftSection={<IconFilter size={16} />}>
            Apply Filter
          </Button>
        </Group>
      </Card>

      <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
        <Text fw={600} mb="md">
          Ledger Entries
        </Text>
        {loading ? (
          <Text c="dimmed" style={{ textAlign: "center", padding: "2rem 0" }}>
            Loading...
          </Text>
        ) : (
          <Table highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Account</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Reference</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th>Debit</Table.Th>
                <Table.Th>Credit</Table.Th>
                <Table.Th>Running Balance</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedData.map((entry, index) => (
                <Table.Tr key={index}>
                  <Table.Td>{entry.date}</Table.Td>
                  <Table.Td>{entry.account}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        entry.type === "asset"
                          ? "blue"
                          : entry.type === "revenue"
                          ? "green"
                          : entry.type === "expense"
                          ? "orange"
                          : "red"
                      }
                    >
                      {entry.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{entry.reference}</Table.Td>
                  <Table.Td>{entry.description}</Table.Td>
                  <Table.Td c="#0A6802">{entry.debit}</Table.Td>
                  <Table.Td c="red">{entry.credit}</Table.Td>
                  <Table.Td fw={600}>{entry.balance}</Table.Td>
                </Table.Tr>
              ))}
              {paginatedData.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={8} style={{ textAlign: "center" }}>
                    No matching records found
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
        <Group justify="center" mt="md">
          <Pagination
            color="#0A6802"
            total={Math.ceil(filteredData.length / pageSize)}
            value={activePage}
            onChange={setActivePage}
          />
        </Group>
      </Card>
    </div>
  );
}
