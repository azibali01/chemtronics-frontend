import { useState, useEffect, useCallback } from "react";
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
import { notifications } from "@mantine/notifications";

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBook,
  IconFilter,
  IconSearch,
  IconCash,
  IconPrinter,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";
import api, { apiBaseURL } from "../../../api_configuration/api";

interface LedgerEntry {
  date: string;
  account: string;
  type: string;
  reference: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
  // Raw numeric values used for stat-card totals (avoids lossy string→number round-trip)
  debitAmount: number;
  creditAmount: number;
}

interface GLEntry {
  date: string;
  voucherNumber: string;
  accountNumber?: string;
  accountName?: string;
  accountType?: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
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
  // Backend-fetched JV rows; null = not yet fetched, [] = fetched but empty
  const [backendRows, setBackendRows] = useState<LedgerEntry[] | null>(null);

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
      parentType = "",
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
            debitAmount > 0
              ? `Rs. ${debitAmount.toLocaleString("en-US")}`
              : "Rs. 0",
          credit:
            creditAmount > 0
              ? `Rs. ${creditAmount.toLocaleString("en-US")}`
              : "Rs. 0",
          balance: `Rs. ${Math.abs(balance).toLocaleString("en-US")}`,
          debitAmount,
          creditAmount,
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

  // Show backend rows once fetched; before first fetch show local CoA opening-balance view..
  // Apply all active filters to whichever source is displayed.
  const baseData = backendRows !== null ? backendRows : ledgerData;
  const displayData = baseData.filter((entry) => {
    const entryDate = new Date(entry.date);

    const matchesSearch =
      search === "" ||
      entry.account.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.toLowerCase().includes(search.toLowerCase());

    const matchesAccount = !account || entry.account === account;
    const matchesType =
      !accountType || entry.type.toLowerCase() === accountType.toLowerCase();

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

  const fetchLedger = useCallback(async () => {
    // Resolve account code; null account = global "all accounts" search
    const raw = account
      ? (ledgerData.find((e) => e.account === account)?.reference ?? account)
      : null;
    const accountCode = raw ? raw.split("-")[0].trim() : "";

    const params = new URLSearchParams();
    if (fromDate) params.set("startDate", fromDate.toISOString().split("T")[0]);
    if (toDate) params.set("endDate", toDate.toISOString().split("T")[0]);

    const endpoint = accountCode
      ? `/reports/general-ledger/${accountCode}?${params.toString()}`
      : `/reports/general-ledger/all?${params.toString()}`;

    setLoading(true);
    setActivePage(1);
    try {
      console.log(
        "Fetching for account:",
        accountCode || "ALL",
        "| params:",
        params.toString(),
      );
      const { data } = await api.get<GLEntry[]>(endpoint);
      console.log("API Response:", data);

      const accountEntryType = account
        ? (ledgerData.find((e) => e.account === account)?.type ?? "other")
        : "other";

      const mapped: LedgerEntry[] = data.map((e) => ({
        date: new Date(e.date).toLocaleDateString("en-PK"),
        account: account
          ? `${account}`
          : e.accountNumber
            ? `${e.accountNumber}${e.accountName ? ` - ${e.accountName}` : " - Not Found"}`
            : "",
        type: e.accountType ? e.accountType.toLowerCase() : accountEntryType,
        reference: e.voucherNumber,
        description: e.description ?? "",
        debit: e.debit > 0 ? `Rs. ${e.debit.toLocaleString("en-US")}` : "Rs. 0",
        credit:
          e.credit > 0 ? `Rs. ${e.credit.toLocaleString("en-US")}` : "Rs. 0",
        balance: `Rs. ${Math.abs(e.runningBalance).toLocaleString("en-US")}`,
        debitAmount: Number(e.debit) || 0,
        creditAmount: Number(e.credit) || 0,
      }));

      setBackendRows(mapped);
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to fetch ledger entries from the server.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [account, fromDate, toDate, ledgerData]);

  // Auto-fetch on mount and whenever account or date filters change
  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const startIndex = (activePage - 1) * pageSize;
  const paginatedData = displayData.slice(startIndex, startIndex + pageSize);

  // Use raw numeric fields — no string parsing needed
  const totalDebits = displayData.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredits = displayData.reduce((sum, e) => sum + e.creditAmount, 0);
  const netBalance = totalDebits - totalCredits;

  const printLedgerPdf = () => {
    // Derive the account code (stored as `reference` in ledgerData)
    const selectedCode = account
      ? ledgerData.find((e) => e.account === account)?.reference
      : undefined;

    if (!selectedCode) {
      notifications.show({
        title: "Select an Account",
        message:
          "Please select an account from the filter to generate the ledger PDF.",
        color: "yellow",
      });
      return;
    }

    const params = new URLSearchParams();
    if (fromDate) params.set("startDate", fromDate.toISOString().split("T")[0]);
    if (toDate) params.set("endDate", toDate.toISOString().split("T")[0]);

    // Attach token + brand so the backend can authorise a plain browser navigation
    const token = localStorage.getItem("access_token") ?? "";
    const brand = localStorage.getItem("brand") ?? "chemtronics";
    params.set("token", token);
    params.set("brand", brand);

    const url = `${apiBaseURL}/reports/general-ledger/${selectedCode}/pdf?${params.toString()}`;
    window.open(url, "_blank");
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
        <Group gap="xs">
          <Button
            variant="outline"
            color="#000080"
            leftSection={<IconPrinter size={16} />}
            onClick={printLedgerPdf}
          >
            Print Ledger PDF
          </Button>
        </Group>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
            <Group>
              <IconArrowDownRight size={30} color="green" />
              <div>
                <Text size="sm">Total Debits</Text>
                <Text fw={700} size="lg">
                  Rs.{" "}
                  {totalDebits.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  Rs.{" "}
                  {totalCredits.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card shadow="sm" p="lg" radius="md" withBorder bg="#F1FCF0">
            <Group>
              <IconCash size={30} color={netBalance >= 0 ? "blue" : "red"} />
              <div>
                <Text size="sm">
                  {netBalance >= 0 ? "Debit Balance" : "Credit Balance"}
                </Text>
                <Text
                  fw={700}
                  size="lg"
                  c={netBalance >= 0 ? "#0A6802" : "red"}
                >
                  Rs.{" "}
                  {Math.abs(netBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                {!account && (
                  <Text size="xs" c="dimmed" mt={4}>
                    Select a specific account to see its current balance.
                  </Text>
                )}
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
                  {displayData.length}
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
                e.currentTarget.value ? new Date(e.currentTarget.value) : null,
              )
            }
          />
          <TextInput
            type="date"
            placeholder="To Date"
            value={toDate ? toDate.toISOString().split("T")[0] : ""}
            onChange={(e) =>
              setToDate(
                e.currentTarget.value ? new Date(e.currentTarget.value) : null,
              )
            }
          />
          <Button
            color="#0A6802"
            leftSection={<IconFilter size={16} />}
            onClick={fetchLedger}
            loading={loading}
          >
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
                    {(() => {
                      const t = (entry.type || "").toLowerCase();
                      const colorMap: Record<string, string> = {
                        asset: "blue",
                        revenue: "green",
                        expense: "orange",
                        liability: "red",
                        equity: "violet",
                      };
                      return (
                        <Badge color={colorMap[t] ?? "gray"}>
                          {entry.type || "OTHER"}
                        </Badge>
                      );
                    })()}
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
            total={Math.ceil(displayData.length / pageSize)}
            value={activePage}
            onChange={setActivePage}
          />
        </Group>
      </Card>
    </div>
  );
}
