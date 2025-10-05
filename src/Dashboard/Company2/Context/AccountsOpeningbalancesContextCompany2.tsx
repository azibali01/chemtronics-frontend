import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AccountsOpeningBalancesContextType {
  balances: Record<string, { debit: number; credit: number }>;
  setBalances: React.Dispatch<
    React.SetStateAction<Record<string, { debit: number; credit: number }>>
  >;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const AccountsOpeningBalancesContextCompany2 = createContext<
  AccountsOpeningBalancesContextType | undefined
>(undefined);

export const AccountsOpeningBalancesProviderCompany2 = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [balances, setBalances] = useState<
    Record<string, { debit: number; credit: number }>
  >({});
  const [loading, setLoading] = useState(false);

  const value: AccountsOpeningBalancesContextType = {
    balances,
    setBalances,
    loading,
    setLoading,
  };

  return (
    <AccountsOpeningBalancesContextCompany2.Provider value={value}>
      {children}
    </AccountsOpeningBalancesContextCompany2.Provider>
  );
};

export function useAccountsOpeningBalances() {
  const context = useContext(AccountsOpeningBalancesContextCompany2);
  if (context === undefined) {
    throw new Error(
      "useAccountsOpeningBalances must be used within an AccountsOpeningBalancesProviderCompany2"
    );
  }
  return context;
}
