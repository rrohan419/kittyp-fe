import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/ui/CartItem";
import { useCart } from "@/context/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/services/cartService";
import { handleCheckout } from "@/services/paymentService";
import { UserProfile } from "@/services/authService";
import { toast } from "sonner";
import { useOrder } from "@/context/OrderContext";
import { fetchUserDetail } from "@/services/UserService";

export function CartSidebar() {
  const { items, subtotal, itemCount, currency, orderId, user, resetCart } = useCart();
  const {taxes, totalValue} = useOrder();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocalCheckout = async () => {
    setIsLoading(true);
    try {
      let userToPass: UserProfile | null = null; // Declare userToPass 
      if (!user) {
        userToPass = await fetchUserDetail(); // Fetch user details
        if (!userToPass) {
          console.error("User is undefined. Cannot proceed with checkout.");
          toast.error("Please login to continue with checkout.");
          return;
        }
      } else {
        userToPass = user;
      }
      // await handleCheckout(subtotal, currency, orderId, userToPass);
      await handleCheckout(taxes, totalValue, currency, orderId, userToPass);
      resetCart();
    } catch (error) {
      console.error("Checkout process failed:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Shopping Cart"
        >
          <ShoppingCart size={20} />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-kitty-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="mb-5">
          <SheetTitle>Your Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Your cart is empty</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setIsOpen(false)}
              asChild
            >
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 -mx-6 px-6">
              {items.map((item) => (
                <CartItem
                  // key={item.uuid} 
                  key={`cart-sidebar-${item.uuid}`}
                  uuid={item.uuid}
                  name={item.name}
                  price={item.price}
                  currency={item.currency}
                  quantity={item.quantity}
                  image={item.productImageUrls[0]}
                  className="py-4"
                />
              ))}
            </div>

            <div className="pt-6 border-t mt-auto">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal.toFixed(2), items[0].currency)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(subtotal.toFixed(2), items[0].currency)}</span>
                </div>
              </div>


              <Button className="w-full" asChild>
                                <Link to="/checkout">Proceed to Checkout</Link>
                              </Button>
              <div className="space-y-3 mt-6">
                {/* <Button className="w-full" onClick={() => handleLocalCheckout()} disabled={isLoading}>Checkout</Button> */}
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/cart">
                    View Cart
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}