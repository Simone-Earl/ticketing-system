// src/components/TeamPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Compass, ChevronRight, Users, UserPlus, ShieldAlert, 
  Mail, Globe, BriefcaseBusiness, UserMinus 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function TeamPage({ activeProject, currentUser, onOpenInviteModal, onRequestRemove }) {
  const navigate = useNavigate();
  const [memberProfiles, setMemberProfiles] = useState({});

  // Fetch real-time profiles for all project members
  useEffect(() => {
    if (!activeProject?.members?.length) return;
    
    const unsubscribes = [];
    
    // Firebase 'in' queries support max 10 items. We chunk the members array to be safe.
    for (let i = 0; i < activeProject.members.length; i += 10) {
      const chunk = activeProject.members.slice(i, i + 10);
      const q = query(collection(db, "settings"), where("email", "in", chunk));
      
      const unsub = onSnapshot(q, (snapshot) => {
        setMemberProfiles(prev => {
          const updated = { ...prev };
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.email) updated[data.email] = data;
          });
          return updated;
        });
      });
      unsubscribes.push(unsub);
    }
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [activeProject?.members]);

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
              <Users className="h-3.5 w-3.5" /> Team Directory
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300 flex-1 flex flex-col">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Workspace Members</h1>
            <p className="text-xs text-slate-500 mt-1">Manage access and view profiles of everyone in this project.</p>
          </div>
          <button 
            onClick={onOpenInviteModal}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/15 hover:bg-blue-700 transition-all whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" /> Add Member
          </button>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeProject?.members?.map((email, idx) => {
            const isMe = email === currentUser?.email;
            const profile = memberProfiles[email];
            
            const bgColors = ['bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
            const avatarColor = isMe ? 'bg-blue-600' : bgColors[idx % bgColors.length];

            const isOnline = isMe ? true : (profile?.isOnline === true);
            const displayName = isMe ? 'You' : (profile?.username || profile?.name || email.split('@')[0]);
            const displayInitials = profile?.initials || email.substring(0, 2).toUpperCase();
            const role = profile?.role || 'Workspace Member';

            return (
              <div key={email} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center text-center relative group">
                
                {/* Remove Member Button */}
                {!isMe && (
                  <button 
                    onClick={() => onRequestRemove(email)}
                    className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Remove from Workspace"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
                {isMe && (
                  <div className="absolute top-3 right-3 p-1.5 text-blue-300" title="Workspace Owner">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                )}

                {/* Avatar & Online Status */}
                <div className={`relative h-20 w-20 rounded-full flex items-center justify-center text-xl font-extrabold text-white shadow-sm mb-4 ${avatarColor}`}>
                  {displayInitials}
                  <div className={`absolute bottom-0 right-1 h-4 w-4 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`} title={isOnline ? 'Online' : 'Offline'}></div>
                </div>

                {/* Name & Role */}
                <h3 className="text-sm font-extrabold text-slate-900 w-full truncate px-2" title={displayName}>
                  {displayName}
                </h3>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mt-1 mb-4 truncate w-full px-2" title={role}>
                  {role}
                </p>

                {/* Email */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 w-full justify-center bg-slate-50 py-1.5 rounded-lg border border-slate-100">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate pr-2">{email}</span>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-3 mt-auto">
                  {profile?.github ? (
                    <a href={profile.github} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors" title="GitHub">
                      <Globe className="h-4 w-4" />
                    </a>
                  ) : (
                    <div className="p-2 text-slate-200"><Globe className="h-4 w-4" /></div>
                  )}
                  
                  {profile?.linkedin ? (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="LinkedIn">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </a>
                  ) : (
                    <div className="p-2 text-slate-200"><BriefcaseBusiness className="h-4 w-4" /></div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}