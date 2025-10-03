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
  ScrollArea,
  ActionIcon,
  Checkbox,
} from "@mantine/core";
import {
  IconBuildingBank,
  IconCurrencyDollar,
  IconChartBar,
  IconCreditCard,
  IconUsers,
  IconEdit,
  IconTrash,
  IconArrowDown,
} from "@tabler/icons-react";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import type { AccountNode } from "../../Context/ChartOfAccountsContext";
import axios from "axios";

// Types and initial data

type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
type AccountGroupType = "Group" | "Detail";

function filterAccounts(
  accounts: AccountNode[],
  search: string,
  type: AccountType | null
): AccountNode[] {
  const match = (acc: AccountNode) => {
    const searchMatch =
      !search ||
      acc.accountName.toLowerCase().includes(search.toLowerCase()) ||
      acc.selectedCode.includes(search);
    const typeMatch = !type || acc.accountType === type;
    return searchMatch && typeMatch;
  };

  return accounts
    .map((acc) => {
      const filteredChildren = acc.children
        ? filterAccounts(acc.children, search, type)
        : [];
      if (match(acc) || filteredChildren.length > 0) {
        return { ...acc, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as AccountNode[];
}

function renderAccounts(
  data: AccountNode[],
  onEdit: (acc: AccountNode) => void,
  onDelete: (code: string) => void,
  expanded: Record<string, boolean>,
  setExpanded: (exp: Record<string, boolean>) => void,
  level = 0
): JSX.Element[] {
  return data.flatMap(function (acc) {
    return [
      <div key={acc.selectedCode} style={{ marginLeft: level * 20 }}>
        <Group align="center" py={4} gap={8} style={{ width: "100%" }}>
          {/* Expand/collapse arrow for accounts with children */}
          {acc.children && acc.children.length > 0 && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => {
                setExpanded({
                  ...expanded,
                  [acc.selectedCode]: !expanded[acc.selectedCode],
                });
              }}
              size={24}
            >
              {expanded[acc.selectedCode] ? (
                <IconArrowDown color="#0A6802" size={16} />
              ) : (
                <IconArrowDown
                  style={{ transform: "rotate(-90deg)" }}
                  size={16}
                  color="#0A6802"
                />
              )}
            </ActionIcon>
          )}
          {/* Show summary card icon for top-level accounts, else nothing */}
          {level === 0 && (
            <span style={{ marginRight: 8 }}>
              {acc.accountType === "Asset" && (
                <IconBuildingBank size={24} color="blue" />
              )}
              {acc.accountType === "Liability" && (
                <IconCreditCard size={24} color="red" />
              )}
              {acc.accountType === "Equity" && (
                <IconUsers size={24} color="#0A6802" />
              )}
              {acc.accountType === "Revenue" && (
                <IconChartBar size={24} color="teal" />
              )}
              {acc.accountType === "Expense" && (
                <IconCurrencyDollar size={24} color="orange" />
              )}
            </span>
          )}
          <Text fw={600} style={{ textTransform: "uppercase" }}>
            {acc.accountName}
          </Text>
          <div style={{ flex: 1 }} />
          {/* Edit and Delete icons */}
          <ActionIcon
            variant="subtle"
            color="#0A6802"
            onClick={() => onEdit(acc)}
            title="Edit Account"
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onDelete(acc.selectedCode)}
            title="Delete Account"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
        {acc.children &&
          expanded[acc.selectedCode] &&
          renderAccounts(
            acc.children,
            onEdit,
            onDelete,
            expanded,
            setExpanded,
            level + 1
          )}
      </div>,
    ];
  });
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
  // Level 1 options for Equity
  const equityAccountTypeOptions = [
    { value: "Share Capital", label: "Share Capital" },
  ];
  // Expense flow options (Level 2 options still used below)
  const expenseAccountTypeOptions2: Record<
    string,
    { value: string; label: string }[]
  > = {
    "Administrative Expenses": [
      { value: "Salaries", label: "Salaries" },
      { value: "Rent", label: "Rent" },
      { value: "Utilities", label: "Utilities" },
      { value: "Depreciation", label: "Depreciation" },
    ],
    "Selling Expenses": [
      { value: "Advertising", label: "Advertising" },
      { value: "Sales Commission", label: "Sales Commission" },
    ],
    "Financial Charges": [
      { value: "Bank Charges", label: "Bank Charges" },
      { value: "Interest Expense", label: "Interest Expense" },
    ],
    "Other Charges": [{ value: "Miscellaneous", label: "Miscellaneous" }],
  };
  const { accounts, setAccounts, expanded, setExpanded } = useChartOfAccounts();
  const [opened, setOpened] = useState(false);

  // Only show backend data, do not set demo data
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
  // Multi-level Account Type workflow for Assets and Liabilities
  const [editing, setEditing] = useState<AccountNode | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<AccountType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Only allow valid parent options for new accounts
  // If creating a direct child of 'Assets', only allow 'Assets' as parent
  // Level 1 options (under Assets and Liabilities)
  // Show only parent accounts in Parent Account field
  // Show all accounts except the one being created/edited as parent options
  // Only show the 5 main parent accounts in Parent Account dropdown
  // Hardcoded 5 main parent account options for Parent Account dropdown
  const parentOptions = [
    { value: "1000", label: "1000 - Assets" },
    { value: "2000", label: "2000 - Liabilities" },
    { value: "3000", label: "3000 - Equity" },
    { value: "4000", label: "4000 - Revenue" },
    { value: "5000", label: "5000 - Expenses" },
  ];

  // Multi-level Account Type workflow for Assets
  const [selectedAccountType1, setSelectedAccountType1] = useState<string>("");
  const [selectedAccountType2, setSelectedAccountType2] = useState<string>("");

  // Level 2 options for Liabilities
  const accountTypeOptionsLiabilities: Record<
    string,
    { value: string; label: string }[]
  > = {
    "Current Liabilities": [
      { value: "Purchase party", label: "Purchase party" },
      { value: "Advance Exp.", label: "Advance Exp." },
    ],
  };

  // Level 1 options for Assets

  // Level 2 options for Assets
  const accountTypeOptions2: Record<
    string,
    { value: string; label: string }[]
  > = {
    "Current Assets": [
      { value: "Cash", label: "Cash" },
      { value: "Bank Accounts", label: "Bank Accounts" },
      { value: "Other Current Assets", label: "Other Current Assets" },
    ],
    Receivables: [
      { value: "Receivables Accounts", label: "Receivables Accounts" },
    ],
    "Advances & Commissions": [
      { value: "Salesman Account", label: "Salesman Account" },
    ],
    "Bank Accounts": [{ value: "Meezan Bank", label: "Meezan Bank" }],
  };

  // Level 3 options for Assets

  const handleCreateOrUpdate = async () => {
    const payload = {
      selectedCode,
      accountCode,
      level,
      accountName,
      accountType,
      parentAccount,
      type,
      isParty,
      address,
      phoneNo,
      salesTaxNo,
      ntn,
    };
    try {
      await axios.post("http://localhost:3000/chart-of-account", payload);
      // Always re-fetch accounts after create/update
      await fetchAccounts(setAccounts);
    } catch (err) {
      console.error("Failed to create/update account", err);
    }
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
    setEditing(null);
    setOpened(false);
  };

  const handleEdit = (acc: AccountNode) => {
    setEditing(acc);
    setAccountCode(acc.accountCode);
    setSelectedCode(acc.selectedCode);
    setLevel(acc.level);
    setAccountName(acc.accountName);
    setAccountType(acc.accountType);
    setParentAccount(acc.parentAccount);
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

  const filteredAccounts = filterAccounts(accounts, search, filterType);

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts(setAccounts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // const filteredAccountsByCity = filterCity
  //   ? filteredAccounts.filter(
  //       (acc) =>
  //         acc.city === filterCity ||
  //         (acc.children &&
  //           acc.children.some((child) => child.city === filterCity))
  //     )
  //   : filteredAccounts;

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
                {/* TODO: Show dynamic asset total here */}
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
                {/* TODO: Show dynamic liabilities total here */}
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
                {/* TODO: Show dynamic equity total here */}
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
                {/* TODO: Show dynamic revenue total here */}
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
                {/* TODO: Show dynamic expenses total here */}
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
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <Select
              placeholder="Filter by type"
              data={["Asset", "Liability", "Equity", "Revenue", "Expense"]}
              value={filterType}
              onChange={(v) => setFilterType(v as AccountType)}
              clearable
            />
            {/*
            <Select
              placeholder="Filter by city"
              data={["Multan", "Faisalabad", "Lahore", "Karachi", "Rawalpindi"]}
              value={filterCity}
              onChange={setFilterCity}
              clearable
            />
            */}
          </Group>
          <Divider />
          <ScrollArea h={400}>
            {renderAccounts(
              filteredAccounts,
              handleEdit,
              handleDelete,
              expanded,
              setExpanded
            )}
          </ScrollArea>
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
              disabled={!!editing}
            />
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
            {/* Multi-level Account Type selection for Assets, Liabilities, Equity, Revenue, and Expense workflow */}
            {(parentAccount === "1000" ||
              parentAccount === "2000" ||
              parentAccount === "3000" ||
              parentAccount === "4000" ||
              parentAccount === "5000") && (
              <>
                {parentAccount === "1000" && (
                  <>
                    <Select
                      label="Account Type (Level 1)"
                      placeholder="Select account type"
                      data={[
                        {
                          value: "Current Assets",
                          label: "1100 - Current Assets",
                        },
                        { value: "Fixed Assets", label: "1200 - Fixed Assets" },
                        { value: "Inventories", label: "1300 - Inventories" },
                        { value: "Receivables", label: "1400 - Receivables" },
                        {
                          value: "Advances & Commissions",
                          label: "1500 - Advances & Commissions",
                        },
                      ]}
                      value={selectedAccountType1}
                      onChange={(v) => {
                        setSelectedAccountType1(v || "");
                        setSelectedAccountType2("");
                        setAccountType(v as AccountType);
                      }}
                      searchable
                    />
                    {selectedAccountType1 &&
                      accountTypeOptions2[selectedAccountType1] && (
                        <Select
                          label="Account Type (Level 2)"
                          placeholder={`Select subaccount of ${selectedAccountType1}`}
                          data={
                            selectedAccountType1 === "Current Assets"
                              ? [
                                  { value: "Cash", label: "1110 - Cash" },
                                  {
                                    value: "Bank Accounts",
                                    label: "1120 - Bank Accounts",
                                  },
                                  {
                                    value: "Other Current Assets",
                                    label: "1130 - Other Current Assets",
                                  },
                                ]
                              : selectedAccountType1 === "Receivables"
                              ? [
                                  {
                                    value: "Receivables Accounts",
                                    label: "1410 - Receivables Accounts",
                                  },
                                ]
                              : selectedAccountType1 ===
                                "Advances & Commissions"
                              ? [
                                  {
                                    value: "Salesman Account",
                                    label: "1510 - Salesman Account",
                                  },
                                ]
                              : selectedAccountType1 === "Bank Accounts"
                              ? [
                                  {
                                    value: "Meezan Bank",
                                    label: "1121 - Meezan Bank",
                                  },
                                ]
                              : []
                          }
                          value={selectedAccountType2}
                          onChange={(v) => {
                            setSelectedAccountType2(v || "");
                            setAccountType(v as AccountType);
                          }}
                          searchable
                        />
                      )}
                  </>
                )}
                {parentAccount === "2000" && (
                  <>
                    <Select
                      label="Account Type (Level 1)"
                      placeholder="Select account type"
                      data={[
                        { value: "Captial", label: "2100 - Captial" },
                        {
                          value: "Current Liabilities",
                          label: "2200 - Current Liabilities",
                        },
                        { value: "Other", label: "2300 - Other" },
                        {
                          value: "Salesman Account",
                          label: "2400 - Salesman Account",
                        },
                        { value: "Bismillah", label: "2500 - Bismillah" },
                      ]}
                      value={selectedAccountType1}
                      onChange={(v) => {
                        setSelectedAccountType1(v || "");
                        setSelectedAccountType2("");
                        setAccountType(v as AccountType);
                      }}
                      searchable
                    />
                    {selectedAccountType1 &&
                      accountTypeOptionsLiabilities[selectedAccountType1] && (
                        <Select
                          label="Account Type (Level 2)"
                          placeholder={`Select subaccount of ${selectedAccountType1}`}
                          data={
                            selectedAccountType1 === "Current Liabilities"
                              ? [
                                  {
                                    value: "Purchase party",
                                    label: "2210 - Purchase party",
                                  },
                                  {
                                    value: "Advance Exp.",
                                    label: "2220 - Advance Exp.",
                                  },
                                ]
                              : []
                          }
                          value={selectedAccountType2}
                          onChange={(v) => {
                            setSelectedAccountType2(v || "");
                            setAccountType(v as AccountType);
                          }}
                          searchable
                        />
                      )}
                  </>
                )}
                {parentAccount === "3000" && (
                  <Select
                    label="Account Type"
                    placeholder="Select account type"
                    data={equityAccountTypeOptions}
                    value={selectedAccountType1}
                    onChange={(v) => {
                      setSelectedAccountType1(v || "");
                      setAccountType(v as AccountType);
                    }}
                    searchable
                  />
                )}
                {parentAccount === "4000" && (
                  <>
                    <Select
                      label="Account Type (Level 1)"
                      placeholder="Select account type"
                      data={[
                        {
                          value: "Sales Control Account",
                          label: "4100 - Sales Control Account",
                        },
                      ]}
                      value={selectedAccountType1}
                      onChange={(v) => {
                        setSelectedAccountType1(v || "");
                        setSelectedAccountType2("");
                        setAccountType(v as AccountType);
                      }}
                      searchable
                    />
                    {selectedAccountType1 === "Sales Control Account" && (
                      <Select
                        label="Account Type (Level 2)"
                        placeholder="Select subaccount of Sales Control Account"
                        data={[{ value: "Sales", label: "4110 - Sales" }]}
                        value={selectedAccountType2}
                        onChange={(v) => {
                          setSelectedAccountType2(v || "");
                          setAccountType(v as AccountType);
                        }}
                        searchable
                      />
                    )}
                  </>
                )}
                {parentAccount === "5000" && (
                  <>
                    <Select
                      label="Account Type (Level 1)"
                      placeholder="Select account type"
                      data={[
                        {
                          value: "Administrative Expenses",
                          label: "5100 - Administrative Expenses",
                        },
                        {
                          value: "Selling Expenses",
                          label: "5200 - Selling Expenses",
                        },
                        {
                          value: "Financial Charges",
                          label: "5300 - Financial Charges",
                        },
                        {
                          value: "Other Charges",
                          label: "5400 - Other Charges",
                        },
                      ]}
                      value={selectedAccountType1}
                      onChange={(v) => {
                        setSelectedAccountType1(v || "");
                        setSelectedAccountType2("");
                        setAccountType(v as AccountType);
                      }}
                      searchable
                    />
                    {selectedAccountType1 &&
                      expenseAccountTypeOptions2[selectedAccountType1] && (
                        <Select
                          label="Account Type (Level 2)"
                          placeholder={`Select subaccount of ${selectedAccountType1}`}
                          data={
                            selectedAccountType1 === "Administrative Expenses"
                              ? [
                                  {
                                    value: "Salaries",
                                    label: "5110 - Salaries",
                                  },
                                  { value: "Rent", label: "5120 - Rent" },
                                  {
                                    value: "Utilities",
                                    label: "5130 - Utilities",
                                  },
                                  {
                                    value: "Depreciation",
                                    label: "5140 - Depreciation",
                                  },
                                ]
                              : selectedAccountType1 === "Selling Expenses"
                              ? [
                                  {
                                    value: "Advertising",
                                    label: "5210 - Advertising",
                                  },
                                  {
                                    value: "Sales Commission",
                                    label: "5220 - Sales Commission",
                                  },
                                ]
                              : selectedAccountType1 === "Financial Charges"
                              ? [
                                  {
                                    value: "Bank Charges",
                                    label: "5310 - Bank Charges",
                                  },
                                  {
                                    value: "Interest Expense",
                                    label: "5320 - Interest Expense",
                                  },
                                ]
                              : selectedAccountType1 === "Other Charges"
                              ? [
                                  {
                                    value: "Miscellaneous",
                                    label: "5410 - Miscellaneous",
                                  },
                                ]
                              : []
                          }
                          value={selectedAccountType2}
                          onChange={(v) => {
                            setSelectedAccountType2(v || "");
                            setAccountType(v as AccountType);
                          }}
                          searchable
                        />
                      )}
                  </>
                )}
              </>
            )}
            {parentAccount !== "1000" && parentAccount !== "2000" && (
              <Select
                label="Account Type"
                placeholder="Select account type"
                data={[]}
                value={accountType as string}
                onChange={(v) => setAccountType(v as AccountType)}
                disabled
              />
            )}
            {!editing && (
              <Select
                label="Parent Account"
                placeholder="Select parent account"
                data={parentOptions}
                value={parentAccount}
                onChange={(v) => setParentAccount(v || "")}
                searchable
              />
            )}
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
