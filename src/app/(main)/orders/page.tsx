'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { Package, Eye, Calendar, DollarSign } from 'lucide-react'

interface Order {
  order_id: string // This should be the actual 'id' (PK) from the 'orders' table
  order_number: string
  order_status: string
  total_amount: number
  order_date: string
  order_items: Array<{
    quantity: number
    unit_price: number
    total_price: number
    products: {
      product_name: string
    } | null
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const { user } = useAuth()
  const supabase = createClient()

  // Renamed columns in select to match component's Order interface
  // This assumes 'id' is the PK in 'orders' table and is selected as 'order_id'
  const fetchOrders = async () => {
    if (!user) return; // Ensure user is available
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          order_items (
            quantity,
            unit_price,
            total_price,
            products (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match the Order interface if necessary
      const transformedOrders: Order[] = data.map(dbOrder => ({
        order_id: dbOrder.id, // Map db 'id' to component 'order_id'
        order_number: dbOrder.order_number,
        order_status: dbOrder.status, // Map db 'status' to component 'order_status'
        total_amount: dbOrder.total_amount,
        order_date: dbOrder.created_at, // Map db 'created_at' to component 'order_date'
        order_items: dbOrder.order_items.map(item => ({
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            products: item.products ? { product_name: item.products.name } : null
        }))
      }));
      setOrders(transformedOrders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, selectedStatus]); // supabase client should not be a dependency if it's stable

  const handleCancelOrder = async (orderId: string) => {
    if (!user) {
      alert('You must be logged in to cancel an order.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      // 'orderId' is expected to be the actual 'id' (PK) of the order from the 'orders' table.
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error cancelling order:', error);
        alert(`Failed to cancel order: ${error.message}`);
        // No need to throw here unless specific handling is required upstream
        return; // Stop execution if error
      }

      alert('Order cancelled successfully.');
      fetchOrders(); // Refresh orders list
    } catch (error: any) {
      // This catch block handles unexpected errors during the try execution
      console.error('Unexpected error cancelling order:', error);
      alert(`An unexpected error occurred: ${error.message || 'Please try again.'}`);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800' // Assuming 'processing' is a possible status
      case 'shipped': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6"> {/* Added some padding for overall page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1 md:mt-2">Track and manage your order history</p>
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="mt-4 md:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 self-start md:self-center"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'No orders found' : `No ${selectedStatus} orders found`}
          </h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' ? "You haven't placed any orders yet." : `You have no orders with the status '${selectedStatus}'.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-bold text-gray-900">${order.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Order Items</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.products?.product_name || 'Product name not available'} &times; {item.quantity}
                        </span>
                        <span className="font-medium text-gray-800">${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.order_status === 'pending' && (
                  <div className="mt-4 pt-4 border-t text-right"> {/* Aligned button to the right */}
                    <button
                      onClick={() => handleCancelOrder(order.order_id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-sm transition-colors duration-150"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
