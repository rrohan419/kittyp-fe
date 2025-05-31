import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/LoadingState";
import { ShippingMethod } from "@/services/cartService";
import { getShippingMethods, ShippingMethodInfo } from "@/services/shippingService";
import { useOrder } from "@/context/OrderContext";

interface ShippingMethodSelectorProps {
  selectedMethod: ShippingMethod | "";
  onMethodChange: (methodId: ShippingMethod, price: number) => void;
}

export function ShippingMethodSelector({ selectedMethod, onMethodChange }: ShippingMethodSelectorProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {setTaxes} = useOrder();

  useEffect(() => {
    async function fetchShippingMethods() {
      try {
        const methods = await getShippingMethods();
        setShippingMethods(methods);

        if (!selectedMethod && methods.length > 0) {
          const first = methods[0];
          onMethodChange(first.id, first.price);
          setTaxes(prev => ({ ...prev, shipping: first.price }));
        }
      } catch (error) {
        console.error("Failed to fetch shipping methods:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchShippingMethods();
  }, [selectedMethod, onMethodChange]);

  const handleChange = (id: ShippingMethod, price: number) => {
    onMethodChange(id, price);
    setTaxes(prev => ({ ...prev, shipping: price })); 
  };

  if (isLoading) {
    return <LoadingState message="Loading shipping options..." />;
  }

  return (
    <RadioGroup value={selectedMethod} className="space-y-3">
      {shippingMethods.map((method) => (
        <Card 
          key={method.id} 
          className={`transition-all cursor-pointer ${
            selectedMethod === method.id ? 'border-kitty-500 ring-2 ring-kitty-200' : 'border-gray-200 hover:border-kitty-300'
          }`}
          onClick={() => handleChange(method.id, method.price)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-base">{method.name}</Label>
                <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">Estimated delivery: {method.estimatedDays}</p>
              </div>
              <div className="font-semibold">₹{method.price}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </RadioGroup>
  );
}
