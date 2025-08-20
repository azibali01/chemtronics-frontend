import { useState } from "react";
import {
  Box,
  Button,
  Group,
  Select,
  TextInput,
  Title,
  Grid,
} from "@mantine/core";

export default function PurchaseInvoice() {
  const [invoice, setInvoice] = useState("");

  return (
    <Box
      p="md"
      style={{
        backgroundColor: "#1f232c", // dark background
        color: "#dfd6d1",
        border: "1px solid #83746e",
        borderRadius: 8,
      }}
    >
      <Title order={4} mb="md" style={{ color: "#dfd6d1" }}>
        Purchase Invoice
      </Title>

      {/* Top Row */}
      <Grid gutter="md">
        <Grid.Col span={1}>
          <TextInput
            label="Invoice #"
            disabled
            value={invoice}
            onChange={(e) => setInvoice(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
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
            placeholder="dd/mm/yyyy"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <TextInput
            label="Reference No"
            placeholder="Enter ref no"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <TextInput
            label="Reference Date"
            placeholder="dd/mm/yyyy"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
      </Grid>

      {/* Second Row */}
      <Grid gutter="md" mt="md">
        <Grid.Col span={1}>
          <TextInput
            label="Supplier"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <Select
            label="Supplier Title"
            placeholder="Select Supplier"
            data={["Meezan Bank", "HBL", "UBL"]}
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
              dropdown: { backgroundColor: "#2a2f3a" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <TextInput
            label="Purchase A/C"
            placeholder="Enter A/C"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <TextInput
            label="Purchase Title"
            placeholder="STOCK"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
      </Grid>

      {/* Third Row */}
      <Grid gutter="md" mt="md">
        <Grid.Col span={1}>
          <TextInput
            label="Code"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
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
            placeholder="Select product"
            data={["Product 1", "Product 2", "Product 3"]}
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
              dropdown: { backgroundColor: "#2a2f3a" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={2}>
          <TextInput
            label="Unit"
            placeholder="Unit"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={2}>
          <TextInput
            label="Quantity"
            type="number"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={2}>
          <TextInput
            label="Rate"
            type="number"
            styles={{
              input: {
                backgroundColor: "#2a2f3a",
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
                backgroundColor: "#2a2f3a",
                color: "#dfd6d1",
                border: "1px solid #83746e",
              },
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={1}>
          <Button
            mt={25}
            style={{
              borderColor: "#83746e", // Coffee Pot border
              color: "#dfd6d1", // Serenity text
              backgroundColor: "#1f232c", // Dark bg
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#83746e"; // Coffee Pot hover bg
              e.currentTarget.style.color = "#ffffff"; // White text on hover
              e.currentTarget.style.borderColor = "#dfd6d1"; // Serenity border on hover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#1f232c"; // Dark bg
              e.currentTarget.style.color = "#dfd6d1"; // Serenity text
              e.currentTarget.style.borderColor = "#83746e"; // Coffee Pot border
            }}
          >
            Add
          </Button>
        </Grid.Col>
      </Grid>

      {/*Buttons */}

      <Group mt="md">
        <Button color="blue">New</Button>
        <Button color="red">Delete</Button>
        <Button color="gray">Search</Button>
        <Button color="yellow">Clear</Button>
        <Button color="pink">Print Preview</Button>
      </Group>
    </Box>
  );
}
