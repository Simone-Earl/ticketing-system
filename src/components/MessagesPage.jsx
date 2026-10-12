// src/components/MessagesPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ChevronRight, MessageSquare, Send, Hash, Users } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function MessagesPage({ activeProject, currentUser, userProfile }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [memberProfiles, setMemberProfiles] = useState({});
  const messagesEndRef = useRef(null);

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

  // Fetch real-time messages for the active project
  useEffect(() => {
    if (!activeProject?.id) return;
    
    const q = query(collection(db, "messages"), where("projectId", "==", activeProject.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory to bypass the need for a composite Firebase index
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [activeProject?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeProject?.id) return;

    const text = newMessage.trim();
    setNewMessage(''); // Clear input instantly for snappy feel

    await addDoc(collection(db, "messages"), {
      projectId: activeProject.id,
      text: text,
      authorEmail: currentUser.email,
      authorName: userProfile?.username || userProfile?.name || currentUser.email.split('@')[0],
      authorInitials: userProfile?.initials || currentUser.email.substring(0,2).toUpperCase(),
      createdAt: serverTimestamp()
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Sending...';
    const date = timestamp.toMillis ? new Date(timestamp.toMillis()) : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Fallback map from history just in case a profile gets deleted
  const knownUsers = {};
  messages.forEach(msg => {
    if (msg.authorEmail) {
      knownUsers[msg.authorEmail] = {
        name: msg.authorName,
        initials: msg.authorInitials
      };
    }
  });

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
              <MessageSquare className="h-3.5 w-3.5" /> Messages
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300 flex-1 flex flex-col">
        
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Team Chat</h1>
          <p className="text-xs text-slate-500 mt-1">Collaborate and share updates with your workspace in real-time.</p>
        </div>

        {/* Chat Layout Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row flex-1 min-h-[600px] max-h-[800px]">
          
          {/* Left Pane: Team Members */}
          <div className="lg:w-72 border-r border-slate-100 bg-slate-50/50 flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-white">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Hash className="h-4 w-4" /> General Chat
              </h3>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Active Members ({activeProject?.members?.length || 0})
              </h4>
              
              <div className="flex flex-col gap-2">
                {activeProject?.members?.map((email, idx) => {
                  const isMe = email === currentUser?.email;
                  const bgColors = ['bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
                  const avatarColor = isMe ? 'bg-blue-600' : bgColors[idx % bgColors.length];

                  const profile = memberProfiles[email];
                  
                  // Live Online/Offline Check
                  const isOnline = isMe ? true : (profile?.isOnline === true);
                  
                  // Priority: "You" > Database Username > Database Name > Message History Name > Email split
                  const displayName = isMe 
                    ? 'You' 
                    : (profile?.username || profile?.name || knownUsers[email]?.name || email.split('@')[0]);
                    
                  // Priority: Database Initials > Message History Initials > Email split
                  const displayInitials = isMe 
                    ? (userProfile?.initials || email.substring(0, 2).toUpperCase()) 
                    : (profile?.initials || knownUsers[email]?.initials || email.substring(0, 2).toUpperCase());

                  return (
                    <div key={email} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100/80 transition-colors">
                      <div className={`relative h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm ${avatarColor}`}>
                        {displayInitials}
                        {/* Dynamic Status Dot */}
                        <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 border-2 border-white rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {displayName}
                        </span>
                        {/* Dynamic Status Text */}
                        <span className={`text-[9px] font-extrabold ${isOnline ? 'text-blue-600' : 'text-slate-400'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Pane: Chat Feed */}
          <div className="flex-1 flex flex-col bg-white relative">
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-blue-300" />
                  </div>
                  <p className="text-sm font-extrabold text-slate-800">Welcome to the team chat!</p>
                  <p className="text-xs text-slate-500 mt-1">Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.authorEmail === currentUser?.email;
                  const showHeader = index === 0 || messages[index - 1].authorEmail !== msg.authorEmail;

                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                      
                      {/* Avatar */}
                      {showHeader ? (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm shrink-0 ${isMe ? 'bg-blue-600' : 'bg-slate-800'}`}>
                          {msg.authorInitials}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0"></div> // Spacer for subsequent messages
                      )}

                      {/* Message Content */}
                      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {showHeader && (
                          <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[11px] font-extrabold text-slate-800">{isMe ? 'You' : msg.authorName}</span>
                            <span className="text-[9px] font-bold text-slate-400">{formatTime(msg.createdAt)}</span>
                          </div>
                        )}
                        
                        <div className={`px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${activeProject?.name || 'general'}...`}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/80 rounded-xl pl-4 pr-12 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}