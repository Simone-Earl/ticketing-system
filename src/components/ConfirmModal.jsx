// src/components/ConfirmModal.jsx
import { Archive, Trash2, UserMinus } from 'lucide-react'; // Added UserMinus icon

export default function ConfirmModal({ isOpen, onClose, onConfirm, type, ticketTitle, itemType = "Ticket" }) {
  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const isRemove = type === 'remove'; // NEW: Remove mode
  
  const Icon = isDelete ? Trash2 : (isRemove ? UserMinus : Archive);
  const colorClass = (isDelete || isRemove) ? 'text-red-600 bg-red-100' : 'text-blue-600 bg-blue-100';
  const buttonClass = (isDelete || isRemove) ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
  
  let title;
  let message;
  let confirmText;
  
  if (isDelete) {
    title = `Delete ${itemType}`;
    message = `Are you sure you want to permanently delete "${ticketTitle}"? This action cannot be undone.`;
    confirmText = 'Yes, delete it';
  } else if (isRemove) {
    title = `Remove ${itemType}`;
    message = `Are you sure you want to remove "${ticketTitle}" from this workspace? They will lose access to all tickets.`;
    confirmText = 'Yes, remove them';
  } else {
    title = `Archive ${itemType}`;
    message = `Are you sure you want to move "${ticketTitle}" to the archive?`;
    confirmText = 'Yes, archive it';
  }

  return (
    // Increased z-index to 110 so it sits on top of the Invite Modal
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors ${buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}