import { useEffect, useState, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, Edit, Eye, DollarSign, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/module/store/store';
import { fetchAdminProducts, setCurrentPage, deleteAdminProduct } from '@/module/slice/AdminProductSlice';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { addProduct, Product, updateProductAdmin } from '@/services/productService';
import { toast } from 'sonner';
import { formatCurrency } from '@/services/cartService';

import { uploadProductImages } from '@/services/fileUploadService';

const AdminProducts = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [viewProduct, setViewProduct] = useState<Product>(null);
  const [editProduct, setEditProduct] = useState<Product>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const pageSize = 10;
  const imageInputRef = useRef<HTMLInputElement>(null);

  const {
    products,
    totalPages,
    currentPage,
    isLoading,
    error,
    totalElements,
    isFirst,
    isLast
  } = useSelector((state: RootState) => state.adminProducts);

  const defaultFormValues = {
    name: '',
    description: '',
    status: 'ACTIVE',
    price: '',
    productImageUrls: [''],
    category: '',
    attribute: { color: '', size: '', material: '' },
    stockQuantity: '',
    sku: '',
    currency: 'INR',
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: defaultFormValues });

  useEffect(() => {
    dispatch(
      fetchAdminProducts({
        page: currentPage,
        size: pageSize,
        body: {
          name: searchTerm || null,
          category: null,
          minPrice: null,
          maxPrice: null,
          status: filterStatus,
          isRandom: null
        }
      }) as any
    );
  }, [searchTerm, filterStatus, currentPage, dispatch]);

  useEffect(() => {
    if (editProduct) {
      reset({
        ...editProduct,
        price: editProduct.price.toString(),
        stockQuantity: editProduct.stockQuantity.toString(),
        status: editProduct.status,
        productImageUrls: editProduct.productImageUrls.length ? editProduct.productImageUrls : [''],
        attribute: editProduct.attributes || { color: '', size: '', material: '' },
      });
    } else {
      reset(defaultFormValues);
    }
  }, [editProduct, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        stockQuantity: parseInt(data.stockQuantity, 10),
        attribute: { ...data.attribute },
        productImageUrls: Array.isArray(data.productImageUrls) ? data.productImageUrls : [data.productImageUrls],
        status: data.status,
      };
      if (editProduct) {
        await updateProductAdmin(editProduct.uuid, payload);
        toast.success('Product updated');
      } else {
        await addProduct(payload);
        toast.success('Product added');
      }
      setAddDialogOpen(false);
      setEditProduct(null);
      reset(defaultFormValues);
      dispatch(fetchAdminProducts({
        page: currentPage,
        size: pageSize,
        body: {
          name: searchTerm || null,
          category: null,
          minPrice: null,
          maxPrice: null,
          status: filterStatus,
          isRandom: null
        }
      }) as any);
    } catch (err) {
      toast.error('Failed to save product');
    }
  };

  const closeDialogs = () => {
    setAddDialogOpen(false);
    setEditProduct(null);
    setViewProduct(null);
    reset(defaultFormValues);
  };

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
            <Button onClick={() => { setAddDialogOpen(true); setEditProduct(null); }}>
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
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      dispatch(setCurrentPage(1));
                    }}
                    className="pl-10"
                  />
                </div>
                <Tabs value={filterStatus[0] || 'all'} onValueChange={(val) => {
                  setFilterStatus(val === 'all' ? [] : [val]);
                  dispatch(setCurrentPage(1));
                }}>
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
              {isLoading && <div className="py-4 text-center">Loading...</div>}
              {error && <div className="py-4 text-center text-red-500">{error}</div>}
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
                    {products && products.length > 0 ? (
                      products.map((product) => (
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
                                {product.attributes?.material && (
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
                              <span className="font-medium">{formatCurrency(product.price.toFixed(2), product.currency)}</span>
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
                              {/* <Button variant="outline" size="sm" onClick={() => setViewProduct(product)}>
                                <Eye className="h-3 w-3 mr-1" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setEditProduct(product); setAddDialogOpen(true); }}>
                                <Edit className="h-3 w-3 mr-1" />
                              </Button> */}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setViewProduct(product)} 
                                className="hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                title="View Product Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setEditProduct(product); setAddDialogOpen(true); }} 
                                className="hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                title="Edit Product"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <AlertDialog open={deleteDialogOpen && productToDelete?.uuid === product.uuid} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setProductToDelete(null); }}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true); }} 
                                    className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete <span className="font-semibold">{product.name}</span>? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => { dispatch(deleteAdminProduct({ productUuid: product.uuid }) as any); setDeleteDialogOpen(false); setProductToDelete(null); }}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      !isLoading && <TableRow><TableCell colSpan={7} className="text-center">No products found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  disabled={isFirst || isLoading || currentPage === 1}
                  onClick={() => dispatch(setCurrentPage(currentPage - 1))}
                  variant="outline"
                >
                  Previous
                </Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button
                  disabled={isLast || isLoading || currentPage === totalPages}
                  onClick={() => dispatch(setCurrentPage(currentPage + 1))}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      {/* Add/Edit Product Dialog */}
      <Dialog open={addDialogOpen || !!editProduct} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {editProduct ? 'Update product details.' : 'Add a new product to the catalog.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Product Name *</label>
              <Input {...register('name', { required: 'Product name is required' })} placeholder="Product Name" />
              {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
            </div>
            <div>
              <label className="block font-medium mb-1">SKU *</label>
              <Input {...register('sku', { required: 'SKU is required' })} placeholder="SKU" />
              {errors.sku && <span className="text-red-500 text-xs">{errors.sku.message}</span>}
            </div>
            <div>
              <label className="block font-medium mb-1">Description *</label>
              <Input {...register('description', { required: 'Description is required' })} placeholder="Description" />
              {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Price *</label>
                <Input {...register('price', { required: 'Price is required' })} placeholder="Price" type="number" step="0.01" />
                {errors.price && <span className="text-red-500 text-xs">{errors.price.message}</span>}
              </div>
              <div>
                <label className="block font-medium mb-1">Currency *</label>
                <Select value={watch('currency')} onValueChange={val => setValue('currency', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Stock Quantity *</label>
                <Input {...register('stockQuantity', {
                  required: 'Stock quantity is required',
                  min: {
                    value: 0,
                    message: 'Stock quantity cannot be negative',
                  }
                })} placeholder="Stock Quantity" type="number" />
                {errors.stockQuantity && <span className="text-red-500 text-xs">{errors.stockQuantity.message}</span>}
              </div>
              <div>
                <label className="block font-medium mb-1">Category *</label>
                <Input {...register('category', { required: 'Category is required' })} placeholder="Category" />
                {errors.category && <span className="text-red-500 text-xs">{errors.category.message}</span>}
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Product Image *</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const urls = await uploadProductImages([file]);
                        setValue('productImageUrls.0', urls[0], { shouldValidate: true });
                      } catch (error) {
                        console.error('Upload failed:', error);
                      }
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}>
                  Upload Image
                </Button>
                {watch('productImageUrls.0') && (
                  <img src={watch('productImageUrls.0')} alt="Product" className="w-16 h-16 object-cover rounded border" />
                )}
              </div>
              {errors.productImageUrls?.[0] && <span className="text-red-500 text-xs">{errors.productImageUrls[0].message}</span>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Color</label>
                <Input {...register('attribute.color')} placeholder="Color" />
              </div>
              <div>
                <label className="block font-medium mb-1">Size</label>
                <Input {...register('attribute.size')} placeholder="Size" />
              </div>
              <div>
                <label className="block font-medium mb-1">Material</label>
                <Input {...register('attribute.material')} placeholder="Material" />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Status *</label>
              <Select value={watch('status')} onValueChange={val => setValue('status', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="OUT_OF_STOCK" disabled>Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>{editProduct ? 'Update' : 'Add'}</Button>
              <Button type="button" variant="outline" onClick={closeDialogs}>Cancel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={!!viewProduct} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewProduct && (
            <div className="space-y-2">
              <img src={viewProduct.productImageUrls[0]} alt={viewProduct.name} className="w-32 h-32 object-cover rounded" />
              <div><b>Name:</b> {viewProduct.name}</div>
              <div><b>SKU:</b> {viewProduct.sku}</div>
              <div><b>Description:</b> {viewProduct.description}</div>
              <div><b>Price:</b> {formatCurrency(viewProduct.price, viewProduct.currency)}</div>
              <div><b>Stock:</b> {viewProduct.stockQuantity}</div>
              <div><b>Category:</b> {viewProduct.category}</div>
              <div><b>Status:</b> {viewProduct.status}</div>
              <div><b>Currency:</b> {viewProduct.currency}</div>
              <div><b>Attributes:</b></div>
              <ul className="ml-4 list-disc">
                <li><b>Color:</b> {viewProduct.attributes?.color || '-'}</li>
                <li><b>Size:</b> {viewProduct.attributes?.size || '-'}</li>
                <li><b>Material:</b> {viewProduct.attributes?.material || '-'}</li>
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialogs}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;