import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Layout from "./components/Layout"
import { ProductTable } from "./components/ProductTable"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <ProductTable />
      </Layout>
    </QueryClientProvider>
  )
}

export default App