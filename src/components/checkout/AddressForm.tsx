import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AddressModel, AddressType, SaveAddressDto, saveNewAddress } from "@/services/addressService";
import { useSelector } from "react-redux";
import { RootState } from "@/module/store/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface AddressFormProps {
  onAddressCreated: (address: AddressModel) => void;
  onCancel: () => void;
}

export function AddressForm({ onAddressCreated, onCancel }: AddressFormProps) {
  const [address, setAddress] = useState<SaveAddressDto>({
    name: "",
    phoneNumber: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    formattedAddress: "",
    addressType: AddressType.HOME
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useSelector((state: RootState) => state.cartReducer);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Function to format address from individual fields
  const formatAddress = (addressData: SaveAddressDto): string => {
    const parts = [
      addressData.name,
      addressData.street,
      addressData.city,
      addressData.state,
      addressData.postalCode,
      addressData.country
    ].filter(Boolean); // Remove empty/undefined values
    
    return parts.join(", ");
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
      // Populate formatted address before submitting
      const addressWithFormatted = {
        ...address,
        formattedAddress: formatAddress(address)
      };

      const newAddress = await saveNewAddress(addressWithFormatted, user.uuid);
      console.log("Address saved, response:", newAddress);
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            value={address.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            name="phoneNumber"
            value={address.phoneNumber}
            onChange={handleChange}
            placeholder="Enter your phone number"
            required
          />
        </div>
      </div>
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
      <div className="space-y-2">
        <Label htmlFor="addressType">Address Type *</Label>
        <Select
          value={address.addressType}
          onValueChange={(value) =>
            setAddress((prev) => ({
              ...prev,
              addressType: value as AddressType,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select address type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HOME">Home</SelectItem>
            <SelectItem value="WORK">Work</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preview of formatted address */}
      {address.street && address.city && (
        <div className="space-y-2">
          <Label>Formatted Address Preview</Label>
          <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
            {formatAddress(address)}
          </div>
        </div>
      )}

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
