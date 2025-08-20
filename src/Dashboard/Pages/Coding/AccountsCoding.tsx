// src/pages/AccountDetail.tsx
import {
  Paper,
  Card,
  Text,
  Group,
  TextInput,
  Select,
  Checkbox,
  Button,
  SimpleGrid,
} from "@mantine/core";
import { useAccountsCoding } from "../../Context/AccountsCodingContext";

export default function AccountsCoding() {
  const {
    account,
    updateField,
    resetForm,
    newAccount,
    saveAccount,
    deleteAccount,
    searchAccount,
  } = useAccountsCoding();

  // 🔹 Reusable styles
  const inputStyles = {
    input: {
      background: "#2a2f38",
      borderColor: "#83746e",
      color: "white",
    },
    label: { color: "white" },
  };

  const selectStyles = {
    input: {
      background: "#2a2f38",
      borderColor: "#83746e",
    },
    label: { color: "#dfd6d1", fontWeight: 600 },
    dropdown: { background: "#2a2f38", color: "#dfd6d1" },
    option: { "&[data-hovered]": { background: "#83746e" } },
  };

  return (
    <Paper
      shadow="md"
      radius="md"
      p="md"
      withBorder
      style={{
        backgroundColor: "#1f232c",
        borderColor: "#83746e",
        color: "#dfd6d1",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <Card
        shadow="sm"
        padding="lg"
        style={{ backgroundColor: "#1f232c", color: "#dfd6d1" }}
      >
        <Text c="white" fw={600} mb="md">
          Account Detail
        </Text>

        {/* Top row */}
        <SimpleGrid cols={3} spacing="md" mb="md">
          <TextInput
            label="Selected Code"
            placeholder="Selected Code"
            value={account.selectedCode}
            onChange={(e) => updateField("selectedCode", e.currentTarget.value)}
            styles={inputStyles}
          />
          <Select
            label="Account Code"
            placeholder="Account Code"
            data={["1001", "1002", "1003"]}
            value={account.accountCode}
            onChange={(val) => updateField("accountCode", val || "")}
            styles={selectStyles}
          />
          <TextInput
            label="Level"
            placeholder="Level"
            value={account.level}
            onChange={(e) => updateField("level", e.currentTarget.value)}
            styles={inputStyles}
          />
        </SimpleGrid>

        {/* Form fields */}
        <Select
          label="Title"
          placeholder="Title"
          mb="md"
          data={[
            { label: "Assets", value: "Assets" },
            { label: "Liabilities", value: "Liabilities" },
            { label: "Equity", value: "Equity" },
            { label: "Income", value: "Income" },
            { label: "Expenses", value: "Expenses" },
          ]}
          value={account.title}
          onChange={(val) => updateField("title", val || "")}
          styles={selectStyles}
        />

        <Select
          label="Type"
          placeholder="Group"
          mb="md"
          data={[
            { label: "Group", value: "Group" },
            { label: "Detail", value: "Detail" },
          ]}
          value={account.type}
          onChange={(val) => updateField("type", val || "")}
          styles={selectStyles}
        />

        <Checkbox
          label="Is Party"
          color="#83746E"
          checked={account.isParty}
          onChange={(e) => updateField("isParty", e.currentTarget.checked)}
          mb="md"
          styles={{
            label: { color: "white" },
            input: { borderColor: "#83746e" },
          }}
        />

        <TextInput
          label="Address"
          placeholder="Address"
          value={account.address}
          onChange={(e) => updateField("address", e.currentTarget.value)}
          mb="md"
          styles={inputStyles}
        />
        <TextInput
          label="Contact Person"
          placeholder="Contact Person"
          value={account.contactPerson}
          onChange={(e) => updateField("contactPerson", e.currentTarget.value)}
          mb="md"
          styles={inputStyles}
        />
        <TextInput
          label="Sales Tax#"
          placeholder="Sales Tax"
          value={account.salesTax}
          onChange={(e) => updateField("salesTax", e.currentTarget.value)}
          mb="md"
          styles={inputStyles}
        />
        <TextInput
          label="Phone #"
          placeholder="Phone"
          value={account.phone}
          onChange={(e) => updateField("phone", e.currentTarget.value)}
          mb="md"
          styles={inputStyles}
        />

        {/* Footer Buttons */}
        <Group justify="center" mt="lg">
          <Button color="#2563eb" onClick={newAccount}>
            New
          </Button>
          <Button color="#10b981" onClick={saveAccount}>
            Save
          </Button>
          <Button
            color="#ef4444"
            onClick={() => deleteAccount(account.accountCode)}
          >
            Delete
          </Button>
          <Button
            color="#f59e0b"
            onClick={() => searchAccount(account.accountCode)}
          >
            Search
          </Button>
          <Button color="#22c55e" onClick={resetForm}>
            Clear
          </Button>
        </Group>
      </Card>
    </Paper>
  );
}
