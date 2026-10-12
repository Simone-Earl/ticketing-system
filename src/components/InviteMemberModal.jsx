// src/components/InviteMemberModal.jsx
import { useState } from 'react';
import { X, Users, Mail, UserMinus, ShieldAlert } from 'lucide-react';

export default function InviteMemberModal({ activeProject, currentUser, onClose, onInvite, onRemove }) {
  const [emailToInvite, setEmailToInvite] = useState('');

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (emailToInvite.trim() && !activeProject.members.includes(emailToInvite.trim())) {
      onInvite(emailToInvite.trim());
      setEmailToInvite('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 md:px-6 border-b border-slate-100 bg-white">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
              <Users className="h-4 w-4" />
            </div>
            Manage Team
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col bg-slate-50/50">
          
          {/* Invite Form */}
          <div className="p-5 md:px-6 border-b border-slate-100">
            <form onSubmit={handleInviteSubmit} className="flex flex-col gap-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Invite new member</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailToInvite}
                    onChange={(e) => setEmailToInvite(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-800 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!emailToInvite.trim()}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none rounded-xl transition-all shadow-md shadow-blue-500/20 whitespace-nowrap"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>

          {/* Member List */}
          <div className="p-5 md:px-6 max-h-[50vh] overflow-y-auto">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-3">Active Members ({activeProject?.members?.length || 0})</h3>
            
            <div className="flex flex-col gap-2">
              {activeProject?.members?.map((email) => {
                const isCurrentUser = email === currentUser?.email;
                
                return (
                  <div key={email} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:border-slate-300">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-sm">
                        {email.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-extrabold text-slate-900 truncate">{email}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-slate-400">Workspace Member</span>
                          {isCurrentUser && <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">(You)</span>}
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser ? (
                      <button 
                        onClick={() => onRemove(email)}
                        className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors ml-2 shrink-0 group"
                        title="Remove Member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="px-2" title="Owner/Admin">
                        <ShieldAlert className="h-4 w-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}