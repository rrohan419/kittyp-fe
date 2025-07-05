import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, Edit, Eye, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminProduct {
  uuid: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: string;
  stockQuantity: number;
  sku: string;
  category: string;
  productImageUrls: string[];
  attributes: {
    color?: string;
    size?: string;
    material?: string;
  };
}

const mockProducts: AdminProduct[] = [
  {
    uuid: 'prod-1',
    name: 'Eco-Friendly Cat Litter - Natural',
    description: 'Premium biodegradable cat litter made from recycled materials',
    price: 24.99,
    currency: 'USD',
    status: 'ACTIVE',
    stockQuantity: 150,
    sku: 'ECO-LITTER-NAT-001',
    category: 'Cat Litter',
    productImageUrls: ['/placeholder.svg'],
    attributes: {
      material: 'Recycled Paper',
      size: '10 lbs'
    }
  },
  {
    uuid: 'prod-2',
    name: 'Eco-Friendly Cat Litter - Clumping',
    description: 'Superior clumping action with natural ingredients',
    price: 29.99,
    currency: 'USD',
    status: 'ACTIVE',
    stockQuantity: 75,
    sku: 'ECO-LITTER-CLUMP-002',
    category: 'Cat Litter',
    productImageUrls: ['/placeholder.svg'],
    attributes: {
      material: 'Clay Alternative',
      size: '12 lbs'
    }
  },
  {
    uuid: 'prod-3',
    name: 'Eco-Friendly Cat Litter - Lightweight',
    description: 'Easy to carry, powerful odor control',
    price: 19.99,
    currency: 'USD',
    status: 'OUT_OF_STOCK',
    stockQuantity: 0,
    sku: 'ECO-LITTER-LIGHT-003',
    category: 'Cat Litter',
    productImageUrls: ['/placeholder.svg'],
    attributes: {
      material: 'Corn-based',
      size: '8 lbs'
    }
  }
];

const AdminProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'OUT_OF_STOCK': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600';
    if (quantity < 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
              <p className="text-muted-foreground">
                Manage your product catalog and inventory
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Products
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="ACTIVE">Active</TabsTrigger>
                    <TabsTrigger value="INACTIVE">Inactive</TabsTrigger>
                    <TabsTrigger value="OUT_OF_STOCK">Out of Stock</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.uuid}>
                        <TableCell>
                          <div className="flex items-start space-x-3">
                            <img 
                              src={product.productImageUrls[0]} 
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                            />
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {product.description}
                              </div>
                              {product.attributes.material && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {product.attributes.material}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{product.sku}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span className="font-medium">${product.price.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${getStockColor(product.stockQuantity)}`}>
                            {product.stockQuantity} units
                          </div>
                          {product.stockQuantity < 20 && product.stockQuantity > 0 && (
                            <div className="text-xs text-yellow-600">Low stock</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(product.status)}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminProducts;