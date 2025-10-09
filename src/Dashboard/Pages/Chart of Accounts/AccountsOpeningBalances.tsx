import React, { useMemo } from "react";
import axios from "axios";
import {
  Table,
  Button,
  TextInput,
  NumberInput,
  Group,
  Text,
  Card,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";
import { useAccountsOpeningBalances } from "../../Context/AccountsOpeningbalancesContext";
import type { AccountNode } from "../../Context/ChartOfAccountsContext";

const flattenAccounts = (
  nodes: AccountNode[]
): { code: string; name: string }[] => {
  return nodes.flatMap((n) => [
    { code: String(n.selectedCode), name: n.accountName },
    ...(n.children ? flattenAccounts(n.children) : []),
  ]);
};

const AccountsOpeningBalances: React.FC = () => {
  const { accounts } = useChartOfAccounts();
  const { balances, setBalances, loading, setLoading } =
    useAccountsOpeningBalances();
  const [search, setSearch] = React.useState("");

  const allAccounts = useMemo(() => flattenAccounts(accounts), [accounts]);
  const filteredAccounts = useMemo(
    () =>
      allAccounts.filter(
        (a: { code?: string; name?: string }) =>
          (a.name && a.name.toLowerCase().includes(search.toLowerCase())) ||
          (a.code && a.code.toLowerCase().includes(search.toLowerCase()))
      ),
    [allAccounts, search]
  );

  const handleChange = (
    code: string,
    field: "debit" | "credit",
    value: number
  ) => {
    setBalances((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const handleUpdate = async () => {
    setLoading(true);
    // Prepare payload: array of { code, name, debit, credit }
    const payload = filteredAccounts.map((acc) => ({
      code: acc.code,
      name: acc.name,
      debit: balances[acc.code]?.debit || 0,
      credit: balances[acc.code]?.credit || 0,
    }));
    try {
      await axios.post(
        "https://chemtronics-backend-zbf6.onrender.com/opening-balances",
        payload
      );
      // Optionally show success notification here
    } catch (error) {
      // Optionally show error notification here
      console.error("Failed to update opening balances", error);
    }
    setLoading(false);
  };

  const totalDebit = filteredAccounts.reduce(
    (sum: number, a: { code: string; name: string }) =>
      sum + (balances[a.code]?.debit || 0),
    0
  );
  const totalCredit = filteredAccounts.reduce(
    (sum: number, a: { code: string; name: string }) =>
      sum + (balances[a.code]?.credit || 0),
    0
  );

  return (
    <Card shadow="md" radius="md" p="lg" withBorder>
      <Group justify="space-between" mb="md">
        <Text fw={700} size="xl">
          Opening Balances
        </Text>
        <TextInput
          placeholder="Search for code or title.."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ width: 350 }}
        />
      </Group>
      <Divider mb="md" />
      <ScrollArea h={500} type="auto">
        <Table
          striped
          highlightOnHover
          withRowBorders
          withColumnBorders
          style={{ minWidth: 800, border: "1px solid #dee2e6" }}
        >
          <Table.Thead
            style={{
              position: "sticky",
              top: 0,
              background: "#f8f9fa",
              zIndex: 1,
            }}
          >
            <Table.Tr>
              <Table.Th style={{ border: "1px solid #dee2e6", padding: 8 }}>
                Account Code
              </Table.Th>
              <Table.Th
                style={{
                  border: "1px solid #dee2e6",
                  padding: 8,
                  minWidth: 500,
                }}
              >
                Title
              </Table.Th>
              <Table.Th style={{ border: "1px solid #dee2e6", padding: 8 }}>
                Debit
              </Table.Th>
              <Table.Th style={{ border: "1px solid #dee2e6", padding: 8 }}>
                Credit
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredAccounts.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={4}
                  style={{ textAlign: "center", padding: 24, color: "#888" }}
                >
                  No accounts found.
                </Table.Td>
              </Table.Tr>
            ) : (
              filteredAccounts.map((row: { code: string; name: string }) => (
                <Table.Tr
                  key={row.code}
                  style={{ border: "1px solid #dee2e6" }}
                >
                  <Table.Td style={{ border: "1px solid #dee2e6", padding: 8 }}>
                    {row.code}
                  </Table.Td>
                  <Table.Td style={{ border: "1px solid #dee2e6", padding: 8 }}>
                    {row.name}
                  </Table.Td>
                  <Table.Td style={{ border: "1px solid #dee2e6", padding: 8 }}>
                    <NumberInput
                      value={balances[row.code]?.debit || 0}
                      min={0}
                      onChange={(val: number | string) =>
                        handleChange(
                          row.code,
                          "debit",
                          typeof val === "number" ? val : 0
                        )
                      }
                      hideControls={false}
                    />
                  </Table.Td>
                  <Table.Td style={{ border: "1px solid #dee2e6", padding: 8 }}>
                    <NumberInput
                      value={balances[row.code]?.credit || 0}
                      min={0}
                      onChange={(val: number | string) =>
                        handleChange(
                          row.code,
                          "credit",
                          typeof val === "number" ? val : 0
                        )
                      }
                      hideControls={false}
                    />
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Divider my="md" />
      <Group mt="md" justify="space-between">
        <Button
          color="#0A6802"
          size="md"
          onClick={handleUpdate}
          loading={loading}
        >
          Update
        </Button>
        <Group>
          <Text c="red" fw={700} size="md">
            Total Debit: {totalDebit}
          </Text>
          <Text c="red" fw={700} size="md">
            Total Credit: {totalCredit}
          </Text>
        </Group>
      </Group>
    </Card>
  );
};

export default AccountsOpeningBalances;
