// src/pages/UserRights.tsx
import { useState } from "react";
import {
  Paper,
  Group,
  Text,
  Select,
  Button,
  Checkbox,
  SimpleGrid,
  Divider,
  Card,
} from "@mantine/core";

export default function UserRights() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // categories with rights
  const categories = {
    Coding: [
      "Accounts Coding",
      "Accounts Opening Balances",
      "Product Group",
      "Product Type",
      "Product Coding",
      "Opening Stocks",
      "Change Sale Rate",
      "Daily Cash",
      "City Coding",
    ],
    Invoice: [
      "Purchase Invoice",
      "Purchase Return",
      "Sale Invoice",
      "Sale Return",
      "Whole Sale Invoice",
      "Whole Sale Return Invoice",
    ],
    Accounts: [
      "Cash Receipt Voucher",
      "Cash Payment Voucher",
      "Journal Voucher",
      "Bank Receipt Voucher",
      "Bank Payment Voucher",
      "Salesman Commission",
    ],
    "Accounts Reports": [
      "Chart of Accounts",
      "Account Ledger",
      "Account Reconciliation",
      "Cash Book",
      "Day Book",
      "Journal Book",
      "Balance Sheet",
      "Receivable and Payable",
      "Profit and Loss",
      "Trial Balances",
    ],
    "Inventory Reports": [
      "Stock Ledger",
      "Daily Sale",
      "Stock in hand",
      "Stock in hand Value",
      "Stock in hand Avg Rate",
      "Stock in hand by Group",
      "Product Reports",
      "Product List",
      "Product List Group Wise",
    ],
    System: [
      "Create User",
      "User Rights",
      "Accounts Master Deletion",
      "Control Accounts",
    ],
  };

  const [rights, setRights] = useState<Record<string, boolean>>({});

  const toggleAll = (value: boolean) => {
    const updated: Record<string, boolean> = {};
    Object.values(categories)
      .flat()
      .forEach((r) => {
        updated[r] = value;
      });
    setRights(updated);
  };

  const handleToggle = (label: string) => {
    setRights((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Paper
      withBorder
      shadow="sm"
      radius="md"
      style={{
        borderColor: "#83746e",
        background: "#2a2f38",
        color: "white",
      }}
    >
      {/* Header */}
      <Card
        shadow="sm"
        padding="lg"
        style={{
          backgroundColor: "#1f232c",
          color: "#dfd6d1",
        }}
      >
        <Text c="white" size="lg" fw={600}>
          User Rights
        </Text>

        {/* Controls */}
        <Group py="sm">
          <Select
            placeholder="Select User"
            data={["User 1", "User 2"]}
            value={selectedUser}
            onChange={setSelectedUser}
            styles={{
              input: {
                background: "#2a2f38",
                borderColor: "#83746e",
                color: "white",
              },
              dropdown: {
                background: "#2a2f38",
                "&:hover": {
                  background: "#83746E",
                },
              },
            }}
          />
          <Button color="#3b82f6" onClick={() => toggleAll(true)}>
            Check All
          </Button>
          <Button color="#ef4444" onClick={() => toggleAll(false)}>
            Clear All
          </Button>
          <Button color="#10b981">Search</Button>
        </Group>

        {/* Categories */}
        {Object.entries(categories).map(([cat, items], idx) => (
          <div key={idx} style={{ marginBottom: "25px" }}>
            <Text fw={600} c="#f3f4f6" mb="sm">
              {cat}
            </Text>
            <SimpleGrid cols={4} spacing="xs">
              {items.map((item, i) => (
                <Checkbox
                  key={i}
                  color="#83746E"
                  label={item}
                  checked={rights[item] || false}
                  onChange={() => handleToggle(item)}
                  styles={{
                    label: { color: "white" },
                    input: { borderColor: "#83746e" },
                  }}
                />
              ))}
            </SimpleGrid>
            <Divider my="md" color="#444" />
          </div>
        ))}

        {/* Footer */}
        <Group justify="center">
          <Button color="#83746E">Save</Button>
        </Group>
      </Card>
    </Paper>
  );
}
