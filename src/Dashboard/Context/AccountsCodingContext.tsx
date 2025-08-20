/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";

export interface AccountDetail {
  selectedCode: string;
  accountCode: string;
  level: string;
  title: string;
  type: string;
  isParty: boolean;
  address: string;
  contactPerson: string;
  salesTax: string;
  phone: string;
}

interface AccountContextType {
  account: AccountDetail;
  accounts: AccountDetail[];
  updateField: (field: keyof AccountDetail, value: string | boolean) => void;
  resetForm: () => void;
  newAccount: () => void;
  saveAccount: () => void;
  deleteAccount: (code: string) => void;
  searchAccount: (code: string) => void;
}

const defaultAccount: AccountDetail = {
  selectedCode: "",
  accountCode: "",
  level: "",
  title: "",
  type: "",
  isParty: false,
  address: "",
  contactPerson: "",
  salesTax: "",
  phone: "",
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountsCodingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [account, setAccount] = useState<AccountDetail>(defaultAccount);
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);

  const updateField = (field: keyof AccountDetail, value: string | boolean) => {
    setAccount((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => setAccount(defaultAccount);

  const newAccount = () => resetForm();

  const saveAccount = () => {
    setAccounts((prev) => {
      const exists = prev.find((a) => a.accountCode === account.accountCode);
      return exists
        ? prev.map((a) => (a.accountCode === account.accountCode ? account : a))
        : [...prev, account];
    });
    resetForm();
  };

  const deleteAccount = (code: string) => {
    setAccounts((prev) => prev.filter((a) => a.accountCode !== code));
    resetForm();
  };

  const searchAccount = (code: string) => {
    const found = accounts.find((a) => a.accountCode === code);
    if (found) setAccount(found);
    else alert("Account not found!");
  };

  return (
    <AccountContext.Provider
      value={{
        account,
        accounts,
        updateField,
        resetForm,
        newAccount,
        saveAccount,
        deleteAccount,
        searchAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccountsCoding = () => {
  const context = useContext(AccountContext);
  if (!context)
    throw new Error(
      "useAccountsCoding must be used within AccountsCodingProvider"
    );
  return context;
};
