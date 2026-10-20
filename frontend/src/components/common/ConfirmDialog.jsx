// src/components/common/ConfirmDialog.jsx
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Delete", loading, onConfirm, onClose }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}
    >
      <p className="text-sm text-slate-600">{description}</p>
    </Modal>
  );
}
