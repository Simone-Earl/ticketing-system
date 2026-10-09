// src/components/ArchivePage.jsx
import { useState } from 'react';
import { Search, RotateCcw, Trash2, LayoutDashboard, Archive as ArchiveIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

export default function ArchivePage({ allTickets, updateTicketInDB, deleteTicketFromDB, activeProjectId }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, ticketId: '', ticketTitle: '' });

  // Only show tickets that belong to the active project AND are archived
  const archivedTickets = allTickets.filter(
    ticket => ticket.projectId === activeProjectId && ticket.isArchived
  );

  const filteredTickets = archivedTickets.filter(ticket => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(lowerCaseQuery) || 
      ticket.description.toLowerCase().includes(lowerCaseQuery)
    );
  });

  const handleRestore = async (ticketId) => {
    await updateTicketInDB(ticketId, { isArchived: false });
    // Removed notification
  };

  const requestDelete = (ticketId, ticketTitle) => {
    setConfirmDialog({ isOpen: true, ticketId, ticketTitle });
  };

  const executeDelete = async () => {
    await deleteTicketFromDB(confirmDialog.ticketId);
    // Removed notification
    setConfirmDialog({ isOpen: false, ticketId: '', ticketTitle: '' });
  };

  const formatBadgeText = (text) => text ? text.replace('-', ' ').toUpperCase() : '';

  const getStatusColor = (status) => {
    switch(status) {
      case 'backlog': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in-review': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-300 max-w-6xl mx-auto">
      
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Workspace
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold flex items-center gap-1.5">
            <ArchiveIcon className="h-4 w-4" /> Archive
          </span>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Archived Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">Restore tickets to the board or permanently delete them.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search archive..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm" 
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <ArchiveIcon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Archive is empty</h3>
            <p className="text-sm text-slate-500">No archived tickets found in this workspace.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ticket Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Reporter</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 mb-1">{ticket.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-md">{ticket.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold border ${getStatusColor(ticket.status)}`}>
                        {formatBadgeText(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                          {ticket.authorInitials || 'U'}
                        </div>
                        <span className="text-xs font-medium text-slate-600">
                          {ticket.authorName || ticket.authorEmail?.split('@')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleRestore(ticket.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Restore
                        </button>
                        <button 
                          onClick={() => requestDelete(ticket.id, ticket.title)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmDialog.isOpen} 
        type="delete" 
        ticketTitle={confirmDialog.ticketTitle} 
        onClose={() => setConfirmDialog({ isOpen: false, ticketId: '', ticketTitle: '' })} 
        onConfirm={executeDelete} 
      />

    </div>
  );
}