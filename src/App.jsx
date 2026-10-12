// src/App.jsx
import { useState, useEffect, useMemo } from 'react'; 
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Board from './components/Board';
import TicketPage from './components/TicketPage';
import CreateProjectModal from './components/CreateProjectModal';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import ArchivePage from './components/ArchivePage';
import CalendarPage from './components/CalendarPage';
import AnalyticsPage from './components/AnalyticsPage';
import MessagesPage from './components/MessagesPage';
import TeamPage from './components/TeamPage';
import ConfirmModal from './components/ConfirmModal';
import LoginPage from './components/LoginPage';
import InviteMemberModal from './components/InviteMemberModal';
import Maintenance from './components/Maintenance';

import { 
  Kanban, ChevronDown, Globe, BriefcaseBusiness, FolderKanban, Plus, Settings, Archive, Trash2, LogOut, UserPlus,
  Compass, Calendar, BarChart3, MessageSquare, Users, TrendingUp, Bell, CheckSquare, Clock, Trash
} from 'lucide-react'; 

import { db, auth } from './firebase'; 
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, setDoc, serverTimestamp, where, arrayUnion, arrayRemove } from 'firebase/firestore'; 
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth'; 

const projectsCollectionRef = collection(db, "projects");
const ticketsCollectionRef = collection(db, "tickets");
const quickTasksCollectionRef = collection(db, "quickTasks"); 

