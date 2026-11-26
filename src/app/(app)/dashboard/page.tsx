import { requireSession } from '@/lib/auth'
import { getOrg } from '@/lib/data/organizations'
import { getDashboardStats } from '@/lib/data/products'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireSession()
  const org = await getOrg(session.organizationId)
  const stats = await getDashboardStats(
    session.organizationId,
    org?.defaultLowStockThreshold ?? 5,
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of your inventory</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total products"
          value={formatNumber(stats.totalProducts)}
          icon={
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Total units on hand"
          value={formatNumber(stats.totalQuantity)}
          icon={
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Low stock items"
          value={formatNumber(stats.lowStockItems.length)}
          icon={
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
          alert={stats.lowStockItems.length > 0}
        />
      </div>

      {/* Low stock table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Low stock items</h2>
          {stats.lowStockItems.length > 0 && (
            <Badge variant="low-stock">{stats.lowStockItems.length} items</Badge>
          )}
        </div>

        {stats.lowStockItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="mx-auto h-10 w-10 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-900">All stocked up!</p>
            <p className="mt-1 text-sm text-gray-500">No products are below their low stock threshold.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.lowStockItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <TableCell>
                    <Link
                      href={`/products/${item.id}/edit`}
                      className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700">
                      {item.sku}
                    </code>
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-amber-600">
                    {item.quantity} units
                  </TableCell>
                  <TableCell className="text-right text-xs text-gray-500 font-mono">
                    ≤ {item.effectiveThreshold}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Link
                      href={`/products/${item.id}/adjust`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      Restock
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  alert = false,
}: {
  label: string
  value: string
  icon: React.ReactNode
  alert?: boolean
}) {
  return (
    <Card className={alert ? 'border-red-200' : ''}>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${alert ? 'bg-red-50' : 'bg-indigo-50'}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
