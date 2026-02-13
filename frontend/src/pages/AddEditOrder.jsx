import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Save, CalendarDays, Package, DollarSign } from 'lucide-react';
import { getOrder, getProducts, createOrder, updateOrder } from '../api/api';
import ProductFormModal from '../components/ProductFormModal';
import ConfirmModal from '../components/ConfirmModal';

export default function AddEditOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [orderNumber, setOrderNumber] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [orderProducts, setOrderProducts] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [removeIndex, setRemoveIndex] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const products = await getProducts();
                setAvailableProducts(products);

                if (isEdit) {
                    const order = await getOrder(id);
                    setOrderNumber(order.order_number);
                    setDate(order.date.split('T')[0]);
                    setOrderProducts(
                        order.products.map((p) => ({
                            product_id: p.product_id,
                            name: p.name,
                            unit_price: Number(p.total_price) / p.qty,
                            qty: p.qty,
                            total_price: Number(p.total_price),
                        }))
                    );
                }
            } catch (err) {
                console.error('Error loading data:', err);
                alert(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, isEdit]);

    const numProducts = orderProducts.length;
    const finalPrice = orderProducts.reduce((sum, p) => sum + p.total_price, 0);

    const handleAddProduct = (product) => {
        setOrderProducts([...orderProducts, product]);
        setProductModalOpen(false);
    };

    const handleEditProduct = (product) => {
        const updated = [...orderProducts];
        updated[editingIndex] = product;
        setOrderProducts(updated);
        setEditingIndex(null);
    };

    const handleRemoveProduct = () => {
        setOrderProducts(orderProducts.filter((_, i) => i !== removeIndex));
        setRemoveIndex(null);
    };

    const handleSave = async () => {
        if (!orderNumber.trim()) {
            alert('Please enter an order number.');
            return;
        }
        if (orderProducts.length === 0) {
            alert('Please add at least one product.');
            return;
        }

        const payload = {
            order_number: orderNumber,
            date,
            products: orderProducts.map((p) => ({
                product_id: p.product_id,
                qty: p.qty,
                total_price: p.total_price,
            })),
        };

        try {
            if (isEdit) {
                await updateOrder(id, payload);
            } else {
                await createOrder(payload);
            }
            navigate('/my-orders');
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="text-muted">Loading...</p>;

    return (
        <div>
            <div className="page-header">
                <h1>{isEdit ? 'Edit Order' : 'Add Order'}</h1>
            </div>

            <div className="card">
                <div className="form-group">
                    <label>Order #</label>
                    <input
                        type="text"
                        className="form-control"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="e.g. ORD-001"
                    />
                </div>
                <div className="info-counters">
                    <div className="info-counter">
                        <CalendarDays size={20} />
                        <div>
                            <span className="info-counter-label">Date</span>
                            <span className="info-counter-value">{new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="info-counter">
                        <Package size={20} />
                        <div>
                            <span className="info-counter-label"># Products</span>
                            <span className="info-counter-value">{numProducts}</span>
                        </div>
                    </div>
                    <div className="info-counter">
                        <DollarSign size={20} />
                        <div>
                            <span className="info-counter-label">Final Price</span>
                            <span className="info-counter-value">${finalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="mt-24">
                <div className="page-header">
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>Order Products</h2>
                    <button className="btn btn-primary btn-small" onClick={() => { setEditingIndex(null); setProductModalOpen(true); }}>
                        <Plus size={14} /> Add Product
                    </button>
                </div>

                {orderProducts.length === 0 ? (
                    <div className="empty-state">
                        <p>No products added yet.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Unit Price</th>
                                <th>Qty</th>
                                <th>Total Price</th>
                                <th>Options</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderProducts.map((p, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{p.name}</td>
                                    <td>${Number(p.unit_price).toFixed(2)}</td>
                                    <td>{p.qty}</td>
                                    <td>${Number(p.total_price).toFixed(2)}</td>
                                    <td>
                                        <div className="actions">
                                            <button className="btn btn-secondary btn-small" onClick={() => { setEditingIndex(idx); setProductModalOpen(true); }}>
                                                <Pencil size={14} />
                                            </button>
                                            <button className="btn btn-danger btn-small" onClick={() => setRemoveIndex(idx)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Save Button */}
            <div className="mt-24 text-right">
                <button className="btn btn-secondary" onClick={() => navigate('/my-orders')} style={{ marginRight: '10px' }}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave}>
                    <Save size={16} /> {isEdit ? 'Update Order' : 'Save Order'}
                </button>
            </div>

            {/* Product Form Modal */}
            <ProductFormModal
                open={productModalOpen}
                products={availableProducts}
                initialData={editingIndex !== null ? orderProducts[editingIndex] : null}
                onSave={editingIndex !== null ? handleEditProduct : handleAddProduct}
                onCancel={() => { setProductModalOpen(false); setEditingIndex(null); }}
            />

            {/* Remove Confirm Modal */}
            <ConfirmModal
                open={removeIndex !== null}
                title="Remove Product"
                message="Remove this product from the order?"
                onConfirm={handleRemoveProduct}
                onCancel={() => setRemoveIndex(null)}
            />
        </div>
    );
}
