import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Types
export interface OpeningBalance {
  debit: number;
  credit: number;
}

interface AccountsOpeningBalancesContextType {
  balances: Record<string, OpeningBalance>;
  setBalances: React.Dispatch<
    React.SetStateAction<Record<string, OpeningBalance>>
  >;
}

const AccountsOpeningBalancesContext = createContext<
  AccountsOpeningBalancesContextType | undefined
>(undefined);

export const useAccountsOpeningBalances = () => {
  const context = useContext(AccountsOpeningBalancesContext);
  if (!context)
    throw new Error(
      "useAccountsOpeningBalances must be used within AccountsOpeningBalancesProvider"
    );
  return context;
};

export const AccountsOpeningBalancesProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [balances, setBalances] = useState<Record<string, OpeningBalance>>({});

  return (
    <AccountsOpeningBalancesContext.Provider value={{ balances, setBalances }}>
      {children}
    </AccountsOpeningBalancesContext.Provider>
  );
};
