import {
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Radio,
  Select,
  Text,
  TextInput,
} from "@mantine/core";

export default function WholeSaleReturn() {
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
          Whole Sale Invoice Return
        </Text>

        {/* === Top Section === */}
        <Grid gutter="md">
          <Grid.Col span={3}>
            <TextInput
              label="Invoice #"
              placeholder="Enter Invoice No"
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
              label="Invoice Date"
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
              label="Delivery No"
              placeholder="Enter Delivery No"
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
              label="Delivery Date"
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
              label="PO No"
              placeholder="Enter PO No"
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
              label="PO Date"
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
              label="Customer"
              defaultValue="1411"
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
              label="Customer Title"
              placeholder="Select Title"
              data={["Counter Sale", "Retail Customer", "Wholesale"]}
              defaultValue="Counter Sale"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
                dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
              }}
            />
          </Grid.Col>

          <Grid.Col span={3}>
            <TextInput
              label="Sale A/C"
              defaultValue="4111"
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
              label="Sale Title"
              data={["Sales Of Chemicals", "Sales Of Goods"]}
              defaultValue="Sales Of Chemicals"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
                dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Salesman"
              data={["Saleman1", "Saleman2"]}
              defaultValue="Saleman1"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
                dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
              }}
            />
          </Grid.Col>
        </Grid>

        {/* === Discount + Payment === */}
        <Grid gutter="md" mt="md">
          <Grid.Col span={3}>
            <Text fw={600} style={{ color: "#d9534f" }}>
              Discount %
            </Text>
            <TextInput
              type="number"
              defaultValue="0"
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
              }}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Radio.Group
              label="Payment Mode"
              defaultValue="cash"
              styles={{ label: { color: "#dfd6d1" } }}
            >
              <Radio value="cash" label="Cash" color="gray" />
              <Radio value="card" label="Credit Card" color="gray" />
            </Radio.Group>
          </Grid.Col>
        </Grid>

        {/* === Product Row === */}
        <Grid gutter="md" mt="md">
          <Grid.Col span={1}>
            <TextInput
              label="Code"
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
              label="Product Name"
              placeholder="-- Select Product --"
              data={["Product A", "Product B", "Product C"]}
              styles={{
                input: {
                  backgroundColor: "#1f232c",
                  color: "#dfd6d1",
                  border: "1px solid #83746e",
                },
                label: { color: "#dfd6d1" },
                dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
              }}
            />
          </Grid.Col>

          <Grid.Col span={2}>
            <TextInput
              label="Description"
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
          <Grid.Col span={1}>
            <TextInput
              label="Quantity"
              type="number"
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
          <Grid.Col span={1}>
            <TextInput
              label="Rate"
              type="number"
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
          <Grid.Col span={1}>
            <TextInput
              label="Amount"
              type="number"
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
          <Grid.Col span={1}>
            <TextInput
              label="Discount"
              type="number"
              defaultValue="0"
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
          <Grid.Col span={1}>
            <TextInput
              label="Net Amount"
              type="number"
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

        {/* Buttons */}
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
          <Button style={{ backgroundColor: "#dfd6d1", color: "#1f232c" }}>
            Print Preview
          </Button>
          <Button style={{ backgroundColor: "#e83e8c", color: "#ffffff" }}>
            Print Dispatch
          </Button>
        </Group>
      </Card>
    </Paper>
  );
}
