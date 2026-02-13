import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import MyOrders from './pages/MyOrders';
import AddEditOrder from './pages/AddEditOrder';
import Products from './pages/Products';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="nav-bar">
          <NavLink to="/my-orders" className={({ isActive }) => isActive ? 'active' : ''}>
            My Orders
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
            Products
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/my-orders" replace />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/add-order" element={<AddEditOrder />} />
          <Route path="/add-order/:id" element={<AddEditOrder />} />
          <Route path="/products" element={<Products />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
