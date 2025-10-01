import { useState, type ReactNode } from "react";
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
  IconCalculator,
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
import axios from "axios";

// Types and initial data

type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
type AccountGroupType = "Group" | "Detail";

type ParentAccount =
  | "1000-Assets"
  | "1100-Current-Assets"
  | "1110-CashInHands"
  | "1120-CashAtBank"
  | "1130-AccountsReceiveable"
  | "1200-fixedAssets"
  | "1220-Furniture & fixtures"
  | "2000-Liabilities"
  | "2100-current Liabilities"
  | "2110-AccountsPayable"
  | "2120-AccuredExpenses"
  | "2200-Long-Term Liabilites"
  | "2210-Bank Loan"
  | "300-Equity"
  | "3100-Owner's Equity"
  | "3200-Retained Earnings"
  | "4000-Revenue"
  | "4100-sales revenue"
  | "4200-serviceRevenue"
  | "5000-Expenses"
  | "5100-operating Expenses"
  | "5110-salaries & wages"
  | "5120-Rent Expense"
  | "5130-Utilities"
  | "5200- administrative expenses"
  | "5210-office supplies"
  | "5220-professional fees";

interface AccountNode {
  selectedCode: string;
  accountCode: string;
  level: string;
  accountName: string;
  accountType: AccountType;
  parentAccount: ParentAccount | string;
  type: AccountGroupType;
  isParty: boolean;
  address?: string;
  phoneNo?: string;
  salesTaxNo?: string;
  ntn?: string;
  icon?: ReactNode;
  children?: AccountNode[];
}

const initialAccounts: AccountNode[] = [
  {
    selectedCode: "1000",
    accountCode: "100",
    level: "1",
    accountName: "Assets",
    accountType: "Asset",
    parentAccount: "",
    type: "Group",
    isParty: false,
    address: "",
    phoneNo: "",
    salesTaxNo: "",
    ntn: "",
    icon: <IconCalculator />,
    children: [
      {
        selectedCode: "1100",
        accountCode: "110",
        level: "2",
        accountName: "Current Assets",
        accountType: "Asset",
        parentAccount: "1000-Assets",
        type: "Group",
        isParty: false,
        address: "",
        phoneNo: "",
        salesTaxNo: "",
        ntn: "",
        icon: <IconCalculator />,
        children: [
          {
            selectedCode: "1110",
            accountCode: "111",
            level: "3",
            accountName: "Cash in Hand",
            accountType: "Asset",
            parentAccount: "1100-Current-Assets",
            type: "Detail",
            isParty: false,
            address: "",
            phoneNo: "",
            salesTaxNo: "",
            ntn: "",
            icon: <IconCalculator />,
          },
          {
            selectedCode: "1120",
            accountCode: "112",
            level: "3",
            accountName: "Cash at Bank",
            accountType: "Asset",
            parentAccount: "1100-Current-Assets",
            type: "Detail",
            isParty: false,
            address: "",
            phoneNo: "",
            salesTaxNo: "",
            ntn: "",
            icon: <IconCalculator />,
          },
          {
            selectedCode: "1130",
            accountCode: "113",
            level: "3",
            accountName: "Accounts Receivable",
            accountType: "Asset",
            parentAccount: "1100-Current-Assets",
            type: "Detail",
            isParty: false,
            address: "",
            phoneNo: "",
            salesTaxNo: "",
            ntn: "",
            icon: <IconCalculator />,
          },
        ],
      },
      {
        selectedCode: "1200",
        accountCode: "120",
        level: "2",
        accountName: "Fixed Assets",
        accountType: "Asset",
        parentAccount: "1000-Assets",
        type: "Group",
        isParty: false,
        address: "",
        phoneNo: "",
        salesTaxNo: "",
        ntn: "",
        icon: <IconCalculator />,
        children: [
          {
            selectedCode: "1210",
            accountCode: "121",
            level: "3",
            accountName: "Equipment",
            accountType: "Asset",
            parentAccount: "1200-fixedAssets",
            type: "Detail",
            isParty: false,
            address: "",
            phoneNo: "",
            salesTaxNo: "",
            ntn: "",
            icon: <IconCalculator />,
          },
          {
            selectedCode: "1220",
            accountCode: "122",
            level: "3",
            accountName: "Furniture & Fixtures",
            accountType: "Asset",
            parentAccount: "1200-fixedAssets",
            type: "Detail",
            isParty: false,
            address: "",
            phoneNo: "",
            salesTaxNo: "",
            ntn: "",
            icon: <IconCalculator />,
          },
        ],
      },
    ],
  },
  // Add similar objects for Liabilities, Equity, Revenue, Expense as per new schema if needed
];

