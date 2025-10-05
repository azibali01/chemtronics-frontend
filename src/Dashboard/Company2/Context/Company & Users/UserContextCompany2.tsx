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

const UserContextCompany2 = createContext<UserContextType | undefined>(
  undefined
);

export const UserProviderCompany2 = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([
    {
      name: "Alice Waterman",
      email: "alice@hydroworx.com",
      role: "Super Admin",
      roleColor: "red",
      company: "Hydroworx Ltd.",
      status: "active",
      lastLogin: "10/1/2025",
    },
    {
      name: "Bob Stream",
      email: "bob@bluestream.com",
      role: "Company Admin",
      roleColor: "blue",
      company: "BlueStream Inc.",
      status: "active",
      lastLogin: "9/28/2025",
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
    <UserContextCompany2.Provider
      value={{ users, setUsers, addUser, updateUser, deleteUser }}
    >
      {children}
    </UserContextCompany2.Provider>
  );
};

export const useUserContextCompany2 = () => {
  const context = useContext(UserContextCompany2);
  if (!context)
    throw new Error(
      "useUserContextCompany2 must be used within UserProviderCompany2"
    );
  return context;
};
