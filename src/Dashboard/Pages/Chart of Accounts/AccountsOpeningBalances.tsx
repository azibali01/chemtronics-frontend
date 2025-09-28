import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  Table,
  TextInput,
  NumberInput,
  Container,
  Title,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext"; // Import Chart of Accounts context

// Account Opening Balance Type
interface AccountOpeningBalance {
  accountCode: string;
  title: string;
  debit: number;
  credit: number;
}

// Helper function to flatten accounts from Chart of Accounts
function flattenAccountsForBalances(
  nodes: any[],
  result: AccountOpeningBalance[] = []
): AccountOpeningBalance[] {
  nodes.forEach((node) => {
    // Add current account to the result
    result.push({
      accountCode: node.code,
      title: node.name,
      debit: 0,
      credit: 0,
    });

    // Recursively add children
    if (node.children && node.children.length > 0) {
      flattenAccountsForBalances(node.children, result);
    }
  });

  return result;
}

export default function AccountsOpeningBalances() {
  // Get accounts from Chart of Accounts context
  const { accounts: chartAccounts } = useChartOfAccounts();

  // State for accounts data - will be populated from Chart of Accounts
  const [accounts, setAccounts] = useState<AccountOpeningBalance[]>([]);

  // Search state
  const [search, setSearch] = useState("");

  // Calculate totals
  const totalDebit = accounts.reduce((sum, account) => sum + account.debit, 0);
  const totalCredit = accounts.reduce(
    (sum, account) => sum + account.credit,
    0
  );

  // Filter accounts based on search
  const filteredAccounts = accounts.filter(
    (account) =>
      account.accountCode.toLowerCase().includes(search.toLowerCase()) ||
      account.title.toLowerCase().includes(search.toLowerCase())
  );

  // Update account balance
  const updateAccountBalance = (
    accountCode: string,
    field: "debit" | "credit",
    value: number
  ) => {
    setAccounts((prev) =>
      prev.map((account) =>
        account.accountCode === accountCode
          ? { ...account, [field]: value }
          : account
      )
    );
  };

  // Load accounts from Chart of Accounts when component mounts or chartAccounts changes
  useEffect(() => {
    if (chartAccounts && chartAccounts.length > 0) {
      const flattenedAccounts = flattenAccountsForBalances(chartAccounts);
      setAccounts(flattenedAccounts);
    }
  }, [chartAccounts]);

  // Fetch opening balances from backend
  const fetchOpeningBalances = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/accounts/opening-balances"
      );
      if (response.data && response.data.length > 0) {
        // Merge backend data with Chart of Accounts structure
        const backendBalances = response.data;
        const flattenedAccounts = flattenAccountsForBalances(chartAccounts);

        // Update with existing balances from backend
        const mergedAccounts = flattenedAccounts.map((account) => {
          const existingBalance = backendBalances.find(
            (balance: AccountOpeningBalance) =>
              balance.accountCode === account.accountCode
          );
          return existingBalance ? { ...account, ...existingBalance } : account;
        });

        setAccounts(mergedAccounts);
      } else {
        // If no backend data, use Chart of Accounts structure
        const flattenedAccounts = flattenAccountsForBalances(chartAccounts);
        setAccounts(flattenedAccounts);
      }
    } catch (error) {
      console.error("Error fetching opening balances:", error);
      // If backend error, still load from Chart of Accounts
      if (chartAccounts && chartAccounts.length > 0) {
        const flattenedAccounts = flattenAccountsForBalances(chartAccounts);
        setAccounts(flattenedAccounts);
      }
      notifications.show({
        title: "Info",
        message:
          "Loaded accounts from Chart of Accounts. Backend data not available.",
        color: "blue",
      });
    }
  };

  // Update opening balances to backend
  const updateOpeningBalances = async () => {
    try {
      const response = await axios.put(
        "http://localhost:3000/accounts/opening-balances",
        { accounts }
      );

      if (response.data) {
        notifications.show({
          title: "Success",
          message: "Opening balances updated successfully",
          color: "green",
        });
      }
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message || "Failed to update opening balances",
        color: "red",
      });
      console.error("Error updating opening balances:", error);
    }
  };

  // Fetch data on component mount and when Chart of Accounts changes
  useEffect(() => {
    if (chartAccounts && chartAccounts.length > 0) {
      fetchOpeningBalances();
    }
  }, [chartAccounts]);

  // Show loading message if no accounts loaded yet
  if (!accounts || accounts.length === 0) {
    return (
      <Container size="xl" py="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="center" py="xl">
            <Text size="lg" c="dimmed">
              Please create accounts in Chart of Accounts first...
            </Text>
          </Group>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <Title order={3} c="#0A6802">
            Opening Balances
          </Title>

          {/* Search Input */}
          <TextInput
            placeholder="Search for title..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={300}
          />
        </Group>

        {/* Info Banner */}
        <Card mb="md" p="sm" bg="#f0f9ff" withBorder>
          <Text size="sm" c="#0A6802">
            📊 Accounts are automatically loaded from Chart of Accounts. Total
            Accounts: <strong>{accounts.length}</strong>
          </Text>
        </Card>

        {/* Table */}
        <Table.ScrollContainer minWidth={800}>
          <Table highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: "15%" }}>Account Code</Table.Th>
                <Table.Th style={{ width: "45%" }}>Account Title</Table.Th>
                <Table.Th style={{ width: "20%" }}>Debit</Table.Th>
                <Table.Th style={{ width: "20%" }}>Credit</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredAccounts.map((account) => (
                <Table.Tr key={account.accountCode}>
                  <Table.Td>
                    <Text fw={500} c="#0A6802">
                      {account.accountCode}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{account.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={account.debit}
                      onChange={(value) =>
                        updateAccountBalance(
                          account.accountCode,
                          "debit",
                          Number(value) || 0
                        )
                      }
                      min={0}
                      step={0.01}
                      placeholder="0"
                      hideControls
                      styles={{
                        input: {
                          textAlign: "right",
                          border: "1px solid #e0e0e0",
                          "&:focus": {
                            borderColor: "#0A6802",
                          },
                        },
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={account.credit}
                      onChange={(value) =>
                        updateAccountBalance(
                          account.accountCode,
                          "credit",
                          Number(value) || 0
                        )
                      }
                      min={0}
                      step={0.01}
                      placeholder="0"
                      hideControls
                      styles={{
                        input: {
                          textAlign: "right",
                          border: "1px solid #e0e0e0",
                          "&:focus": {
                            borderColor: "#0A6802",
                          },
                        },
                      }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        {/* Footer with Totals and Update Button */}
        <Group justify="space-between" mt="lg" p="md" bg="#f8f9fa">
          <Group>
            <Button color="#0A6802" onClick={updateOpeningBalances} size="md">
              Update
            </Button>
          </Group>

          <Group gap="xl">
            <Text fw={700} c="red" size="lg">
              Total Debit: {totalDebit.toFixed(2)}
            </Text>
            <Text fw={700} c="#0A6802" size="lg">
              Total Credit: {totalCredit.toFixed(2)}
            </Text>
          </Group>
        </Group>
      </Card>
    </Container>
  );
}
