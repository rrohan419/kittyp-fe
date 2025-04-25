import { Taxes } from "@/services/cartService";
import { createContext, ReactNode, useContext, useState } from "react";


export interface OrderContextType {
    taxes: Taxes;
    setTaxes: React.Dispatch<React.SetStateAction<Taxes>>;
    totalValue: number;
    setTotalValue: React.Dispatch<React.SetStateAction<number>>;
    shippingCost: number;
    setShippingCost: React.Dispatch<React.SetStateAction<number>>;
}


const OrderContext = createContext<OrderContextType>({
    taxes: undefined,
    shippingCost: 0,
    totalValue: 0,
    setShippingCost: () => { },
    setTaxes: () => { },
    setTotalValue: () => { }
});

export const OrderProvider = ({ children }: { children: ReactNode }) => {
    const [taxes, setTaxes] = useState<Taxes>({ shippingCharges: 0, otherTax: 0, serviceCharge: 0 });
    const [totalValue, setTotalValue] = useState<number>(0);
    const [shippingCost, setShippingCost] = useState<number>(0);

    return (
        <OrderContext.Provider value={{ taxes, setTaxes, totalValue, setTotalValue, shippingCost, setShippingCost }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrder = () => useContext(OrderContext);
