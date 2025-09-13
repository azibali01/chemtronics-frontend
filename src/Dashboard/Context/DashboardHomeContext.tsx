import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  stockInHand: number;
  receivables: number;
  payables: number;
  lowStockItems: number;
}

interface DashboardHomeContextType {
  stats: DashboardStats;
  setStats: React.Dispatch<React.SetStateAction<DashboardStats>>;
}

const DashboardHomeContext = createContext<
  DashboardHomeContextType | undefined
>(undefined);

export const useDashboardHome = () => {
  const context = useContext(DashboardHomeContext);
  if (!context)
    throw new Error(
      "useDashboardHome must be used within DashboardHomeProvider"
    );
  return context;
};

export const DashboardHomeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalPurchases: 0,
    stockInHand: 0,
    receivables: 0,
    payables: 0,
    lowStockItems: 0,
  });

  return (
    <DashboardHomeContext.Provider value={{ stats, setStats }}>
      {children}
    </DashboardHomeContext.Provider>
  );
};
