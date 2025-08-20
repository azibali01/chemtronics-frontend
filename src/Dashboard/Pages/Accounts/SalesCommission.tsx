import {
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Select,
  Text,
  TextInput,
} from "@mantine/core";

export default function SalesCommission() {
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
          Salesman Commission
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
              label="Saleman Account"
              placeholder="Enter Account"
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
              label="Saleman Title"
              placeholder="-- Select Saleman --"
              data={["Saleman1", "Saleman2", "Saleman3"]}
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
        </Grid>

        {/* === Second Row === */}
        <Grid gutter="md" mt="md">
          <Grid.Col span={3}>
            <TextInput
              label="Sales Commission A/C"
              placeholder="Enter A/C"
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
              label="Sales Commission Account Title"
              placeholder="-- Select Title --"
              data={["Commission A", "Commission B"]}
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

          <Grid.Col span={3}>
            <TextInput
              label="Invoice From"
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
            <Group grow align="flex-end">
              <TextInput
                label="Invoice To"
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
              <Button style={{ backgroundColor: "#f0ad4e", color: "#ffffff" }}>
                Search
              </Button>
            </Group>
          </Grid.Col>
        </Grid>

        {/* === Action Buttons === */}
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
