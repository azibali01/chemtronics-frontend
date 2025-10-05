import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { AccountNode } from "../../Context/ChartOfAccountsContext";

interface ChartOfAccountsContextType {
  accounts: AccountNode[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountNode[]>>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ChartOfAccountsContextCompany2 = createContext<
  ChartOfAccountsContextType | undefined
>(undefined);

export const useChartOfAccounts = () => {
  const context = useContext(ChartOfAccountsContextCompany2);
  if (!context)
    throw new Error(
      "useChartOfAccounts must be used within ChartOfAccountsProviderCompany2"
    );
  return context;
};

export const ChartOfAccountsProviderCompany2: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [accounts, setAccounts] = useState<AccountNode[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch accounts from backend API (Company2 route)
    const fetchAccounts = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3000/chart-of-account-company2"
        );
        if (Array.isArray(res.data)) {
          setAccounts(res.data);
        }
      } catch {
        setAccounts([]);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <ChartOfAccountsContextCompany2.Provider
      value={{ accounts, setAccounts, expanded, setExpanded }}
    >
      {children}
    </ChartOfAccountsContextCompany2.Provider>
  );
};
