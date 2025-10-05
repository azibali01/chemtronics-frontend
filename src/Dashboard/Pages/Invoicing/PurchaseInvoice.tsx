import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  Table,
  Menu,
  ActionIcon,
  TextInput,
  Grid,
  Modal,
  NumberInput,
  Textarea,
  Switch,
  Pagination,
  Select,
} from "@mantine/core";
import {
  IconSearch,
  IconDots,
  IconTrash,
  IconPencil,
  IconDownload,
  IconShoppingCart,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { usePurchaseInvoice } from "../../Context/Invoicing/PurchaseInvoiceContext";
import { useProducts } from "../../Context/Inventory/ProductsContext";
import { useChartOfAccounts } from "../../Context/ChartOfAccountsContext";

type Invoice = {
  id: number;
  number: string;
  date: string;
  supplierNo?: string;
  supplierTitle?: string;
  purchaseAccount?: string;
  purchaseTitle?: string;
  items?: Item[];
  notes?: string;
  gst?: boolean;
  amount?: number;
  ntnNo?: string; // <-- Add NTN No here
  partyBillNo?: string; // <-- Add this line
  partyBillDate?: string; // <-- Add this line
};

type Item = {
  id: number;
  code: number;
  hsCode: string; // <-- Add this line
  product: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

// HS Code mapping and GST logic
const hsCodeTypeMap: Record<
  string,
  "Chemicals" | "Equipments" | "Pumps" | "Services"
> = {
  "3824": "Chemicals",
  "8421": "Equipments",
  "8413": "Pumps",
  "9833": "Services",
};

function getTaxRate(hsCode: string, province: "Punjab" | "Sindh") {
  const type = hsCodeTypeMap[hsCode];
  if (!type) return 0;
  if (type === "Services") {
    return province === "Punjab" ? 16 : 15;
  }
  // Chemicals, Equipments, Pumps
  return 18;
}

export default function PurchaseInvoice() {
  const { invoices, setInvoices } = usePurchaseInvoice();
  const { products } = useProducts();
  const { accounts } = useChartOfAccounts(); // Add this line

  // Remove hardcoded data and add state for dynamic data
  const [purchaseAccounts, setPurchaseAccounts] = useState<any[]>([]);

  // Fetch all required data from backend on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch Purchase Invoices
        const invoicesResponse = await axios.get(
          "http://localhost:3000/purchase-invoice/all-purchase-invoices"
        );
        if (invoicesResponse.data && Array.isArray(invoicesResponse.data)) {
          setInvoices(invoicesResponse.data);
        }

        // Extract Purchase Accounts and Supplier Accounts from Chart of Accounts
        if (accounts && accounts.length > 0) {
          const flatAccounts = flattenAccounts(accounts);
          const purchaseAccountsList = flatAccounts.filter(
            (account) =>
              account.code.startsWith("5") || // Expense accounts
              account.code.startsWith("131") || // Stock accounts
              account.name.toLowerCase().includes("purchase") ||
              account.name.toLowerCase().includes("stock")
          );
          setPurchaseAccounts(purchaseAccountsList);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        notifications.show({
          title: "Error",
          message: "Failed to fetch required data",
          color: "red",
        });
      }
    };

    fetchAllData();
  }, [setInvoices, accounts]);

  // Helper function to flatten Chart of Accounts
  const flattenAccounts = (nodes: any[]): any[] => {
    let result: any[] = [];
    nodes.forEach((node) => {
      result.push({
        code: node.code,
        name: node.name,
        parentAccount: node.parentAccount,
        isParty: node.isParty,
        accountName: node.accountName,
        accountType: node.accountType,
        address: node.address,
        phoneNo: node.phoneNo,
        ntn: node.ntn,
      });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenAccounts(node.children));
      }
    });
    return result;
  };

  // Create dropdown options from Chart of Accounts supplier accounts
  const supplierAccounts = flattenAccounts(accounts).filter(
    (acc) => acc.parentAccount === "2110-AccountsPayable" || acc.isParty
  );
  const supplierOptions = supplierAccounts
    .filter((supplier) => supplier.code)
    .map((supplier) => ({
      value: supplier.code,
      label: `${supplier.code} - ${supplier.accountName || supplier.name}`,
      data: supplier,
    }));

  const purchaseAccountOptions = purchaseAccounts.map((account) => ({
    value: account.code,
    label: `${account.code} - ${account.name}`,
  }));

  // Function to handle supplier selection
  const handleSupplierSelect = (selectedValue: string) => {
    const selectedSupplier = supplierAccounts.find(
      (s: any) => s.code === selectedValue
    );
    if (selectedSupplier) {
      setSupplierNo(selectedSupplier.code);
      setSupplierTitle(selectedSupplier.accountName || selectedSupplier.name);
      setNtnNo(selectedSupplier.ntn || "");
    }
  };

  // Function to handle purchase account selection
  const handlePurchaseAccountSelect = (selectedCode: string) => {
    const selectedAccount = purchaseAccounts.find(
      (account) => account.code === selectedCode
    );
    if (selectedAccount) {
      setPurchaseAccount(selectedCode);
      setPurchaseTitle(selectedAccount.name);
    }
  };

  // Fetch invoices from backend on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/purchase-invoice/all-purchase-invoices" // Changed path
        );
        if (response.data && Array.isArray(response.data)) {
          setInvoices(response.data);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
        notifications.show({
          title: "Error",
          message: "Failed to fetch purchase invoices",
          color: "red",
        });
      }
    };

    fetchInvoices();
  }, [setInvoices]);

  const [productCodes, setProductCodes] = useState<
    {
      value: string;
      label: string;
      productName: string;
      description: string;
      rate: number;
    }[]
  >([]);

  useEffect(() => {
    interface Product {
      code: string;
      productName?: string;
      name?: string;
      productDescription?: string;
      description?: string;
      unitPrice?: number;
    }
    const fetchProductCodes = async () => {
      try {
        const res = await axios.get("http://localhost:3000/products");
        if (Array.isArray(res.data)) {
          setProductCodes(
            res.data.map((p: Product) => ({
              value: p.code,
              label: `${p.code} - ${p.productName || p.name || ""}`,
              productName: p.productName || p.name || "",
              description: p.productDescription || p.description || "",
              rate: p.unitPrice || 0,
            }))
          );
        }
      } catch {
        setProductCodes([]);
      }
    };
    fetchProductCodes();
  }, []);

  const productCodeOptions = products.map((p) => ({
    value: p.code,
    label: `${p.code} }`, // Shows both code and name
  }));

  const productNameOptions = products.map((p) => ({
    value: p.productName,
    label: p.productName,
  }));

  const getProductByCode = (code: string) => {
    return products.find((p) => p.code === code);
  };

  const getProductByName = (name: string) => {
    return products.find((p) => p.productName === name);
  };

  // Update item with product details when code is selected
  const handleProductCodeChange = (itemId: number, selectedCode: string) => {
    const product = getProductByCode(selectedCode);
    if (product) {
      updateItem(itemId, "code", selectedCode);
      updateItem(itemId, "product", product.productName);
      updateItem(itemId, "description", product.productDescription);
      updateItem(itemId, "rate", product.unitPrice);
    }
  };

  // Update item with product details when name is selected
  const handleProductNameChange = (itemId: number, selectedName: string) => {
    const product = getProductByName(selectedName);
    if (product) {
      // Auto-fill product details when name is selected
      updateItem(itemId, "product", selectedName);
      updateItem(itemId, "code", product.code);
      updateItem(itemId, "description", product.productDescription);
      updateItem(itemId, "rate", product.unitPrice || 0);
      updateItem(itemId, "unit", "Piece"); // You can set default unit or get from product
    } else {
      updateItem(itemId, "product", selectedName);
    }
  };

  // Helper for header/footer
  function addHeaderFooter(doc: jsPDF, title: string) {
    doc.setFontSize(18);
    doc.text("CHEMTRONIX ENGINEERING SOLUTION", 14, 14);
    doc.setFontSize(12);
    doc.text(title, 14, 24);

    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setFontSize(10);
    doc.text(
      "*Computer generated invoice. No need for signature",
      14,
      pageHeight - 20
    );
    doc.setFontSize(11);
    doc.text(
      "HEAD OFFICE: 552 Mujtaba Canal View, Main Qasimpur Canal Road, Multan",
      14,
      pageHeight - 14
    );
    doc.text(
      "PLANT SITE: 108-1 Tufailabad Industrial Estate Multan",
      14,
      pageHeight - 8
    );
  }

  // Export filtered invoices to PDF
  const exportFilteredPDF = () => {
    const doc = new jsPDF();
    addHeaderFooter(doc, "Purchase Invoices");

    autoTable(doc, {
      startY: 32,
      head: [
        [
          "Invoice #",
          "Date",
          "Supplier No",
          "Supplier Title",
          "Purchase Account",
          "Purchase Title",
          "GST",
          "Amount",
        ],
      ],
      body: filteredInvoices.map((inv) => [
        inv.number || "",
        inv.date,
        inv.supplierNo || "",
        inv.supplierTitle || "",
        inv.purchaseAccount || "",
        inv.purchaseTitle || "",
        inv.gst ? "Yes" : "No",
        inv.amount !== undefined ? inv.amount.toFixed(2) : "0.00",
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const finalY = (data.cursor?.y ?? 60) + 8;
        doc.setFontSize(12);
        doc.text(`Total Invoices: ${filteredInvoices.length}`, 14, finalY);
        doc.text(
          `Total Amount: ${filteredInvoices
            .reduce((sum, i) => sum + (i.amount || 0), 0)
            .toFixed(2)}`,
          80,
          finalY
        );
      },
    });

    doc.save("purchase_invoices.pdf");
  };

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("PUR-004");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [dueDate, setDueDate] = useState("");
  const [includeGST, setIncludeGST] = useState(true);
  const [province, setProvince] = useState<"Punjab" | "Sindh">("Punjab");
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState("");
  const [supplierNo, setSupplierNo] = useState("");
  const [supplierTitle, setSupplierTitle] = useState("");
  const [purchaseAccount, setPurchaseAccount] = useState("");
  const [purchaseTitle, setPurchaseTitle] = useState("");
  const [ntnNo, setNtnNo] = useState(""); // <-- Add NTN No state

  // Add state for Party Bill No and Party Bill Date
  const [partyBillNo, setPartyBillNo] = useState("");
  const [partyBillDate, setPartyBillDate] = useState("");

  const totalPurchases = invoices.length;

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        code: 1,
        hsCode: "",
        product: "",
        description: "",
        unit: "",
        qty: 0,
        rate: 0,
      },
    ]);
  };

  // Subtotal, GST, etc. calculations
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const gst = includeGST ? subtotal * 0.18 : 0;
  const total = subtotal + gst;

  // Ex Gst Amount and Total GST (auto-calculated per item)
  const exGstAmount = items.reduce(
    (acc, item) =>
      acc +
      (item.qty * item.rate * getTaxRate(item.hsCode ?? "", province)) / 100,
    0
  );
  const totalGst = items.reduce(
    (acc, item) => acc + getTaxRate(item.hsCode ?? "", province),
    0
  );

  const removeItem = (id: number) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: number,
    field: keyof Item,
    value: Item[keyof Item]
  ) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      (inv.number || "").toLowerCase().includes(search.toLowerCase()) &&
      (!fromDate || new Date(inv.date) >= new Date(fromDate)) &&
      (!toDate || new Date(inv.date) <= new Date(toDate))
  );

  // Single Invoice PDF
  const exportPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    addHeaderFooter(doc, `Purchase Invoice: ${invoice.number}`);

    autoTable(doc, {
      startY: 32,
      head: [["Field", "Value"]],
      body: [
        ["Invoice #", invoice.number],
        ["Date", invoice.date],
        ["Supplier No", invoice.supplierNo || ""],
        ["Supplier Title", invoice.supplierTitle || ""],
        ["Purchase Account", invoice.purchaseAccount || ""],
        ["Purchase Title", invoice.purchaseTitle || ""],
        ["GST", invoice.gst ? "Yes" : "No"],
        ["Notes", invoice.notes || ""],
        [
          "Amount",
          invoice.amount !== undefined ? invoice.amount.toFixed(2) : "0.00",
        ],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [10, 104, 2] },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    if (invoice.items && invoice.items.length > 0) {
      autoTable(doc, {
        startY: (doc as jsPDF & { lastAutoTable?: { finalY?: number } })
          .lastAutoTable?.finalY
          ? ((doc as jsPDF & { lastAutoTable?: { finalY?: number } })
              .lastAutoTable?.finalY ?? 60) + 8
          : 60,
        head: [
          [
            "Code",
            "Product Name",
            "Description",
            "Unit",
            "Qty",
            "Rate",
            "Amount",
          ],
        ],
        body: (invoice.items ?? []).map((item) => [
          item.code,
          item.product,
          item.description,
          item.unit,
          item.qty,
          item.rate,
          (item.qty * item.rate).toFixed(2),
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [10, 104, 2] },
        theme: "grid",
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const finalY = (data.cursor?.y ?? 68) + 8;
          doc.setFontSize(12);
          doc.text(
            `Subtotal: ${(invoice.items ?? [])
              .reduce((sum, i) => sum + i.qty * i.rate, 0)
              .toFixed(2)}`,
            14,
            finalY
          );

          doc.text(
            `GST (18%): ${
              invoice.gst
                ? (
                    (invoice.items ?? []).reduce(
                      (sum, i) => sum + i.qty * i.rate,
                      0
                    ) * 0.18 || 0
                  ).toFixed(2)
                : "0.00"
            }`,
            110,
            finalY
          );
          doc.text(
            `Total: ${
              invoice.amount !== undefined ? invoice.amount.toFixed(2) : "0.00"
            }`,
            170,
            finalY
          );
        },
      });
    }

    doc.save(`${invoice.number}.pdf`);
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const paginatedInvoices = filteredInvoices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Text size="xl" fw={700}>
          Purchase Invoice
        </Text>
        <Button
          color="#0A6802"
          onClick={() => {
            setInvoiceNumber(
              "PUR-" + (invoices.length + 1).toString().padStart(3, "0")
            );
            setVendor("");
            setDate(new Date().toISOString().slice(0, 10)); // <-- Fix: set current date
            setDueDate("");
            setIncludeGST(true);
            setItems([]);
            setNotes("");
            setCreateOpen(true);
          }}
        >
          + Create Purchase Invoice
        </Button>
      </Group>

      <Grid mb="lg">
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Card shadow="sm" radius="md" p="lg" withBorder bg={"#F1FCF0"}>
            <Group justify="space-between">
              <Text>Total Purchases</Text>
              <IconShoppingCart size={20} />
            </Group>
            <div style={{ marginTop: 10 }}>
              <Text fw={700}>{totalPurchases}</Text>
            </div>
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="sm" radius="md" p="lg" bg={"#F1FCF0"} withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={600}>Purchase Invoices</Text>
        </Group>
        <Group mb="md" gap={"xs"} grow>
          <TextInput
            label="Search"
            placeholder="Search purchase invoices..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            style={{ minWidth: 220 }}
          />
          <TextInput
            label="From Date"
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <TextInput
            label="To Date"
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.currentTarget.value)}
            style={{ minWidth: 140 }}
          />
          <Group mt={24} gap="xs">
            <Button
              variant="outline"
              color="#0A6802"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </Button>
            <Button
              variant="filled"
              color="#0A6802"
              leftSection={<IconDownload size={16} />}
              onClick={exportFilteredPDF}
            >
              Export
            </Button>
          </Group>

          <Group justify="flex-end" mb="md">
            <Select
              data={["5", "10", "20", "50"]}
              value={pageSize.toString()}
              onChange={(val) => {
                setPageSize(Number(val));
                setPage(1);
              }}
              label="Rows per page"
              style={{ width: 120 }}
              size="xs"
            />
          </Group>
        </Group>

        <Table highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Invoice #</Table.Th>
              <Table.Th>Invoice Date</Table.Th>
              <Table.Th>Supplier No</Table.Th>
              <Table.Th>Supplier Title</Table.Th>
              <Table.Th>Purchase Account</Table.Th>
              <Table.Th>Purchase Title</Table.Th>
              <Table.Th>Code</Table.Th>
              <Table.Th>Product Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Rate</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedInvoices.map((inv) => (
              <Table.Tr key={inv.id}>
                <Table.Td>{inv.number || ""}</Table.Td>
                <Table.Td>{inv.date}</Table.Td>
                <Table.Td>{inv.supplierNo || ""}</Table.Td>
                <Table.Td>{inv.supplierTitle || ""}</Table.Td>
                <Table.Td>{inv.purchaseAccount || ""}</Table.Td>
                <Table.Td>{inv.purchaseTitle || ""}</Table.Td>
                <Table.Td>{inv.items?.[0]?.code || ""}</Table.Td>
                <Table.Td>{inv.items?.[0]?.product || ""}</Table.Td>
                <Table.Td>{inv.items?.[0]?.description || ""}</Table.Td>
                <Table.Td>{inv.items?.[0]?.unit || ""}</Table.Td>
                <Table.Td>{inv.items?.[0]?.qty || ""}</Table.Td>
                <Table.Td>{inv.items?.[0]?.rate || ""}</Table.Td>
                <Table.Td>
                  {inv.items?.[0]?.qty && inv.items?.[0]?.rate
                    ? (inv.items[0].qty * inv.items[0].rate).toFixed(2)
                    : ""}
                </Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={180}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="#0A6802">
                        <IconDots size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconPencil size={14} />}
                        onClick={() => {
                          setInvoiceNumber(inv.number || "");
                          setDate(inv.date);
                          setIncludeGST(inv.gst ?? true);
                          setItems(inv.items || []);
                          setNotes(inv.notes || "");
                          setSupplierNo(inv.supplierNo || "");
                          setSupplierTitle(inv.supplierTitle || "");
                          setPurchaseAccount(inv.purchaseAccount || "");
                          setPurchaseTitle(inv.purchaseTitle || "");
                          setNtnNo(inv.ntnNo || ""); // <-- add this line
                          setPartyBillNo(inv.partyBillNo || ""); // <-- add this line
                          setPartyBillDate(inv.partyBillDate || ""); // <-- add this line
                          setEditInvoice(inv);
                        }}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconDownload size={14} />}
                        onClick={() => exportPDF(inv)}
                      >
                        Export PDF
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => setDeleteInvoice(inv)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group mt="md" justify="center">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.max(1, Math.ceil(filteredInvoices.length / pageSize))}
            color="#0A6802"
            radius="md"
            size="md"
            withControls
          />
        </Group>
      </Card>

      <Modal
        opened={createOpen || !!editInvoice}
        onClose={() => {
          setCreateOpen(false);
          setEditInvoice(null);
        }}
        title={editInvoice ? "Edit Invoice" : "Create Purchase Invoice"}
        size="100%"
        centered
      >
        <Grid>
          <Grid.Col span={3}>
            <TextInput
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Invoice Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Party Bill No"
              value={partyBillNo}
              onChange={(e) => setPartyBillNo(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Party Bill Date"
              type="date"
              value={partyBillDate}
              onChange={(e) => setPartyBillDate(e.currentTarget.value)}
            />
          </Grid.Col>

          {/* Updated Supplier Selection with backend data */}
          <Grid.Col span={6}>
            <Select
              label="Select Supplier"
              placeholder="Choose supplier from list"
              data={supplierOptions}
              value={supplierNo}
              onChange={(selectedValue) => {
                if (selectedValue) {
                  handleSupplierSelect(selectedValue);
                }
              }}
              searchable
              clearable
              maxDropdownHeight={200}
            />
          </Grid.Col>

          {/* Manual supplier fields (if not in backend) */}
          <Grid.Col span={3}>
            <TextInput
              label="Supplier No (Manual)"
              placeholder="Enter manually if not in list"
              value={supplierNo}
              onChange={(e) => setSupplierNo(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <TextInput
              label="Supplier Title (Manual)"
              placeholder="Enter manually if not in list"
              value={supplierTitle}
              onChange={(e) => setSupplierTitle(e.currentTarget.value)}
            />
          </Grid.Col>

          {/* Updated Purchase Account with Chart of Accounts data */}
          <Grid.Col span={4}>
            <Select
              label="Purchase Account"
              placeholder="Select purchase account"
              data={purchaseAccountOptions}
              value={purchaseAccount}
              onChange={(selectedCode) => {
                if (selectedCode) {
                  handlePurchaseAccountSelect(selectedCode);
                }
              }}
              searchable
              clearable
              maxDropdownHeight={200}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="Purchase Title"
              value={purchaseTitle}
              readOnly
              styles={{
                input: { backgroundColor: "#f8f9fa" },
              }}
            />
          </Grid.Col>
          <Grid.Col span={4}>
            <TextInput
              label="NTN No"
              value={ntnNo}
              onChange={(e) => setNtnNo(e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>

        <Switch
          mt="md"
          label="Include GST (18%)"
          color={"#0A6802"}
          checked={includeGST}
          onChange={(e) => setIncludeGST(e.currentTarget.checked)}
        />

        <Select
          label="Province"
          data={[
            { value: "Punjab", label: "Punjab" },
            { value: "Sindh", label: "Sindh" },
          ]}
          value={province}
          onChange={(v) => setProvince(v as "Punjab" | "Sindh")}
          mb="md"
        />

        <Group justify="space-between" mt="md" mb="xs">
          <Text fw={600}>Invoice Items</Text>
          <Button size="xs" onClick={addItem} color="#0A6802">
            + Add Item
          </Button>
        </Group>
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th>Product Name</Table.Th>
              <Table.Th>HS Code</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Rate</Table.Th>
              <Table.Th>EX.GST Rate</Table.Th>
              <Table.Th>EX.GST Amt</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => {
              const gstRate = getTaxRate(item.hsCode ?? "", province);
              const gstAmount = (item.qty * item.rate * gstRate) / 100;
              const amount = item.qty * item.rate;

              return (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Select
                      placeholder="Product Code"
                      data={Array.from(
                        new Map(
                          productCodes.map((p) => [
                            String(p.value),
                            {
                              value: String(p.value),
                              label: p.label,
                              productName: p.productName,
                              description: p.description,
                              rate: p.rate,
                            },
                          ])
                        ).values()
                      )}
                      value={item.code?.toString() || ""}
                      onChange={(v) => {
                        const selected = productCodes.find(
                          (p) => String(p.value) === v
                        );
                        const newItems = [...items];
                        const itemIndex = newItems.findIndex(
                          (i) => i.id === item.id
                        );
                        if (itemIndex !== -1) {
                          newItems[itemIndex].code = Number(v) || 0;
                          newItems[itemIndex].product =
                            selected?.productName || "";
                          newItems[itemIndex].description =
                            selected?.description || "";
                          newItems[itemIndex].rate = selected?.rate || 0;
                          setItems(newItems);
                        }
                      }}
                      searchable
                      clearable
                      maxDropdownHeight={200}
                      styles={{
                        dropdown: { zIndex: 1000 },
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select
                      placeholder="Product Name"
                      data={Array.from(
                        new Map(
                          productCodes.map((p) => [
                            p.productName,
                            {
                              value: p.productName,
                              label: p.productName,
                              code: p.value,
                              description: p.description,
                              rate: p.rate,
                            },
                          ])
                        ).values()
                      )}
                      value={item.product}
                      onChange={(v) => {
                        const selected = productCodes.find(
                          (p) => p.productName === v
                        );
                        const newItems = [...items];
                        const itemIndex = newItems.findIndex(
                          (i) => i.id === item.id
                        );
                        if (itemIndex !== -1) {
                          newItems[itemIndex].product = v || "";
                          newItems[itemIndex].code =
                            Number(selected?.value) || 0;
                          newItems[itemIndex].description =
                            selected?.description || "";
                          newItems[itemIndex].rate = selected?.rate || 0;
                          setItems(newItems);
                        }
                      }}
                      searchable
                      clearable
                      maxDropdownHeight={200}
                      styles={{
                        dropdown: { zIndex: 1000 },
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Select
                      placeholder="HS Code"
                      data={[
                        { value: "3824", label: "3824 - Chemicals" },
                        { value: "8421", label: "8421 - Equipment" },
                        { value: "8413", label: "8413 - Pumps" },
                        { value: "9833", label: "9833 - Service" },
                      ]}
                      value={item.hsCode ?? ""}
                      onChange={(v) => updateItem(item.id, "hsCode", v || "")}
                      searchable
                      clearable
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "description",
                          e.currentTarget.value
                        )
                      }
                      readOnly={!!getProductByCode(item.code?.toString() || "")} // Read-only if auto-filled
                      styles={{
                        input: {
                          backgroundColor: getProductByCode(
                            item.code?.toString() || ""
                          )
                            ? "#f8f9fa"
                            : "white",
                        },
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <TextInput
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(item.id, "unit", e.currentTarget.value)
                      }
                      placeholder="Unit"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={1}
                      value={item.qty}
                      onChange={(val) =>
                        updateItem(item.id, "qty", Number(val) || 0)
                      }
                      placeholder="Qty"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      min={0}
                      step={0.01}
                      decimalScale={2}
                      value={item.rate}
                      onChange={(val) =>
                        updateItem(item.id, "rate", Number(val) || 0)
                      }
                      placeholder="Rate"
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput value={gstRate} disabled />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput value={gstAmount.toFixed(2)} disabled />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput value={amount.toFixed(2)} disabled />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      onClick={() => removeItem(item.id)}
                      variant="light"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>

        <Group align="start" mt="md">
          <div style={{ minWidth: 180 }}>
            <Text>Subtotal: {subtotal.toFixed(2)}</Text>
            <Text>Ex Gst Amount: {exGstAmount.toFixed(2)}</Text>
            <Text>Total GST: {totalGst.toFixed(2)}</Text>
            <Text>GST (18%): {gst.toFixed(2)}</Text>
            <Text fw={700}>Total: {total.toFixed(2)}</Text>
          </div>
        </Group>

        <Textarea
          label="Notes (Optional)"
          placeholder="Additional notes or terms..."
          mt="md"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
        />

        <Group justify="flex-end" mt="lg">
          <Button
            color="#0A6802"
            onClick={async () => {
              try {
                const payload = {
                  invoiceNumber: invoiceNumber,
                  invoiceDate: date,
                  partyBillNo,
                  partyBillDate,
                  supplierNo,
                  supplierTitle,
                  purchaseAccount,
                  purchaseTitle,
                  ntnNo,
                  amount: total,
                  items,
                  notes,
                  gst: includeGST,
                };

                if (editInvoice) {
                  // Update existing invoice
                  const response = await axios.put(
                    `http://localhost:3000/purchase-invoice/update-purchase-invoice/${editInvoice.id}`, // Changed path
                    payload
                  );

                  if (response.data) {
                    setInvoices((prev) =>
                      prev.map((i) =>
                        i.id === editInvoice.id ? { ...i, ...payload } : i
                      )
                    );
                    notifications.show({
                      title: "Success",
                      message: "Purchase Invoice updated successfully",
                      color: "green",
                    });
                  }
                  setEditInvoice(null);
                } else {
                  // Create new invoice
                  const response = await axios.post(
                    "http://localhost:3000/purchase-invoice/create-purchase-invoice", // Changed path
                    payload
                  );

                  if (response.data) {
                    const newInvoice: Invoice = {
                      id: response.data.id || Date.now(),
                      ...response.data,
                    };
                    setInvoices((prev) => [...prev, newInvoice]);
                    notifications.show({
                      title: "Success",
                      message: "Purchase Invoice created successfully",
                      color: "green",
                    });
                  }
                  setCreateOpen(false);
                }
              } catch (error: any) {
                notifications.show({
                  title: "Error",
                  message:
                    error.response?.data?.message || "Failed to save invoice",
                  color: "red",
                });
                console.error("Error saving invoice:", error);
              }
            }}
          >
            {editInvoice ? <strong>Update Invoice</strong> : "Create Invoice"}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={!!deleteInvoice}
        onClose={() => setDeleteInvoice(null)}
        title="Confirm Delete"
        centered
      >
        <Text mb="md">
          Are you sure you want to delete{" "}
          <strong>{deleteInvoice?.number}</strong>?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteInvoice(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={async () => {
              if (deleteInvoice) {
                try {
                  await axios.delete(
                    `http://localhost:3000/purchase-invoice/delete-purchase-invoice/${deleteInvoice.id}` // Changed path
                  );

                  setInvoices((prev) =>
                    prev.filter((i) => i.id !== deleteInvoice.id)
                  );

                  notifications.show({
                    title: "Success",
                    message: "Purchase Invoice deleted successfully",
                    color: "green",
                  });

                  setDeleteInvoice(null);
                } catch (error: any) {
                  notifications.show({
                    title: "Error",
                    message:
                      error.response?.data?.message ||
                      "Failed to delete invoice",
                    color: "red",
                  });
                  console.error("Error deleting invoice:", error);
                }
              }
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

const purchaseAccountMap: Record<string, string> = {
  "131": "STOCK",
  // Add more codes and titles here
};
