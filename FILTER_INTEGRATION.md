# Filter Integration Guide

This document explains how to use the filter system in the Kittyp frontend application.

## Overview

The filter system consists of:
1. **ProductFilter Component** - A reusable filter UI component
2. **ProductFilterRequest** - TypeScript interface for filter parameters
3. **Backend Integration** - Spring Boot specification for filtering

## Components

### ProductFilter Component

Located at: `src/components/ui/ProductFilter.tsx`

This is a reusable component that provides:
- Category filtering
- Price range filtering
- Search functionality
- Mobile-responsive design
- Active filter badges
- Clear filters functionality

### Usage Example

```tsx
import { ProductFilter } from '@/components/ui/ProductFilter';
import { ProductFilterRequest } from '@/services/productService';

const MyPage = () => {
  const [productDto, setProductDto] = useState<ProductFilterRequest>({
    name: null,
    category: null,
    minPrice: null,
    maxPrice: null,
    status: null,
    isRandom: false,
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <ProductFilter
        productDto={productDto}
        setProductDto={setProductDto}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPriceRange={selectedPriceRange}
        setSelectedPriceRange={setSelectedPriceRange}
        isMobileFilterOpen={isMobileFilterOpen}
        setIsMobileFilterOpen={setIsMobileFilterOpen}
        productCount={productCount}
      />
      
      {/* Your product grid here */}
    </div>
  );
};
```

## Filter Parameters

### ProductFilterRequest Interface

```typescript
interface ProductFilterRequest {
  name: string | null;        // Search by product name
  category: string | null;    // Filter by category
  minPrice: number | null;    // Minimum price filter
  maxPrice: number | null;    // Maximum price filter
  status: string | null;      // Product status filter
  isRandom: boolean | null;   // Random ordering
}
```

### Available Categories

- All
- Cat Litter
- toys
- food
- Accessories

### Price Ranges

- Under ₹250
- ₹250 - ₹500
- ₹500 - ₹1000
- Over ₹1000

## Backend Integration

The backend uses Spring Data JPA Specifications to handle filtering:

### ProductSpecification.java

```java
public static Specification<Product> productByFilters(ProductFilterDto productFilterDto) {
  return (Root<Product> root, CriteriaQuery<?> query, CriteriaBuilder builder) -> {
    List<Predicate> predicates = new ArrayList<>();
    
    // Add active products filter
    predicates.add(builder.equal(root.get("isActive"), true));
    
    // Name filter (case-insensitive like)
    if (productFilterDto.getName() != null && !productFilterDto.getName().isEmpty()) {
      predicates.add(builder.like(
        builder.lower(root.get("name")), 
        "%" + productFilterDto.getName().toLowerCase() + "%"
      ));
    }
    
    // Category filter
    if (productFilterDto.getCategory() != null && !productFilterDto.getCategory().isEmpty()) {
      predicates.add(builder.equal(
        builder.lower(root.get("category")), 
        productFilterDto.getCategory()
      ));
    }
    
    // Price range filters
    if (productFilterDto.getMinPrice() != null) {
      predicates.add(builder.greaterThanOrEqualTo(
        root.get("price"), 
        productFilterDto.getMinPrice()
      ));
    }
    
    if (productFilterDto.getMaxPrice() != null) {
      predicates.add(builder.lessThanOrEqualTo(
        root.get("price"), 
        productFilterDto.getMaxPrice()
      ));
    }
    
    // Random ordering
    if (productFilterDto.getIsRandom() != null && Boolean.TRUE.equals(productFilterDto.getIsRandom())) {
      Expression<Double> randomFunction = builder.function("RANDOM", Double.class);
      query.orderBy(builder.asc(randomFunction));
    }
    
    return builder.and(predicates.toArray(new Predicate[0]));
  };
}
```

## API Endpoint

The filter is applied through the product service:

```typescript
export const fetchFilteredProducts = async ({ 
  page, 
  size, 
  body 
}: {
  page: number;
  size: number;
  body: ProductFilterRequest;
}): Promise<ProductApiResponse> => {
  const response = await axiosInstance.post(
    `/product/all?page=${page}&size=${size}`, 
    body
  );
  return response.data;
};
```

## Features

### Debounced Search
Search queries are debounced by 500ms to prevent excessive API calls.

### Infinite Scroll
Products are loaded using infinite scroll with pagination.

### Mobile Responsive
The filter component adapts to mobile screens with a slide-out filter panel.

### Active Filter Indicators
Active filters are displayed as badges for better UX.

### Clear Filters
Users can clear all applied filters with a single click.

## Best Practices

1. **State Management**: Keep filter state in the parent component
2. **Debouncing**: Always debounce search inputs to prevent API spam
3. **Loading States**: Show loading indicators when filters are being applied
4. **Error Handling**: Handle API errors gracefully
5. **Accessibility**: Ensure filters are keyboard accessible

## Customization

To customize the filter component:

1. **Categories**: Modify the `categories` array in `ProductFilter.tsx`
2. **Price Ranges**: Update the `priceRanges` array
3. **Styling**: Use the `className` prop for custom styling
4. **Additional Filters**: Extend the `ProductFilterRequest` interface and component

## Troubleshooting

### Common Issues

1. **Filters not applying**: Ensure `productDto` is being updated when filter state changes
2. **Search not working**: Check that debounced search is properly integrated
3. **Mobile filters not opening**: Verify z-index and positioning
4. **API errors**: Check backend specification and request format

### Debug Tips

1. Console log the `productDto` to verify filter parameters
2. Check network tab for API request/response
3. Verify backend logs for specification errors
4. Test individual filter parameters in isolation 