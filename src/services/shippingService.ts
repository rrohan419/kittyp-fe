import { ShippingMethod as ShippingMethodType } from "./addressService";
import { ShippingMethod } from "./cartService";

export interface ShippingMethodInfo extends ShippingMethodType {
  id: ShippingMethod;
}

const shippingMethods: ShippingMethodInfo[] = [
  {
    id: ShippingMethod.STANDARD,
    name: "Standard Shipping",
    description: "Delivery within 5-7 business days",
    price: 99,
    estimatedDays: "5-7 business days"
  },
  {
    id: ShippingMethod.EXPRESS,
    name: "Express Shipping",
    description: "Delivery within 2-3 business days",
    price: 199,
    estimatedDays: "2-3 business days"
  },
  {
    id: ShippingMethod.PRIORITY,
    name: "Priority Delivery",
    description: "Next business day delivery",
    price: 499,
    estimatedDays: "Next business day"
  }
];

export const getShippingMethods = async (): Promise<ShippingMethodInfo[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(shippingMethods), 300);
  });
};
