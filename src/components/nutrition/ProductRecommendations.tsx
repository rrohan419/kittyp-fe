import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecommendedProduct } from '@/types/nutrition';
import { ExternalLink, ShoppingCart } from 'lucide-react';

interface ProductRecommendationsProps {
  products: RecommendedProduct[];
}

export const ProductRecommendations = ({ products }: ProductRecommendationsProps) => {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Recommended Products</h3>
        <p className="text-sm text-muted-foreground">
          Products tailored to your pet's nutrition plan and health needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square relative overflow-hidden bg-muted">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="object-cover w-full h-full transition-transform hover:scale-105"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold line-clamp-2">{product.name}</h4>
                {product.price && (
                  <Badge variant="secondary" className="shrink-0">
                    {product.price}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {product.purpose}
              </p>
              <Button
                variant="default"
                className="w-full"
                onClick={() => window.open(product.buyLink, '_blank')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Product
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
