
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from "sonner";

export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  addFavorite: (product: FavoriteProduct) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  
  // Load favorites from localStorage on initial render
  useEffect(() => {
    const savedFavorites = localStorage.getItem('kittyp-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to parse favorites data:', error);
      }
    }
  }, []);
  
  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kittyp-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (product: FavoriteProduct) => {
    setFavorites(prev => {
      if (!prev.some(item => item.id === product.id)) {
        toast.success(`Added ${product.name} to favorites`);
        return [...prev, product];
      }
      return prev;
    });
  };
  
  const removeFavorite = (productId: string) => {
    setFavorites(prev => {
      const product = prev.find(item => item.id === productId);
      if (product) {
        toast.info(`Removed ${product.name} from favorites`);
      }
      return prev.filter(item => item.id !== productId);
    });
  };
  
  const isFavorite = (productId: string) => {
    return favorites.some(item => item.id === productId);
  };
  
  return (
    <FavoritesContext.Provider value={{ 
      favorites, 
      addFavorite, 
      removeFavorite, 
      isFavorite 
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
