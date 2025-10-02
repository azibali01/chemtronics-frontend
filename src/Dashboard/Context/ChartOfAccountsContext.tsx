import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
// Types
export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Revenue"
  | "Expense";

export type AccountGroupType = "Group" | "Detail";

export type ParentAccount =
  | "1000-Assets"
  | "1100-Current-Assets"
  | "1110-CashInHands"
  | "1120-CashAtBank"
  | "1130-AccountsReceiveable"
  | "1200-fixedAssets"
  | "1220-Furniture & fixtures"
  | "2000-Liabilities"
  | "2100-current Liabilities"
  | "2110-AccountsPayable"
  | "2120-AccuredExpenses"
  | "2200-Long-Term Liabilites"
  | "2210-Bank Loan"
  | "300-Equity"
  | "3100-Owner's Equity"
  | "3200-Retained Earnings"
  | "4000-Revenue"
  | "4100-sales revenue"
  | "4200-serviceRevenue"
  | "5000-Expenses"
  | "5100-operating Expenses"
  | "5110-salaries & wages"
  | "5120-Rent Expense"
  | "5130-Utilities"
  | "5200- administrative expenses"
  | "5210-office supplies"
  | "5220-professional fees";

export interface AccountNode {
  selectedCode: string;
  accountCode: string;
  level: string;
  accountName: string;
  accountType: AccountType;
  parentAccount: ParentAccount | string;
  type: AccountGroupType;
  isParty: boolean;
  address?: string;
  phoneNo?: string;
  salesTaxNo?: string;
  ntn?: string;
  icon?: ReactNode;
  children?: AccountNode[];
}

interface ChartOfAccountsContextType {
  accounts: AccountNode[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountNode[]>>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ChartOfAccountsContext = createContext<
  ChartOfAccountsContextType | undefined
>(undefined);

export const useChartOfAccounts = () => {
  const context = useContext(ChartOfAccountsContext);
  if (!context)
    throw new Error(
      "useChartOfAccounts must be used within ChartOfAccountsProvider"
    );
  return context;
};

export const ChartOfAccountsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch accounts from backend API (correct route)
    const fetchAccounts = async () => {
      try {
        const res = await axios.get("http://localhost:3000/chart-of-account");
        if (Array.isArray(res.data)) {
          setAccounts(res.data);
        }
      } catch (err) {
        // Optionally handle error
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <ChartOfAccountsContext.Provider
      value={{ accounts, setAccounts, expanded, setExpanded }}
    >
      {children}
    </ChartOfAccountsContext.Provider>
  );
};
