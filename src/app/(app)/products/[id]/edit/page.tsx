import { requireSession } from '@/lib/auth'
import { getProduct } from '@/lib/data/products'
import { notFound } from 'next/navigation'
import { updateProductAction } from '@/actions/products'
import { ProductForm } from '../../ProductForm'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  const product = await getProduct(id, session.organizationId)

  if (!product) notFound()

  const boundAction = updateProductAction.bind(null, id)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit product</h1>
          <p className="mt-0.5 text-sm text-gray-500">{product.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <ProductForm
            action={boundAction}
            defaultValues={{
              name: product.name,
              sku: product.sku,
              description: product.description ?? '',
              quantity: product.quantity,
              costPrice: product.costPrice,
              sellingPrice: product.sellingPrice,
              lowStockThreshold: product.lowStockThreshold,
            }}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>
    </div>
  )
}
