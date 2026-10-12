// src/components/TicketPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pencil, Code, ExternalLink, MessageSquare, 
  User, Tag, ChevronDown, Send,
  Trash2, Reply, X, Compass, ChevronRight, Archive, Calendar
} from 'lucide-react';
import ConfirmModal from './ConfirmModal'; 

const generateId = () => Math.random().toString(36).substring(2, 9);
const getTimestamp = () => Date.now();
const formatBadgeText = (text) => text ? text.replace('-', ' ').toUpperCase() : '';

export default function TicketPage({ tickets, updateTicketInDB, deleteTicketFromDB, currentUser, userProfile, memberProfiles = {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const ticket = tickets.find(t => t.id === id);

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  
  const [newComment, setNewComment] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'MEDIUM',
    techStack: '',
    repoLink: '',
    liveLink: '',
    deadline: ''
  });

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, commentId: null, parentId: null, snippet: '' });
  const [ticketConfirmDialog, setTicketConfirmDialog] = useState({ isOpen: false, type: '' });

  if (!ticket) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500 min-h-screen bg-slate-50 md:pl-60">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Task Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">This task may have been deleted or archived.</p>
        <button onClick={() => navigate('/')} className="text-xs font-bold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          Return to Workspace
        </button>
      </div>
    );
  }

  const projectTickets = tickets.filter(t => t.projectId === ticket.projectId);
  const sortedProjectTickets = [...projectTickets].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
    return timeA - timeB;
  });
  const ticketIndex = sortedProjectTickets.findIndex(t => t.id === ticket.id);
  const ticketNumber = ticketIndex !== -1 ? `#${ticketIndex + 1}` : '#1';

  const currentStatus = (ticket.status || 'backlog').toLowerCase().replace(' ', '-');
  const currentPriority = (ticket.priority || 'LOW').toUpperCase();

  const solverEmail = ticket.completedBy;
  const solverProfile = solverEmail ? memberProfiles[solverEmail] : null;
  const solverDisplayName = solverEmail === currentUser?.email 
    ? 'You' 
    : (solverProfile?.username || solverProfile?.name || solverEmail?.split('@')[0] || 'Unknown');

  const handleUpdate = async (field, value) => {
    const updates = { [field]: value };
    
    if (field === 'status' && value === 'done') {
      updates.completedBy = currentUser.email;
      updates.completedByInitials = userProfile?.initials || currentUser.email.substring(0, 2).toUpperCase();
    }

    await updateTicketInDB(ticket.id, updates);
    setShowStatusMenu(false);
    setShowPriorityMenu(false);
  };

  const openEditModal = () => {
    setEditForm({
      title: ticket.title || '',
      description: ticket.description || '',
      status: ticket.status || 'backlog',
      priority: ticket.priority || 'MEDIUM',
      techStack: Array.isArray(ticket.techStack) ? ticket.techStack.join(', ') : (ticket.techStack || ''),
      repoLink: ticket.repoLink || '',
      liveLink: ticket.liveLink || '',
      deadline: ticket.deadline || ''
    });
    setIsEditingTicket(true);
  };

  const handleSaveTicketEdit = async (e) => {
    e.preventDefault();
    const updatedData = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      status: editForm.status,
      priority: editForm.priority,
      type: editForm.priority, 
      techStack: editForm.techStack ? editForm.techStack.split(',').map(t => t.trim()).filter(Boolean) : [],
      repoLink: editForm.repoLink.trim(),
      liveLink: editForm.liveLink.trim(),
      deadline: editForm.deadline || ''
    };

    if (editForm.status === 'done' && ticket.status !== 'done') {
      updatedData.completedBy = currentUser.email;
      updatedData.completedByInitials = userProfile?.initials || currentUser.email.substring(0, 2).toUpperCase();
    }

    await updateTicketInDB(ticket.id, updatedData);
    setIsEditingTicket(false);
  };

  const handleExecuteTicketAction = async () => {
    if (ticketConfirmDialog.type === 'archive') {
      await updateTicketInDB(ticket.id, { isArchived: true });
      navigate('/');
    } else if (ticketConfirmDialog.type === 'delete') {
      await deleteTicketFromDB(ticket.id);
      navigate('/');
    }
    setTicketConfirmDialog({ isOpen: false, type: '' });
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    const commentData = {
      id: generateId(),
      text: newComment.trim(),
      authorEmail: currentUser?.email || 'Unknown User',
      authorName: userProfile?.username || userProfile?.name || currentUser?.email?.split('@')[0] || 'Unknown User',
      authorInitials: userProfile?.initials || currentUser?.email?.substring(0, 2).toUpperCase() || 'U',
      timestamp: getTimestamp(),
      replies: [] 
    };

    const updatedComments = [...(ticket.comments || []), commentData];
    await updateTicketInDB(ticket.id, { comments: updatedComments });
    setNewComment('');
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleReplyKeyDown = (e, parentId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddReply(null, parentId);
    }
  };

  const requestDeleteComment = (commentId, parentId = null, text = '') => {
    const snippet = text.length > 30 ? text.substring(0, 30) + '...' : text;
    setConfirmDelete({ isOpen: true, commentId, parentId, snippet });
  };

  const executeDeleteComment = async () => {
    const { commentId, parentId } = confirmDelete;
    let updatedComments = [...(ticket.comments || [])];
    
    if (parentId) {
      updatedComments = updatedComments.map(c => 
        c.id === parentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) } : c
      );
    } else {
      updatedComments = updatedComments.filter(c => c.id !== commentId);
    }
    
    await updateTicketInDB(ticket.id, { comments: updatedComments });
    setConfirmDelete({ isOpen: false, commentId: null, parentId: null, snippet: '' });
  };

  const handleSaveEdit = async (commentId, parentId = null) => {
    if (!editText.trim()) return;
    let updatedComments = [...(ticket.comments || [])];
    if (parentId) {
      updatedComments = updatedComments.map(c => 
        c.id === parentId 
          ? { ...c, replies: (c.replies || []).map(r => r.id === commentId ? { ...r, text: editText.trim(), isEdited: true } : r) }
          : c
      );
    } else {
      updatedComments = updatedComments.map(c => 
        c.id === commentId ? { ...c, text: editText.trim(), isEdited: true } : c
      );
    }
    
    await updateTicketInDB(ticket.id, { comments: updatedComments });
    setEditingId(null);
    setEditText('');
  };

  const handleAddReply = async (e, parentId) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const newReply = {
      id: generateId(),
      text: replyText.trim(),
      authorEmail: currentUser?.email || 'Unknown User',
      authorName: userProfile?.username || userProfile?.name || currentUser?.email?.split('@')[0] || 'Unknown User',
      authorInitials: userProfile?.initials || currentUser?.email?.substring(0, 2).toUpperCase() || 'U',
      timestamp: getTimestamp(),
      isEdited: false
    };

    const updatedComments = (ticket.comments || []).map(c => 
      c.id === parentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
    );

    await updateTicketInDB(ticket.id, { comments: updatedComments });
    setReplyingId(null);
    setReplyText('');
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
    setReplyingId(null);
  };

  const startReply = (id) => {
    setReplyingId(id);
    setReplyText('');
    setEditingId(null); 
  };

  const statusColors = {
    'backlog': 'bg-slate-100 text-slate-600',
    'in-progress': 'bg-amber-50 text-amber-600',
    'in-review': 'bg-purple-50 text-purple-600',
    'done': 'bg-emerald-50 text-emerald-600',
  };

  const priorityColors = {
    'LOW': 'bg-blue-50 text-blue-600',
    'MEDIUM': 'bg-amber-50 text-amber-600',
    'HIGH': 'bg-orange-50 text-orange-600',
    'URGENT': 'bg-red-50 text-red-600',
  };

  const getBadgeColor = (index) => {
    const colors = [
      'bg-blue-50 text-blue-600', 
      'bg-purple-50 text-purple-600', 
      'bg-emerald-50 text-emerald-600', 
      'bg-pink-50 text-pink-600'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:pl-60">
      
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/95 px-6 py-3.5 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> Workspace
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{ticketNumber}</span>
            <span className="text-slate-800 truncate max-w-[150px] sm:max-w-[300px] hidden sm:block">{ticket.title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={openEditModal}
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-extrabold text-blue-600 transition-all hover:bg-blue-100"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Task
            </button>
            <button 
              onClick={() => setTicketConfirmDialog({ isOpen: true, type: 'archive' })}
              className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-extrabold text-amber-600 transition-all hover:bg-amber-100"
              title="Archive Task"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => setTicketConfirmDialog({ isOpen: true, type: 'delete' })}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-xs font-extrabold text-red-600 transition-all hover:bg-red-100"
              title="Delete Task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6 leading-tight">{ticket.title}</h1>
              
              <div className="prose prose-slate max-w-none mb-8">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
              </div>

              {Array.isArray(ticket.techStack) && ticket.techStack.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">Tags & Tech</h3>
                  <div className="flex flex-wrap gap-2">
                    {ticket.techStack.map((tech, i) => (
                      <span key={i} className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wide ${getBadgeColor(i)}`}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(ticket.repoLink || ticket.liveLink) && (
                <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                  {ticket.repoLink && (
                    <a href={ticket.repoLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                      <Code className="h-3.5 w-3.5" /> Repository
                    </a>
                  )}
                  {ticket.liveLink && (
                    <a href={ticket.liveLink} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                      <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                <MessageSquare className="h-4.5 w-4.5 text-slate-400" /> Activity Thread
              </h3>

              <div className="flex flex-col gap-6 mb-6">
                {(!ticket.comments || ticket.comments.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-xl">
                    No comments yet. Start the discussion!
                  </p>
                ) : (
                  ticket.comments.map(comment => {
                    const isAuthor = comment.authorEmail === currentUser?.email;
                    
                    return (
                      <div key={comment.id} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex gap-4 group">
                          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-sm mt-0.5">
                            {comment.authorInitials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-extrabold text-slate-900" title={comment.authorEmail}>
                                {comment.authorName || comment.authorEmail?.split('@')[0]}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {comment.isEdited && <span className="italic ml-1">(edited)</span>}
                              </span>
                            </div>
                            
                            {editingId === comment.id ? (
                              <div className="flex flex-col gap-2 mt-1 w-full max-w-2xl">
                                <textarea 
                                  autoFocus
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-none"
                                  rows={2}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingId(null)} className="text-[10px] text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 transition-colors">Cancel</button>
                                  <button onClick={() => handleSaveEdit(comment.id)} className="text-[10px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold px-4 py-1.5 shadow-sm transition-colors">Save</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl rounded-tl-none inline-block whitespace-pre-wrap border border-slate-100">
                                  {comment.text}
                                </p>
                                
                                <div className="flex items-center gap-1 mt-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button onClick={() => startReply(comment.id)} title="Reply" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Reply className="h-3.5 w-3.5" />
                                  </button>
                                  {isAuthor && (
                                    <>
                                      <button onClick={() => startEdit(comment.id, comment.text)} title="Edit" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => requestDeleteComment(comment.id, null, comment.text)} title="Delete" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Reply Form */}
                        {replyingId === comment.id && (
                          <form onSubmit={(e) => handleAddReply(e, comment.id)} className="ml-12 mt-2 flex items-start gap-3 animate-in slide-in-from-top-1 duration-150">
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-extrabold text-slate-600 shrink-0 mt-1">
                              {userProfile?.initials || currentUser?.email?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                              <textarea
                                autoFocus
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                                placeholder="Reply..."
                                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setReplyingId(null)} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 transition-colors">Cancel</button>
                                <button type="submit" disabled={!replyText.trim()} className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg px-4 py-1.5 transition-colors shadow-sm">Reply</button>
                              </div>
                            </div>
                          </form>
                        )}

                        {/* Nested Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-6 mt-1 pl-6 flex flex-col gap-4 border-l-2 border-slate-100">
                            {comment.replies.map(reply => {
                              const isReplyAuthor = reply.authorEmail === currentUser?.email;
                              return (
                                <div key={reply.id} className="flex gap-3 group/reply mt-1">
                                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-extrabold text-slate-600 shrink-0 mt-0.5">
                                    {reply.authorInitials}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[11px] font-extrabold text-slate-900" title={reply.authorEmail}>
                                        {reply.authorName || reply.authorEmail?.split('@')[0]}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400">
                                        {new Date(reply.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {reply.isEdited && <span className="italic ml-1">(edited)</span>}
                                      </span>
                                    </div>

                                    {editingId === reply.id ? (
                                      <div className="flex flex-col gap-2 mt-1 w-full max-w-xl">
                                        <textarea 
                                          autoFocus
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-none"
                                          rows={1}
                                        />
                                        <div className="flex gap-2 justify-end">
                                          <button onClick={() => setEditingId(null)} className="text-[10px] text-slate-500 hover:text-slate-700 font-bold px-3 py-1 transition-colors">Cancel</button>
                                          <button onClick={() => handleSaveEdit(reply.id, comment.id)} className="text-[10px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold px-3 py-1 shadow-sm transition-colors">Save</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-100 p-2.5 rounded-xl rounded-tl-none inline-block whitespace-pre-wrap">
                                          {reply.text}
                                        </p>
                                        
                                        <div className="flex items-center gap-1 mt-0.5 opacity-0 transition-opacity group-hover/reply:opacity-100">
                                          <button onClick={() => startReply(comment.id)} title="Reply" className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                            <Reply className="h-3 w-3" />
                                          </button>
                                          
                                          {isReplyAuthor && (
                                            <>
                                              <button onClick={() => startEdit(reply.id, reply.text)} title="Edit" className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                                <Pencil className="h-3 w-3" />
                                              </button>
                                              <button onClick={() => requestDeleteComment(reply.id, comment.id, reply.text)} title="Delete" className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-100">
                <div className="relative flex items-center">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="Write a comment... (Shift + Enter for new line)"
                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-50/50 focus:bg-white rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-none transition-all"
                    rows={2}
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar / Properties */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
              <h3 className="text-sm font-extrabold text-slate-900 mb-5 flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" /> Properties
              </h3>
              
              <div className="flex flex-col gap-5">
                
                {/* Status Dropdown */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 block">Status</label>
                  <div className="relative">
                    <button 
                      onClick={() => { setShowStatusMenu(!showStatusMenu); setShowPriorityMenu(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs font-extrabold rounded-xl transition-all ${statusColors[currentStatus] || statusColors['backlog']}`}
                    >
                      {formatBadgeText(currentStatus)}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                    
                    {showStatusMenu && (
                      <div className="absolute z-10 top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {Object.keys(statusColors).map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdate('status', status)}
                            className="block w-full text-left px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span className={`px-2 py-0.5 rounded-md ${statusColors[status]}`}>{formatBadgeText(status)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Dropdown */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 block">Priority</label>
                  <div className="relative">
                    <button 
                      onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowStatusMenu(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs font-extrabold rounded-xl transition-all ${priorityColors[currentPriority] || priorityColors['LOW']}`}
                    >
                      {formatBadgeText(currentPriority)}
                      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                    </button>
                    
                    {showPriorityMenu && (
                      <div className="absolute z-10 top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {Object.keys(priorityColors).map(priority => (
                          <button
                            key={priority}
                            onClick={() => handleUpdate('priority', priority)}
                            className="block w-full text-left px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span className={`px-2 py-0.5 rounded-md ${priorityColors[priority]}`}>{formatBadgeText(priority)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Block */}
                <div className="border-t border-slate-100 pt-5 mt-2 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0 text-white font-extrabold text-xs shadow-sm">
                      {ticket.authorInitials || ticket.authorEmail?.substring(0,2).toUpperCase() || <User className="h-4 w-4" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Reporter</span>
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[150px] block" title={ticket.authorEmail}>
                        {ticket.authorName || ticket.authorEmail?.split('@')[0] || 'Unknown User'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Completed By Block (Only shows if task is done) */}
                  {currentStatus === 'done' && (
                    <div className="flex items-center gap-3 animate-in fade-in duration-200">
                      <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white font-extrabold text-xs shadow-sm">
                        {ticket.completedByInitials || solverDisplayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600">Completed By</span>
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[150px] block" title={solverEmail}>
                          {solverDisplayName}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Deadline</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {ticket.deadline || 'No deadline set'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Edit Ticket Modal */}
      {isEditingTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 md:px-6 border-b border-slate-100 bg-white">
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Pencil className="h-4 w-4 text-blue-600" />
                Edit Task
              </h2>
              <button onClick={() => setIsEditingTicket(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicketEdit} className="p-5 md:p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto bg-slate-50/50">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Title</label>
                <input 
                  required
                  type="text" 
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <textarea 
                  required
                  rows="3"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none shadow-sm text-xs text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="backlog">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Priority</label>
                  <select 
                    value={editForm.priority}
                    onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Deadline</label>
                  <input 
                    type="date" 
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({...editForm, deadline: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Tags (Comma separated)</label>
                <input 
                  type="text" 
                  value={editForm.techStack}
                  onChange={(e) => setEditForm({...editForm, techStack: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs"
                  placeholder="e.g., Design, Feature, Bug"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Repository Link</label>
                  <input 
                    type="url" 
                    value={editForm.repoLink}
                    onChange={(e) => setEditForm({...editForm, repoLink: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">Live Demo Link</label>
                  <input 
                    type="url" 
                    value={editForm.liveLink}
                    onChange={(e) => setEditForm({...editForm, liveLink: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-sm text-xs"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-4 mt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsEditingTicket(false)}
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
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.isOpen} 
        type="delete" 
        itemType="Comment"
        ticketTitle={confirmDelete.snippet} 
        onClose={() => setConfirmDelete({ isOpen: false, commentId: null, parentId: null, snippet: '' })} 
        onConfirm={executeDeleteComment} 
      />

      {/* Ticket Archive/Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={ticketConfirmDialog.isOpen} 
        type={ticketConfirmDialog.type} 
        itemType="Task"
        ticketTitle={ticket.title} 
        onClose={() => setTicketConfirmDialog({ isOpen: false, type: '' })} 
        onConfirm={handleExecuteTicketAction} 
      />

    </div>
  );
}