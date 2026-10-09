// src/components/Column.jsx
import { useDroppable } from '@dnd-kit/core';
import TicketCard from './TicketCard';

export default function Column({ column, tickets, onTicketClick, onRequestArchiveTicket, onRequestDeleteTicket }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex w-full h-full flex-col rounded-2xl bg-slate-200/50 p-3 border border-slate-200/60">
      
      <div className="mb-4 flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{column.title}</h2>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/50 text-[10px] font-bold text-slate-600">
            {tickets.length}
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-3 min-h-[200px]">
        {tickets.map((ticket) => (
          <TicketCard 
            key={ticket.id} 
            ticket={ticket} 
            onClick={() => onTicketClick(ticket)} 
            onRequestArchiveTicket={onRequestArchiveTicket}
            onRequestDeleteTicket={onRequestDeleteTicket}
          />
        ))}
      </div>
    </div>
  );
}