import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Address } from "@/services/addressService";
import { cn } from "@/lib/utils";

interface AddressCardProps {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  id: string;
}

export function AddressCard({ address, isSelected, onSelect, id }: AddressCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
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
                <Badge variant="secondary" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mt-1">
              {address.city}, {address.state} {address.postalCode}<br />
              {address.country}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
