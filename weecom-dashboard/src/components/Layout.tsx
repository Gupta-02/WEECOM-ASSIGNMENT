import React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-md p-4 flex-shrink-0">
        <div className="text-2xl font-bold mb-6">Weecom Dashboard</div>
        <nav className="space-y-2">
          <a href="#" className="block px-2 py-1 rounded hover:bg-gray-100">Products</a>
          {/* Add more sidebar links here */}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Product Dashboard</h1>
          {/* Add header actions here */}
        </header>
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}