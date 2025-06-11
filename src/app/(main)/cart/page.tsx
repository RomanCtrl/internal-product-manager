// src/app/(main)/cart/page.tsx
import { redirect } from 'next/navigation';

export default function DisabledCartPage() {
  redirect('/products'); // Redirect to the main products page
  return null; // Ensure the component returns null after initiating redirect
}