function flattenAccounts(
  nodes: AccountNode[],
  prefix = ""
): { value: string; label: string }[] {
  return nodes.flatMap((n) => [
    {
      value: n.selectedCode,
      label: `${prefix}${n.selectedCode} - ${n.accountName}`,
    },
    ...(n.children ? flattenAccounts(n.children, prefix + "   ") : []),
  ]);
}

function insertAccount(
  list: AccountNode[],
  parentCode: string | null,
  newAcc: AccountNode
): AccountNode[] {
  if (!parentCode) return [...list, newAcc];
  return list.map((n) => {
    if (n.selectedCode === parentCode) {
      return { ...n, children: [...(n.children ?? []), newAcc] };
    }
    return n.children
      ? { ...n, children: insertAccount(n.children, parentCode, newAcc) }
      : n;
  });
}

function updateAccount(
  list: AccountNode[],
  updated: AccountNode
): AccountNode[] {
  return list.map((n) => {
    if (n.selectedCode === updated.selectedCode) {
      return { ...n, ...updated };
    }
    return n.children
      ? { ...n, children: updateAccount(n.children, updated) }
      : n;
  });
}

function deleteAccount(list: AccountNode[], code: string): AccountNode[] {
  return list
    .filter((n) => n.selectedCode !== code)
    .map((n) => ({
      ...n,
      children: n.children ? deleteAccount(n.children, code) : undefined,
    }));
}

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

export default function ChartOfAccounts() {
  const { accounts, setAccounts, expanded, setExpanded } = useChartOfAccounts();
  const [opened, setOpened] = useState(false);

  // If accounts is empty, initialize with initialAccounts
  if (accounts.length === 0) {
    setAccounts(initialAccounts);
  }
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
  const [filterType, setFilterType] = useState<AccountType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const parentOptions = flattenAccounts(accounts);

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
    const res = await axios.post(
      "http://localhost:3000/chart-of-account",
      payload
    );
    console.log(res);
    if (!accountType) return; // Ensure accountType is not null
    const newNode: AccountNode = {
      ...payload,
      accountType, // explicitly non-null
    };
    if (!newNode.selectedCode || !newNode.accountName) return;

    if (editing) {
      setAccounts((prev) => updateAccount(prev, newNode));
    } else {
      setAccounts((prev) => insertAccount(prev, parentAccount, newNode));
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
  const confirmDelete = () => {
    if (deleteId) setAccounts((prev) => deleteAccount(prev, deleteId));
    setDeleteId(null);
  };

  const filteredAccounts = filterAccounts(accounts, search, filterType);
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
                $125,000
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
                $45,000
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
                $80,000
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
                $150,000
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
                $95,000
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
            <Select
              label="Account Type"
              placeholder="Select account type"
              data={["Asset", "Liability", "Equity", "Revenue", "Expense"]}
              value={accountType}
              onChange={(v) => setAccountType(v as AccountType)}
            />
            {!editing && (
              <Select
                label="Parent Account"
                placeholder="Select parent account"
                data={parentOptions}
                value={parentAccount}
                onChange={(v) => setParentAccount(v || "")}
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
