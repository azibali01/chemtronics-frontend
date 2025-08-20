import { useState } from "react";
import {
  TextInput,
  Select,
  Button,
  Group,
  Paper,
  Title,
  Checkbox,
  Grid,
} from "@mantine/core";

export default function PurchaseInvoiceGST() {
  const [formData, setFormData] = useState({
    computer: "",
    invoiceDate: "18/08/2025",
    partyBillNo: "",
    partyBillDate: "18/08/2025",
    supplier: "",
    supplierTitle: "",
    purchaseAccount: "131",
    purchaseTitle: "STOCK",
    ntnNo: "",
    code: "",
    productName: "",
    hsCode: "",
    quantity: "",
    rate: "",
    netAmount: "",
    gst: "",
    exGstRate: "",
    exGstAmount: "",
    printInvoice: "",
  });

  // Common input style (for both TextInput & Select)
  const inputStyle = {
    backgroundColor: "#1f232c", // dark background
    color: "#dfd6d1", // light text
    border: "1px solid #83746e", // Coffee Pot accent border
    borderRadius: "8px",
  };

  return (
    <Paper
      shadow="md"
      radius="md"
      p="md"
      withBorder
      style={{
        backgroundColor: "#1f232c", // Dark paper background
        borderColor: "#83746e",
        color: "#dfd6d1",
      }}
    >
      <Title order={4} mb="md" style={{ color: "#dfd6d1" }}>
        Purchase Invoice GST
      </Title>

      <Grid gutter="sm">
        <Grid.Col span={3}>
          <TextInput
            label="Computer #"
            value={formData.computer}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Invoice Date"
            value={formData.invoiceDate}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Party Bill No"
            value={formData.partyBillNo}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Party Bill Date"
            value={formData.partyBillDate}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <TextInput
            label="Supplier"
            value={formData.supplier}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Supplier Title"
            placeholder="-- Select Account --"
            data={["Supplier A", "Supplier B"]}
            styles={(theme) => ({
              input: {
                backgroundColor: theme.colors.dark[6],
                borderColor: theme.colors.gray[7],
                color: theme.colors.gray[0],
              },
              label: {
                color: theme.colors.gray[3],
              },
              option: {
                "&[data-selected]": {
                  backgroundColor: theme.colors.blue[7],
                  color: theme.white,
                },
                "&[data-hovered]": {
                  backgroundColor: theme.colors.blue[8],
                  color: theme.white,
                },
              },
            })}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Purchase Account"
            value={formData.purchaseAccount}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <Select
            label="Purchase A/C Title"
            data={["STOCK", "EXPENSES"]}
            value={formData.purchaseTitle}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
              dropdown: { backgroundColor: "#1f232c", color: "#dfd6d1" },
              option: {
                "&[data-selected]": {
                  backgroundColor: "#83746e",
                  color: "#1f232c",
                },
              },
            }}
          />
        </Grid.Col>

        <Grid.Col span={3}>
          <TextInput
            label="NTN No"
            value={formData.ntnNo}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Code"
            value={formData.code}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Product Name"
            value={formData.productName}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="HS Code"
            value={formData.hsCode}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>

        <Grid.Col span={2}>
          <TextInput
            label="Quantity"
            value={formData.quantity}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="Rate"
            value={formData.rate}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="Net Amount"
            value={formData.netAmount}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="GST %"
            value={formData.gst}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="EX.GST Rate"
            value={formData.exGstRate}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
        <Grid.Col span={2}>
          <TextInput
            label="EX.GST Amt"
            value={formData.exGstAmount}
            styles={{
              input: inputStyle,
              label: { color: "#dfd6d1" },
            }}
          />
        </Grid.Col>
      </Grid>

      <Group mt="lg">
        <Button style={{ backgroundColor: "#83746e", color: "#1f232c" }}>
          New
        </Button>
        <Button style={{ backgroundColor: "#d9534f", color: "#ffffff" }}>
          Delete
        </Button>
        <Button style={{ backgroundColor: "#495057", color: "#ffffff" }}>
          Search
        </Button>
        <Button style={{ backgroundColor: "#ffc107", color: "#1f232c" }}>
          Clear
        </Button>
      </Group>
    </Paper>
  );
}
