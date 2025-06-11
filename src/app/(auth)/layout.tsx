// src/app/(auth)/layout.tsx
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Product Management System</h1>
            <p className="text-gray-600 mt-2">Internal Business Tool</p>
          </div>
          {children}
        </div>
      </div>
    )
  }
  