import React, { createContext, useContext, useState } from "react";

export type DeliveryItem = {
  sr: number;
  itemCode: string;
  particulars: string;
  unit: string;
  length: string;
  width: string;
  qty: string;
};

export type DeliveryChallan = {
  id: string;
  poNo: string;
  poDate: string;
  partyName: string;
  partyAddress: string;
  date: string;
  deliveryDate: string;
  status: "Delivered" | "In Transit" | "Pending";
  items: DeliveryItem[];
};

type DeliveryChallanContextType = {
  challans: DeliveryChallan[];
  setChallans: React.Dispatch<React.SetStateAction<DeliveryChallan[]>>;
  addChallan: (challan: DeliveryChallan) => void;
  updateChallan: (challan: DeliveryChallan) => void;
  deleteChallan: (id: string) => void;
};

const DeliveryChallanContext = createContext<
  DeliveryChallanContextType | undefined
>(undefined);

export const useDeliveryChallan = () => {
  const context = useContext(DeliveryChallanContext);
  if (!context)
    throw new Error(
      "useDeliveryChallan must be used within DeliveryChallanProvider"
    );
  return context;
};

export const DeliveryChallanProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);

  const addChallan = (challan: DeliveryChallan) => {
    setChallans((prev) => [...prev, challan]);
  };

  const updateChallan = (challan: DeliveryChallan) => {
    setChallans((prev) => prev.map((c) => (c.id === challan.id ? challan : c)));
  };

  const deleteChallan = (id: string) => {
    setChallans((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <DeliveryChallanContext.Provider
      value={{
        challans,
        setChallans,
        addChallan,
        updateChallan,
        deleteChallan,
      }}
    >
      {children}
    </DeliveryChallanContext.Provider>
  );
};
