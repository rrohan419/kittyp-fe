
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Address } from "@/services/addressService";

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  id: string;
}

export function AddressCard({ address, isSelected, onSelect, id }: AddressCardProps) {
  return (
    <Card 
      className={`transition-all cursor-pointer ${isSelected ? 'border-kitty-500 ring-2 ring-kitty-200' : 'border-gray-200 hover:border-kitty-300'}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start">
          <RadioGroupItem id={id} value={address.id || ""} className="mt-1 mr-3" checked={isSelected} />
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Label htmlFor={id} className="font-medium cursor-pointer">
                {address.street}
              </Label>
              {address.isDefault && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Default
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-500 mt-1">
              {address.city}, {address.state} {address.postalCode}<br />
              {address.country}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
