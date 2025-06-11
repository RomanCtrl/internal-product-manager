'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Package, Eye, Calendar, DollarSign } from 'lucide-react'

interface Order {
  order_id: string
  order_number: string
  order_status: string
  total_amount: number
  order_date: string
  order_items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, selectedStatus])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('orders')
        .select(`
          order_id,
          order_number,
          order_status,
          total_amount,
          order_date,
          order_items (
            quantity,
            unit_price,
            total_price,
            products (
              product_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('order_date', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('order_status', selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-2">Track and manage your order history</p>
        </div>
        
        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">${order.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.products?.product_name} × {item.quantity}
                        </span>
                        <span className="font-medium">${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
