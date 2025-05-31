

export interface Address {
    id?: string;
    fullName: string;
    phoneNumber: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault?: boolean;
  }
  
  export interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    price: number;
    estimatedDays: string;
  }
  
  export interface CheckoutSummary {
    subtotal: number;
    shipping: number;
    tax: number;
    serviceFee: number;
    total: number;
  }
  

// Mock saved addresses - in a real app, these would come from an API
const savedAddresses: Address[] = [
  {
    id: "addr_1",
    street: "123 Main Street",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110001",
    country: "India",
    isDefault: true,
    fullName: "John Doe",
    phoneNumber: "1234567890"
  },
  {
    id: "addr_2",
    street: "456 Park Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "India",
    isDefault: false,
    fullName: "Jane Smith",
    phoneNumber: "0987654321"
  }
];

export const fetchSavedAddresses = async (): Promise<Address[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(savedAddresses), 500);
  });
};

export const saveNewAddress = async (address: Address): Promise<Address> => {
  // Simulate API call
  return new Promise((resolve) => {
    const newAddress = {
      ...address,
      id: `addr_${Math.random().toString(36).substring(2, 9)}`
    };
    // In a real app, we would save this to the database
    setTimeout(() => resolve(newAddress), 500);
  });
};
