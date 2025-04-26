
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
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
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Address, fetchSavedAddresses } from "@/services/addressService";
import { handleCheckout } from "@/services/paymentService";
import { useOrder } from "@/context/OrderContext";

export default function Checkout() {
    const { items, subtotal, currency, orderId, user, clearCart } = useCart();
    const { taxes, totalValue } = useOrder();
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);

    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string>("");
    const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string>("");
    const [sameAsShipping, setSameAsShipping] = useState(true);

    const [selectedShippingMethod, setSelectedShippingMethod] = useState("");
    const [shippingCost, setShippingCost] = useState(0);

    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    useEffect(() => {
        // Redirect to cart if cart is empty
        if (items.length === 0) {
            navigate("/cart");
            return;
        }

        async function loadSavedAddresses() {
            try {
                const savedAddresses = await fetchSavedAddresses();
                setAddresses(savedAddresses);

                // Set default address if available
                const defaultAddress = savedAddresses.find(addr => addr.isDefault);
                if (defaultAddress) {
                    setSelectedShippingAddressId(defaultAddress.id || "");
                    setSelectedBillingAddressId(defaultAddress.id || "");
                } else if (savedAddresses.length > 0) {
                    setSelectedShippingAddressId(savedAddresses[0].id || "");
                    setSelectedBillingAddressId(savedAddresses[0].id || "");
                }
            } catch (error) {
                // console.error("Failed to load addresses:", error);
                toast.error("Failed to load saved addresses");
            } finally {
                setIsLoadingAddresses(false);
            }
        }

        loadSavedAddresses();
    }, [items.length, navigate, subtotal]);

    const handleAddressCreated = (newAddress: Address) => {
        setAddresses(prev => [...prev, newAddress]);
        setSelectedShippingAddressId(newAddress.id || "");
        if (sameAsShipping) {
            setSelectedBillingAddressId(newAddress.id || "");
        }
        setShowAddAddressForm(false);
    };

    const handleShippingMethodChange = (methodId: string, price: number) => {
        setSelectedShippingMethod(methodId);
        setShippingCost(price);
    };

    // const handlePlaceOrder = async () => {
    //     if (!selectedShippingAddressId) {
    //         toast.error("Please select a shipping address");
    //         return;
    //     }

    //     if (!sameAsShipping && !selectedBillingAddressId) {
    //         toast.error("Please select a billing address");
    //         return;
    //     }

    //     if (!selectedShippingMethod) {
    //         toast.error("Please select a shipping method");
    //         return;
    //     }

    //     setIsProcessingOrder(true);

    //         try {
    //           const { tax, serviceFee, total } = calculateOrderSummary(subtotal, shippingCost);

    //           console.log("tax", tax);
    //           console.log("serviceFee" , serviceFee);
    //           console.log("tax" , tax);

    //           const currentTaxes = {
    //             serviceCharge: serviceFee,
    //             shippingCharges: shippingCost,
    //             otherTax: tax
    //           };

              
    //           console.log("handleCheckout called with the following parameters:");
    //           console.log("Subtotal:", subtotal);
    //           console.log("Total:", total);
    //           console.log("Current Taxes:", currentTaxes);
    //           console.log("Currency:", currency);
    //           console.log("Order ID:", orderId);
    //           console.log("User:", user);
    //           await handleCheckout(total, currency, orderId, user);

    //           toast.success("Order placed successfully!");
    //           clearCart();
    //         //   navigate("/orders");
    //         } catch (error) {
    //           console.error("Failed to process order:", error);
    //           toast.error("Failed to place order. Please try again.");
    //         } finally {
    //         //   initializeUserAndCart();
    //           setIsProcessingOrder(false);
    //         }
    //       };

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

            setIsProcessingOrder(true);

            try {
                // In a real app, this would call an API to process the order
                //   await new Promise(resolve => setTimeout(resolve, 1500));



                console.log("Values", currency, orderId, user);
                await handleCheckout(taxes, totalValue, currency, orderId, user);
                toast.success("Order placed successfully!");
                clearCart();
                navigate("/orders");
            } catch (error) {
                console.error("Failed to process order:", error);
                toast.error("Failed to place order. Please try again.");
            } finally {
                // initializeUserAndCart();
                setIsProcessingOrder(false);
            }
        };

        if (isLoadingAddresses) {
            return (
                <>
                    <Navbar />
                    <div className="container mx-auto px-4 py-16 max-w-6xl min-h-[80vh]">
                        <LoadingState message="Preparing checkout..." />
                    </div>
                    <Footer />
                </>
            );
        }

        return (
            <>
                <Navbar />
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
                                            {addresses.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <p className="text-gray-500 mb-4">You don't have any saved addresses</p>
                                                    <Button onClick={() => setShowAddAddressForm(true)}>
                                                        <Plus className="mr-2 h-4 w-4" /> Add New Address
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <RadioGroup value={selectedShippingAddressId} className="space-y-3">
                                                        {addresses.map((address, index) => (
                                                            <AddressCard
                                                                key={`selected-shipping-address-id-${address.id || index}`}
                                                                address={address}
                                                                id={`shipping-address-${index}`}
                                                                isSelected={selectedShippingAddressId === address.id}
                                                                onSelect={() => setSelectedShippingAddressId(address.id || "")}
                                                            />
                                                        ))}
                                                    </RadioGroup>

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
                                                <RadioGroup value={selectedBillingAddressId} className="space-y-3">
                                                    {addresses.map((address, index) => (
                                                        <AddressCard
                                                            key={`selected-billing-address-id-${address.id || index}`}
                                                            address={address}
                                                            id={`billing-address-${index}`}
                                                            isSelected={selectedBillingAddressId === address.id}
                                                            onSelect={() => setSelectedBillingAddressId(address.id || "")}
                                                        />
                                                    ))}
                                                </RadioGroup>
                                            </TabsContent>

                                            <TabsContent value="new">
                                                <AddressForm
                                                    onAddressCreated={(newAddress) => {
                                                        setAddresses(prev => [...prev, newAddress]);
                                                        setSelectedBillingAddressId(newAddress.id || "");
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
                                            <div key={`order-summary-item-uuid-${item.uuid}`} className="flex justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden">
                                                        <img
                                                            src={item.productImageUrls[0]}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <OrderSummary shippingCost={shippingCost} />

                                    <Button
                                        className="w-full mt-6"
                                        size="lg"
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessingOrder}
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
