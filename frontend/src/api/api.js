const BASE_URL = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
    }
    return res.json();
}

// Products
export const getProducts = () => request('/products');
export const getProduct = (id) => request(`/products/${id}`);
export const createProduct = (data) => request('/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Orders
export const getOrders = () => request('/orders');
export const getOrder = (id) => request(`/orders/${id}`);
export const createOrder = (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) });
export const updateOrder = (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteOrder = (id) => request(`/orders/${id}`, { method: 'DELETE' });
export const updateOrderStatus = (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
