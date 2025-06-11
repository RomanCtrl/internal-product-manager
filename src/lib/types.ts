export interface User {
    id: string
    name: string
    email: string
    city: string
    zip: number
    country: string
    role: string
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
    price: number
    stock_quantity: number
    image_url?: string
    step?: number
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