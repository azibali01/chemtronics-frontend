import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type Item = {
  id: number;
  code: number;
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
  discount?: number;
};

type PurchaseInvoiceContextType = {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
};

const PurchaseInvoiceContext = createContext<
  PurchaseInvoiceContextType | undefined
>(undefined);

export const PurchaseInvoiceProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <PurchaseInvoiceContext.Provider
      value={{
        invoices,
        setInvoices,
        selectedInvoice,
        setSelectedInvoice,
      }}
    >
      {children}
    </PurchaseInvoiceContext.Provider>
  );
};

// Move this to a separate file if you want to share it between components
export const usePurchaseInvoice = () => {
  const context = useContext(PurchaseInvoiceContext);
  if (!context) {
    throw new Error(
      "usePurchaseInvoice must be used within a PurchaseInvoiceProvider"
    );
  }
  return context;
};
