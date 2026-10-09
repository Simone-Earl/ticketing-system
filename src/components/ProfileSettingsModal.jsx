// src/components/ProfileSettingsModal.jsx
import { useState } from 'react';
import { X, User, Briefcase, Globe, BriefcaseBusiness, Mail, Settings, AlertTriangle } from 'lucide-react';

export default function ProfileSettingsModal({ currentProfile, currentUser, onClose, onSave, onDeleteAccount }) {
  const [formData, setFormData] = useState({
    name: currentProfile?.name || '',
    initials: currentProfile?.initials || '',
    role: currentProfile?.role || '',
    github: currentProfile?.github || '',
    linkedin: currentProfile?.linkedin || ''
  });

  // State to manage the delete confirmation toggle
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const words = newName.trim().split(' ');
    let autoInitials = '';
    
    if (words.length > 1) {
      autoInitials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length > 0) {
      autoInitials = words[0].substring(0, 2).toUpperCase();
    }

    setFormData({
      ...formData,
      name: newName,
      initials: autoInitials || formData.initials
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Profile Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-6">
          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-sm">
                {formData.initials || 'ME'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Avatar</h4>
                <p className="text-xs text-slate-500">Auto-generated from your name.</p>
              </div>
            </div>

            <div className="space-y-4">
              {currentUser && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                </div>
                <div className="w-24">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Initials</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={formData.initials}
                    onChange={(e) => setFormData({...formData, initials: e.target.value.toUpperCase()})}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-center font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Role / Job Title</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Senior Frontend Developer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">GitHub URL</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({...formData, github: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">LinkedIn URL</label>
                  <div className="relative">
                    <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* DANGER ZONE */}
          <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-5">
            <h4 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h4>
            <p className="text-xs text-red-500 mb-4 leading-relaxed">
              Permanently delete your account and profile data. This will revoke your access to all workspaces and cannot be undone.
            </p>
            
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-lg bg-white border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
              >
                Delete Account
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={onDeleteAccount}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Yes, Delete My Account
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="rounded-lg bg-white border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 shrink-0">
          <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200">
            Cancel
          </button>
          <button form="profile-form" type="submit" className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}