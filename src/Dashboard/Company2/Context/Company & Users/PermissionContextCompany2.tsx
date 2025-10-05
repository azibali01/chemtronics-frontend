import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import {
  IconUserShield,
  IconBuilding,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";

export type Permission = {
  name: string;
  description: string;
};

export type Role = {
  name: string;
  icon: React.ReactNode;
  description: string;
  users: number;
  permissions: Permission[];
};

const rolesDataCompany2: Role[] = [
  {
    name: "Super Admin",
    icon: <IconUserShield size={20} color="red" />,
    description: "Full system access with all permissions",
    users: 1,
    permissions: [
      { name: "Dashboard", description: "View dashboard and analytics" },
      { name: "Company Management", description: "Manage company profiles" },
      { name: "User Management", description: "Manage user accounts" },
      { name: "Chart of Accounts", description: "Manage account structure" },
      { name: "Invoicing", description: "Create and manage invoices" },
      {
        name: "Product Management",
        description: "Manage inventory and products",
      },
      { name: "Reports & Analytics", description: "View and export reports" },
      { name: "Cash Management", description: "Handle cash transactions" },
      { name: "Journal Entries", description: "Create journal vouchers" },
      { name: "Tax Management", description: "Manage GST and tax invoices" },
    ],
  },
  {
    name: "Company Admin",
    icon: <IconBuilding size={20} color="blue" />,
    description: "Company-level administration and management",
    users: 2,
    permissions: [
      { name: "Dashboard", description: "View dashboard and analytics" },
      { name: "Company Management", description: "Manage company profiles" },
      { name: "User Management", description: "Manage user accounts" },
      { name: "Reports & Analytics", description: "View and export reports" },
    ],
  },
  {
    name: "Accounts User",
    icon: <IconUser size={20} color="green" />,
    description: "Accounting and financial operations",
    users: 3,
    permissions: [
      { name: "Invoicing", description: "Create and manage invoices" },
      { name: "Cash Management", description: "Handle cash transactions" },
      { name: "Journal Entries", description: "Create journal vouchers" },
      { name: "Tax Management", description: "Manage GST and tax invoices" },
    ],
  },
  {
    name: "Staff",
    icon: <IconUsers size={20} color="gray" />,
    description: "Basic operations and data entry",
    users: 4,
    permissions: [
      { name: "Dashboard", description: "View dashboard and analytics" },
      {
        name: "Product Management",
        description: "Manage inventory and products",
      },
    ],
  },
];

type PermissionContextType = {
  roles: Role[];
  selectedRole: Role;
  enabledPermissions: string[];
  setSelectedRole: (role: Role) => void;
  togglePermission: (perm: string) => void;
};

const PermissionContextCompany2 = createContext<
  PermissionContextType | undefined
>(undefined);

export function PermissionProviderCompany2({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedRole, setSelectedRole] = useState<Role>(rolesDataCompany2[0]);
  const [enabledPermissions, setEnabledPermissions] = useState<string[]>(
    rolesDataCompany2[0].permissions.map((p) => p.name)
  );

  const togglePermission = (perm: string) => {
    setEnabledPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <PermissionContextCompany2.Provider
      value={{
        roles: rolesDataCompany2,
        selectedRole,
        enabledPermissions,
        setSelectedRole,
        togglePermission,
      }}
    >
      {children}
    </PermissionContextCompany2.Provider>
  );
}

export const usePermissionContextCompany2 = () => {
  const ctx = useContext(PermissionContextCompany2);
  if (!ctx)
    throw new Error(
      "usePermissionContextCompany2 must be used within PermissionProviderCompany2"
    );
  return ctx;
};
