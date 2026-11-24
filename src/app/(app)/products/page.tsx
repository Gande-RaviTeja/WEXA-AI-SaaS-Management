import { requireSession } from '@/lib/auth'
import { getOrg } from '@/lib/data/organizations'
import { listProducts } from '@/lib/data/products'
import { ProductsClient } from './ProductsClient'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const session = await requireSession()
  const [org, products] = await Promise.all([
    getOrg(session.organizationId),
    listProducts(session.organizationId),
  ])

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your inventory</p>
        </div>
        <Link href="/products/new">
          <Button>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add product
          </Button>
        </Link>
      </div>

      <ProductsClient
        products={products}
        orgThreshold={org?.defaultLowStockThreshold ?? 5}
      />
    </div>
  )
}
