// src/components/CreateTicketModal.jsx
import { useState } from 'react';
import { X, LayoutDashboard } from 'lucide-react';

const generateId = () => `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

export default function CreateTicketModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM', // Changed from 'type' and using uppercase
    status: 'backlog',
    tags: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newTicket = {
      id: generateId(), // Cleaner, string-based ID
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority, // Saving it cleanly as 'priority'
      status: formData.status,
      // Fallback field for legacy components just in case
      type: formData.priority, 
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };

    onSave(newTicket);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-blue-600" />
            Create New Ticket
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Title</label>
            <input 
              required
              autoFocus
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm text-sm"
              placeholder="e.g., Fix Navigation Bug"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</label>
            <textarea 
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none shadow-sm text-sm"
              placeholder="Detailed description of the task..."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm text-sm font-medium text-slate-700 cursor-pointer"
              >
                {/* Options are now exactly matching the uppercase dictionary */}
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Column</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white shadow-sm text-sm font-medium text-slate-700 cursor-pointer"
              >
                <option value="backlog">Backlog</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tech Stack Tags</label>
            <input 
              type="text" 
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm text-sm"
              placeholder="e.g., React, Tailwind, Node.js (Comma separated)"
            />
          </div>

          <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!formData.title.trim() || !formData.description.trim()}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}