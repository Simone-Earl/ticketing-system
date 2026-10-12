// src/components/CalendarPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage({ tickets, activeProjectId }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const projectTickets = tickets.filter(t => t.projectId === activeProjectId && !t.isArchived);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Map tickets by deadline date (fallback to createdAt if no deadline)
  const getTicketsForDay = (day) => {
    return projectTickets.filter(ticket => {
      let targetDate;
      
      if (ticket.deadline) {
        const [year, month, d] = ticket.deadline.split('-');
        targetDate = new Date(year, month - 1, d);
      } else if (ticket.createdAt) {
        const millis = ticket.createdAt.toMillis ? ticket.createdAt.toMillis() : new Date(ticket.createdAt).getTime();
        targetDate = new Date(millis);
      } else {
        return false;
      }

      return (
        targetDate.getDate() === day &&
        targetDate.getMonth() === currentMonth &&
        targetDate.getFullYear() === currentYear
      );
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-amber-400';
      case 'LOW': return 'bg-blue-400';
      default: return 'bg-slate-300';
    }
  };

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => (
    <div key={`blank-${i}`} className="min-h-[120px] bg-slate-50/50 border-r border-b border-slate-100 p-2"></div>
  ));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTickets = getTicketsForDay(day);
    const isToday = 
      day === new Date().getDate() && 
      currentMonth === new Date().getMonth() && 
      currentYear === new Date().getFullYear();

    return (
      <div key={`day-${day}`} className={`min-h-[120px] bg-white border-r border-b border-slate-100 p-2 hover:bg-slate-50 transition-colors group ${isToday ? 'bg-blue-50/30' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-extrabold flex items-center justify-center h-7 w-7 rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 group-hover:text-slate-900'}`}>
            {day}
          </span>
          {dayTickets.length > 0 && (
            <span className="text-[9px] font-bold text-slate-400">{dayTickets.length} tasks</span>
          )}
        </div>
        
        <div className="flex flex-col gap-1.5 h-[80px] overflow-y-auto no-scrollbar">
          {dayTickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => navigate(`/ticket/${ticket.id}`)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300 transition-colors group/ticket relative overflow-hidden"
              title={ticket.deadline ? `Deadline: ${ticket.deadline}` : 'Created Date'}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${getPriorityColor(ticket.priority)}`} />
              <span className="text-[10px] font-bold text-slate-700 truncate pl-1">{ticket.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  });

  return (
    <div className="flex-1 flex flex-col md:pl-60 min-h-screen bg-slate-50">
      
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> Workspace
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-slate-800 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
              <CalendarIcon className="h-3.5 w-3.5" /> Calendar
            </span>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={handleToday} className="px-3 py-1.5 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Today
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              {monthNames[currentMonth]} <span className="text-slate-400 font-medium">{currentYear}</span>
            </h1>
            
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button onClick={handlePrevMonth} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100 bg-white">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-r border-slate-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-slate-50">
            {blanks}
            {days}
          </div>

        </div>

      </main>
    </div>
  );
}