'use client'

import { useState, useMemo, useTransition, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProductAction } from '@/actions/products'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { ProductRow } from '@/lib/data/products'

interface ProductsClientProps {
  products: ProductRow[]
  orgThreshold: number
}

type StatusFilter = 'all' | 'low' | 'out' | 'in'
type SortField = 'name' | 'sku' | 'quantity' | 'price'
type SortOrder = 'asc' | 'desc'

export function ProductsClient({ products, orgThreshold }: ProductsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [isPending, startTransition] = useTransition()

  // Press "/" to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Helper stock status calculations
  function getEffectiveThreshold(p: ProductRow) {
    return p.lowStockThreshold ?? orgThreshold
  }

  function isOutOfStock(p: ProductRow) {
    return p.quantity === 0
  }

  function isLowStock(p: ProductRow) {
    return p.quantity > 0 && p.quantity <= getEffectiveThreshold(p)
  }

  function isInStock(p: ProductRow) {
    return p.quantity > getEffectiveThreshold(p)
  }

  // Pre-calculate status counts for pills
  const counts = useMemo(() => {
    let out = 0
    let low = 0
    let inStock = 0
    for (const p of products) {
      if (isOutOfStock(p)) out++
      else if (isLowStock(p)) low++
      else inStock++
    }
    return {
      total: products.length,
      out,
      low,
      inStock,
    }
  }, [products, orgThreshold])

  // Filtering + Sorting
  const filteredAndSorted = useMemo(() => {
    let list = products

    // 1. Status Filter
    if (statusFilter === 'out') {
      list = list.filter((p) => isOutOfStock(p))
    } else if (statusFilter === 'low') {
      list = list.filter((p) => isLowStock(p))
    } else if (statusFilter === 'in') {
      list = list.filter((p) => isInStock(p))
    }

    // 2. Search query
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      )
    }

    // 3. Sorting
    return [...list].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'sku':
          comparison = a.sku.localeCompare(b.sku)
          break
        case 'quantity':
          comparison = a.quantity - b.quantity
          break
        case 'price':
          comparison = (a.sellingPrice ?? 0) - (b.sellingPrice ?? 0)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [products, statusFilter, search, sortField, sortOrder, orgThreshold])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      // Default to descending for numeric metrics (quantity/price), ascending for names
      setSortOrder(field === 'quantity' || field === 'price' ? 'desc' : 'asc')
    }
  }

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteProductAction(deleteTarget.id)
      if (res.message === 'Product deleted successfully') {
        toast(`"${deleteTarget.name}" deleted`, 'success')
        router.refresh()
      } else {
        toast(res.message ?? 'Failed to delete product', 'error')
      }
      setDeleteTarget(null)
    })
  }, [deleteTarget, toast, router])

  return (
    <>
      {/* 1. Interactive Status Filter Pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900/20'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>All Items</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] ${
              statusFilter === 'all' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('low')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'low'
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
              : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50/70'
          }`}
        >
          <span>⚠️ Low Stock</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
              statusFilter === 'low' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {counts.low}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('out')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'out'
              ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
              : 'bg-white text-red-800 border border-red-200 hover:bg-red-50/70'
          }`}
        >
          <span>🔴 Out of Stock</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
              statusFilter === 'out' ? 'bg-red-700 text-red-100' : 'bg-red-100 text-red-800'
            }`}
          >
            {counts.out}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('in')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'in'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
              : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50/70'
          }`}
        >
          <span>✅ In Stock</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
              statusFilter === 'in'
                ? 'bg-emerald-700 text-emerald-100'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {counts.inStock}
          </span>
        </button>

        {(statusFilter !== 'all' || search) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all')
              setSearch('')
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-2 underline cursor-pointer"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* 2. Search Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search by name, SKU, or description… (Press /)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 text-sm"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 pointer-events-none">
              /
            </kbd>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-medium shrink-0">
            Showing <strong className="text-gray-900">{filteredAndSorted.length}</strong> of{' '}
            {products.length} items
          </span>
        </div>
      </div>

      {/* 3. Table with Clickable Sort Headers & Visual Stock Meters */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg
              className="mx-auto h-10 w-10 text-gray-300 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-sm font-medium text-gray-900">No products yet</p>
            <p className="mt-1 text-sm text-gray-500 mb-4">
              Get started by adding your first product.
            </p>
            <Link href="/products/new">
              <Button size="sm">Add product</Button>
            </Link>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-gray-700">No products match your filters</p>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search query or status filter.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/75 select-none">
                {/* Name Column Header */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="group inline-flex items-center gap-1.5 font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    <span>Product Name</span>
                    <SortIndicator active={sortField === 'name'} order={sortOrder} />
                  </button>
                </TableHead>

                {/* SKU Column Header */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort('sku')}
                    className="group inline-flex items-center gap-1.5 font-semibold text-gray-700 hover:text-gray-900 cursor-pointer"
                  >
                    <span>SKU</span>
                    <SortIndicator active={sortField === 'sku'} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Quantity & Stock Level Meter Column Header */}
                <TableHead className="text-right w-64">
                  <button
                    type="button"
                    onClick={() => handleSort('quantity')}
                    className="group inline-flex items-center gap-1.5 font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ml-auto"
                  >
                    <span>Stock Level & Quantity</span>
                    <SortIndicator active={sortField === 'quantity'} order={sortOrder} />
                  </button>
                </TableHead>

                {/* Selling Price Column Header */}
                <TableHead className="text-right">
                  <button
                    type="button"
                    onClick={() => handleSort('price')}
                    className="group inline-flex items-center gap-1.5 font-semibold text-gray-700 hover:text-gray-900 cursor-pointer ml-auto"
                  >
                    <span>Selling Price</span>
                    <SortIndicator active={sortField === 'price'} order={sortOrder} />
                  </button>
                </TableHead>

                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((product) => {
                const threshold = getEffectiveThreshold(product)
                const isOut = isOutOfStock(product)
                const isLow = isLowStock(product)

                return (
                  <TableRow key={product.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Name + Status Badge */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                        >
                          {product.name}
                        </Link>
                        {isOut ? (
                          <Badge variant="out-of-stock" className="bg-red-50 text-red-700 border-red-200">
                            Out of stock
                          </Badge>
                        ) : isLow ? (
                          <Badge variant="low-stock" className="bg-amber-50 text-amber-800 border-amber-200">
                            Low stock
                          </Badge>
                        ) : (
                          <Badge variant="in-stock" className="bg-emerald-50 text-emerald-800 border-emerald-200">
                            In stock
                          </Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="mt-0.5 text-xs text-gray-500 truncate max-w-sm">
                          {product.description}
                        </p>
                      )}
                    </TableCell>

                    {/* SKU Code */}
                    <TableCell>
                      <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700">
                        {product.sku}
                      </code>
                    </TableCell>

                    {/* Visual Stock Meter & Quantity */}
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              isOut
                                ? 'text-red-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {formatNumber(product.quantity)} units
                          </span>
                        </div>

                        {/* Visual Meter Bar */}
                        <StockMeter
                          quantity={product.quantity}
                          threshold={threshold}
                          isOut={isOut}
                          isLow={isLow}
                        />
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-right font-medium text-gray-800 tabular-nums">
                      {formatCurrency(product.sellingPrice)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/products/${product.id}/adjust`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Adjust stock"
                            className="hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </Button>
                        </Link>
                        <Link href={`/products/${product.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit product"
                            className="hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete product"
                          onClick={() => setDeleteTarget(product)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete product">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-900">&quot;{deleteTarget?.name}&quot;</span>? This
          action cannot be undone and will permanently remove this item from your inventory.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isPending}>
            Delete product
          </Button>
        </div>
      </Modal>
    </>
  )
}

/**
 * Clickable Sort Header Arrow Indicator
 */
function SortIndicator({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) {
    return (
      <svg
        className="h-3.5 w-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    )
  }

  return order === 'asc' ? (
    <svg
      className="h-3.5 w-3.5 text-indigo-600 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg
      className="h-3.5 w-3.5 text-indigo-600 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/**
 * Visual Stock Level Meter
 */
function StockMeter({
  quantity,
  threshold,
  isOut,
  isLow,
}: {
  quantity: number
  threshold: number
  isOut: boolean
  isLow: boolean
}) {
  // Max scale target for the progress bar (e.g., 2.5x threshold or at least 15 units)
  const maxScale = Math.max(threshold * 2.5, 15)
  const percent = Math.min(100, Math.round((quantity / maxScale) * 100))

  return (
    <div className="flex items-center gap-2 w-36">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOut
              ? 'w-0'
              : isLow
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: isOut ? '0%' : `${Math.max(percent, 8)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-600 tabular-nums font-mono shrink-0">
        {isOut ? 'Depleted' : `Thresh: ${threshold}`}
      </span>
    </div>
  )
}
