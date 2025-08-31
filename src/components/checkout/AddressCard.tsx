import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Address, AddressModel } from "@/services/addressService";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface AddressCardProps {
  address: AddressModel;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  id: string;
  showDeleteButton?: boolean;
}

export function AddressCard({ address, isSelected, onSelect, onDelete, id, showDeleteButton = false }: AddressCardProps) {
  return (
    <Card 
      className={cn(
        "transition-all cursor-pointer",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1">
            <RadioGroup>
            <RadioGroupItem id={id} value={address.uuid || ""} className="mt-1 mr-3" checked={isSelected} />
            </RadioGroup>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor={id} className="font-medium cursor-pointer">
                  {address.name}
                </Label>
              </div>
              <div className="flex items-center gap-2">             
                <Label htmlFor={id} className="font-medium cursor-pointer">
                  {address.street}
                </Label>
                {/* {address.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )} */}
              </div>
              
              <div className="text-sm text-muted-foreground mt-1">
                {address.city}, {address.state} {address.postalCode}<br />
                {address.country} <br />
                {address.phoneNumber}
              </div>
            </div>
          </div>
          
          {showDeleteButton && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
