// src/components/Board.jsx
import { useState, useEffect } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Column from './Column';
import CreateTicketModal from './CreateTicketModal';
import ConfirmModal from './ConfirmModal';

const columns = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'in-review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

export default function Board({ allTickets, updateTicketInDB, addTicketToDB, deleteTicketFromDB, activeProjectId, addNotification }) {
  const navigate = useNavigate(); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', ticketId: '', ticketTitle: '' });

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('boardScrollPosition');
    if (savedScrollPosition) setTimeout(() => window.scrollTo({ top: parseInt(savedScrollPosition, 10), left: 0, behavior: 'instant' }), 10);
  }, []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const projectTickets = allTickets.filter(ticket => ticket.projectId === activeProjectId && !ticket.isArchived);

  // FIX: Sort project tickets chronologically to assign stable sequential numbers (#1, #2, etc.)
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
      await updateTicketInDB(ticketId, { status: newStatus });
      addNotification('Status Updated', `Ticket was moved to ${newStatus.replace('-', ' ').toUpperCase()}.`);
    }
  };

  const handleAddTicket = async (newTicket) => {
    await addTicketToDB(newTicket);
    setIsCreating(false);
    addNotification('Ticket Created', `New ticket added to backlog.`);
  };

  const requestArchiveTicket = (ticketId, ticketTitle) => setConfirmDialog({ isOpen: true, type: 'archive', ticketId, ticketTitle });
  const requestDeleteTicket = (ticketId, ticketTitle) => setConfirmDialog({ isOpen: true, type: 'delete', ticketId, ticketTitle });

  const executeConfirmAction = async () => {
    if (confirmDialog.type === 'archive') {
      await updateTicketInDB(confirmDialog.ticketId, { isArchived: true });
      addNotification('Ticket Archived', `Ticket has been moved to the archive.`);
    } else if (confirmDialog.type === 'delete') {
      await deleteTicketFromDB(confirmDialog.ticketId);
      addNotification('Ticket Deleted', `Ticket was permanently removed.`);
    }
    setConfirmDialog({ isOpen: false, type: '', ticketId: '', ticketTitle: '' });
  };

  const filteredTickets = projectTickets.filter(ticket => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return ticket.title.toLowerCase().includes(lowerCaseQuery) || ticket.description.toLowerCase().includes(lowerCaseQuery) || ticket.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
  });

  const priorityWeights = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 pt-2 pb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
          <Plus className="w-4 h-4" /> Create Ticket
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 pb-6 min-h-[calc(100vh-300px)]">
          {columns.map((column) => {
            const columnTickets = filteredTickets
              .filter((ticket) => ticket.status === column.id)
              .sort((a, b) => {
                const priorityA = a.priority?.toUpperCase() || 'LOW';
                const priorityB = b.priority?.toUpperCase() || 'LOW';
                return (priorityWeights[priorityB] || 0) - (priorityWeights[priorityA] || 0);
              });
            
            return (
              <Column 
                key={column.id} 
                column={column} 
                tickets={columnTickets} 
                ticketNumberMap={ticketNumberMap}
                onTicketClick={(ticket) => { sessionStorage.setItem('boardScrollPosition', window.scrollY.toString()); navigate(`/ticket/${ticket.id}`); }}
                onRequestArchiveTicket={requestArchiveTicket}
                onRequestDeleteTicket={requestDeleteTicket}
              />
            );
          })}
        </div>
      </DndContext>

      {isCreating && <CreateTicketModal onClose={() => setIsCreating(false)} onSave={handleAddTicket} />}
      <ConfirmModal isOpen={confirmDialog.isOpen} type={confirmDialog.type} ticketTitle={confirmDialog.ticketTitle} onClose={() => setConfirmDialog({ isOpen: false, type: '', ticketId: '', ticketTitle: '' })} onConfirm={executeConfirmAction} />
    </div>
  );
}