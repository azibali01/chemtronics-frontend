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
import { useChartOfAccountsCompany2 } from "../Context/ChartOfAccountsContextCompany2";
import { useAccountsOpeningBalancesCompany2 } from "../Context/AccountsOpeningbalancesContextCompany2";
import type { AccountNode } from "../Context/ChartOfAccountsContextCompany2";

const flattenAccounts = (
  nodes: AccountNode[]
): { code: string; name: string }[] => {
  return nodes.flatMap((n) => [
    { code: String(n.selectedCode), name: n.accountName },
    ...(n.children ? flattenAccounts(n.children) : []),
  ]);
};

const AccountsOpeningBalancesCompany2: React.FC = () => {
  const { accounts } = useChartOfAccountsCompany2();
  const { balances, setBalances, loading, setLoading } =
    useAccountsOpeningBalancesCompany2();
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
    await axios.post("/api/accounts-opening-balances-company2", payload);
    setLoading(false);
  };

  return (
    <Card>
      <Text fw={600} fz="xl" mb="md">
        Accounts Opening Balances (Hydroworx)
      </Text>
      <TextInput
        placeholder="Search accounts..."
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
      />
      <ScrollArea>
        <Table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map((acc) => (
              <tr key={acc.code}>
                <td>{acc.code}</td>
                <td>{acc.name}</td>
                <td>
                  <NumberInput
                    value={balances[acc.code]?.debit || 0}
                    onChange={(val) =>
                      handleChange(acc.code, "debit", Number(val))
                    }
                  />
                </td>
                <td>
                  <NumberInput
                    value={balances[acc.code]?.credit || 0}
                    onChange={(val) =>
                      handleChange(acc.code, "credit", Number(val))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>
      <Group mt="md">
        <Button color="#0A6802" loading={loading} onClick={handleUpdate}>
          Update Balances
        </Button>
      </Group>
    </Card>
  );
};

export default AccountsOpeningBalancesCompany2;
