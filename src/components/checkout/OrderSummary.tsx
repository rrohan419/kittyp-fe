import { CurrencyType, formatCurrency } from "@/services/cartService";

interface OrderSummaryProps {
    amount: number;
    shippingCost: number;
    currency: CurrencyType;
}

export function OrderSummary({ amount, shippingCost, currency }: OrderSummaryProps) {
    const tax = amount * 0.18; // 18% GST
    const serviceCharge = amount * 0.05; // 5% service charge
    const total = amount + tax + serviceCharge + shippingCost;

    return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>{formatCurrency(amount.toFixed(2), currency)}</span>
            </div>

            <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                <span>{formatCurrency(tax.toFixed(2), currency)}</span>
            </div>

            <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Service Charge (5%)</span>
                <span>{formatCurrency(serviceCharge.toFixed(2), currency)}</span>
            </div>

            <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span>{formatCurrency(shippingCost.toFixed(2), currency)}</span>
            </div>

            <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total.toFixed(2), currency)}</span>
            </div>
        </div>
    );
}
