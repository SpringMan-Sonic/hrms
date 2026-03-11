import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-6xl font-700 text-gray-200 mb-4">404</p>
                <p className="text-lg font-600 text-gray-700">Page not found</p>
              </div>
            } />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}