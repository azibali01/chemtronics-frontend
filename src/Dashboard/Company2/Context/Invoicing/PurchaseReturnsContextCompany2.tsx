import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
type ReturnItem = {
  product: string;
  quantity: number;
  rate: number;
  amount: number;
  code: string;
  unit: string;
  discount?: number;
  netAmount?: number;
};

type ReturnEntry = {
  id: string;
  invoice: string;
  date: string;
  amount: number;
  notes: string;
  items: ReturnItem[];
  supplierNumber: string;
  supplierTitle: string;
  purchaseAccount: string;
  purchaseTitle: string;
};

type PurchaseReturnsContextTypeCompany2 = {
  returns: ReturnEntry[];
  setReturns: React.Dispatch<React.SetStateAction<ReturnEntry[]>>;
  selectedReturn: ReturnEntry | null;
  setSelectedReturn: React.Dispatch<React.SetStateAction<ReturnEntry | null>>;
};

const PurchaseReturnsContextCompany2 = createContext<
  PurchaseReturnsContextTypeCompany2 | undefined
>(undefined);

export const usePurchaseReturnsCompany2 = () => {
  const context = useContext(PurchaseReturnsContextCompany2);
  if (!context) {
    throw new Error(
      "usePurchaseReturnsCompany2 must be used within a PurchaseReturnsProviderCompany2"
    );
  }
  return context;
};

export const PurchaseReturnsProviderCompany2 = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnEntry | null>(
    null
  );

  return (
    <PurchaseReturnsContextCompany2.Provider
      value={{
        returns,
        setReturns,
        selectedReturn,
        setSelectedReturn,
      }}
    >
      {children}
    </PurchaseReturnsContextCompany2.Provider>
  );
};
