import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/ui/CartItem";
import { useCart } from "@/context/CartContext";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default function Cart() {
  const { items, subtotal, clearCart } = useCart();
  
  return (
    <>
      <Navbar />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          {items.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          )}
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-16 space-y-6">
            <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart size={36} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold">Your cart is empty</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button asChild className="mt-4">
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {items.map((item) => (
                  <CartItem 
                    key={item.id}
                    id={item.id} 
                    name={item.name} 
                    price={item.price} 
                    quantity={item.quantity} 
                    image={item.image}
                  />
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button className="w-full">Proceed to Checkout</Button>
                
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2" 
                    asChild
                  >
                    <Link to="/products">
                      <ArrowLeft size={16} />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}