import { useState, useRef, useEffect } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  Table,
  Modal,
  TextInput,
  ActionIcon,
  NumberInput,
  Textarea,
  Select,
  Switch,
  Pagination,
} from "@mantine/core";
import {
  IconPlus,
  IconTrash,
  IconPencil,
  IconSearch,
  IconDownload,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSalesInvoiceCompany2 } from "../../Context/Invoicing/SalesInvoiceContextCompany2";
import { useChartOfAccountsCompany2 } from "../../Context/ChartOfAccountsContextCompany2";
import axios from "axios";
import { notifications } from "@mantine/notifications";

// ...existing Chemtronics SalesInvoice logic, adapted for Company2 context...
export default function SalesInvoiceCompany2() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } =
    useSalesInvoiceCompany2();
  // ...rest of Chemtronics SalesInvoice logic, adapted for Company2 context...
  return (
    <div>
      <Text fw={600} fz="xl" mb="md">
        Sales Invoice (Hydroworx)
      </Text>
      {/* ...rest of the UI, modals, forms, etc. ... */}
    </div>
  );
}
