import { useState, type ReactNode } from "react";
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

type AccountType = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";

interface AccountNode {
  code: string;
  selCode: string;
  name: string;
  icon?: ReactNode;
  type?: AccountType;
  balance: number;
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
        code: "2100",
        selCode: "131",
        name: "Current Liabilities",
        icon: <IconCreditCard />,
        balance: 25000,
        children: [
          {
            code: "2110",
            selCode: "132",
            icon: <IconCreditCard />,
            name: "Accounts Payable",
            balance: 15000,
          },
          {
            code: "2120",
            selCode: "133",
            icon: <IconCreditCard />,
            name: "Accrued Expenses",
            balance: 10000,
          },
        ],
      },
      {
        code: "2200",
        selCode: "140",
        name: "Long-term Liabilities",
        icon: <IconCreditCard />,
        balance: 20000,
        children: [
          {
            code: "2210",
            selCode: "141",
            icon: <IconCreditCard />,
            name: "Bank Loan",
            balance: 20000,
          },
        ],
      },
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
        code: "3100",
        selCode: "151",
        icon: <IconCurrencyDollar />,
        name: "Owner's Equity",
        balance: 50000,
      },
      {
        code: "3200",
        selCode: "152",
        icon: <IconCurrencyDollar />,
        name: "Retained Earnings",
        balance: 30000,
      },
    ],
  },
  {
    code: "4000",
    selCode: "160",
    name: "Revenue",
    icon: <IconChartBar />,
    type: "Revenue",
    balance: 150000,
    children: [
      {
        code: "4100",
        selCode: "161",
        icon: <IconChartBar />,
        name: "Sales Revenue",
        balance: 100000,
      },
      {
        code: "4200",
        selCode: "162",
        icon: <IconChartBar />,
        name: "Service Revenue",
        balance: 50000,
      },
    ],
  },
  {
    code: "5000",
    selCode: "170",
    name: "Expenses",
    icon: <IconArrowDown />,
    type: "Expense",
    balance: 95000,
    children: [
      {
        code: "5100",
        selCode: "171",
        name: "Operating Expenses",
        icon: <IconArrowDown />,
        balance: 70000,
        children: [
          {
            code: "5110",
            selCode: "172",
            icon: <IconArrowDown />,
            name: "Salaries & Wages",
            balance: 40000,
          },
          {
            code: "5120",
            selCode: "173",
            icon: <IconArrowDown />,
            name: "Rent Expense",
            balance: 20000,
          },
          {
            code: "5130",
            selCode: "174",
            icon: <IconArrowDown />,
            name: "Utilities",
            balance: 10000,
          },
        ],
      },
      {
        code: "5200",
        selCode: "175",
        name: "Administrative Expenses",
        icon: <IconArrowDown />,
        balance: 25000,
        children: [
          {
            code: "5210",
            selCode: "176",
            icon: <IconArrowDown />,
            name: "Office Supplies",
            balance: 12000,
          },
          {
            code: "5220",
            selCode: "177",
            icon: <IconArrowDown />,
            name: "Professional Fees",
            balance: 13000,
          },
        ],
      },
    ],
  },
];

function renderAccounts(
  data: AccountNode[],
  onEdit: (acc: AccountNode) => void,
  onDelete: (code: string) => void,
  level = 0
): JSX.Element[] {
  return data.flatMap((acc) => [
    <div key={acc.code} style={{ marginLeft: level * 20 }}>
      <Group justify="space-between" py={4}>
        <Group>
          <Text fw={level === 0 ? 600 : 400}>
            {acc.name} ({acc.code})
          </Text>
        </Group>
        <Group>
          <Text fw={500}>${acc.balance.toLocaleString()}</Text>
          <ActionIcon
            variant="subtle"
            color="#0A6802"
            onClick={() => onEdit(acc)}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => onDelete(acc.code)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </div>,
    ...(acc.children
      ? renderAccounts(acc.children, onEdit, onDelete, level + 1)
      : []),
  ]);
}

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

export default function ChartOfAccounts() {
  const [opened, setOpened] = useState(false);
  const [accounts, setAccounts] = useState<AccountNode[]>(initialAccounts);

  // modal form state
  const [accCode, setAccCode] = useState("");
  const [selCode, setSelCode] = useState("");
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState<AccountType | null>(null);
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [openingBalance, setOpeningBalance] = useState<string>("0");

  const [editing, setEditing] = useState<AccountNode | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<AccountType | null>(null);

  const parentOptions = flattenAccounts(accounts);

  const handleCreateOrUpdate = () => {
    const balanceNumber = Number(openingBalance || 0);
    const newNode: AccountNode = {
      code: accCode.trim(),
      selCode: selCode.trim(),
      name: accName.trim(),
      type: accType ?? undefined,
      balance: isNaN(balanceNumber) ? 0 : balanceNumber,
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
    setSelCode(selCode);
    setAccCode(acc.code);
    setAccName(acc.name);
    setAccType(acc.type ?? null);
    setOpeningBalance(String(acc.balance));
    setOpened(true);
  };

  const handleDelete = (code: string) => {
    setAccounts((prev) => deleteAccount(prev, code));
  };

  const filteredAccounts = filterAccounts(accounts, search, filterType);

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
          </Group>
          <Divider />
          <ScrollArea h={400}>
            {renderAccounts(filteredAccounts, handleEdit, handleDelete)}
          </ScrollArea>
        </Stack>
      </Card>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editing ? "Edit Account" : "Add New Account"}
        centered
        size="lg"
      >
        <Stack>
          <Group grow>
            <TextInput
              label="Selected Code"
              placeholder="Selected Code"
              value={selCode}
              onChange={(e) => setAccCode(e.currentTarget.value)}
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
              label="Account Name"
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
            <Checkbox
              label="Is Party"
              color="#0A6802"
              labelPosition="left"
              size="md"
              mt={25}
            />
          </Group>

          {/* <TextInput
            label="Opening Balance"
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.currentTarget.value)}
          /> */}
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
    </div>
  );
}
