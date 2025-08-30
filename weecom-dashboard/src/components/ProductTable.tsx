import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"

// Product interface - matches the API response
interface Product {
  id: number
  title: string
  price: number
  category: string
  brand: string
  stock: number
  rating: number
}

// API response structure
interface ProductsResponse {
  products: Product[]
  total: number
  skip: number
  limit: number
}

// Fetch products with pagination
async function fetchProducts(skip: number = 0): Promise<ProductsResponse> {
  const response = await fetch(`https://dummyjson.com/products?limit=10&skip=${skip}&delay=1000`)
  return response.json()
}

// Add new product
async function addProduct(product: Omit<Product, "id">): Promise<Product> {
  const response = await fetch("https://dummyjson.com/products/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  })
  return response.json()
}

// Update existing product
async function updateProduct(id: number, product: Partial<Product>): Promise<Product> {
  const response = await fetch(`https://dummyjson.com/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  })
  return response.json()
}

// Delete product
async function deleteProduct(id: number): Promise<void> {
  await fetch(`https://dummyjson.com/products/${id}`, {
    method: "DELETE",
  })
}

export function ProductTable() {
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof Product>("title")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("")

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [productBeingEdited, setProductBeingEdited] = useState<Product | null>(null)

  // Form data for add/edit
  const [productForm, setProductForm] = useState<Omit<Product, "id">>({
    title: "",
    price: 0,
    category: "",
    brand: "",
    stock: 0,
    rating: 0,
  })

  const queryClient = useQueryClient()

  // Fetch products
  const { data, isLoading, isError } = useQuery<ProductsResponse>({
    queryKey: ["products", currentPage],
    queryFn: () => fetchProducts(currentPage * 10)
  })

  // Mutations for CRUD operations
  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setShowAddDialog(false)
      // Reset form
      setProductForm({ title: "", price: 0, category: "", brand: "", stock: 0, rating: 0 })
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, product }: { id: number; product: Partial<Product> }) =>
      updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setShowEditDialog(false)
      setProductBeingEdited(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  // Get unique categories for filter dropdown
  const availableCategories = useMemo(() => {
    if (!data?.products) return []
    const categories = data.products.map(p => p.category)
    return [...new Set(categories)]
  }, [data])

  // Filter and sort products
  const processedProducts = useMemo(() => {
    if (!data?.products) return []

    let result = data.products.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    // Sort the filtered results
    result.sort((a, b) => {
      const valueA = a[sortField]
      const valueB = b[sortField]

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [data, searchTerm, selectedCategory, sortField, sortDirection])

  // Event handlers
  const handleAddProduct = () => {
    addMutation.mutate(productForm)
  }

  const handleEditProduct = () => {
    if (productBeingEdited) {
      editMutation.mutate({ id: productBeingEdited.id, product: productForm })
    }
  }

  const handleDeleteProduct = (id: number) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?")
    if (confirmed) {
      deleteMutation.mutate(id)
    }
  }

  const openEditDialog = (product: Product) => {
    setProductBeingEdited(product)
    setProductForm({
      title: product.title,
      price: product.price,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
      rating: product.rating,
    })
    setShowEditDialog(true)
  }

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Products</h2>
        <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Price</th>
                <th className="text-left p-2">Category</th>
                <th className="text-left p-2">Stock</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="border px-4 py-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="border px-4 py-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="border px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="border px-4 py-2"><Skeleton className="h-4 w-12" /></td>
                  <td className="border px-4 py-2"><Skeleton className="h-4 w-16" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  if (isError || !data) {
    return <p className="text-red-500">Failed to load products.</p>
  }

  const totalPages = Math.ceil(data.total / 10)

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Products</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the details for the new product.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <input
                placeholder="Product Title"
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                className="border px-2 py-1 rounded"
              />
              <input
                type="number"
                placeholder="Price"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="border px-2 py-1 rounded"
              />
              <input
                placeholder="Category"
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                className="border px-2 py-1 rounded"
              />
              <input
                placeholder="Brand"
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                className="border px-2 py-1 rounded"
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                className="border px-2 py-1 rounded"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAddProduct} disabled={addMutation.isPending}>
                {addMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">All Categories</option>
          {availableCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <Button onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}>
          Sort: {sortDirection}
        </Button>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as keyof Product)}
          className="border px-2 py-1 rounded"
        >
          <option value="title">Title</option>
          <option value="price">Price</option>
          <option value="category">Category</option>
          <option value="stock">Stock</option>
        </select>
      </div>
      <div className="border rounded-md p-4 bg-white dark:bg-gray-900">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Price</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Stock</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  No products found matching your criteria.
                </td>
              </tr>
            ) : (
              processedProducts.map((product: Product) => (
                <tr key={product.id}>
                  <td className="border px-4 py-2">{product.title}</td>
                  <td className="border px-4 py-2">${product.price}</td>
                  <td className="border px-4 py-2">{product.category}</td>
                  <td className="border px-4 py-2">{product.stock}</td>
                  <td className="border px-4 py-2 flex gap-2">
                    <Button size="sm" onClick={() => openEditDialog(product)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <p>
          Showing {data.products.length} of {data.total} products
          (Page {currentPage + 1} of {totalPages})
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <input
              placeholder="Product Title"
              value={productForm.title}
              onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
              className="border px-2 py-1 rounded"
            />
            <input
              type="number"
              placeholder="Price"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
              className="border px-2 py-1 rounded"
            />
            <input
              placeholder="Category"
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              className="border px-2 py-1 rounded"
            />
            <input
              placeholder="Brand"
              value={productForm.brand}
              onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
              className="border px-2 py-1 rounded"
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={productForm.stock}
              onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
              className="border px-2 py-1 rounded"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleEditProduct} disabled={editMutation.isPending}>
              {editMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}