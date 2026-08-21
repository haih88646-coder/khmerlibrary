import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AdminLayout from './components/admin/AdminLayout';
import PDFReader from './components/reader/PDFReader';
import TXTReader from './components/reader/TXTReader';

import Home from './pages/Home';
import Browse from './pages/Browse';
import GlobalBooks from './pages/GlobalBooks';
import BookDetails from './pages/BookDetails';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';

import AdminDashboard from './pages/admin/Dashboard';
import BookManagement from './pages/admin/BookManagement';
import AddEditBook from './pages/admin/AddEditBook';
import CategoryManagement from './pages/admin/CategoryManagement';
import AuthorManagement from './pages/admin/AuthorManagement';
import UserManagement from './pages/admin/UserManagement';
import SiteSettings from './pages/admin/SiteSettings';

function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}

function ReaderRoute({ type }) {
  return type === 'txt' ? <TXTReader /> : <PDFReader />;
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <SiteSettingsProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/browse" element={<PublicLayout><Browse /></PublicLayout>} />
              <Route path="/global-books" element={<PublicLayout><GlobalBooks /></PublicLayout>} />
              <Route path="/book/:id" element={<PublicLayout><BookDetails /></PublicLayout>} />
              <Route path="/favorites" element={<PublicLayout><Favorites /></PublicLayout>} />
              <Route path="/profile" element={<PublicLayout><Profile /></PublicLayout>} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Reader Routes - No public layout */}
              <Route path="/read/:id" element={<PDFReader />} />
              <Route path="/read-txt/:id" element={<TXTReader />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="books" element={<BookManagement />} />
                <Route path="books/add" element={<AddEditBook />} />
                <Route path="books/edit/:id" element={<AddEditBook />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="authors" element={<AuthorManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<SiteSettings />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={
                <PublicLayout>
                  <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-surface-200 dark:text-surface-700 mb-4">404</h1>
                      <p className="text-surface-500">Page not found</p>
                    </div>
                  </div>
                </PublicLayout>
              } />
            </Routes>

            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              theme="colored"
            />
            </SiteSettingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
