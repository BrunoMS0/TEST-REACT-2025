import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { getOrders, deleteOrder, updateOrderStatus } from '../api/api';
import ConfirmModal from '../components/ConfirmModal';

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleDelete = async () => {
        try {
            await deleteOrder(deleteId);
            setDeleteId(null);
            fetchOrders();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await updateOrderStatus(id, newStatus);
            fetchOrders();
        } catch (err) {
            alert(err.message);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div>
            <div className="page-header">
                <h1>My Orders</h1>
                <button className="btn btn-primary" onClick={() => navigate('/add-order')}>
                    <Plus size={16} /> Add Order
                </button>
            </div>

            {loading ? (
                <p className="text-muted">Loading...</p>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <p>No orders yet. Create your first order!</p>
                    <button className="btn btn-primary" onClick={() => navigate('/add-order')}>
                        <Plus size={16} /> Add Order
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Order #</th>
                            <th>Date</th>
                            <th># Products</th>
                            <th>Final Price</th>
                            <th>Status</th>
                            <th>Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.order_number}</td>
                                <td>{formatDate(order.date)}</td>
                                <td>{order.num_products}</td>
                                <td>${Number(order.final_price).toFixed(2)}</td>
                                <td>
                                    <select
                                        className="status-select"
                                        value={order.status}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button
                                            className="btn btn-secondary btn-small"
                                            onClick={() => navigate(`/add-order/${order.id}`)}
                                            disabled={order.status === 'Completed'}
                                            title={order.status === 'Completed' ? 'Cannot edit completed orders' : 'Edit order'}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className="btn btn-danger btn-small"
                                            onClick={() => setDeleteId(order.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <ConfirmModal
                open={deleteId !== null}
                title="Delete Order"
                message="Are you sure you want to delete this order? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
