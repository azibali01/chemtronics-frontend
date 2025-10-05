import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type Item = {
  id: number;
  code: number;
  hsCode: string;
  product: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
};

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
  ntnNo?: string;
  partyBillNo?: string;
  partyBillDate?: string;
};

type PurchaseInvoiceContextTypeCompany2 = {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const PurchaseInvoiceContextCompany2 = createContext<
  PurchaseInvoiceContextTypeCompany2 | undefined
>(undefined);

export const PurchaseInvoiceProviderCompany2 = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <PurchaseInvoiceContextCompany2.Provider
      value={{
        invoices,
        setInvoices,
        selectedInvoice,
        setSelectedInvoice,
      }}
    >
      {children}
    </PurchaseInvoiceContextCompany2.Provider>
  );
};

export const usePurchaseInvoiceCompany2 = () => {
  const context = useContext(PurchaseInvoiceContextCompany2);
  if (!context) {
    throw new Error(
      "usePurchaseInvoiceCompany2 must be used within a PurchaseInvoiceProviderCompany2"
    );
  }
  return context;
};
