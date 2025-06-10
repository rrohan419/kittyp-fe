import { toast } from "sonner";
import { handleCheckout } from "@/services/paymentService";
import { CurrencyType, callRazorpayVerifyPayment } from "@/services/cartService";
import { UserProfile } from "@/services/authService";

interface Order {
    orderNumber: string;
    totalAmount: number;
    taxes: any;
    currency: string;
}

interface ReinitiatePaymentOptions {
    order: Order;
    user: UserProfile;
    onSuccess?: () => void;
    onVerifying?: () => void;
    onComplete?: () => void;
}

export const reinitiatePayment = async ({
    order,
    user,
    onSuccess,
    onVerifying,
    onComplete
}: ReinitiatePaymentOptions) => {
    if (!user) {
        toast.error("Please login to reinitiate payment");
        return;
    }

    try {
        // Convert the currency string to CurrencyType
        const currency = order.currency === 'INR' ? CurrencyType.INR : CurrencyType.USD;
        
        const response = await handleCheckout(
            order.taxes,
            order.totalAmount,
            currency,
            order.orderNumber,
            user
        );

        // Set verifying state if callback provided
        if (onVerifying) {
            onVerifying();
        }

        try {
            // Verify the payment
            const verifyResponse = await callRazorpayVerifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
            });

            if (verifyResponse.success) {
                toast.success("Payment successful!");
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                throw new Error("Payment verification failed");
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support if payment was deducted.");
            throw error;
        }
    } catch (error: any) {
        console.error("Payment process error:", error);
        
        // Handle different types of errors
        if (error.error?.description) {
            // Razorpay specific error
            toast.error(error.error.description);
        } else if (error.message === "Payment cancelled by user") {
            toast.error("Payment was cancelled");
        } else if (error.message === "Payment verification failed") {
            toast.error("Payment verification failed. Please contact support if payment was deducted.");
        } else {
            toast.error("Payment failed. Please try again.");
        }
        throw error;
    } finally {
        if (onComplete) {
            onComplete();
        }
    }
}; 