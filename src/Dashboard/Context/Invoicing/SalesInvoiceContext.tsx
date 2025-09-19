import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type InvoiceItem = {
  id: number;
  code: string; // <-- string, not number
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
  number: string;
  date: string;
  deliveryNo?: string;
  deliveryDate?: string;
  poNo?: string;
  poDate?: string;
  accountNo?: string;
  accountTitle: string; // <-- required, not optional
  saleAccount?: string;
  saleAccountTitle?: string;
  ntnNo?: string;
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

const SalesInvoiceContext = createContext<SalesInvoiceContextType | undefined>(
  undefined
);

export const useSalesInvoice = () => {
  const context = useContext(SalesInvoiceContext);
  if (!context) {
    throw new Error(
      "useSalesInvoice must be used within a SalesInvoiceProvider"
    );
  }
  return context;
};

export const SalesInvoiceProvider = ({ children }: { children: ReactNode }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <SalesInvoiceContext.Provider
      value={{
        invoices,
        setInvoices,
        selectedInvoice,
        setSelectedInvoice,
      }}
    >
      {children}
    </SalesInvoiceContext.Provider>
  );
};
