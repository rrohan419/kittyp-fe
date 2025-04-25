import { ShippingMethod } from "./addressService";


const shippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "Delivery within 5-7 business days",
    price: 99,
    estimatedDays: "5-7 business days"
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "Delivery within 2-3 business days",
    price: 199,
    estimatedDays: "2-3 business days"
  },
  {
    id: "overnight",
    name: "Overnight Delivery",
    description: "Next business day delivery",
    price: 499,
    estimatedDays: "Next business day"
  }
];

export const getShippingMethods = async (): Promise<ShippingMethod[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(shippingMethods), 300);
  });
};
