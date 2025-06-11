'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Search } from 'lucide-react'

interface InventoryItem {
  product_id: string
  product_name: string
  total_inventory: number
  min_stock_level: number
  max_stock_level: number
  reorder_point: number
  price: number
  step: number
  last_updated: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchInventory()
  }, [])

  useEffect(() => {
    filterInventory()
  }, [inventory, searchTerm, filterType])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_name')

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInventory = () => {
    let filtered = inventory

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply stock level filter
    switch (filterType) {
      case 'low_stock':
        filtered = filtered.filter(item => item.total_inventory <= item.reorder_point)
        break
      case 'out_of_stock':
        filtered = filtered.filter(item => item.total_inventory === 0)
        break
      case 'overstock':
        filtered = filtered.filter(item => item.total_inventory > item.max_stock_level)
        break
      default:
        break
    }

    setFilteredInventory(filtered)
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.total_inventory === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50' }
    } else if (item.total_inventory <= item.reorder_point) {
      return { status: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else if (item.total_inventory > item.max_stock_level) {
      return { status: 'Overstock', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    }
    return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  const updateStock = async (productId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          total_inventory: newQuantity,
          last_updated: new Date().toISOString()
