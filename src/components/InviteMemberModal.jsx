// src/components/InviteMemberModal.jsx
import { useState } from 'react';
import { UserPlus, UserMinus, X } from 'lucide-react';

export default function InviteMemberModal({ onClose, onInvite, onRemove, activeProject, currentUser }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      onInvite(email.toLowerCase().trim());
      setEmail('');
    }
  };

  // Check if the current logged-in user is the creator/owner of this project
  const isOwner = activeProject?.ownerId === currentUser.uid;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Workspace Members
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-6">
            Invite team members to collaborate on <strong>{activeProject?.name}</strong>. They will have full access to view and edit tickets.
          </p>
          
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm mb-6"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Close
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                Send Invite
              </button>
            </div>
          </form>
          
          {activeProject?.members?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Members</h4>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                {activeProject.members.map(memberEmail => (
                  <div key={memberEmail} className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                        {memberEmail.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[180px]">{memberEmail}</span>
                      {memberEmail === currentUser.email && (
                        <span className="text-xs text-slate-400 font-normal">(You)</span>
                      )}
                    </div>
                    
                    {/* Only show the Kick button if the person viewing is the owner AND the row is not their own email */}
                    {isOwner && memberEmail !== currentUser.email && (
                      <button
                        type="button"
                        onClick={() => onRemove(memberEmail)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}