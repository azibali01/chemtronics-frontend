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

// Types and initial data

type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";

interface AccountNode {
  code: string;
  selCode: string;
  name: string;
  icon?: ReactNode;
  type?: AccountType;
  balance: number;
  city?: string;
  children?: AccountNode[];
}

const initialAccounts: AccountNode[] = [
  {
    code: "1000",
    selCode: "100",
    name: "Assets",
    icon: <IconCalculator />,
    type: "Asset",
    balance: 125000,
    children: [
      {
        code: "1100",
        selCode: "110",
        name: "Current Assets",
        icon: <IconCalculator />,
        type: "Asset",
        balance: 60000,
        children: [
          {
            code: "1110",
            selCode: "111",
            icon: <IconCalculator />,
            name: "Cash in Hand",
            balance: 20000,
          },
          {
            code: "1120",
            selCode: "112",
            icon: <IconCalculator />,
            name: "Cash at Bank",
            balance: 25000,
          },
          {
            code: "1130",
            selCode: "113",
            icon: <IconCalculator />,
            name: "Accounts Receivable",
            balance: 15000,
          },
        ],
      },
      {
        code: "1200",
        selCode: "120",
        name: "Fixed Assets",
        icon: <IconCalculator />,
        type: "Asset",
        balance: 65000,
        children: [
          {
            code: "1210",
            selCode: "121",
            icon: <IconCalculator />,
            name: "Equipment",
            balance: 40000,
          },
          {
            code: "1220",
            selCode: "122",
            icon: <IconCalculator />,
            name: "Furniture & Fixtures",
            balance: 25000,
          },
        ],
      },
    ],
  },
  {
    code: "2000",
    selCode: "130",
    name: "Liabilities",
    icon: <IconCreditCard />,
    type: "Liability",
    balance: 45000,
    children: [
      {
        code: "2090",
        selCode: "129",
        name: "Capital",
        icon: <IconCreditCard />,
        balance: 5000,
      },
      {
        code: "2100",
        selCode: "131",
        name: "Current Liabilities",
        icon: <IconCreditCard />,
        balance: 25000,
        children: [
          {
            code: "2111",
            selCode: "134",
            icon: <IconCreditCard />,
            name: "Purchase Party",
            balance: 15000,
          },
          {
            code: "2112",
            selCode: "135",
            icon: <IconCreditCard />,
            name: "Advance Exp.",
            balance: 10000,
          },
        ],
      },
      {
        code: "2130",
        selCode: "136",
        name: "Others",
        icon: <IconCreditCard />,
        balance: 0,
        children: [],
      },
      {
        code: "2140",
        selCode: "137",
        name: "Salesman A/C",
        icon: <IconCreditCard />,
        balance: 0,
        children: [],
      },
      {
        code: "2150",
        selCode: "138",
        name: "Bismillah",
        icon: <IconCreditCard />,
        balance: 0,
      },
      // Removed: Long-term Liabilities, Other, Salesman A/C, Bismillah
    ],
  },
  {
    code: "3000",
    selCode: "150",
    name: "Equity",
    icon: <IconCurrencyDollar />,
    type: "Equity",
    balance: 80000,
    children: [
      {
        code: "3101",
        selCode: "153",
        icon: <IconCurrencyDollar />,
        name: "Share Capital",
        balance: 80000,
      },
    ],
  },
  {
    code: "4000",
    selCode: "160",
    name: "Income",
    icon: <IconChartBar />,
    type: "Revenue",
    balance: 150000,
    children: [
      {
        code: "4100",
        selCode: "161",
        icon: <IconChartBar />,
        name: "SALES Controll A/c",
        balance: 100000,
        children: [
          {
            code: "4110",
            selCode: "163",
            icon: <IconChartBar />,
            name: "Sales",
            balance: 100000,
          },
        ],
      },
    ],
  },
  {
    code: "5000",
    selCode: "170",
    name: "Expense",
    icon: <IconArrowDown />,
    type: "Expense",
    balance: 95000,
    children: [
      {
        code: "5100",
        selCode: "171",
        name: "EXPENSES",
        icon: <IconArrowDown />,
        balance: 0,
      },
      {
        code: "5200",
        selCode: "172",
        name: "Ware House Expenses",
        icon: <IconArrowDown />,
        balance: 0,
      },
      {
        code: "5300",
        selCode: "173",
        name: "Cost of Goods",
        icon: <IconArrowDown />,
        balance: 0,
      },
    ],
  },
];

