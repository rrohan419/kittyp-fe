import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/checkout/AddressForm";
import { AddressCard } from "@/components/checkout/AddressCard";
import { findAllSavedAddress, deleteAddress, AddressModel } from "@/services/addressService";
import { useSelector } from "react-redux";
import { RootState } from "@/module/store/store";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({ open, onClose }) => {
  const user = useSelector((state: RootState) => state.authReducer.user);
  const [addresses, setAddresses] = useState<AddressModel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = async () => {
    if (!user?.uuid) return;
    setLoading(true);
    try {
      const res = await findAllSavedAddress(user.uuid);
      setAddresses(res.data);
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchAddresses();
  }, [open, user?.uuid]);

  const handleAddressCreated = (newAddress: AddressModel) => {
    setAddresses(prev => [...prev, newAddress]);
    setShowAddForm(false);
  };

  const handleDelete = async (uuid: string) => {
    if (!user?.uuid) return;
    try {
      await deleteAddress(user.uuid, uuid);
      setAddresses(prev => prev.filter(addr => addr.uuid !== uuid));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{showAddForm ? "New Address" : "Saved Addresses"}</DialogTitle>
        </DialogHeader>
        {showAddForm ? (
          <AddressForm
            onAddressCreated={handleAddressCreated}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <>
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {addresses.length === 0 && <div className="text-gray-500 text-center">No saved addresses.</div>}
              {addresses.map((address, idx) => (
                <AddressCard
                  key={address.uuid || idx}
                  address={address}
                  id={`profile-address-${idx}`}
                  isSelected={false}
                  onSelect={() => {}}
                  onDelete={() => handleDelete(address.uuid)}
                  showDeleteButton={true}
                />
              ))}
            </div>
             
            <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add New Address
            </Button>
          </>
        )}
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-2 right-2"></Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};