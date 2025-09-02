import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
type User = {
  name: string;
  email: string;
  role: string;
  roleColor: string;
  company: string;
  status: string;
  lastLogin: string;
};

type UserContextType = {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  addUser: (user: User) => void;
  updateUser: (index: number, user: User) => void;
  deleteUser: (index: number) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([
    {
      name: "John Smith",
      email: "john.smith@acme.com",
      role: "Super Admin",
      roleColor: "red",
      company: "Acme Corporation",
      status: "active",
      lastLogin: "3/15/2024",
    },
    {
      name: "Sarah Johnson",
      email: "sarah.j@acme.com",
      role: "Company Admin",
      roleColor: "blue",
      company: "Acme Corporation",
      status: "active",
      lastLogin: "3/14/2024",
    },
    {
      name: "Mike Wilson",
      email: "mike.w@techstart.com",
      role: "Accounts User",
      roleColor: "green",
      company: "TechStart Solutions",
      status: "active",
      lastLogin: "3/13/2024",
    },
    {
      name: "Lisa Brown",
      email: "lisa.b@global.com",
      role: "Staff",
      roleColor: "gray",
      company: "Global Enterprises",
      status: "inactive",
      lastLogin: "3/10/2024",
    },
  ]);

  const addUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
  };

  const updateUser = (index: number, updatedUser: User) => {
    setUsers((prev) => {
      const copy = [...prev];
      copy[index] = updatedUser;
      return copy;
    });
  };

  const deleteUser = (index: number) => {
    setUsers((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <UserContext.Provider
      value={{ users, setUsers, addUser, updateUser, deleteUser }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUserContext must be used within UserProvider");
  return context;
};
