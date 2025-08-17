import {
  Container,
  Grid,
  TextInput,
  Select,
  Checkbox,
  Button,
  Group,
  Paper,
  Box,
} from "@mantine/core";

export default function PurchaseInvoice() {
  return (
    <Box>
      <Container
        fluid
        style={{
          paddingTop: 20,
          backgroundColor: "#0b0909", // Black main background
        }}
      >
        <Paper
          shadow="sm"
          radius="md"
          p="md"
          withBorder
          style={{
            backgroundColor: "#44444c", // Ebony secondary background
            borderColor: "#8c8c8c", // Gray border
          }}
        >
          <Grid gutter="sm">
            <Grid.Col span={3}>
              <TextInput
                label="Invoice #"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                label="Invoice Date"
                value="09/08/2025"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                label="Reference No"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                label="Reference Date"
                value="09/08/2025"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>

            <Grid.Col span={3}>
              <TextInput
                label="Supplier"
                value="11211"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Select
                label="Supplier Title"
                data={["Meezan Bnak Hydro Worx A/C 01040859"]}
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <TextInput
                label="Purchase A/C"
                value="131"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Select
                label="Purchase Title"
                data={["STOCK"]}
                value="STOCK"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>

            <Grid.Col span={3}>
              <TextInput
                label="Code"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <Select
                label="Product Name"
                data={["-- Select Product --"]}
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <TextInput
                label="Unit"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <TextInput
                label="Quantity"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <TextInput
                label="Rate"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col span={2}>
              <TextInput
                label="Amount"
                styles={{ label: { color: "#d6d6d6" } }}
              />
            </Grid.Col>
            <Grid.Col
              span={2}
              style={{ display: "flex", alignItems: "flex-end" }}
            >
              <Button
                fullWidth
                styles={{
                  root: {
                    backgroundColor: "#8c8c8c",
                    color: "#0b0909",
                    "&:hover": {
                      backgroundColor: "#d6d6d6",
                    },
                  },
                }}
              >
                Add
              </Button>
            </Grid.Col>
          </Grid>

          <Checkbox
            mt="md"
            label="Print Invoice"
            defaultChecked
            styles={{
              label: { color: "#d6d6d6" },
            }}
          />

          <Group mt="md">
            <Button
              styles={{
                root: {
                  backgroundColor: "#8c8c8c",
                  color: "#0b0909",
                  "&:hover": { backgroundColor: "#d6d6d6" },
                },
              }}
            >
              New
            </Button>
            <Button
              styles={{
                root: {
                  backgroundColor: "#8c8c8c",
                  color: "#0b0909",
                  "&:hover": { backgroundColor: "#d6d6d6" },
                },
              }}
            >
              Delete
            </Button>
            <Button
              styles={{
                root: {
                  backgroundColor: "#d6d6d6",
                  color: "#0b0909",
                  "&:hover": { backgroundColor: "#8c8c8c", color: "#0b0909" },
                },
              }}
            >
              Search
            </Button>
            <Button
              styles={{
                root: {
                  backgroundColor: "#d6d6d6",
                  color: "#0b0909",
                  "&:hover": { backgroundColor: "#8c8c8c", color: "#0b0909" },
                },
              }}
            >
              Clear
            </Button>
            <Button
              styles={{
                root: {
                  backgroundColor: "#8c8c8c",
                  color: "#0b0909",
                  "&:hover": { backgroundColor: "#d6d6d6" },
                },
              }}
            >
              Print Preview
            </Button>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}
