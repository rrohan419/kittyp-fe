import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchProductByUuid, Product } from '@/services/productService';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ShoppingCart, Heart, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/context/FavoritesContext';
import { cn } from '@/lib/utils';

const ProductDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const loadProduct = async () => {
      if (!uuid) return;

      setIsLoading(true);
      try {
        const response = await fetchProductByUuid(uuid);
        setProduct(response.data);
        setSelectedImage(response.data.productImageUrls[0] || null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [uuid]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
    }
  };

  const handleToggleFavorite = () => {
    if (!product) return;

    const favoriteProduct = {
      id: product.uuid,
      name: product.name,
      price: product.price,
      image: product.productImageUrls && product.productImageUrls[0] ? product.productImageUrls[0] : "",
    };

    if (isFavorite(product.uuid)) {
      removeFavorite(product.uuid);
    } else {
      addFavorite(favoriteProduct);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kitty-500"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || "Product not found"}
            </h2>
            <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <button
          onClick={handleGoBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Products
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              <img
                src={selectedImage || product.productImageUrls[0] || ''}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>

            {product.productImageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.productImageUrls.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${selectedImage === imageUrl ? 'border-kitty-500' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} - view ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
              <p className="mt-2 text-2xl font-semibold text-kitty-600 dark:text-kitty-400">
                ${product.price.toFixed(2)}
              </p>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full">
                  {product.category}
                </span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <p>{product.description}</p>
            </div>

            {product.attribute && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.attribute.color && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Color</p>
                      <p className="font-medium">{product.attribute.color}</p>
                    </div>
                  )}
                  {product.attribute.size && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
                      <p className="font-medium">{product.attribute.size}</p>
                    </div>
                  )}
                  {product.attribute.material && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Material</p>
                      <p className="font-medium">{product.attribute.material}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 space-y-4">
              <Button
                onClick={handleAddToCart}
                className="w-full h-12 text-base flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </Button>

              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                className={cn(
                  "w-full h-12 text-base flex items-center justify-center gap-2",
                  isFavorite(product?.uuid || '') && "bg-pink-50 border-pink-200 hover:bg-pink-100 dark:bg-pink-900/20 dark:border-pink-800"
                )}
              >
                <Heart
                  size={20}
                  className={cn(
                    isFavorite(product?.uuid || '') && "text-pink-500 fill-current"
                  )}
                />
                {isFavorite(product?.uuid || '') ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
