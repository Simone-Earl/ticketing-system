// src/components/TicketCard.jsx
import { useDraggable } from '@dnd-kit/core';
import { AlertCircle, ChevronsUp, Minus, ChevronDown, Archive, Trash2 } from 'lucide-react';

export default function TicketCard({ ticket, onClick, onRequestArchiveTicket, onRequestDeleteTicket }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getStatusBorder = (status) => {
    switch(status) {
      case 'backlog': return 'border-l-pink-500';
      case 'in-progress': return 'border-l-blue-500';
      case 'in-review': return 'border-l-amber-500';
      case 'done': return 'border-l-purple-500';
      default: return 'border-l-slate-300';
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-red-500' };
      case 'high': return { icon: <ChevronsUp className="w-3.5 h-3.5" />, color: 'text-orange-500' };
      case 'medium': return { icon: <Minus className="w-3.5 h-3.5" />, color: 'text-blue-500' };
      case 'low': return { icon: <ChevronDown className="w-3.5 h-3.5" />, color: 'text-slate-500' };
      default: return { icon: <Minus className="w-3.5 h-3.5" />, color: 'text-slate-400' };
    }
  };

  const getDynamicTagStyle = (tag) => {
    const text = tag.toLowerCase();
    if (text.includes('react') || text.includes('tailwind')) return 'bg-cyan-50 text-cyan-700 border-cyan-100';
    if (text.includes('node') || text.includes('mongo') || text.includes('api')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (text.includes('laravel') || text.includes('angular')) return 'bg-red-50 text-red-700 border-red-100';
    if (text.includes('web3') || text.includes('blockchain')) return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-slate-100 text-slate-600 border-slate-200'; 
  };

  const displayPriority = ticket.priority || ticket.type || 'LOW';
  const priorityDisplay = getPriorityConfig(displayPriority);
  
  // Dynamic user data variables
  const authorInitials = ticket.authorInitials || ticket.authorEmail?.substring(0, 2).toUpperCase() || 'U';
  const authorEmail = ticket.authorEmail || 'Unknown User';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      onClick={onClick}
      className={`bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-slate-200/80 border-l-[3px] ${getStatusBorder(ticket.status)} p-4 hover:shadow-lg hover:-translate-y-0.5 ${
        isDragging ? 'opacity-50 ring-2 ring-blue-500 z-50 cursor-grabbing' : 'transition-all cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold text-slate-400 tracking-wider">{ticket.id}</span>
        
        <div className="flex items-center gap-1">
          <button 
            title="Archive Ticket"
            onClick={(e) => {
              e.stopPropagation();
              onRequestArchiveTicket(ticket.id, ticket.title);
            }}
            className="p-1 rounded text-slate-300 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button 
            title="Delete Ticket"
            onClick={(e) => {
              e.stopPropagation();
              onRequestDeleteTicket(ticket.id, ticket.title);
            }}
            className="p-1 rounded text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <h3 className="font-extrabold text-sm text-slate-900 mb-1.5 leading-snug tracking-tight">{ticket.title}</h3>
      
      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
        {ticket.description}
      </p>
      
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ticket.tags && ticket.tags.map(tag => (
          <span key={tag} className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getDynamicTagStyle(tag)}`}>
            {tag}
          </span>
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100">
        <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${priorityDisplay.color}`}>
          {priorityDisplay.icon}
          <span>{displayPriority}</span>
        </div>
        
        {/* DYNAMIC AVATAR */}
        <div 
          className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-2 ring-white"
          title={`Created by: ${authorEmail}`}
        >
          {authorInitials}
        </div>
      </div>
    </div>
  );
}