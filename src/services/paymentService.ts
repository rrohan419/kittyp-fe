import { callRazorpayCreateOrder, callRazorpayVerifyPayment, CurrencyType, Taxes } from "./cartService";
import { UserProfile } from "./authService";
import { useOrder } from "@/context/OrderContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export type RazorpayOrderResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// export const handleCheckout = async (taxes: Taxes,
//   totalValue: number, currency: CurrencyType, orderId: string, user: UserProfile) => {
//   const isLoaded = await loadRazorpayScript();
//   // const { taxes, shippingCost, totalValue } = useOrder();
//   // const navigate = useNavigate();

//   if (!isLoaded) {
//     alert("Razorpay SDK failed to load. Please check your internet connection.");
//     return;
//   }
//   console.log("reciept", orderId);
//   console.log("iiiiiiiiiiiiiiiiii", orderId);
//   // Call your backend to create an order and get order_id, amount, currency etc.
//   const response = await callRazorpayCreateOrder({ amount: totalValue, currency: currency, receipt: orderId, notes: [], taxes });
//   console.log("rrrrrrrrrrrrrr", response);


//   const data = response.data

//   const options = {
//     key: "rzp_test_KxxNVzRC1oX2C1", // Replace with your Razorpay key_id
//     amount: data.amount * 100,
//     currency: data.currency,
//     name: "Kittyp Inc.",
//     description: "Test Transaction",
//     order_id: data.id,
//     handler: async function (razorpayOrderResponse: RazorpayOrderResponse) {
//       console.log("Payment successful", razorpayOrderResponse);
//       const razorpayVerifyResponse = await callRazorpayVerifyPayment({ orderId: razorpayOrderResponse.razorpay_order_id, paymentId: razorpayOrderResponse.razorpay_payment_id, signature: razorpayOrderResponse.razorpay_signature });
//       // Send payment ID and signature to backend for verification
//       console.log("payment success ? ", razorpayVerifyResponse);
//       if (razorpayVerifyResponse.status === 200) {
//         // window.location.href = "/orders";
//         // navigate("/orders");
//       }
//     },
//     prefill: {
//       name: user.firstName,
//       email: user.email,
//       contact: "",
//     },
//     theme: {
//       color: "#9D57FF",
//     },
//   };

//   const rzp = new window.Razorpay(options);
//   rzp.open();

// };

export const handleCheckout = (
  taxes: Taxes,
  totalValue: number,
  currency: CurrencyType,
  orderId: string,
  user: UserProfile
): Promise<RazorpayOrderResponse> => {
  return new Promise(async (resolve, reject) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return reject("Razorpay SDK failed to load");
    }

    try {
      const response = await callRazorpayCreateOrder({
        amount: totalValue,
        currency,
        receipt: orderId,
        notes: [],
        taxes,
      });

      const data = response.data;

      const options = {
        key: "rzp_test_KxxNVzRC1oX2C1",
        amount: data.amount * 100,
        currency: data.currency,
        name: "Kittyp Inc.",
        description: "Test Transaction",
        order_id: data.id,
        handler: async function (razorpayOrderResponse: RazorpayOrderResponse) {
          console.log("Payment successful", razorpayOrderResponse);

          const razorpayVerifyResponse = await callRazorpayVerifyPayment({
            orderId: razorpayOrderResponse.razorpay_order_id,
            paymentId: razorpayOrderResponse.razorpay_payment_id,
            signature: razorpayOrderResponse.razorpay_signature,
          });

          if (razorpayVerifyResponse.status === 200) {
            resolve(razorpayOrderResponse);
          } else {
            reject("Payment verification failed");
          }
        },
        prefill: {
          name: user.firstName,
          email: user.email,
          contact: "",
        },
        theme: {
          color: "#9D57FF",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (err: any) => {
        reject(err);
      });
      rzp.open();
    } catch (err) {
      reject(err);
    }
  });
};


const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      return resolve(true); // already loaded
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};
