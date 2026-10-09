// src/components/ArchivePage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { ArchiveRestore, Trash2, Eye, LayoutDashboard, AlertCircle, Archive } from 'lucide-react';

export default function ArchivePage({ allTickets, updateTicketInDB, deleteTicketFromDB, activeProjectId, addNotification }) {
  const navigate = useNavigate();

  // Filter to only show archived tickets for the currently active project
  const archivedTickets = allTickets.filter(t => t.isArchived && t.projectId === activeProjectId);

  const handleRestore = async (ticketId, ticketTitle) => {
    await updateTicketInDB(ticketId, { isArchived: false });
    addNotification('Ticket Restored', `"${ticketTitle}" has been moved back to the active board.`);
  };

  const handleDelete = async (ticketId, ticketTitle) => {
    // A quick browser confirmation so they don't accidentally double-click delete
    if (window.confirm(`Are you sure you want to permanently delete "${ticketTitle}"? This cannot be undone.`)) {
      await deleteTicketFromDB(ticketId);
      addNotification('Ticket Deleted', `"${ticketTitle}" was permanently removed.`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* BREADCRUMBS */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Workspace
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Archive</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
          <Archive className="h-6 w-6 text-slate-400" /> Archived Tickets
        </h2>

        {archivedTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No archived tickets</h3>
            <p className="text-xs text-slate-500 mt-1">Tickets you archive from your board will appear here safely.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {archivedTickets.map(ticket => (
              <div 
                key={ticket.id} 
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex-1">
                  {/* Clickable Title */}
                  <Link to={`/ticket/${ticket.id}`} className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">
                    {ticket.title}
                  </Link>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                    {ticket.description || 'No description provided.'}
                  </p>
                  
                  {/* Metadata Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">
                      {ticket.status || 'BACKLOG'}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">
                      {ticket.priority || 'LOW'}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <Link 
                    to={`/ticket/${ticket.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" /> View
                  </Link>
                  <button 
                    onClick={() => handleRestore(ticket.id, ticket.title)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <ArchiveRestore className="h-4 w-4" /> Restore
                  </button>
                  <button 
                    onClick={() => handleDelete(ticket.id, ticket.title)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}