export interface User {
    id: string
    email: string
    full_name: string
    role: string
    department?: string
  }
  
  export interface Category {
    id: string
    name: string
    description?: string
    parent_id?: string
  }
  
  export interface Product {
    id: string
    sku: string
    name: string
    description?: string
    category_id?: string
    price: number
    cost?: number
    stock_quantity: number
    min_stock_level: number
    status: string
    image_url?: string
    created_by?: string
  }
  
  export interface CartItem {
    id: string
    cart_id: string
    product_id: string
    quantity: number
    price_at_time: number
    product?: Product
  }
  
  export interface Order {
    id: string
    order_number: string
    user_id: string
    status: string
    total_amount: number
    notes?: string
    requested_delivery_date?: string
    created_at: string
  }