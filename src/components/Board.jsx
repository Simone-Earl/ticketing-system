// src/components/Board.jsx
import { useState, useEffect } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Plus, SlidersHorizontal, X, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Column from './Column';
import CreateTicketModal from './CreateTicketModal';
import ConfirmModal from './ConfirmModal';

const columns = [
  { id: 'backlog', title: 'To Do', badgeColor: 'bg-slate-100 text-slate-600' },
  { id: 'in-progress', title: 'In Progress', badgeColor: 'bg-amber-100 text-amber-700' },
  { id: 'in-review', title: 'In Review', badgeColor: 'bg-purple-100 text-purple-700' },
  { id: 'done', title: 'Done', badgeColor: 'bg-emerald-100 text-emerald-700' },
];

export default function Board({ allTickets, updateTicketInDB, addTicketToDB, deleteTicketFromDB, activeProjectId, searchQuery = '', currentUser, userProfile }) {
  const navigate = useNavigate(); 
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', ticketId: '', ticketTitle: '' });
  
  // Quick Edit Modal State
  const [editingTicket, setEditingTicket] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'MEDIUM', deadline: '', techStack: '' });

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('boardScrollPosition');
    if (savedScrollPosition) setTimeout(() => window.scrollTo({ top: parseInt(savedScrollPosition, 10), left: 0, behavior: 'instant' }), 10);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const projectTickets = allTickets.filter(ticket => ticket.projectId === activeProjectId && !ticket.isArchived);

  const sortedProjectTickets = [...projectTickets].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return timeA - timeB;
  });

  const ticketNumberMap = {};
  sortedProjectTickets.forEach((t, index) => {
    ticketNumberMap[t.id] = `#${index + 1}`;
  });

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id;
    const newStatus = over.id;

    const draggedTicket = allTickets.find(t => t.id === ticketId);
    if (draggedTicket && draggedTicket.status !== newStatus) {
      const updateFields = { status: newStatus };
      
      if (newStatus === 'done') {
        updateFields.completedBy = currentUser.email;
        updateFields.completedByInitials = userProfile?.initials || currentUser.email.substring(0, 2).toUpperCase();
      }

      await updateTicketInDB(ticketId, updateFields);
    }
  };

  const handleAddTicket = async (newTicket) => {
    await addTicketToDB(newTicket);
    setIsCreating(false);
  };

  const requestArchiveTicket = (ticketId, ticketTitle) => setConfirmDialog({ isOpen: true, type: 'archive', ticketId, ticketTitle });
  const requestDeleteTicket = (ticketId, ticketTitle) => setConfirmDialog({ isOpen: true, type: 'delete', ticketId, ticketTitle });

  const requestEditTicket = (ticket) => {
    setEditingTicket(ticket);
    setEditForm({
      title: ticket.title || '',
      description: ticket.description || '',
      priority: ticket.priority || 'MEDIUM',
      deadline: ticket.deadline || '',
      techStack: Array.isArray(ticket.techStack) ? ticket.techStack.join(', ') : (ticket.techStack || '')
    });
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!editingTicket) return;

    const updatedData = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      priority: editForm.priority,
      type: editForm.priority,
      deadline: editForm.deadline || '',
      techStack: editForm.techStack ? editForm.techStack.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    await updateTicketInDB(editingTicket.id, updatedData);
    setEditingTicket(null);
  };

  const executeConfirmAction = async () => {
    if (confirmDialog.type === 'archive') {
      await updateTicketInDB(confirmDialog.ticketId, { isArchived: true });
    } else if (confirmDialog.type === 'delete') {
      await deleteTicketFromDB(confirmDialog.ticketId);
    }
    setConfirmDialog({ isOpen: false, type: '', ticketId: '', ticketTitle: '' });
  };

  const filteredTickets = projectTickets.filter(ticket => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return ticket.title.toLowerCase().includes(lowerCaseQuery) || ticket.description.toLowerCase().includes(lowerCaseQuery) || ticket.techStack?.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
  });

  const priorityWeights = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">My Tasks (Kanban)</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mr-2">
            <span>Sort: Priority</span>
            <SlidersHorizontal className="h-3 w-3" />
          </div>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-extrabold hover:bg-blue-100 transition-colors whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-2 min-h-[500px]">
          {columns.map((column) => {
            const columnTickets = filteredTickets
              .filter((ticket) => ticket.status === column.id || (column.id === 'backlog' && !ticket.status)) 
              .sort((a, b) => {
                const priorityA = a.priority?.toUpperCase() || 'LOW';
                const priorityB = b.priority?.toUpperCase() || 'LOW';
                return (priorityWeights[priorityB] || 0) - (priorityWeights[priorityA] || 0);
              });
            
            return (
              <div key={column.id} className="flex flex-col">
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${column.badgeColor}`}>
                  <span className="text-xs font-extrabold">{column.title}</span>
                  <span className="text-[10px] font-extrabold bg-white/50 px-2 py-0.5 rounded-md">{columnTickets.length}</span>
                </div>
                
                <Column 
                  column={column} 
                  tickets={columnTickets} 
                  ticketNumberMap={ticketNumberMap}
                  onTicketClick={(ticket) => { sessionStorage.setItem('boardScrollPosition', window.scrollY.toString()); navigate(`/ticket/${ticket.id}`); }}
                  onRequestArchiveTicket={requestArchiveTicket}
                  onRequestDeleteTicket={requestDeleteTicket}
                  onRequestEditTicket={requestEditTicket}
                />
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* Quick Edit Modal */}
      {editingTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-white">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2 text-sm">
                <Pencil className="h-4 w-4 text-blue-600" /> Quick Edit Task
              </h2>
              <button onClick={() => setEditingTicket(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="p-5 flex flex-col gap-4 bg-slate-50/50">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Description</label>
                <textarea 
                  required
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs text-slate-700 shadow-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Priority</label>
                  <select 
                    value={editForm.priority}
                    onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-700 shadow-sm cursor-pointer"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Deadline</label>
                  <input 
                    type="date" 
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({...editForm, deadline: e.target.value})}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-700 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Tags (Comma separated)</label>
                <input 
                  type="text" 
                  value={editForm.techStack}
                  onChange={(e) => setEditForm({...editForm, techStack: e.target.value})}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs shadow-sm"
                  placeholder="e.g., Design, Bug"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreating && <CreateTicketModal onClose={() => setIsCreating(false)} onSave={handleAddTicket} />}
      <ConfirmModal isOpen={confirmDialog.isOpen} type={confirmDialog.type} ticketTitle={confirmDialog.ticketTitle} onClose={() => setConfirmDialog({ isOpen: false, type: '', ticketId: '', ticketTitle: '' })} onConfirm={executeConfirmAction} />
    </div>
  );
}