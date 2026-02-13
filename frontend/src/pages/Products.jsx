import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/api';
import ConfirmModal from '../components/ConfirmModal';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    const openAdd = () => {
        setEditingProduct(null);
        setName('');
        setUnitPrice('');
        setModalOpen(true);
    };

    const openEdit = (product) => {
        setEditingProduct(product);
        setName(product.name);
        setUnitPrice(String(product.unit_price));
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!name.trim() || !unitPrice) return;
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, { name, unit_price: Number(unitPrice) });
            } else {
                await createProduct({ name, unit_price: Number(unitPrice) });
            }
            setModalOpen(false);
            fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProduct(deleteId);
            setDeleteId(null);
            fetchProducts();
        } catch (err) {
            alert(err.message);
            setDeleteId(null);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Products</h1>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={16} /> Add Product
                </button>
            </div>

            {loading ? (
                <p className="text-muted">Loading...</p>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <p>No products yet.</p>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Unit Price</th>
                            <th>Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.name}</td>
                                <td>${Number(p.unit_price).toFixed(2)}</td>
                                <td>
                                    <div className="actions">
                                        <button className="btn btn-secondary btn-small" onClick={() => openEdit(p)}>
                                            <Pencil size={14} />
                                        </button>
                                        <button className="btn btn-danger btn-small" onClick={() => setDeleteId(p.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Product Form Modal */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                        <div className="form-group">
                            <label>Name</label>
                            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
                        </div>
                        <div className="form-group">
                            <label>Unit Price</label>
                            <input type="number" className="form-control" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || !unitPrice}>
                                {editingProduct ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={deleteId !== null}
                title="Delete Product"
                message="Are you sure you want to delete this product?"
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
            />
        </div>
    );
}
