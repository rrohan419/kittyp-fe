import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressForm } from "@/components/checkout/AddressForm";
import { AddressCard } from "@/components/checkout/AddressCard";
import { ShippingMethodSelector } from "@/components/checkout/ShippingMethodSelector";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { RadioGroup } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/ui/LoadingState";
import { PaymentLoader } from "@/components/ui/PaymentLoader";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Address, AddressModel, fetchSavedAddresses, findAllSavedAddress, deleteAddress } from "@/services/addressService";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
    callRazorpayCreateOrder,
    callRazorpayVerifyPayment,
    CurrencyType,
    createOrder,
    OrderRequest,
    ShippingMethod
} from "@/services/cartService";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from '@/module/store/store';
import { clearCartThunk } from "@/module/slice/CartSlice";
import { loadRazorpayScript, handlePayment, RazorpayOptions, handlePaymentTimeout, handlePaymentCancellation } from "@/services/paymentService";


export default function Checkout() {
    const dispatch = useDispatch<AppDispatch>();
    const { items, totalAmount, user } = useSelector((state: RootState) => state.cartReducer);
    const navigate = useNavigate();
    const { colorScheme, resolvedMode } = useTheme();

    // const [addresses, setAddresses] = useState<Address[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<AddressModel[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);

    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>("");
    const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>("");
    const [sameAsShipping, setSameAsShipping] = useState(true);

    const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | "">("");
    const [shippingCost, setShippingCost] = useState(0);

    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

    const [paymentTimeout, setPaymentTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isPaymentPending, setIsPaymentPending] = useState(false);
    const [isPaymentVerifying, setIsPaymentVerifying] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        if (items.length === 0) {
            navigate("/cart");
            return;
        }
    }, [items.length, navigate]);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (user?.uuid) {
                try {
                    setIsLoadingAddresses(true);
                    const addresses = await findAllSavedAddress(user.uuid);
                    const fetchedAddresses = addresses.data;

                setSavedAddresses(fetchedAddresses);

                if (fetchedAddresses.length > 0) {
                    setSelectedShippingAddressId(fetchedAddresses[0].uuid);
                    setSelectedBillingAddressId(fetchedAddresses[0].uuid);
                }
                    console.log("db saved address", addresses);
                } catch (error) {
                    toast.error("Failed to load saved addresses");
                } finally {
                    setIsLoadingAddresses(false);
                }

            }
        };
        fetchAddresses();
    }, [user?.uuid]);

    useEffect(() => {
        // Check if Razorpay is already loaded
        loadRazorpayScript().then(setIsRazorpayLoaded);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupPaymentTimeout();
            // Cleanup Razorpay scroll state if it exists
            if ((window as any).__razorpayCleanup) {
                (window as any).__razorpayCleanup();
                delete (window as any).__razorpayCleanup;
            }
            // Always ensure scroll is restored
            document.body.style.overflow = 'auto';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, []);

    const cleanupPaymentTimeout = () => {
        if (paymentTimeout) {
            clearTimeout(paymentTimeout);
            setPaymentTimeout(null);
        }
        setIsPaymentPending(false);
        setIsProcessingOrder(false);
        // Restore scroll state
        document.body.style.overflow = 'auto';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
    };

    const handlePaymentCleanup = async (orderId: string, reason: 'timeout' | 'cancelled') => {
        try {
            setIsRedirecting(true);
            if (reason === 'timeout') {
                await handlePaymentTimeout(orderId);
                toast.error("Payment session timed out. Please try again.");
            } else {
                await handlePaymentCancellation(orderId);
                toast.info("Payment cancelled. You can try again when ready.");
            }
        } catch (error) {
            console.error(`Error handling payment ${reason}:`, error);
        } finally {
            navigate('/cart');
        }
    };

    // const handleAddressCreated = (newAddress: Address) => {
    //     setAddresses(prev => [...prev, newAddress]);
     const handleAddressCreated = (newAddress: AddressModel) => {
        console.log("New address created:", newAddress);
        setSavedAddresses(prev => [...prev, newAddress]);
        setSelectedShippingAddressId(newAddress.uuid || "");
        if (sameAsShipping) {
            setSelectedBillingAddressId(newAddress.uuid || "");
        }
        setShowAddAddressForm(false);
    };

    const handleAddressDelete = async (addressUuid: string) => {
        if (!user?.uuid) {
            toast.error("User not found");
            return;
        }

        try {
            await deleteAddress(user.uuid, addressUuid);
            setSavedAddresses(prev => prev.filter(addr => addr.uuid !== addressUuid));
            
            // Update selected addresses if the deleted address was selected
            if (selectedShippingAddressId === addressUuid) {
                const remainingAddresses = savedAddresses.filter(addr => addr.uuid !== addressUuid);
                if (remainingAddresses.length > 0) {
                    setSelectedShippingAddressId(remainingAddresses[0].uuid);
                    if (sameAsShipping) {
                        setSelectedBillingAddressId(remainingAddresses[0].uuid);
                    }
                } else {
                    setSelectedShippingAddressId("");
                    if (sameAsShipping) {
                        setSelectedBillingAddressId("");
                    }
                }
            } else if (selectedBillingAddressId === addressUuid) {
                const remainingAddresses = savedAddresses.filter(addr => addr.uuid !== addressUuid);
                if (remainingAddresses.length > 0) {
                    setSelectedBillingAddressId(remainingAddresses[0].uuid);
                } else {
                    setSelectedBillingAddressId("");
                }
            }
            
            toast.success("Address deleted successfully");
        } catch (error) {
            console.error("Failed to delete address:", error);
            toast.error("Failed to delete address");
        }
    };

    const handleShippingMethodChange = (methodId: ShippingMethod, price: number) => {
        setSelectedShippingMethod(methodId);
        setShippingCost(price);
    };

    // Function to get theme color based on current theme
    const getThemeColor = () => {
        // Get color based on colorScheme
        switch (colorScheme) {
            case 'purple':
                return '#9D57FF';
            case 'blue':
                return '#3B82F6';
            case 'green':
                return '#22C55E';
            case 'autumn':
                return '#FB923C';
            case 'ocean':
                return '#0EA5E9';
            default: // default/pink theme
                return resolvedMode === 'dark' ? '#F43F7A' : '#F43F5E';
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedShippingAddressId) {
            toast.error("Please select a shipping address");
            return;
        }

        if (!sameAsShipping && !selectedBillingAddressId) {
            toast.error("Please select a billing address");
            return;
        }

        if (!selectedShippingMethod) {
            toast.error("Please select a shipping method");
            return;
        }

        if (!user?.uuid) {
            toast.error("Please login to continue");
            return;
        }

        if (!isRazorpayLoaded) {
            toast.error("Payment system is initializing. Please try again.");
            return;
        }

        setIsProcessingOrder(true);
        setIsPaymentPending(true);

        try {
            // Get selected addresses
            // const shippingAddress = addresses.find(addr => addr.id === selectedShippingAddressId);
            // const billingAddress = sameAsShipping
            //     ? shippingAddress
            //     : addresses.find(addr => addr.id === selectedBillingAddressId);

            const shippingAddress = savedAddresses.find(addr => addr.uuid === selectedShippingAddressId);
            const billingAddress = sameAsShipping
                ? shippingAddress
                : savedAddresses.find(addr => addr.uuid === selectedBillingAddressId);

            if (!shippingAddress || (!sameAsShipping && !billingAddress)) {
                throw new Error("Selected addresses not found");
            }

            // Create order from cart
            const orderRequest: OrderRequest = {
                shippingAddress: {
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postalCode: shippingAddress.postalCode,
                    country: shippingAddress.country
                },
                billingAddress: sameAsShipping ? {
                    street: shippingAddress.street,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postalCode: shippingAddress.postalCode,
                    country: shippingAddress.country
                } : {
                    street: billingAddress!.street,
                    city: billingAddress!.city,
                    state: billingAddress!.state,
                    postalCode: billingAddress!.postalCode,
                    country: billingAddress!.country
                },
                shippingMethod: selectedShippingMethod
            };

            let orderResponse;
            try {
                orderResponse = await createOrder(user.uuid, orderRequest);
            } catch (error: any) {
                console.error("Order creation error:", error);
                // Clear processing states
                setIsProcessingOrder(false);
                setIsPaymentPending(false);

                // Get error message from response or fallback
                let errorMessage = "Failed to create order";
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                // Force show the error toast
                toast.dismiss(); // Clear any existing toasts
                toast.error(errorMessage, {
                    duration: 5000,
                });

                // Handle insufficient stock separately
                if (errorMessage.includes("Insufficient stock")) {
                    const match = errorMessage.match(/Insufficient stock for product: (.+)\. Available: (\d+)/);
                    if (match) {
                        const [, productName, availableQty] = match;
                        setTimeout(() => {
                            toast.error(`Only ${availableQty} unit(s) available for ${productName}. Please update your cart.`, {
                                duration: 5000,
                            });
                        }, 100); // Slight delay to ensure both messages are seen
                    }
                }

                // Navigate back to cart after a short delay
                setTimeout(() => {
                    navigate('/cart');
                }, 2000);

                return;
            }

            if (!orderResponse.success) {
                setIsProcessingOrder(false);
                setIsPaymentPending(false);

                toast.dismiss(); // Clear any existing toasts
                toast.error(orderResponse.message || "Failed to place order", {
                    duration: 5000,
                });

                setTimeout(() => {
                    navigate('/cart');
                }, 2000);

                return;
            }

            const { orderNumber, totalAmount } = orderResponse.data;

            // Create Razorpay order
            const razorpayOrderResponse = await callRazorpayCreateOrder({
                amount: totalAmount,
                currency: CurrencyType.INR,
                receipt: orderNumber,
                notes: [`user_id:${user.uuid}`, `order_number:${orderNumber}`],
                taxes: orderResponse.data.taxes
            });

            if (!razorpayOrderResponse.success) {
                throw new Error(razorpayOrderResponse.message);
            }

            const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
            if (!razorpayKey) {
                toast.error("Payment configuration error. Please contact support.");
                console.error("Razorpay key is missing");
                return;
            }

            // Set a 5-minute timeout for payment completion
            const timeout = setTimeout(() => {
                if (isPaymentPending) {
                    handlePaymentCleanup(razorpayOrderResponse.data.id, 'timeout');
                }
            }, 5 * 60 * 1000); // 5 minutes

            setPaymentTimeout(timeout);

            const options: RazorpayOptions = {
                key: razorpayKey,
                amount: razorpayOrderResponse.data.amount,
                currency: razorpayOrderResponse.data.currency,
                name: "Kittyp Haven",
                description: `Order #${orderNumber}`,
                order_id: razorpayOrderResponse.data.id,
                handler: async function (response) {
                    try {
                        cleanupPaymentTimeout();
                        setIsPaymentVerifying(true);
                        const verifyResponse = await callRazorpayVerifyPayment({
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature
                        });

                        if (verifyResponse.success) {
                            await dispatch(clearCartThunk(user.uuid));
                            toast.success("Payment successful!");
                            navigate("/profile", { state: "orders" });
                        } else {
                            throw new Error("Payment verification failed");
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error("Payment verification failed");
                        navigate('/cart');
                    } finally {
                        setIsPaymentVerifying(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsRedirecting(true);
                        handlePaymentCleanup(razorpayOrderResponse.data.id, 'cancelled');
                    },
                    escape: true,
                },
                prefill: {
                    name: shippingAddress.name || '',
                    email: user.email || '',
                    contact: shippingAddress.phoneNumber || ''
                },
                theme: {
                    color: getThemeColor()
                }
            };

            try {
                await handlePayment(options);
            } catch (error: any) {
                cleanupPaymentTimeout();
                setIsRedirecting(true);
                console.error('Payment failed:', error);
                if (error.error?.description) {
                    toast.error(error.error.description);
                } else {
                    toast.error("Payment failed. Please try again.");
                }
                navigate('/cart');
            }

        } catch (error) {
            cleanupPaymentTimeout();
            console.error("Failed to process order:", error);
            setIsProcessingOrder(false);
            setIsPaymentPending(false);
            setIsRedirecting(true);

            toast.dismiss(); // Clear any existing toasts
            toast.error("Failed to place order. Please try again.", {
                duration: 5000,
            });

            setTimeout(() => {
                navigate('/cart');
            }, 2000);
        }
    };

    if (isLoadingAddresses || isPaymentVerifying || isRedirecting) {
        return (
            <>
                <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center bg-white dark:bg-gray-950">
                    {isPaymentVerifying ? (
                        <PaymentLoader
                            message="Processing Your Order"
                            subMessage="Please wait while we verify your payment and process your order. Do not close or refresh this page."
                        />
                    ) : isRedirecting ? (
                        <PaymentLoader
                            message="Redirecting"
                            subMessage="Please wait while we redirect you..."
                        />
                    ) : (
                        <LoadingState message="Preparing checkout..." />
                    )}
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <style>
                {`
                    .address-scroll-container::-webkit-scrollbar {
                        width: 8px;
                    }
                    .address-scroll-container::-webkit-scrollbar-track {
                        background: rgb(243 244 246);
                        border-radius: 4px;
                    }
                    .address-scroll-container::-webkit-scrollbar-thumb {
                        background: rgb(156 163 175);
                        border-radius: 4px;
                    }
                    .address-scroll-container::-webkit-scrollbar-thumb:hover {
                        background: rgb(107 114 128);
                    }
                    
                    .dark .address-scroll-container::-webkit-scrollbar-track {
                        background: rgb(55 65 81);
                    }
                    .dark .address-scroll-container::-webkit-scrollbar-thumb {
                        background: rgb(107 114 128);
                    }
                    .dark .address-scroll-container::-webkit-scrollbar-thumb:hover {
                        background: rgb(156 163 175);
                    }
                `}
            </style>
            <div className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
                <div className="flex items-center mb-8">
                    <Button
                        variant="ghost"
                        className="mr-2"
                        onClick={() => navigate('/cart')}
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <h1 className="text-3xl font-bold">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-xl">
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>

                            <CardContent>
                                {showAddAddressForm ? (
                                    <AddressForm
                                        onAddressCreated={handleAddressCreated}
                                        onCancel={() => setShowAddAddressForm(false)}
                                    />
                                ) : (
                                    <>
                                        {savedAddresses.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-gray-500 mb-4">You don't have any saved addresses</p>
                                                <Button onClick={() => setShowAddAddressForm(true)}>
                                                    <Plus className="mr-2 h-4 w-4" /> Add New Address
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative">
                                                    <div className="max-h-80 overflow-y-auto pr-2 space-y-3 address-scroll-container">
                                                        <RadioGroup value={selectedShippingAddressId} className="space-y-3">
                                                                                                                {savedAddresses.map((address, index) => (
                                                        <AddressCard
                                                            key={`shipping-${address.uuid || index}`}
                                                            address={address}
                                                            id={`shipping-address-${index}`}
                                                            isSelected={selectedShippingAddressId === address.uuid}
                                                            onSelect={() => setSelectedShippingAddressId(address.uuid || "")}
                                                            onDelete={() => handleAddressDelete(address.uuid)}
                                                            showDeleteButton={true}
                                                        />
                                                    ))}
                                                        </RadioGroup>
                                                    </div>
                                                    {savedAddresses.length > 3 && (
                                                        <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none dark:from-gray-950"></div>
                                                    )}
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => setShowAddAddressForm(true)}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" /> Add New Address
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Billing Address */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl">Billing Address</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <div className="mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={sameAsShipping}
                                            onChange={() => setSameAsShipping(!sameAsShipping)}
                                            className="mr-2"
                                        />
                                        <span>Same as shipping address</span>
                                    </label>
                                </div>

                                {!sameAsShipping && (
                                    <Tabs defaultValue="existing" className="w-full">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="existing">Use Existing Address</TabsTrigger>
                                            <TabsTrigger value="new">Add New Address</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="existing">
                                            <div className="relative">
                                                <div className="max-h-80 overflow-y-auto pr-2 space-y-3 address-scroll-container">
                                                    <RadioGroup value={selectedBillingAddressId} className="space-y-3">
                                                                                                        {savedAddresses.map((address, index) => (
                                                    <AddressCard
                                                        key={`billing-${address.uuid || index}`}
                                                        address={address}
                                                        id={`billing-address-${index}`}
                                                        isSelected={selectedBillingAddressId === address.uuid}
                                                        onSelect={() => setSelectedBillingAddressId(address.uuid || "")}
                                                        onDelete={() => handleAddressDelete(address.uuid)}
                                                        showDeleteButton={true}
                                                    />
                                                ))}
                                                    </RadioGroup>
                                                </div>
                                                {savedAddresses.length > 3 && (
                                                    <div className="absolute bottom-0 left-0 right-2 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none dark:from-gray-950"></div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="new">
                                            <AddressForm
                                                onAddressCreated={(newAddress) => {
                                                    setSavedAddresses(prev => [...prev, newAddress]);
                                                    setSelectedBillingAddressId(newAddress.uuid || "");
                                                }}
                                                onCancel={() => { }}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                )}
                            </CardContent>
                        </Card>

                        {/* Shipping Methods */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl">Shipping Method</CardTitle>
                            </CardHeader>

                            <CardContent>
                                <ShippingMethodSelector
                                    selectedMethod={selectedShippingMethod}
                                    onMethodChange={handleShippingMethodChange}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader className="pb-3">
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Item summary */}
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <div key={`summary-${item.productUuid}`} className="flex justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-md bg-muted overflow-hidden">
                                                    <img
                                                        src={item.productImageUrls?.[0] ?? ""}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p>{item.price * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator />

                                <OrderSummary
                                    amount={totalAmount}
                                    shippingCost={shippingCost}
                                    currency={CurrencyType.INR}
                                />

                                <Button
                                    className="w-full mt-6"
                                    size="lg"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessingOrder || !user?.uuid}
                                >
                                    {isProcessingOrder ? "Processing..." : "Place Order"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
