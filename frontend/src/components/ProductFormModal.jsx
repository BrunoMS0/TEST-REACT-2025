import { useState, useEffect } from 'react';

export default function ProductFormModal({ open, products, initialData, onSave, onCancel }) {
    const [productId, setProductId] = useState('');
    const [qty, setQty] = useState(1);

    useEffect(() => {
        if (initialData) {
            setProductId(String(initialData.product_id));
            setQty(initialData.qty);
        } else {
            setProductId('');
            setQty(1);
        }
    }, [initialData, open]);

    if (!open) return null;

    const selectedProduct = products.find((p) => p.id === Number(productId));
    const totalPrice = selectedProduct ? (selectedProduct.unit_price * qty) : 0;

    const handleSave = () => {
        if (!productId || qty < 1) return;
        onSave({
            product_id: Number(productId),
            name: selectedProduct.name,
            unit_price: selectedProduct.unit_price,
            qty,
            total_price: totalPrice,
        });
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{initialData ? 'Edit Product' : 'Add Product'}</h2>
                <div className="form-group">
                    <label>Product</label>
                    <select
                        className="form-control"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                    >
                        <option value="">-- Select a product --</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} (${Number(p.unit_price).toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Quantity</label>
                    <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                    />
                </div>
                {selectedProduct && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                        Total: <strong style={{ color: 'var(--color-success)' }}>${totalPrice.toFixed(2)}</strong>
                    </p>
                )}
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={!productId || qty < 1}>
                        {initialData ? 'Update' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}
