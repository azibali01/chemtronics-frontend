"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
interface Company {
  name: string;
  address: string;
  email: string;
  phone: string;
  users: number;
  status: "active" | "inactive";
  created: string;
}

interface CompanyContextType {
  companies: Company[];
  addCompany: (company: Company) => void;
  updateCompany: (index: number, company: Company) => void;
  deleteCompany: (index: number) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = (): CompanyContextType => {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error("useCompanyContext must be used inside CompanyProvider");
  }
  return ctx;
};

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([
    {
      name: "Acme Corporation",
      address: "123 Business St, City, State 12345",
      email: "admin@acme.com",
      phone: "+1 (555) 123-4567",
      users: 15,
      status: "active",
      created: "1/15/2024",
    },
    {
      name: "TechStart Solutions",
      address: "456 Innovation Ave, Tech City, TC 67890",
      email: "contact@techstart.com",
      phone: "+1 (555) 987-6543",
      users: 8,
      status: "active",
      created: "2/20/2024",
    },
    {
      name: "Global Enterprises",
      address: "789 Corporate Blvd, Metro, MT 54321",
      email: "info@global.com",
      phone: "+1 (555) 456-7890",
      users: 25,
      status: "inactive",
      created: "1/5/2024",
    },
  ]);

  const addCompany = (company: Company) => {
    setCompanies((prev) => [...prev, company]);
  };

  const updateCompany = (index: number, company: Company) => {
    setCompanies((prev) => prev.map((c, i) => (i === index ? company : c)));
  };

  const deleteCompany = (index: number) => {
    setCompanies((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <CompanyContext.Provider
      value={{ companies, addCompany, updateCompany, deleteCompany }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
