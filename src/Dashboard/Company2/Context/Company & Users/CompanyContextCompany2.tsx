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

const CompanyContextCompany2 = createContext<CompanyContextType | undefined>(
  undefined
);

export const useCompanyContextCompany2 = (): CompanyContextType => {
  const ctx = useContext(CompanyContextCompany2);
  if (!ctx) {
    throw new Error(
      "useCompanyContextCompany2 must be used inside CompanyProviderCompany2"
    );
  }
  return ctx;
};

export const CompanyProviderCompany2 = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [companies, setCompanies] = useState<Company[]>([
    {
      name: "Hydroworx Ltd.",
      address: "456 Water St, Aqua City, AQ 67890",
      email: "admin@hydroworx.com",
      phone: "+1 (555) 987-6543",
      users: 10,
      status: "active",
      created: "3/10/2025",
    },
    {
      name: "BlueStream Inc.",
      address: "789 River Rd, Streamville, ST 54321",
      email: "info@bluestream.com",
      phone: "+1 (555) 456-7890",
      users: 7,
      status: "inactive",
      created: "4/5/2025",
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
    <CompanyContextCompany2.Provider
      value={{ companies, addCompany, updateCompany, deleteCompany }}
    >
      {children}
    </CompanyContextCompany2.Provider>
  );
};
