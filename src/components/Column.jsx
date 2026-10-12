// src/components/Column.jsx
import { useDroppable } from '@dnd-kit/core';
import TicketCard from './TicketCard';

export default function Column({ column, tickets, ticketNumberMap, onTicketClick, onRequestArchiveTicket, onRequestDeleteTicket, onRequestEditTicket }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 flex flex-col gap-3 min-h-[450px] p-2 rounded-xl transition-colors ${isOver ? 'bg-blue-50/50 ring-2 ring-blue-500/20' : 'bg-slate-50/70'}`}
    >
      {tickets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center border border-dashed border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-400 italic">No tasks in {column.title}</span>
        </div>
      ) : (
        tickets.map((ticket) => (
          <TicketCard 
            key={ticket.id} 
            ticket={ticket} 
            ticketNumber={ticketNumberMap[ticket.id]} 
            onClick={onTicketClick} 
            onRequestArchive={onRequestArchiveTicket}
            onRequestDelete={onRequestDeleteTicket}
            onRequestEdit={onRequestEditTicket}
          />
        ))
      )}
    </div>
  );
}