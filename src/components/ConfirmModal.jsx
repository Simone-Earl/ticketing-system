// src/components/ConfirmModal.jsx
import { Archive, Trash2, UserMinus } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, type, ticketTitle, itemType = "Task" }) {
  if (!isOpen) return null;

  const isDelete = type === 'delete' || type === 'remove';
  const Icon = isDelete ? (type === 'remove' ? UserMinus : Trash2) : Archive;
  
  const titleText = isDelete ? `Delete ${itemType}` : `Archive ${itemType}`;
  const confirmText = isDelete ? 'Yes, Delete' : 'Yes, Archive';
  const buttonColor = isDelete ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20';
  const iconColor = isDelete ? 'text-red-600 bg-red-100' : 'text-amber-600 bg-amber-100';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center">
        
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 ${iconColor}`}>
          <Icon className="h-7 w-7" />
        </div>
        
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">{titleText}</h3>
        
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Are you sure you want to {isDelete ? 'permanently delete' : 'archive'} <br/>
          <strong className="text-slate-800 line-clamp-2 mt-1 px-4">{ticketTitle}</strong>
          {isDelete && <span className="block mt-2 text-red-500">This action cannot be undone.</span>}
        </p>
        
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-3 text-xs font-extrabold text-white rounded-xl shadow-md transition-all ${buttonColor}`}
          >
            {confirmText}
          </button>
        </div>
        
      </div>
    </div>
  );
}