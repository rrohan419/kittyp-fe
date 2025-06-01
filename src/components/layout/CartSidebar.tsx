import { Button } from "@/components/ui/button";
import { CartItem as CartItemUI } from "@/components/ui/CartItem";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CurrencyType, formatCurrency } from "@/services/cartService";
import { RootState, AppDispatch } from "@/module/store";
import { resetCartThunk } from "@/module/slice/CartSlice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CartSidebar() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, totalAmount, user, loading, error } = useSelector((state: RootState) => ({
    ...state.cartReducer,
    loading: state.cartReducer.loading || state.cartReducer.isCartLoading
  }));
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const handleClearCart = async () => {
    try {
      await dispatch(resetCartThunk()).unwrap();
    } catch (error) {
      // Error is already handled by the thunk
      console.error("Failed to clear cart:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Shopping Cart"
        >
          <ShoppingCart className="h-5 w-5 text-foreground" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center rounded-full text-black text-xs font-medium shadow-sm">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <div className="flex flex-col h-[100dvh] sm:h-full">
          <div className="p-6">
            <SheetHeader className="mb-5">
              <div className="flex justify-between items-center">
                <SheetTitle>Your Cart ({itemCount} items)</SheetTitle>
                {items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearCart}
                    disabled={loading}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Clear Cart
                  </Button>
                )}
              </div>
            </SheetHeader>

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingCart size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Your cart is empty</p>
                <Button variant="outline" className="mt-2" onClick={() => setIsOpen(false)} asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemUI
                      key={`cart-sidebar-${item.productUuid}`}
                      uuid={item.productUuid}
                      name={item.productName}
                      price={item.price}
                      currency={CurrencyType.INR}
                      quantity={item.quantity}
                      image={`/product-images/${item.productUuid}.jpg`}
                      className="py-4"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-auto border-t border-border bg-background p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(totalAmount.toFixed(2), CurrencyType.INR)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">Calculated at checkout</span>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount.toFixed(2), CurrencyType.INR)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  asChild 
                  disabled={loading}
                >
                  <Link to="/checkout">
                    {loading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground animate-spin"></div>
                    ) : (
                      "Proceed to Checkout"
                    )}
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  disabled={loading}
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
