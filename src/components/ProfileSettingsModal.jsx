// src/components/ProfileSettingsModal.jsx
import { useState } from 'react';
import { X, User, Globe, BriefcaseBusiness, AlertTriangle } from 'lucide-react';

export default function ProfileSettingsModal({ currentProfile, onClose, onSave, onDeleteAccount }) {
  const [profile, setProfile] = useState({
    name: currentProfile?.name || '',
    username: currentProfile?.username || '',
    initials: currentProfile?.initials || '',
    role: currentProfile?.role || '',
    github: currentProfile?.github || '',
    linkedin: currentProfile?.linkedin || ''
  });

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(profile);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 md:px-6 border-b border-slate-100 bg-white">
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
            <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
              <User className="h-4 w-4" />
            </div>
            Profile Settings
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto bg-slate-50/50">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
              <input 
                required
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Display Username</label>
              <input 
                required
                type="text" 
                value={profile.username}
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-800 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Job Role / Title</label>
              <input 
                type="text" 
                value={profile.role}
                onChange={(e) => setProfile({...profile, role: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-800 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Avatar Initials (Max 2)</label>
              <input 
                required
                type="text" 
                maxLength={2}
                value={profile.initials}
                onChange={(e) => setProfile({...profile, initials: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-800 transition-all text-center"
              />
            </div>
          </div>

          <div className="h-px w-full bg-slate-200/60 my-2" />

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5"/> GitHub URL</label>
            <input 
              type="url" 
              value={profile.github}
              onChange={(e) => setProfile({...profile, github: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5"/> LinkedIn URL</label>
            <input 
              type="url" 
              value={profile.linkedin}
              onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs transition-all"
            />
          </div>

          <div className="pt-4 mt-2 flex justify-between items-center border-t border-slate-200/60">
            {confirmDelete ? (
              <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                <span className="text-[10px] font-bold text-red-600 px-2">Are you sure?</span>
                <button type="button" onClick={() => setConfirmDelete(false)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-2">Cancel</button>
                <button type="button" onClick={onDeleteAccount} className="text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg">Delete</button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-[10px] font-extrabold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Delete Account
              </button>
            )}

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}