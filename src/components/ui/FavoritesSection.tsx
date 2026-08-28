import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ProductCard } from './ProductCard';
import { Heart, Loader2, PackageSearch, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchFavoritesThunk,
  removeFromFavoritesThunk,
  setCategory,
  selectFavorites,
  selectFavoritesLoading,
  selectFavoritesPagination,
  selectFavoritesCategory,
} from '@/module/slice/FavoritesSlice';
import { RootState, AppDispatch } from '@/module/store/store';
import { toast } from 'sonner';
import { Button } from './button';
import { Badge } from './badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { FavoriteProductCard } from './FavoriteProductCard';

const FavoritesSection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const favorites = useSelector(selectFavorites);
  const loading = useSelector(selectFavoritesLoading);
  const { totalElements, currentPage, totalPages } = useSelector(selectFavoritesPagination);
  const selectedCategory = useSelector(selectFavoritesCategory);
  const { user } = useSelector((state: RootState) => state.authReducer);

  useEffect(() => {
    if (user?.uuid) {
      dispatch(
        fetchFavoritesThunk({
          userUuid: user.uuid,
          page: currentPage,
          size: 10,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
        })
      );
    }
  }, [dispatch, user?.uuid, currentPage, selectedCategory]);

  const handleRemoveFavorite = async (productUuid: string) => {
    if (!user?.uuid) {
      toast.error("Please login to manage favorites");
      return;
    }

    try {
      await dispatch(removeFromFavoritesThunk({ userUuid: user.uuid, productUuid })).unwrap();
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites");
    }
  };

  const handleCategoryChange = (value: string) => {
    dispatch(setCategory(value === 'all' ? null : value));
  };

  const handlePageChange = (page: number) => {
    if (!user?.uuid) {
      toast.error("Please login to view favorites");
      return;
    }

    const pageNumber = Math.max(1, page);
    dispatch(
      fetchFavoritesThunk({
        userUuid: user.uuid,
        page: pageNumber,
        size: 10,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      })
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <Heart className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-semibold text-muted-foreground mb-2">
          No favorites yet
        </h3>
        <p className="text-muted-foreground">
          Items you favorite will appear here
        </p>
      </div>
    );
  }

  const categories = [
    { label: 'All Categories', value: 'all' },
    { label: 'Cat Litter', value: 'Cat Litter' },
    { label: 'Toys', value: 'Toys' },
    { label: 'Food', value: 'Food' },
    { label: 'Accessories', value: 'Accessories' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Favorite Products</h2>
          <p className="text-sm text-muted-foreground">
            {totalElements} {totalElements === 1 ? 'item' : 'items'} in your wishlist
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCategory || 'All Categories'}
          </Badge>
          <Select 
            value={selectedCategory || 'all'} 
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((favorite) => (
          <FavoriteProductCard
            key={favorite.uuid}
            product={favorite}
            onToggleFavorite={() => handleRemoveFavorite(favorite.uuid)}
          />
          // <ProductCard
          //   key={favorite.uuid}
          //   product={{
          //     uuid: favorite.uuid,
          //     name: favorite.name,
          //     description: favorite.description,
          //     price: favorite.price,
          //     category: favorite.category,
          //     productImageUrls: favorite.imageUrls,
          //     status: 'ACTIVE',
          //     attribute: null,
          //     currency: favorite.currency,
          //     stockQuantity: 0
          //   }}
          //   onToggleFavorite={() => handleRemoveFavorite(favorite.uuid)}
          //   isFavorite={true}
          // />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="w-24"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="w-24"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default FavoritesSection;
