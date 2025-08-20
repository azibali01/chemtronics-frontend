import {
  Button,
  Card,
  Grid,
  Paper,
  Select,
  Text,
  TextInput,
} from "@mantine/core";

export default function GroupTrial() {
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
        maxWidth: "600px",
        margin: "0 auto",
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
          Group Trial Report
        </Text>

        {/* === Fields === */}

        <Grid gutter="md">
          <Grid.Col span={12}>
            <TextInput
              label="Group Code"
              placeholder="Enter Group Code"
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

          <Grid.Col span={12}>
            <Select
              label="Title"
              placeholder="-- Select Account --"
              data={["Cash", "Bank", "Receivables", "Payables"]}
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
          <Grid.Col span={6}>
            <TextInput
              label="To Date"
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
        </Grid>

        {/* === Action Buttons === */}
        <Grid mt="lg">
          <Grid.Col span={6}>
            <Button
              fullWidth
              style={{ backgroundColor: "green", color: "#ffffff" }}
            >
              View
            </Button>
          </Grid.Col>
          <Grid.Col span={6}>
            <Button
              fullWidth
              style={{ backgroundColor: "#003366", color: "#ffffff" }}
            >
              Export into Excel
            </Button>
          </Grid.Col>
        </Grid>
      </Card>
    </Paper>
  );
}
