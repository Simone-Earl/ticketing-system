// src/components/AnalyticsPage.jsx
import { useNavigate } from 'react-router-dom';
import { 
  Compass, ChevronRight, BarChart3, TrendingUp, 
  CheckSquare, Clock, AlertTriangle, Users, Target, Zap
} from 'lucide-react';

export default function AnalyticsPage({ tickets, activeProject }) {
  const navigate = useNavigate();

  // Filter for active workspace tickets (ignore archived)
  const projectTickets = tickets.filter(t => t.projectId === activeProject?.id && !t.isArchived);
  const totalTasks = projectTickets.length;

  // Status metrics
  const doneTasks = projectTickets.filter(t => t.status === 'done').length;
  const inReviewTasks = projectTickets.filter(t => t.status === 'in-review').length;
  const inProgressTasks = projectTickets.filter(t => t.status === 'in-progress').length;
  const todoTasks = projectTickets.filter(t => t.status === 'backlog' || !t.status).length;
  
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Priority metrics
  const urgentTasks = projectTickets.filter(t => t.priority === 'URGENT').length;
  const highTasks = projectTickets.filter(t => t.priority === 'HIGH').length;
  const mediumTasks = projectTickets.filter(t => t.priority === 'MEDIUM').length;
  const lowTasks = projectTickets.filter(t => t.priority === 'LOW').length;

  // Team Workload Data
  const memberStats = {};
  if (activeProject?.members) {
    activeProject.members.forEach(email => {
      memberStats[email] = { email, total: 0, done: 0, initials: email.substring(0,2).toUpperCase() };
    });
  }

  projectTickets.forEach(ticket => {
    if (ticket.authorEmail && memberStats[ticket.authorEmail]) {
      memberStats[ticket.authorEmail].total += 1;
      if (ticket.authorInitials) memberStats[ticket.authorEmail].initials = ticket.authorInitials;
      if (ticket.status === 'done') memberStats[ticket.authorEmail].done += 1;
    }
  });

  const teamData = Object.values(memberStats).sort((a, b) => b.total - a.total);

  return (
    <div className="flex-1 flex flex-col md:pl-60 min-h-screen bg-slate-50">
      
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> Workspace
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-slate-800 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Workspace Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">High-level metrics and performance insights for your team.</p>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Total Tasks</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{totalTasks}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="h-6 w-6" />
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Completion Rate</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{completionRate}%</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Urgent & High Priority</p>
              <h3 className="text-3xl font-extrabold text-red-600">{urgentTasks + highTasks}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Status Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <BarChart3 className="h-4.5 w-4.5 text-slate-400" /> Status Distribution
            </h3>
            
            <div className="flex flex-col gap-5">
              {[
                { label: 'Done', count: doneTasks, color: 'bg-emerald-500', icon: <CheckSquare className="h-4 w-4" /> },
                { label: 'In Review', count: inReviewTasks, color: 'bg-purple-500', icon: <AlertTriangle className="h-4 w-4" /> },
                { label: 'In Progress', count: inProgressTasks, color: 'bg-amber-500', icon: <Clock className="h-4 w-4" /> },
                { label: 'To Do', count: todoTasks, color: 'bg-slate-300', icon: <Compass className="h-4 w-4" /> }
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-500">{item.icon} {item.label}</span>
                    <span>{item.count} <span className="text-slate-400 font-medium">({totalTasks ? Math.round((item.count/totalTasks)*100) : 0}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${totalTasks ? (item.count / totalTasks) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-slate-400" /> Priority Breakdown
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-500 mb-1">Urgent</span>
                <span className="text-3xl font-extrabold text-red-600">{urgentTasks}</span>
              </div>
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-500 mb-1">High</span>
                <span className="text-3xl font-extrabold text-orange-600">{highTasks}</span>
              </div>
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 mb-1">Medium</span>
                <span className="text-3xl font-extrabold text-amber-600">{mediumTasks}</span>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 mb-1">Low</span>
                <span className="text-3xl font-extrabold text-blue-600">{lowTasks}</span>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-slate-400" /> Team Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamData.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No team data available.</p>
              ) : (
                teamData.map((member, i) => {
                  const progress = member.total > 0 ? Math.round((member.done / member.total) * 100) : 0;
                  const bgColors = ['bg-blue-600', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500'];
                  const avatarColor = bgColors[i % bgColors.length];

                  return (
                    <div key={member.email} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${avatarColor}`}>
                        {member.initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-bold text-slate-800">{member.email.split('@')[0]}</span>
                          <span className="text-[10px] font-extrabold text-slate-500">{member.done} / {member.total} Done</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${avatarColor} rounded-full`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}