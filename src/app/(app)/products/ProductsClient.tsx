'use client'

import { useState, useMemo, useTransition, useCallback } from 'react'
import Link from 'next/link'
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

export function ProductsClient({ products, orgThreshold }: ProductsClientProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
  }, [products, search])

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteProductAction(deleteTarget.id)
      if (res.message === 'Product deleted successfully') {
        toast(`"${deleteTarget.name}" deleted`, 'success')
      } else {
        toast(res.message ?? 'Failed to delete product', 'error')
      }
      setDeleteTarget(null)
    })
  }, [deleteTarget, toast])

  function isLow(p: ProductRow) {
    const threshold = p.lowStockThreshold ?? orgThreshold
    return p.quantity <= threshold
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="search"
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <span className="text-sm text-gray-500 shrink-0">
          {filtered.length} of {products.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm font-medium text-gray-900">No products yet</p>
            <p className="mt-1 text-sm text-gray-500 mb-4">Get started by adding your first product.</p>
            <Link href="/products/new">
              <Button size="sm">Add product</Button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-500">No products match &quot;{search}&quot;</p>
            <button onClick={() => setSearch('')} className="mt-2 text-sm text-indigo-600 hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Selling price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{product.name}</span>
                      {isLow(product) ? (
                        <Badge variant="low-stock">Low stock</Badge>
                      ) : (
                        <Badge variant="in-stock">In stock</Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="mt-0.5 text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                      {product.sku}
                    </code>
                  </TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${isLow(product) ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatNumber(product.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-gray-600 tabular-nums">
                    {formatCurrency(product.sellingPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/products/${product.id}/adjust`}>
                        <Button variant="ghost" size="sm" title="Adjust stock">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </Button>
                      </Link>
                      <Link href={`/products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm" title="Edit">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        onClick={() => setDeleteTarget(product)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete product"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-900">&quot;{deleteTarget?.name}&quot;</span>?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isPending}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
