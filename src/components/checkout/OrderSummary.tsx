
import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { Separator } from "@/components/ui/separator";
import { CheckoutSummary } from "@/services/addressService";
import { useOrder } from "@/context/OrderContext";

interface OrderSummaryProps {
  shippingCost: number;
}

export function OrderSummary({ shippingCost }: OrderSummaryProps) {
  const { items, subtotal} = useCart();
  const {taxes, setTaxes, totalValue, setTotalValue} = useOrder();
  const [summary, setSummary] = useState<CheckoutSummary>({
    subtotal: subtotal,
    shipping: shippingCost,
    tax: 0,
    serviceFee: 0,
    total: 0
  });

  useEffect(() => {
    // Calculate tax (5% of subtotal)
    const tax = subtotal * 0.05;
    
    // Service fee (2% of subtotal + shipping)
    const serviceFee = (subtotal + shippingCost) * 0.02;
    
    setTaxes({serviceCharge: serviceFee, shippingCharges:  shippingCost, otherTax: tax})

    // Total
    const total = subtotal + shippingCost + tax + serviceFee;
    console.log("tallllllllllllll", total);
    setTotalValue(total);

    console.log("taxes", taxes);
    console.log("totalValue", totalValue);
    console.log("subtotal", subtotal);
    console.log("shippingCost", shippingCost);
    // console.log("");
    setSummary({
      subtotal,
      shipping: shippingCost,
      tax,
      serviceFee,
      total
    });
  }, [subtotal, shippingCost,taxes, totalValue]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Items ({items.length})</span>
          <span>₹{summary.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>₹{summary.shipping.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Estimated Tax</span>
          <span>₹{summary.tax.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Service Fee</span>
          <span>₹{summary.serviceFee.toFixed(2)}</span>
        </div>
      </div>
      
      <Separator />
      
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>₹{summary.total.toFixed(2)}</span>
      </div>
    </div>
  );
}