function flattenAccounts(
  nodes: AccountNode[],
  prefix = ""
): { value: string; label: string }[] {
  return nodes.flatMap((n) => [
    { value: n.code, label: `${prefix}${n.code} - ${n.name}` },
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
    if (n.code === parentCode) {
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
    if (n.code === updated.code) {
      return { ...n, ...updated };
    }
    return n.children
      ? { ...n, children: updateAccount(n.children, updated) }
      : n;
  });
}

function deleteAccount(list: AccountNode[], code: string): AccountNode[] {
  return list
    .filter((n) => n.code !== code)
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
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.code.includes(search);
    const typeMatch = !type || acc.type === type;
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
      <div key={acc.code} style={{ marginLeft: level * 20 }}>
        <Group align="center" py={4} gap={8} style={{ width: "100%" }}>
          {/* Expand/collapse arrow for accounts with children */}
          {acc.children && acc.children.length > 0 && (
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => {
                setExpanded({
                  ...expanded,
                  [acc.code]: !expanded[acc.code],
                });
              }}
              size={24}
            >
              {expanded[acc.code] ? (
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
              {acc.type === "Asset" && (
                <IconBuildingBank size={24} color="blue" />
              )}
              {acc.type === "Liability" && (
                <IconCreditCard size={24} color="red" />
              )}
              {acc.type === "Equity" && <IconUsers size={24} color="#0A6802" />}
              {acc.type === "Revenue" && (
                <IconChartBar size={24} color="teal" />
              )}
              {acc.type === "Expense" && (
                <IconCurrencyDollar size={24} color="orange" />
              )}
            </span>
          )}
          <Text fw={600} style={{ textTransform: "uppercase" }}>
            {acc.name}
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
            onClick={() => onDelete(acc.code)}
            title="Delete Account"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
        {acc.children &&
          expanded[acc.code] &&
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
  const [accCode, setAccCode] = useState("");
  const [selCode, setSelCode] = useState("");
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<AccountType | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState<string>("0");
  const [editing, setEditing] = useState<AccountNode | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<AccountType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const parentOptions = flattenAccounts(accounts);

  const handleCreateOrUpdate = () => {
    const balanceNumber = Number(openingBalance || 0);
    const newNode: AccountNode = {
      code: accCode.trim(),
      selCode: selCode.trim(),
      name: accName.trim(),
      type: accType ?? undefined,
      balance: isNaN(balanceNumber) ? 0 : balanceNumber,
      // city: accCity || undefined,
    };
    if (!newNode.code || !newNode.name) return;

    if (editing) {
      setAccounts((prev) => updateAccount(prev, newNode));
    } else {
      setAccounts((prev) => insertAccount(prev, parentCode, newNode));
    }
    setSelCode("");
    setAccCode("");
    setAccName("");
    setAccType(null);
    setParentCode(null);
    setOpeningBalance("0");
    setEditing(null);
    setOpened(false);
  };

  const handleEdit = (acc: AccountNode) => {
    setEditing(acc);
    setSelCode(acc.selCode);
    setAccCode(acc.code);
    setAccName(acc.name);
    setAccType(acc.type ?? null);
    setOpeningBalance(String(acc.balance));
    // setAccCity(acc.city || "");
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
              value={selCode}
              onChange={(e) => setSelCode(e.currentTarget.value)}
              disabled={!!editing}
            />
            <TextInput
              label="Account Code"
              placeholder="Account Code"
              value={accCode}
              onChange={(e) => setAccCode(e.currentTarget.value)}
              disabled={!!editing}
            />
          </Group>
          <Group grow>
            <TextInput label="Level" placeholder="Level" />
            <TextInput
              label="Account Title"
              placeholder="Title"
              value={accName}
              onChange={(e) => setAccName(e.currentTarget.value)}
            />
          </Group>
          <Group grow>
            <Select
              label="Account Type"
              placeholder="Select account type"
              data={["Asset", "Liability", "Equity", "Revenue", "Expense"]}
              value={accType}
              onChange={(v) => setAccType(v as AccountType)}
            />
            {!editing && (
              <Select
                label="Parent Account"
                placeholder="Select parent account"
                data={parentOptions}
                value={parentCode}
                onChange={setParentCode}
              />
            )}
          </Group>
          <Group grow>
            <Select
              label="Type"
              data={["Group", "Detail"]}
              defaultValue={"Group"}
            />
            {/*
            <Select
              label="City"
              placeholder="Select city"
              data={["Multan", "Faisalabad", "Lahore", "Karachi", "Rawalpindi"]}
              value={accCity}
              onChange={(v) => setAccCity(v || "")}
            />
            */}
          </Group>
          <Checkbox
            label="Is Party"
            color="#0A6802"
            labelPosition="left"
            size="md"
          />
          <Group grow>
            <TextInput label="Address" placeholder="Address" />
            <TextInput label="Phone No" placeholder="Phone No" type="number" />
          </Group>
          <Group grow>
            <TextInput
              label="Sales Tax#"
              placeholder="Sales Tax#"
              type="number"
            />
            <TextInput label="NTN" placeholder="NTN" type="number" />
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
