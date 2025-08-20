import {
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Select,
  Text,
  Textarea,
  TextInput,
  FileInput,
} from "@mantine/core";

export default function CashReceiptCreditVoucher() {
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
      }}
    >
      <Card
        shadow="sm"
        padding="lg"
        style={{
          backgroundColor: "#1f232c",
          color: "#dfd6d1",
        }}
      >
        {/* Header */}
        <Text
          fw={600}
          size="lg"
          style={{ marginBottom: "1rem", color: "#dfd6d1" }}
        >
          Credit Voucher
        </Text>

        {/* === Top Section === */}
        <Grid gutter="md">
          <Grid.Col span={3}>
            <TextInput
              label="Date"
              type="date"
              defaultValue="2025-08-18"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Voucher#"
              placeholder="Enter Voucher No"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <FileInput
              label="Upload File"
              placeholder="No file selected"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
        </Grid>

        {/* === Middle Section === */}
        <Grid gutter="md" mt="md">
          <Grid.Col span={3}>
            <TextInput
              label="Account Code"
              placeholder="Press enter and select account code"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Account Title"
              placeholder="-- Select Account --"
              data={["Cash", "Bank", "Expense A", "Expense B"]}
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
                dropdown: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                },
              }}
            />
          </Grid.Col>
          <Grid.Col span={2}>
            <TextInput
              label="Credit"
              type="number"
              placeholder="0.00"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Textarea
              label="Remarks"
              resize="vertical"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
          <Grid.Col
            span={1}
            style={{ display: "flex", alignItems: "flex-end" }}
          >
            <Button
              style={{
                backgroundColor: "#83746e",
                color: "#ffffff",
                width: "100%",
              }}
            >
              Add
            </Button>
          </Grid.Col>
        </Grid>

        {/* === Buttons === */}
        <Group mt="lg">
          <Button style={{ backgroundColor: "#007bff", color: "#ffffff" }}>
            New
          </Button>
          <Button style={{ backgroundColor: "#d9534f", color: "#ffffff" }}>
            Delete
          </Button>
          <Button style={{ backgroundColor: "#83746e", color: "#ffffff" }}>
            Search
          </Button>
          <Button style={{ backgroundColor: "#f0ad4e", color: "#ffffff" }}>
            Clear
          </Button>
          <Button style={{ backgroundColor: "#e83e8c", color: "#ffffff" }}>
            Print Preview
          </Button>
        </Group>
      </Card>
    </Paper>
  );
}
