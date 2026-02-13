export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{title || 'Confirm'}</h2>
                <p>{message || 'Are you sure you want to proceed?'}</p>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-danger" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
}
