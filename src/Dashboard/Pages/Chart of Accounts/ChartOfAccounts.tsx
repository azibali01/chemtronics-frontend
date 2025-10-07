import { useState, useEffect } from "react";
import type { JSX } from "react";
import {
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Select,
  Divider,
  ActionIcon,
  Checkbox,
  Pagination, // <-- add this
} from "@mantine/core";
import {
  IconBuildingBank,
  IconCurrencyDollar,
  IconChartBar,
  IconCreditCard,
  IconUsers,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
// ...existing code...

// ...existing code...
import type { AccountNode } from "../../Context/ChartOfAccountsContext";
import axios from "axios";

// Types and initial data
// Helper: Count all accounts (including nested) under a given main parent code (e.g. '1000' for Assets)
function countAccountsByParentCode(
  accounts: AccountNode[],
  parentCode: string
): number {
  let count = 0;
  function walk(nodes: AccountNode[]) {
    for (const acc of nodes) {
      // If this account or any ancestor has parentAccount starting with parentCode, count it
      if (
        acc.parentAccount &&
        acc.parentAccount.split("-")[0].trim() === parentCode
      ) {
        count++;
      }
      if (acc.children) walk(acc.children);
    }
  }
  walk(accounts);
  return count;
}

type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
type AccountGroupType = "Group" | "Detail";

// Helper to flatten all accounts into a list with parent and path info
type FlattenedAccount = {
  acc: AccountNode;
  parent: string | null;
  subaccount: string | null;
  path: string;
};

function flattenAccounts(
  accounts: AccountNode[],
  allAccounts: AccountNode[]
): FlattenedAccount[] {
  const result: FlattenedAccount[] = [];
  // ---
  function walk(nodes: AccountNode[]) {
    for (const acc of nodes) {
      let parent = null;
      if (acc.parentAccount) {
        const parts = acc.parentAccount.split("-");
        if (parts.length > 1) {
          parent = parts.slice(1).join("-");
        }
      }
      // Set subaccount as a comma-separated list of immediate children names (if any)
      let subaccount = null;
      if (acc.children && acc.children.length > 0) {
        subaccount = acc.children.map((child) => child.accountName).join(", ");
      }
      const path = getAccountPath(allAccounts, acc.selectedCode);
      result.push({ acc, parent, subaccount, path });
      if (acc.children) walk(acc.children);
    }
  }
  walk(accounts);
  return result;
}

// Helper to get full path (subaccount hierarchy) for an account (from root to this account)
function getAccountPath(accounts: AccountNode[], code: string): string {
  let result: string[] = [];
  function dfs(nodes: AccountNode[], target: string, curr: string[]): boolean {
    for (const acc of nodes) {
      const next = [...curr, acc.accountName];
      if (acc.selectedCode === target) {
        result = next;
        return true;
      }
      if (acc.children && dfs(acc.children, target, next)) return true;
    }
    return false;
  }
  dfs(accounts, code, []);
  return result.length > 0 ? result.join(" > ") : "";
}

function renderAccountsTable(
  accounts: AccountNode[],
  allAccounts: AccountNode[],
  onEdit: (acc: AccountNode) => void,
  onDelete: (code: string) => void
): JSX.Element {
  const flat = flattenAccounts(accounts, allAccounts);
  // Mapping for Level 1 and Level 2 codes to labels
  const level1Map: Record<string, string> = {
    "1100": "Current Assets",
    "1200": "Fixed Assets",
    "1300": "Inventories",
    "1400": "Receivables",
    "1500": "Advances & Commissions",
    "2100": "Captial",
    "2200": "Current Liabilities",
    "2300": "Other",
    "2400": "Salesman Account",
    "2500": "Bismillah",
    "4100": "Sales Control Account",
    "5100": "Administrative Expenses",
    "5200": "Selling Expenses",
    "5300": "Financial Charges",
    "5400": "Other Charges",
    "Share Capital": "Share Capital",
  };
  const level2Map: Record<string, string> = {
    "1110": "Cash",
    "1120": "Bank Accounts",
    "1130": "Other Current Assets",
    "1410": "Receivables Accounts",
    "1510": "Salesman Account",
    "2210": "Purchase Party",
    "2220": "Advance Exp.",
    "4110": "Sales",
    "5110": "Salaries",
    "5120": "Rent",
    "5130": "Utilities",
    "5140": "Depreciation",
    "5210": "Advertising",
    "5220": "Sales Commission",
    "5310": "Bank Charges",
    "5320": "Interest Expense",
    "5410": "Miscellaneous",
    "1121": "Meezan Bank",
  };
  // Main parent code to label
  const parentMap: Record<string, string> = {
    "1000": "Assets",
    "2000": "Liabilities",
    "3000": "Equity",
    "4000": "Revenue",
    "5000": "Expenses",
  };
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: 4 }}>Sr No</th>
          <th style={{ textAlign: "left", padding: 4 }}>Account Code</th>
          <th style={{ textAlign: "left", padding: 4 }}>Account Name</th>
          <th style={{ textAlign: "left", padding: 4 }}>Level 1 Type</th>
          <th style={{ textAlign: "left", padding: 4 }}>Level 2 Type</th>
          <th style={{ textAlign: "left", padding: 4 }}>Parent</th>
          <th style={{ textAlign: "left", padding: 4 }}>Subaccount(s)</th>
          <th style={{ textAlign: "left", padding: 4 }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {flat.map(({ acc, parent, subaccount }, idx) => {
          const level1Label =
            acc.selectedAccountType1 && level1Map[acc.selectedAccountType1]
              ? level1Map[acc.selectedAccountType1]
              : acc.selectedAccountType1 || "-";
          const level2Label =
            acc.selectedAccountType2 && level2Map[acc.selectedAccountType2]
              ? level2Map[acc.selectedAccountType2]
              : acc.selectedAccountType2 || "-";
          // Parent label: find parent account by selectedCode
          let parentLabel = "-";
          if (parent) {
            const parentAcc = allAccounts.find(
              (a) => a.selectedCode === parent
            );
            if (parentAcc && parentAcc.accountName) {
              parentLabel = parentAcc.accountName;
            } else {
              parentLabel =
                parentMap[parent] ||
                level1Map[parent] ||
                level2Map[parent] ||
                parent;
            }
          }
          return (
            <tr
              key={`${acc.selectedCode}-${idx}`}
              style={{ borderBottom: "1px solid #eee" }}
            >
              <td style={{ padding: 4 }}>{idx + 1}</td>
              <td style={{ padding: 4 }}>{acc.accountCode}</td>
              <td
                style={{
                  padding: 4,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {acc.accountName}
              </td>
              <td style={{ padding: 4 }}>{level1Label}</td>
              <td style={{ padding: 4 }}>{level2Label}</td>
              <td style={{ padding: 4 }}>{parentLabel}</td>
              <td style={{ padding: 4 }}>{subaccount || "-"}</td>
              <td style={{ padding: 4 }}>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={() => onEdit(acc)}
                  title="Edit Account"
                >
                  <IconEdit size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  onClick={() => acc.selectedCode && onDelete(acc.selectedCode)}
                  title="Delete Account"
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
// Fetch accounts from backend
async function fetchAccounts(setAccounts: (accs: AccountNode[]) => void) {
  try {
    const res = await axios.get("http://localhost:3000/chart-of-account");
    if (Array.isArray(res.data)) {
      setAccounts(res.data);
    }
  } catch (err) {
    // Optionally handle error
    console.error("Failed to fetch accounts", err);
  }
}

export default function ChartOfAccounts() {
  // Always call hooks unconditionally
  const { accounts, setAccounts } = useChartOfAccounts();

  // State hooks
  const PAGE_SIZE = 15;
  const [opened, setOpened] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedCode, setSelectedCode] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [level, setLevel] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [parentAccount, setParentAccount] = useState<string>("");
  const [type, setType] = useState<AccountGroupType>("Group");
  const [isParty, setIsParty] = useState(false);
  const [address, setAddress] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [salesTaxNo, setSalesTaxNo] = useState("");
  const [ntn, setNtn] = useState("");
  const [editing, setEditing] = useState<AccountNode | null>(null);
  const [search, setSearch] = useState("");
  const [filterParent, setFilterParent] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedAccountType1, setSelectedAccountType1] = useState<string>("");
  const [selectedAccountType2, setSelectedAccountType2] = useState<string>("");

  // Level 1 options for Equity
  const equityAccountTypeOptions = [
    { value: "Share Capital", label: "Share Capital" },
  ];
  // Hardcoded 5 main parent account options for Parent Account dropdown
  const parentOptions = [
    { value: "1000", label: "1000 - Assets" },
    { value: "2000", label: "2000 - Liabilities" },
    { value: "3000", label: "3000 - Equity" },
    { value: "4000", label: "4000 - Revenue" },
    { value: "5000", label: "5000 - Expenses" },
  ];

  // Handlers
  const handleCreateOrUpdate = async () => {
    // Determine accountType based on main parent
    let resolvedAccountType: AccountType | null = accountType;
    if (
      [
        "1000",
        "1100",
        "1200",
        "1300",
        "1400",
        "1500",
        "1110",
        "1120",
        "1130",
        "1410",
        "1510",
        "1121",
      ].includes(parentAccount) ||
      selectedAccountType1?.startsWith("1")
    ) {
      resolvedAccountType = "Asset";
    } else if (
      ["2000", "2100", "2200", "2300", "2400", "2500", "2210", "2220"].includes(
        parentAccount
      ) ||
      selectedAccountType1?.startsWith("2")
    ) {
      resolvedAccountType = "Liability";
    } else if (
      ["3000"].includes(parentAccount) ||
      selectedAccountType1 === "Share Capital"
    ) {
      resolvedAccountType = "Equity";
    } else if (
      ["4000", "4100", "4110"].includes(parentAccount) ||
      selectedAccountType1?.startsWith("4")
    ) {
      resolvedAccountType = "Revenue";
    } else if (
      [
        "5000",
        "5100",
        "5200",
        "5300",
        "5400",
        "5110",
        "5120",
        "5130",
        "5140",
        "5210",
        "5220",
        "5310",
        "5320",
        "5410",
      ].includes(parentAccount) ||
      selectedAccountType1?.startsWith("5")
    ) {
      resolvedAccountType = "Expense";
    }
    const payload = {
      selectedCode,
      selectedAccountType1,
      selectedAccountType2,
      accountCode,
      level,
      accountName,
      accountType: resolvedAccountType,
      parentAccount,
      type,
      isParty,
      address,
      phoneNo,
      salesTaxNo,
      ntn,
    };
    try {
      console.log("Creating new Chart of Account:", payload);
      await axios.post("http://localhost:3000/chart-of-account", payload);
      await fetchAccounts(setAccounts);
      // Only clear the form if not editing (i.e., creating new)
      if (!editing) {
        setSelectedCode("");
        setAccountCode("");
        setLevel("");
        setAccountName("");
        setAccountType(null);
        setParentAccount("");
        setType("Group");
        setIsParty(false);
        setAddress("");
        setPhoneNo("");
        setSalesTaxNo("");
        setNtn("");
        setSelectedAccountType1("");
        setSelectedAccountType2("");
      }
      setEditing(null);
      setOpened(false);
    } catch (err) {
      console.error("Failed to create/update account", err);
    }
  };

  const handleEdit = (acc: AccountNode) => {
    setEditing(acc);
    setAccountCode(acc.accountCode);
    setSelectedCode(acc.selectedCode);
    setLevel(acc.level);
    setAccountName(acc.accountName);
    setAccountType(acc.accountType);
    if (["1000", "2000", "3000", "4000", "5000"].includes(acc.selectedCode)) {
      setParentAccount(acc.selectedCode);
    } else {
      setParentAccount(acc.parentAccount);
    }
    setType(acc.type);
    setIsParty(acc.isParty);
    setAddress(acc.address || "");
    setPhoneNo(acc.phoneNo || "");
    setSalesTaxNo(acc.salesTaxNo || "");
    setNtn(acc.ntn || "");
    setOpened(true);
  };

  const handleDelete = (code: string) => {
    setDeleteId(code);
  };
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await axios.delete(
          `http://localhost:3000/chart-of-account/${deleteId}`
        );
        await fetchAccounts(setAccounts);
      } catch (err) {
        console.error("Failed to delete account", err);
      }
    }
    setDeleteId(null);
  };

  // Filter by parent account
  let filteredAccounts = filterParent
    ? accounts.filter((acc) => {
        if (!acc.parentAccount) return false;
        const parentCode = acc.parentAccount.split("-")[0];
        return parentCode === filterParent;
      })
    : accounts;

  // Filter by search (only account name)
  if (search.trim() !== "") {
    const searchLower = search.trim().toLowerCase();
    filteredAccounts = filteredAccounts.filter(
      (acc) =>
        acc.accountName && acc.accountName.toLowerCase().includes(searchLower)
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(filteredAccounts.length / PAGE_SIZE) || 1;
  const paginatedAccounts = filteredAccounts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Fetch accounts on mount
  useEffect(() => {
    // If only parent is selected, do not increment, just clear accountCode
    if (
      parentAccount &&
      (!selectedAccountType1 || selectedAccountType1 === "") &&
      (!selectedAccountType2 || selectedAccountType2 === "")
    ) {
      setAccountCode("");
      return;
    }

    // If Level 2 is selected, increment under Level 2
    let codeBase = "";
    let codeLabel = "";
    if (selectedAccountType2 && /^\d{4,}/.test(selectedAccountType2)) {
      codeBase =
        selectedAccountType2.match(/^\d{4,}/)?.[0] || selectedAccountType2;
      codeLabel = selectedAccountType2;
    } else if (selectedAccountType1 && /^\d{4,}/.test(selectedAccountType1)) {
      codeBase =
        selectedAccountType1.match(/^\d{4,}/)?.[0] || selectedAccountType1;
      codeLabel = selectedAccountType1;
    }

    if (codeBase) {
      // For increment, use first 3 digits for Level 2 (e.g., 411 for 4110)
      const codePrefix = codeBase.substring(0, 3);
      // Find all siblings with the same parent and code prefix
      const siblings = accounts.filter((acc) => {
        if (!acc.parentAccount || !acc.accountCode) return false;
        const accParentCodeMatch = acc.parentAccount.match(/^\d{4,}/);
        const accParentCode = accParentCodeMatch
          ? accParentCodeMatch[0]
          : acc.parentAccount;
        const accParentLabel = acc.parentAccount.trim();
        const parentMatch =
          accParentCode === codeBase || accParentLabel === codeLabel;
        const codeMatch = acc.accountCode.startsWith(codePrefix);
        return parentMatch && codeMatch;
      });
      // Collect all used suffixes (after prefix)
      const usedSuffixes = new Set(
        siblings.map((acc) => {
          const code = acc.accountCode;
          return code.length > 3 ? parseInt(code.substring(3), 10) : 0;
        })
      );
      // Find the smallest available suffix >= 1
      let nextSuffix = 1;
      while (usedSuffixes.has(nextSuffix)) {
        nextSuffix++;
      }
      setAccountCode(codePrefix + nextSuffix);
    } else {
      setAccountCode("");
    }
  }, [parentAccount, selectedAccountType1, selectedAccountType2, accounts]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, filterParent]);

  // Account counts for dashboard cards
  const assetCount = countAccountsByParentCode(accounts, "1000");
  const liabilityCount = countAccountsByParentCode(accounts, "2000");
  const equityCount = countAccountsByParentCode(accounts, "3000");
  const revenueCount = countAccountsByParentCode(accounts, "4000");
  const expenseCount = countAccountsByParentCode(accounts, "5000");

  if (!accounts || accounts.length === 0) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder bg="#fffbe0">
        <Text color="#a00" fw={700}>
          No Chart of Accounts data found.
        </Text>
        <Text color="#a00">Check backend API or context provider.</Text>
      </Card>
    );
  }

  return (
    <div className="p-6">
      <Group justify="space-between" mb="lg">
        <Text size="xl" fw={600}>
          Chart of Accounts
        </Text>
        <Button
          color="#0A6802"
          onClick={() => {
            setEditing(null);
            setSelectedCode("");
            // Find max accountCode and increment
            let maxCode = 0;
            accounts.forEach((acc) => {
              const codeNum = parseInt(acc.accountCode, 10);
              if (!isNaN(codeNum) && codeNum > maxCode) maxCode = codeNum;
            });
            setAccountCode(maxCode ? String(maxCode + 1) : "1001");
            setLevel("");
            setAccountName("");
            setAccountType(null);
            setParentAccount("");
            setType("Group");
            setIsParty(false);
            setAddress("");
            setPhoneNo("");
            setSalesTaxNo("");
            setNtn("");
            setSelectedAccountType1("");
            setSelectedAccountType2("");
            setOpened(true);
          }}
        >
          + Add Account
        </Button>
      </Group>
      <Group grow mb="xl">
        <Card withBorder padding="lg">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={600}>Assets</Text>
              <Text size="xl" fw={700}>
                {assetCount} Accounts
              </Text>
            </Stack>
            <IconBuildingBank size={32} color="blue" />
          </Group>
        </Card>
        <Card withBorder padding="lg">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={600}>Liabilities</Text>
              <Text size="xl" fw={700}>
                {liabilityCount} Accounts
              </Text>
            </Stack>
            <IconCreditCard size={32} color="red" />
          </Group>
        </Card>
        <Card withBorder padding="lg">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={600}>Equity</Text>
              <Text size="xl" fw={700}>
                {equityCount} Accounts
              </Text>
            </Stack>
            <IconUsers size={32} color="#0A6802" />
          </Group>
        </Card>
        <Card withBorder padding="lg">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={600}>Revenue</Text>
              <Text size="xl" fw={700}>
                {revenueCount} Accounts
              </Text>
            </Stack>
            <IconChartBar size={32} color="teal" />
          </Group>
        </Card>
        <Card withBorder padding="lg">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={600}>Expenses</Text>
              <Text size="xl" fw={700}>
                {expenseCount} Accounts
              </Text>
            </Stack>
            <IconCurrencyDollar size={32} color="orange" />
          </Group>
        </Card>
      </Group>
      <Card withBorder padding="lg">
        <Stack>
          <Text fw={600}>Account Structure</Text>
          <Group grow mt="sm">
            <TextInput
              label="Search"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <Select
              placeholder="Filter by Parent Account"
              label="Filter by Parent Account"
              data={parentOptions}
              value={filterParent}
              onChange={(v) => setFilterParent(v || "")}
              clearable
            />
          </Group>
          <Divider />
          {renderAccountsTable(
            paginatedAccounts,
            accounts,
            handleEdit,
            handleDelete
          )}
          <Group justify="center" mt="md">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="md"
              radius="xl"
              color="#0A6802"
              disabled={totalPages <= 1}
            />
          </Group>
        </Stack>
      </Card>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          editing ? (
            <strong>Edit Account</strong>
          ) : (
            <strong>Add New Account</strong>
          )
        }
        centered
        size="lg"
      >
        <Stack>
          <Group grow>
            <TextInput
              label="Selected Code"
              placeholder="Selected Code"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.currentTarget.value)}
              disabled={!!editing}
            />
            <TextInput
              label="Account Code"
              placeholder="Account Code"
              value={accountCode}
              onChange={(e) => setAccountCode(e.currentTarget.value)}
              disabled={!!editing || accountCode !== ""}
            />
          </Group>
          <Group grow>
            <Select
              label="Parent Account"
              placeholder="Select parent account"
              data={parentOptions}
              value={parentAccount}
              onChange={(v) => {
                // If main parent selected, set selectedCode and parentAccount to the code (e.g. '2000')
                if (
                  v === "1000" ||
                  v === "2000" ||
                  v === "3000" ||
                  v === "4000" ||
                  v === "5000"
                ) {
                  setSelectedCode(v);
                  setParentAccount(v);
                } else {
                  setParentAccount(v || "");
                }
              }}
              clearable
            />
            {/* Only show Account Type select if not in multi-level type selection mode */}
            {!(
              parentAccount === "1000" ||
              parentAccount === "2000" ||
              parentAccount === "3000" ||
              parentAccount === "4000" ||
              parentAccount === "5000" ||
              (selectedAccountType1 && parentAccount.length === 4) ||
              (selectedAccountType2 && parentAccount.length === 4)
            ) && (
              <Select
                label="Account Type"
                placeholder="Select account type"
                data={[]}
                value={accountType as string}
                onChange={(v) => setAccountType(v as AccountType)}
                disabled
              />
            )}
          </Group>
          <Group grow>
            {/* --- Main Parent: ASSETS --- */}
            {parentAccount === "1000" && (
              <>
                <Select
                  label="Account Type (Level 1)"
                  placeholder="Select account type"
                  data={[
                    { value: "1100", label: "1100 - Current Assets" },
                    { value: "1200", label: "1200 - Fixed Assets" },
                    { value: "1300", label: "1300 - Inventories" },
                    { value: "1400", label: "1400 - Receivables" },
                    { value: "1500", label: "1500 - Advances & Commissions" },
                  ]}
                  value={selectedAccountType1}
                  onChange={(v) => {
                    setSelectedAccountType1(v || "");
                    setSelectedAccountType2("");
                  }}
                  clearable
                />
                {/* Level 2 for Assets */}
                {selectedAccountType1 === "1100" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Current Assets"
                    data={[
                      { value: "1110", label: "1110 - Cash" },
                      { value: "1120", label: "1120 - Bank Accounts" },
                      { value: "1130", label: "1130 - Other Current Assets" },
                    ]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
                {selectedAccountType1 === "1400" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Receivables"
                    data={[
                      { value: "1410", label: "1410 - Receivables Accounts" },
                    ]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
                {selectedAccountType1 === "1500" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Advances & Commissions"
                    data={[{ value: "1510", label: "1510 - Salesman Account" }]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
              </>
            )}
            {/* --- Main Parent: LIABILITIES --- */}
            {parentAccount === "2000" && (
              <>
                <Select
                  label="Account Type (Level 1)"
                  placeholder="Select account type"
                  data={[
                    { value: "2100", label: "2100 - Captial" },
                    { value: "2200", label: "2200 - Current Liabilities" },
                    { value: "2300", label: "2300 - Other" },
                    { value: "2400", label: "2400 - Salesman Account" },
                    { value: "2500", label: "2500 - Bismillah" },
                  ]}
                  value={selectedAccountType1}
                  onChange={(v) => {
                    setSelectedAccountType1(v || "");
                    setSelectedAccountType2("");
                  }}
                  clearable
                />
                {selectedAccountType1 === "2200" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Current Liabilities"
                    data={[
                      { value: "2210", label: "2210 - Purchase Party" },
                      { value: "2220", label: "2220 - Advance Exp." },
                    ]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
              </>
            )}
            {/* --- Main Parent: EQUITY --- */}
            {parentAccount === "3000" && (
              <Select
                label="Account Type"
                placeholder="Select account type"
                data={equityAccountTypeOptions}
                value={selectedAccountType1}
                onChange={(v) => setSelectedAccountType1(v || "")}
                clearable
              />
            )}
            {/* --- Main Parent: REVENUE --- */}
            {parentAccount === "4000" && (
              <>
                <Select
                  label="Account Type (Level 1)"
                  placeholder="Select account type"
                  data={[
                    { value: "4100", label: "4100 - Sales Control Account" },
                  ]}
                  value={selectedAccountType1}
                  onChange={(v) => {
                    setSelectedAccountType1(v || "");
                    setSelectedAccountType2("");
                  }}
                  clearable
                />
                {selectedAccountType1 === "4100" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Sales Control Account"
                    data={[{ value: "4110", label: "4110 - Sales" }]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
              </>
            )}
            {/* --- Main Parent: EXPENSES --- */}
            {parentAccount === "5000" && (
              <>
                <Select
                  label="Account Type (Level 1)"
                  placeholder="Select account type"
                  data={[
                    { value: "5100", label: "5100 - Administrative Expenses" },
                    { value: "5200", label: "5200 - Selling Expenses" },
                    { value: "5300", label: "5300 - Financial Charges" },
                    { value: "5400", label: "5400 - Other Charges" },
                  ]}
                  value={selectedAccountType1}
                  onChange={(v) => {
                    setSelectedAccountType1(v || "");
                    setSelectedAccountType2("");
                  }}
                  clearable
                />
                {selectedAccountType1 === "5100" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Administrative Expenses"
                    data={[
                      { value: "5110", label: "5110 - Salaries" },
                      { value: "5120", label: "5120 - Rent" },
                      { value: "5130", label: "5130 - Utilities" },
                      { value: "5140", label: "5140 - Depreciation" },
                    ]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
                {selectedAccountType1 === "5200" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Selling Expenses"
                    data={[
                      { value: "5210", label: "5210 - Advertising" },
                      { value: "5220", label: "5220 - Sales Commission" },
                    ]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
                {selectedAccountType1 === "5300" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Financial Charges"
                    data={[
                      { value: "5310", label: "5310 - Bank Charges" },
                      { value: "5320", label: "5320 - Interest Expense" },
                    ]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
                {selectedAccountType1 === "5400" && (
                  <Select
                    label="Account Type (Level 2)"
                    placeholder="Select subaccount of Other Charges"
                    data={[{ value: "5410", label: "5410 - Miscellaneous" }]}
                    value={selectedAccountType2}
                    onChange={(v) => setSelectedAccountType2(v || "")}
                    clearable
                  />
                )}
              </>
            )}
          </Group>
          <Group grow>
            <TextInput
              label="Level"
              placeholder="Level"
              value={level}
              onChange={(e) => setLevel(e.currentTarget.value)}
            />
            <TextInput
              label="Account Name"
              placeholder="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <Select
              label="Type"
              data={["Group", "Detail"]}
              value={type}
              onChange={(v) => setType((v as AccountGroupType) || "Group")}
            />
          </Group>
          <Checkbox
            label="Is Party"
            color="#0A6802"
            labelPosition="left"
            size="md"
            checked={isParty}
            onChange={(e) => setIsParty(e.currentTarget.checked)}
          />
          <Group grow>
            <TextInput
              label="Address"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.currentTarget.value)}
            />
            <TextInput
              label="Phone No"
              placeholder="Phone No"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.currentTarget.value)}
              type="number"
            />
          </Group>
          <Group grow>
            <TextInput
              label="Sales Tax#"
              placeholder="Sales Tax#"
              value={salesTaxNo}
              onChange={(e) => setSalesTaxNo(e.currentTarget.value)}
              type="number"
            />
            <TextInput
              label="NTN"
              placeholder="NTN"
              value={ntn}
              onChange={(e) => setNtn(e.currentTarget.value)}
              type="number"
            />
          </Group>
          <Group justify="flex-end" mt="md">
            <Button color="#0A6802" onClick={handleCreateOrUpdate}>
              {editing ? "Update Account" : "Create Account"}
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Modal
        opened={!!deleteId}
        onClose={() => setDeleteId(null)}
        title={<strong>Delete Account</strong>}
        centered
      >
        <Text mb="md">Are you sure you want to delete this account?</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button color="red" onClick={confirmDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
