
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Address, saveNewAddress } from "@/services/addressService";

interface AddressFormProps {
  onAddressCreated: (address: Address) => void;
  onCancel: () => void;
}

export function AddressForm({ onAddressCreated, onCancel }: AddressFormProps) {
  const [address, setAddress] = useState<Address>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!address.street || !address.city || !address.state || !address.postalCode) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newAddress = await saveNewAddress(address);
      toast.success("Address saved successfully");
      onAddressCreated(newAddress);
    } catch (error) {
      toast.error("Failed to save address");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address *</Label>
        <Input
          id="street"
          name="street"
          value={address.street}
          onChange={handleChange}
          placeholder="Enter your street address"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={address.city}
            onChange={handleChange}
            placeholder="Enter your city"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          <Input
            id="state"
            name="state"
            value={address.state}
            onChange={handleChange}
            placeholder="Enter your state"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code *</Label>
          <Input
            id="postalCode"
            name="postalCode"
            value={address.postalCode}
            onChange={handleChange}
            placeholder="Enter your postal code"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            name="country"
            value={address.country}
            onChange={handleChange}
            placeholder="Enter your country"
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Address"}
        </Button>
      </div>
    </form>
  );
}
