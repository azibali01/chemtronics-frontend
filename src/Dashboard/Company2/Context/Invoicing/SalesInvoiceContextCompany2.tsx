import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type InvoiceItem = {
  id: number;
  code: string;
  product: string;
  hsCode: string;
  description: string;
  qty: number;
  rate: number;
  exGSTRate: number;
  exGSTAmount: number;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryNumber?: string;
  deliveryDate?: string;
  poNumber?: string;
  poDate?: string;
  accountNumber?: string;
  accountTitle: string;
  saleAccount?: string;
  saleAccountTitle?: string;
  ntnNumber?: string;
  amount: number;
  netAmount?: number;
  items?: InvoiceItem[];
};

type SalesInvoiceContextType = {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const SalesInvoiceContextCompany2 = createContext<
  SalesInvoiceContextType | undefined
>(undefined);

export const useSalesInvoice = () => {
  const context = useContext(SalesInvoiceContextCompany2);
  if (!context) {
    throw new Error(
      "useSalesInvoice must be used within a SalesInvoiceProviderCompany2"
    );
  }
  return context;
};

export const SalesInvoiceProviderCompany2 = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <SalesInvoiceContextCompany2.Provider
      value={{
        invoices,
        setInvoices,
        selectedInvoice,
        setSelectedInvoice,
      }}
    >
      {children}
    </SalesInvoiceContextCompany2.Provider>
  );
};
