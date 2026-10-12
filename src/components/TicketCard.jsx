// src/components/TicketCard.jsx
import { useDraggable } from '@dnd-kit/core';
import { MoreVertical, Archive, Trash2, Clock, Calendar, Pencil } from 'lucide-react';
import { useState } from 'react';

export default function TicketCard({ ticket, onClick, onRequestArchive, onRequestDelete, onRequestEdit }) {
  const [showMenu, setShowMenu] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ...ticket }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 50,
  } : undefined;

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-amber-400';
      case 'LOW': return 'bg-blue-400';
      default: return 'bg-slate-300';
    }
  };

  const getTypeBadge = () => {
    const tags = Array.isArray(ticket.techStack) ? ticket.techStack : [];
    const typeLabel = tags.length > 0 ? tags[0] : (ticket.type || ticket.priority || 'Task');
    
    const colors = [
      'bg-blue-50 text-blue-600', 
      'bg-purple-50 text-purple-600', 
      'bg-emerald-50 text-emerald-600', 
      'bg-amber-50 text-amber-600', 
      'bg-pink-50 text-pink-600'
    ];
    const colorClass = colors[typeLabel.length % colors.length];
    
    return (
      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${colorClass}`}>
        {typeLabel}
      </span>
    );
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes} 
      {...listeners}
      onClick={() => onClick(ticket)}
      className={`relative group bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 ring-2 ring-blue-500 shadow-xl' : ''}`}
    >
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${getPriorityColor(ticket.priority)}`} />

      <div className="flex justify-between items-start pl-2">
        <h4 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-1 pr-2">
          {ticket.title}
        </h4>
        
        <div 
          className="relative" 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
              <button 
                type="button"
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  onRequestEdit(ticket); 
                  setShowMenu(false); 
                }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Pencil className="w-3 h-3 text-blue-600" /> Quick Edit
              </button>
              <button 
                type="button"
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  onRequestArchive(ticket.id, ticket.title); 
                  setShowMenu(false); 
                }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <Archive className="w-3 h-3" /> Archive
              </button>
              <button 
                type="button"
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  onRequestDelete(ticket.id, ticket.title); 
                  setShowMenu(false); 
                }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {ticket.description && (
        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 pl-2">
          {ticket.description}
        </p>
      )}

      <div className="flex items-center pl-2 pt-0.5">
        {getTypeBadge()}
      </div>

      <div className="flex items-center justify-between pl-2 pt-1 border-t border-slate-100 mt-1">
        {ticket.deadline ? (
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            <Calendar className="w-3 h-3" />
            Due {formatDeadline(ticket.deadline)}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Clock className="w-3 h-3" />
            No deadline
          </div>
        )}
        
        <div className="flex items-center">
          <div className="h-5 w-5 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[8px] font-extrabold text-white shadow-sm" title={ticket.authorEmail}>
            {ticket.authorInitials || 'U'}
          </div>
        </div>
      </div>
    </div>
  );
}