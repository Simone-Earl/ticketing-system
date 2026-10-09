// src/App.jsx
import { useState, useEffect, useMemo } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Board from './components/Board';
import TicketPage from './components/TicketPage';
import CreateProjectModal from './components/CreateProjectModal';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import ArchivePage from './components/ArchivePage';
import ConfirmModal from './components/ConfirmModal';
import LoginPage from './components/LoginPage';
import InviteMemberModal from './components/InviteMemberModal'; 
import { Kanban, ChevronDown, Globe, BriefcaseBusiness, LayoutDashboard, FolderKanban, Plus, Settings, Archive, Trash2, LogOut, UserPlus } from 'lucide-react'; 

import { db, auth } from './firebase'; 
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, setDoc, serverTimestamp, where, arrayUnion, arrayRemove } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth'; 

const projectsCollectionRef = collection(db, "projects");
const ticketsCollectionRef = collection(db, "tickets");

function MainLayout({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const profileDocRef = useMemo(() => doc(db, "settings", currentUser.uid), [currentUser.uid]);

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [tickets, setTickets] = useState([]);
  
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectConfirmDialog, setProjectConfirmDialog] = useState({ isOpen: false, projectId: '', projectName: '' });
  
  const [memberConfirmDialog, setMemberConfirmDialog] = useState({ isOpen: false, memberEmail: '' });
  const [isInviting, setIsInviting] = useState(false);

  const [userProfile, setUserProfile] = useState({
    name: 'Your Name', username: 'user', initials: 'ME', role: 'Full-Stack Dev',
    github: 'https://github.com', linkedin: 'https://linkedin.com'
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) setUserProfile(docSnap.data());
    });
    return () => unsubscribe();
  }, [profileDocRef]); 

  useEffect(() => {
    const q = query(projectsCollectionRef, where("members", "array-contains", currentUser.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      projectsData.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      
      setProjects(projectsData);
      if (projectsData.length > 0 && !activeProjectId) setActiveProjectId(projectsData[0].id);
    });
    return () => unsubscribe();
  }, [activeProjectId, currentUser.email]); 

  useEffect(() => {
    if (!activeProjectId) return;
    
    const q = query(ticketsCollectionRef, where("projectId", "==", activeProjectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setTickets(ticketsData);
    });
    return () => unsubscribe();
  }, [activeProjectId]); 

  const handleSaveProfile = async (updatedProfile) => {
    await setDoc(profileDocRef, updatedProfile);
    setIsEditingProfile(false);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteDoc(profileDocRef);
      await deleteUser(currentUser);
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, please log out and log back in before deleting your account.");
      } else {
        alert("Failed to delete account: " + error.message);
      }
    }
  };

  const handleAddProject = async (projectName) => {
    setIsCreatingProject(false);
    const newProjectRef = await addDoc(projectsCollectionRef, {
      name: projectName,
      createdAt: serverTimestamp(),
      ownerId: currentUser.uid, 
      members: [currentUser.email] 
    });
    
    setActiveProjectId(newProjectRef.id);
    navigate('/');
  };

  const handleInviteMember = async (emailToInvite) => {
    const projectRef = doc(db, "projects", activeProjectId);
    await updateDoc(projectRef, {
      members: arrayUnion(emailToInvite)
    });
    setIsInviting(false);
  };

  const requestRemoveMember = (email) => {
    setMemberConfirmDialog({ isOpen: true, memberEmail: email });
  };

  const executeRemoveMember = async () => {
    const projectRef = doc(db, "projects", activeProjectId);
    await updateDoc(projectRef, {
      members: arrayRemove(memberConfirmDialog.memberEmail)
    });
    setMemberConfirmDialog({ isOpen: false, memberEmail: '' }); 
  };

  const requestDeleteProject = (projectId, projectName) => {
    setProjectConfirmDialog({ isOpen: true, projectId, projectName });
  };

  const executeDeleteProject = async () => {
    const idToDelete = projectConfirmDialog.projectId;
    await deleteDoc(doc(db, "projects", idToDelete));
    setProjectConfirmDialog({ isOpen: false, projectId: '', projectName: '' });
    if (activeProjectId === idToDelete) {
      const remainingProjects = projects.filter(p => p.id !== idToDelete);
      setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
      navigate('/');
    }
  };

  const addTicketToDB = async (newTicket) => {
    if (!activeProjectId) return;
    await addDoc(ticketsCollectionRef, {
      ...newTicket,
      projectId: activeProjectId,
      isArchived: false,
      userId: currentUser.uid,
      authorEmail: currentUser.email,
      authorName: userProfile.username || userProfile.name || currentUser.email.split('@')[0],
      authorInitials: userProfile.initials || currentUser.email.substring(0, 2).toUpperCase(),
      createdAt: serverTimestamp()
    });
  };

  const updateTicketInDB = async (ticketId, updatedFields) => {
    const ticketDoc = doc(db, "tickets", ticketId);
    await updateDoc(ticketDoc, updatedFields);
  };

  const deleteTicketFromDB = async (ticketId) => {
    const ticketDoc = doc(db, "tickets", ticketId);
    await deleteDoc(ticketDoc);
  };

  const handleLogout = () => signOut(auth);

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 md:flex shadow-2xl border-r border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="font-bold text-white tracking-wide">Workspaces</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Your Projects</p>
          
          {projects.length === 0 && (
            <p className="text-sm text-slate-500 italic px-2">No projects yet.</p>
          )}

          {projects.map(project => (
            <div key={project.id} className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveProjectId(project.id); navigate('/'); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeProjectId === project.id && location.pathname !== '/archive'
                    ? 'bg-blue-500/10 text-blue-400' 
                    : activeProjectId === project.id ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FolderKanban className="h-4 w-4" />
                <span className="truncate">{project.name}</span>
              </button>

              {activeProjectId === project.id && (
                <div className="ml-5 mt-1 flex flex-col gap-1 border-l-2 border-slate-800 pl-3">
                  <button
                    onClick={() => navigate('/')}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                      location.pathname === '/' || location.pathname.includes('/ticket/') ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Kanban className="h-3.5 w-3.5" /> Board View
                  </button>
                  <button
                    onClick={() => navigate('/archive')}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                      location.pathname === '/archive' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 p-4">
          <button onClick={() => setIsCreatingProject(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800">
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm md:hidden">
                <Kanban className="h-5 w-5 text-white" />
              </div>
              <div>
                <Link to="/">
                  <h1 className="text-lg font-extrabold tracking-tight leading-none text-slate-900 transition-colors hover:text-blue-600">
                    {activeProject ? activeProject.name : 'Welcome'}
                  </h1>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-5 md:gap-6">
              <div className="relative border-l border-slate-200 pl-5 md:pl-6">
                <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="group flex cursor-pointer items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-blue-600">{userProfile.initials}</div>
                  <div className="hidden text-sm md:block">
                    <p className="mb-1 font-bold leading-none text-slate-700 transition-colors group-hover:text-blue-600">{userProfile.name}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{userProfile.role}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </div>

                {showProfileMenu && (
                  <div className="absolute right-0 z-50 mt-3 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                    <div className="flex flex-col p-2 border-b border-slate-100 mb-1">
                      <button 
                        onClick={() => { setIsEditingProfile(true); setShowProfileMenu(false); }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 font-bold hover:bg-blue-50 hover:text-blue-700 w-full text-left transition-colors"
                      >
                        <Settings className="h-4 w-4" /> Edit Profile
                      </button>
                    </div>
                    <div className="flex flex-col p-2 border-b border-slate-100 mb-1">
                      <a href={userProfile.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><Globe className="h-4 w-4" /> GitHub</a>
                      <a href={userProfile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><BriefcaseBusiness className="h-4 w-4" /> LinkedIn</a>
                    </div>
                    <div className="flex flex-col p-2">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 font-bold hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route 
              path="/" 
              element={
                !activeProject ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200/50 mb-6 border border-slate-200">
                      <FolderKanban className="h-10 w-10 text-slate-400" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Welcome to your Workspace</h2>
                    <p className="text-slate-500 max-w-md mb-8 text-lg">You don't have any projects set up yet. Create your first project workspace to start organizing your tickets and tasks.</p>
                    <button 
                      onClick={() => setIsCreatingProject(true)}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 hover:shadow-md"
                    >
                      <Plus className="h-5 w-5" /> Create New Project
                    </button>
                  </div>
                ) : (
                  <>
                    <section className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-white to-blue-50/50 p-6 shadow-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Project Overview</p>
                          
                          <div className="flex items-center gap-3 mt-1">
                            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{activeProject.name}</h2>
                            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 shadow-sm ml-2">
                              <button 
                                onClick={() => setIsInviting(true)}
                                className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 rounded-md"
                              >
                                <UserPlus className="h-4 w-4" /> Invite
                              </button>
                              <div className="w-px h-4 bg-slate-200 mx-1"></div>
                              <button 
                                onClick={() => requestDeleteProject(activeProject.id, activeProject.name)}
                                className="flex items-center justify-center rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete Workspace"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                    <Board 
                      allTickets={tickets} 
                      updateTicketInDB={updateTicketInDB} 
                      addTicketToDB={addTicketToDB}
                      deleteTicketFromDB={deleteTicketFromDB}
                      activeProjectId={activeProjectId} 
                    />
                  </>
                )
              } 
            />
            <Route path="/ticket/:id" element={<TicketPage tickets={tickets} updateTicketInDB={updateTicketInDB} currentUser={currentUser} userProfile={userProfile} />} />
            <Route path="/archive" element={<ArchivePage allTickets={tickets} updateTicketInDB={updateTicketInDB} deleteTicketFromDB={deleteTicketFromDB} activeProjectId={activeProjectId} />} />
          </Routes>
        </main>
      </div>

      {isCreatingProject && <CreateProjectModal onClose={() => setIsCreatingProject(false)} onSave={handleAddProject} />}
      
      {isEditingProfile && (
        <ProfileSettingsModal 
          currentUser={currentUser} 
          currentProfile={userProfile} 
          onClose={() => setIsEditingProfile(false)} 
          onSave={handleSaveProfile} 
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      
      {isInviting && (
        <InviteMemberModal 
          activeProject={activeProject}
          currentUser={currentUser}
          onClose={() => setIsInviting(false)}
          onInvite={handleInviteMember}
          onRemove={requestRemoveMember} 
        />
      )}

      <ConfirmModal 
        isOpen={projectConfirmDialog.isOpen} 
        type="delete" 
        ticketTitle={projectConfirmDialog.projectName} 
        itemType="Workspace"
        onClose={() => setProjectConfirmDialog({ isOpen: false, projectId: '', projectName: '' })} 
        onConfirm={executeDeleteProject} 
      />

      <ConfirmModal 
        isOpen={memberConfirmDialog.isOpen} 
        type="remove" 
        ticketTitle={memberConfirmDialog.memberEmail} 
        itemType="Member"
        onClose={() => setMemberConfirmDialog({ isOpen: false, memberEmail: '' })} 
        onConfirm={executeRemoveMember} 
      />
    </div>
  );
}

function App() { 
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-400 font-bold tracking-widest uppercase">Loading Workspace...</div>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  return (
    <Router>
      <MainLayout currentUser={currentUser} />
    </Router>
  );
}

export default App;