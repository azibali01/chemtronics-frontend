import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
// Types
export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Revenue"
  | "Expense";

export interface AccountNode {
  code: string;
  selCode: string;
  name: string;
  icon?: ReactNode;
  type?: AccountType;
  balance: number;
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

  return (
    <ChartOfAccountsContext.Provider
      value={{ accounts, setAccounts, expanded, setExpanded }}
    >
      {children}
    </ChartOfAccountsContext.Provider>
  );
};