function MainLayout({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const profileDocRef = useMemo(() => doc(db, "settings", currentUser.uid), [currentUser.uid]);

  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [quickTasks, setQuickTasks] = useState([]); 
  const [newQuickTaskTitle, setNewQuickTaskTitle] = useState(''); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [memberProfiles, setMemberProfiles] = useState({});
  
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

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Fetch real-time profiles for all project members
  useEffect(() => {
    if (!activeProject?.members?.length) return;
    
    const unsubscribes = [];
    for (let i = 0; i < activeProject.members.length; i += 10) {
      const chunk = activeProject.members.slice(i, i + 10);
      const q = query(collection(db, "settings"), where("email", "in", chunk));
      
      const unsub = onSnapshot(q, (snapshot) => {
        setMemberProfiles(prev => {
          const updated = { ...prev };
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.email) updated[data.email] = data;
          });
          return updated;
        });
      });
      unsubscribes.push(unsub);
    }
    
    return () => unsubscribes.forEach(unsub => unsub());
  }, [activeProject?.members]);

  // REAL-TIME PRESENCE TRACKER
  useEffect(() => {
    if (!currentUser?.uid) return;
    const userRef = doc(db, "settings", currentUser.uid);

    const setOnlineStatus = async (status) => {
      try {
        await setDoc(userRef, { 
          isOnline: status, 
          lastActive: serverTimestamp(),
          email: currentUser.email 
        }, { merge: true });
      } catch(e) {
        console.error("Presence error:", e);
      }
    };

    setOnlineStatus(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') setOnlineStatus(true);
      else setOnlineStatus(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => setOnlineStatus(false));

    return () => {
      setOnlineStatus(false);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.uid, currentUser?.email]);

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

  useEffect(() => {
    if (!activeProjectId) return;
    
    const q = query(quickTasksCollectionRef, where("projectId", "==", activeProjectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      tasksData.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
      });
      setQuickTasks(tasksData);
    });
    return () => unsubscribe();
  }, [activeProjectId]);

  const handleSaveProfile = async (updatedProfile) => {
    await setDoc(profileDocRef, { 
      ...updatedProfile, 
      email: currentUser.email 
    }, { merge: true });
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

  const handleAddQuickTask = async (e) => {
    e.preventDefault();
    if (!newQuickTaskTitle.trim() || !activeProjectId) return;
    try {
      await addDoc(quickTasksCollectionRef, {
        title: newQuickTaskTitle.trim(),
        completed: false,
        projectId: activeProjectId,
        createdAt: serverTimestamp(),
        authorInitials: userProfile.initials || currentUser.email.substring(0, 2).toUpperCase()
      });
      setNewQuickTaskTitle('');
    } catch (err) {
      console.error("Error adding quick task:", err);
    }
  };

  const handleToggleQuickTask = async (taskId, currentStatus) => {
    const taskRef = doc(db, "quickTasks", taskId);
    await updateDoc(taskRef, { completed: !currentStatus });
  };

  const handleDeleteQuickTask = async (taskId) => {
    const taskRef = doc(db, "quickTasks", taskId);
    await deleteDoc(taskRef);
  };

  const handleLogout = async () => {
    try {
      await setDoc(doc(db, "settings", currentUser.uid), { isOnline: false }, { merge: true });
    } catch (err) {
      console.error("Logout presence error:", err);
    }
    signOut(auth);
  };

  const projectTickets = tickets.filter(t => t.projectId === activeProjectId && !t.isArchived);
  const totalTasks = projectTickets.length;
  const inProgressTasks = projectTickets.filter(t => t.status === 'in-progress').length;
  const completedTasks = projectTickets.filter(t => t.status === 'done').length;
  const todoTasks = projectTickets.filter(t => t.status === 'backlog').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const inProgressRate = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const todoRate = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0;

  const highPriority = projectTickets.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length;
  const mediumPriority = projectTickets.filter(t => t.priority === 'MEDIUM').length;
  const lowPriority = projectTickets.filter(t => t.priority === 'LOW').length;

  const timelineEvents = useMemo(() => {
    const events = [];
    projectTickets.forEach(ticket => {
      if (ticket.createdAt) {
        const timeVal = ticket.createdAt?.toMillis ? ticket.createdAt.toMillis() : new Date(ticket.createdAt).getTime();
        const authorProfile = memberProfiles[ticket.authorEmail];
        const authorDisplayName = authorProfile?.username || authorProfile?.name || ticket.authorName || ticket.authorEmail?.split('@')[0] || 'User';

        events.push({
          id: `${ticket.id}-created`,
          rawTime: timeVal,
          timeStr: new Date(timeVal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          initials: authorProfile?.initials || ticket.authorInitials || '?',
          bg: 'bg-blue-100 text-blue-600',
          desc: `created task "${ticket.title}"`,
          author: ticket.authorEmail === currentUser.email ? 'You' : authorDisplayName,
          timeAgo: 'Recently'
        });
      }
      if (ticket.comments) {
        ticket.comments.forEach((c) => {
          const commenterProfile = memberProfiles[c.authorEmail];
          const commenterName = commenterProfile?.username || commenterProfile?.name || c.authorName || c.authorEmail?.split('@')[0] || 'User';

          events.push({
            id: `${c.id}-comment`,
            rawTime: c.timestamp,
            timeStr: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            initials: commenterProfile?.initials || c.authorInitials || '?',
            bg: 'bg-purple-100 text-purple-600',
            desc: `commented on "${ticket.title}"`,
            author: c.authorEmail === currentUser.email ? 'You' : commenterName,
            timeAgo: 'Recently'
          });
        });
      }
    });
    return events.sort((a, b) => b.rawTime - a.rawTime).slice(0, 4);
  }, [projectTickets, memberProfiles, currentUser.email]);

  const teamWorkload = useMemo(() => {
    if (!activeProject || totalTasks === 0) return [];
    
    const memberStats = {};
    
    activeProject.members.forEach(email => {
      const profile = memberProfiles[email];
      const displayName = email === currentUser.email ? 'You' : (profile?.username || profile?.name || email.split('@')[0]);
      const initials = profile?.initials || email.substring(0, 2).toUpperCase();

      memberStats[email] = { doneCount: 0, email, displayName, initials };
    });

    projectTickets.forEach(ticket => {
      if (ticket.status === 'done') {
        const solverEmail = ticket.completedBy || ticket.authorEmail;
        if (solverEmail) {
          if (!memberStats[solverEmail]) {
            const profile = memberProfiles[solverEmail];
            const displayName = solverEmail === currentUser.email ? 'You' : (profile?.username || profile?.name || solverEmail.split('@')[0]);
            const initials = ticket.completedByInitials || profile?.initials || ticket.authorInitials || solverEmail.substring(0, 2).toUpperCase();

            memberStats[solverEmail] = { doneCount: 0, email: solverEmail, displayName, initials };
          }
          memberStats[solverEmail].doneCount += 1;
        }
      }
    });

    return Object.values(memberStats)
      .map(stat => ({
        ...stat,
        percentage: completedTasks > 0 ? Math.round((stat.doneCount / completedTasks) * 100) : 0
      }))
      .sort((a, b) => b.doneCount - a.doneCount)
      .slice(0, 4); 
  }, [projectTickets, activeProject, totalTasks, completedTasks, memberProfiles, currentUser.email]);

  const upcomingTasks = useMemo(() => {
    return projectTickets
      .filter(t => t.status !== 'done' && (t.priority === 'URGENT' || t.priority === 'HIGH'))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      })
      .slice(0, 3);
  }, [projectTickets]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-white md:flex border-r border-slate-200/80">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Settings className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">Workspace</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1.5">
          <button onClick={() => navigate('/')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${location.pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}>
            <Compass className="h-4.5 w-4.5" /> Overview
          </button>

          <div>
            <div className="flex items-center justify-between px-3.5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Projects</span>
              <button onClick={() => setIsCreatingProject(true)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            
            {projects.length === 0 && (
              <p className="text-xs text-slate-400 italic px-3.5 py-1">No projects found.</p>
            )}

            {projects.map(project => (
              <div
                key={project.id}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all group/proj ${
                  activeProjectId === project.id && !['/archive', '/calendar', '/analytics', '/messages', '/team'].includes(location.pathname)
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <button
                  onClick={() => { setActiveProjectId(project.id); navigate('/'); }}
                  className="flex items-center gap-3 truncate flex-1 text-left"
                >
                  <FolderKanban className="h-4 w-4 shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDeleteProject(project.id, project.name);
                  }}
                  className="p-1 text-slate-300 hover:text-red-500 rounded opacity-0 group-hover/proj:opacity-100 transition-opacity"
                  title="Delete Workspace"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-100 my-2" />

          <button onClick={() => navigate('/')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all ${location.pathname === '/' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Kanban className="h-4.5 w-4.5" /> Tasks (Kanban)
          </button>
          
          <button onClick={() => navigate('/calendar')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${location.pathname === '/calendar' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Calendar className="h-4.5 w-4.5" /> Calendar
          </button>
          
          <button onClick={() => navigate('/analytics')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${location.pathname === '/analytics' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <BarChart3 className="h-4.5 w-4.5" /> Analytics
          </button>

          <button onClick={() => navigate('/archive')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all ${location.pathname === '/archive' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Archive className="h-4.5 w-4.5" /> Documents
          </button>

          <button onClick={() => navigate('/messages')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${location.pathname === '/messages' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <MessageSquare className="h-4.5 w-4.5" /> Messages
          </button>

          <button onClick={() => navigate('/team')} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${location.pathname === '/team' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Users className="h-4.5 w-4.5" /> Team
          </button>

          <button onClick={() => { setIsEditingProfile(true); }} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <Settings className="h-4.5 w-4.5" /> Settings
          </button>
        </div>

        {/* User Profile dropdown */}
        <div className="border-t border-slate-100 p-4 mt-auto">
          <div onClick={() => setShowProfileMenu(!showProfileMenu)} className="group flex cursor-pointer items-center justify-between rounded-xl p-1.5 hover:bg-slate-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shadow-sm">{userProfile.initials}</div>
              <div className="truncate">
                <p className="text-xs font-extrabold text-slate-900 leading-none mb-0.5">{userProfile.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 truncate max-w-[100px]">{userProfile.role}</p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </div>

          {showProfileMenu && (
            <div className="absolute left-4 bottom-16 z-50 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button onClick={() => { setIsEditingProfile(true); setShowProfileMenu(false); }} className="flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs text-slate-700 font-bold hover:bg-slate-50 w-full text-left transition-colors">
                <Settings className="h-4 w-4" /> Edit Profile
              </button>
              <a href={userProfile.github} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-50 w-full"><Globe className="h-4 w-4" /> GitHub</a>
              <a href={userProfile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-50 w-full"><BriefcaseBusiness className="h-4 w-4" /> LinkedIn</a>
              <div className="h-px bg-slate-100 my-1" />
              <button onClick={handleLogout} className="flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs text-red-600 font-bold hover:bg-red-50 w-full text-left transition-colors">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ROUTES */}
      <Routes>
        
        {/* DASHBOARD ROUTE */}
        <Route path="/" element={
          <div className="flex-1 flex flex-col md:pl-60">
            <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 px-6 py-3.5 backdrop-blur-md">
              <div className="mx-auto flex max-w-7xl items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm md:hidden">
                    <Kanban className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Task</h1>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">Manage and track your team's work</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative hidden md:block w-64 lg:w-72">
                    <input 
                      type="text" 
                      placeholder="Search cards..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white px-4 py-2 text-xs border border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-inner" 
                    />
                  </div>

                  {activeProject && (
                    <button onClick={() => setIsInviting(true)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/15 hover:bg-blue-700 transition-all">
                      <UserPlus className="h-4 w-4" /> Invite Member
                    </button>
                  )}

                  <button className="p-2 text-slate-400 hover:text-slate-600 relative">
                    <Bell className="h-4.5 w-4.5" />
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-500 rounded-full" />
                  </button>
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Total Task</span>
                    <span className="text-3xl font-extrabold text-slate-900 mt-1">{totalTasks}</span>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> active in this workspace
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <CheckSquare className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">In Progress</span>
                    <span className="text-3xl font-extrabold text-slate-900 mt-1">{inProgressTasks}</span>
                    <span className="text-[10px] text-amber-500 font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> actively moving
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Completed</span>
                    <span className="text-3xl font-extrabold text-slate-900 mt-1">{completedTasks}</span>
                    <span className="text-[10px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> ready to close
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Archive className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mb-1">Task Completion</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <span className="text-[10px] font-bold text-slate-600">Completed <b className="text-slate-900">{completionRate}%</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-[10px] font-bold text-slate-600">In Progress <b className="text-slate-900">{inProgressRate}%</b></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold text-slate-600">To Do <b className="text-slate-900">{todoRate}%</b></span>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-center h-16 w-16 animate-in zoom-in-75 duration-200">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="5.5" fill="transparent" />
                      <circle cx="32" cy="32" r="26" stroke="#2563eb" strokeWidth="6" fill="transparent" strokeDasharray="163" strokeDashoffset={163 - (163 * completionRate) / 100} />
                    </svg>
                    <span className="absolute text-xs font-extrabold text-slate-900">{completionRate}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <Board 
                    allTickets={tickets} 
                    updateTicketInDB={updateTicketInDB} 
                    addTicketToDB={addTicketToDB}
                    deleteTicketFromDB={deleteTicketFromDB}
                    activeProjectId={activeProjectId} 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    currentUser={currentUser}
                    userProfile={userProfile} 
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-extrabold text-slate-900">Task Timeline (Recent Activity)</h3>
                      </div>
                      <div className="flex flex-col gap-4">
                        {timelineEvents.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-4">No recent activity on this workspace.</p>
                        ) : timelineEvents.map((ev) => (
                          <div key={ev.id} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                            <span className="text-[10px] font-bold text-slate-400 mt-0.5 shrink-0">{ev.timeStr}</span>
                            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold shrink-0 mt-0.5 ${ev.bg}`}>{ev.initials}</div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800 leading-tight">
                                {ev.author} <span className="font-medium text-slate-500">{ev.desc}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{ev.timeAgo}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-extrabold text-slate-900">Team Workload</h3>
                        <span className="text-[10px] font-bold text-slate-400">Completed</span>
                      </div>
                      <div className="flex flex-col gap-3.5">
                        
                        {teamWorkload.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">No completed tasks yet.</p>
                        ) : (
                          teamWorkload.map((member, idx) => {
                            const isMe = member.email === currentUser.email;
                            const bgColors = ['bg-blue-600', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500'];
                            const activeBg = isMe ? 'bg-blue-600' : bgColors[(idx + 1) % bgColors.length];

                            return (
                              <div key={member.email} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`h-6 w-6 rounded-full text-white flex items-center justify-center text-[9px] font-bold ${activeBg}`}>
                                    {member.initials}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 truncate max-w-[90px]" title={member.displayName}>
                                    {member.displayName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 w-1/2">
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-1.5 rounded-full ${activeBg}`} style={{ width: `${member.percentage}%` }} />
                                  </div>
                                  <span className="text-xs font-extrabold text-slate-900 w-8 text-right">{member.percentage}%</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-extrabold text-slate-900">Today's Tasks</h3>
                    </div>

                    <form onSubmit={handleAddQuickTask} className="mb-4 flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="+ Create rapid checklist task..."
                        value={newQuickTaskTitle}
                        onChange={(e) => setNewQuickTaskTitle(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200/80 hover:bg-slate-50 focus:bg-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-slate-700"
                      />
                      <button type="submit" className="p-2 bg-blue-600 text-white rounded-xl font-extrabold transition hover:bg-blue-700">
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </form>

                    <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                      {quickTasks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-4 text-center">Your checklist is clear.</p>
                      ) : quickTasks.map((t) => (
                        <div key={t.id} className="flex items-start justify-between gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer group/check">
                          <div className="flex items-start gap-3 flex-1">
                            <input 
                              type="checkbox" 
                              checked={t.completed} 
                              onChange={() => handleToggleQuickTask(t.id, t.completed)}
                              className="mt-1 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" 
                            />
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${t.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title}</p>
                              <span className="text-[9px] text-slate-400 font-extrabold mt-0.5 inline-block">Added recently</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteQuickTask(t.id)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover/check:opacity-100 transition-opacity"
                            title="Delete Task"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-extrabold text-slate-900">Urgent Action Items</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {upcomingTasks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-200 rounded-xl">No urgent tasks pending.</p>
                      ) : (
                        upcomingTasks.map(task => (
                          <div 
                            key={task.id} 
                            onClick={() => navigate(`/ticket/${task.id}`)}
                            className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden pr-2">
                              <Calendar className="h-4.5 w-4.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                              <div className="flex flex-col truncate">
                                <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {task.status ? task.status.replace('-', ' ').toUpperCase() : 'BACKLOG'}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                              task.priority === 'URGENT' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col animate-in fade-in-50 duration-200">
                    <h3 className="text-sm font-extrabold text-slate-900 mb-3">Priority Overview</h3>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                      <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-red-500 uppercase">High/Urgent</span>
                        <p className="text-xl font-extrabold text-red-700 mt-1">{highPriority}</p>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">Medium</span>
                        <p className="text-xl font-extrabold text-amber-700 mt-1">{mediumPriority}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Low</span>
                        <p className="text-xl font-extrabold text-slate-600 mt-1">{lowPriority}</p>
                      </div>
                    </div>
                    
                    <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
                      <div className="bg-red-500" style={{ width: `${totalTasks > 0 ? (highPriority / totalTasks) * 100 : 0}%` }} />
                      <div className="bg-amber-500" style={{ width: `${totalTasks > 0 ? (mediumPriority / totalTasks) * 100 : 0}%` }} />
                      <div className="bg-slate-300" style={{ width: `${totalTasks > 0 ? (lowPriority / totalTasks) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold mt-2">Total: {totalTasks} Tasks</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        } />

        {/* TICKET PAGE ROUTE */}
        <Route path="/ticket/:id" element={
          <TicketPage 
            tickets={tickets} 
            updateTicketInDB={updateTicketInDB} 
            deleteTicketFromDB={deleteTicketFromDB} 
            currentUser={currentUser} 
            userProfile={userProfile}
            memberProfiles={memberProfiles} 
          />
        } />

        {/* ARCHIVE PAGE ROUTE */}
        <Route path="/archive" element={
          <div className="flex-1 flex flex-col md:pl-60">
            <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 px-6 py-3.5 backdrop-blur-md">
              <div className="mx-auto flex max-w-7xl items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-sm md:hidden">
                    <Archive className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Archive</h1>
                    <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">View and restore old tasks</p>
                  </div>
                </div>
              </div>
            </header>
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
              <ArchivePage 
                allTickets={tickets} 
                updateTicketInDB={updateTicketInDB} 
                deleteTicketFromDB={deleteTicketFromDB} 
                activeProjectId={activeProjectId} 
              />
            </main>
          </div>
        } />

        {/* CALENDAR PAGE ROUTE */}
        <Route path="/calendar" element={
          <CalendarPage 
            tickets={tickets} 
            activeProjectId={activeProjectId} 
          />
        } />

        {/* ANALYTICS PAGE ROUTE */}
        <Route path="/analytics" element={
          <AnalyticsPage 
            tickets={tickets} 
            activeProject={activeProject} 
          />
        } />

        {/* MESSAGES PAGE ROUTE */}
        <Route path="/messages" element={
          <MessagesPage 
            activeProject={activeProject} 
            currentUser={currentUser} 
            userProfile={userProfile} 
          />
        } />

        {/* TEAM PAGE ROUTE */}
        <Route path="/team" element={
          <TeamPage 
            activeProject={activeProject} 
            currentUser={currentUser} 
            onOpenInviteModal={() => setIsInviting(true)} 
            onRequestRemove={requestRemoveMember} 
          />
        } />

      </Routes>

      {/* MODALS */}
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

  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isMaintenanceMode) {
    return <Maintenance />;
  }

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