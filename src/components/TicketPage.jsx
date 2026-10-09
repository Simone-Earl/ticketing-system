// src/components/TicketPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Edit2, Code, ExternalLink, MessageSquare, 
  Clock, User, Tag, LayoutDashboard, ChevronDown, Send,
  Trash2, Reply
} from 'lucide-react';
import ConfirmModal from './ConfirmModal'; 

// --- HELPER FUNCTIONS ---
const generateId = () => Math.random().toString(36).substring(2, 9);
const getTimestamp = () => Date.now();
const formatBadgeText = (text) => text ? text.replace('-', ' ').toUpperCase() : '';

export default function TicketPage({ tickets, updateTicketInDB, addNotification, currentUser, userProfile }) {
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

  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, commentId: null, parentId: null, snippet: '' });

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Ticket Not Found</h2>
        <p className="text-slate-500 mb-6">This ticket may have been deleted or you don't have access.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 font-bold hover:underline">
          Return to Workspace
        </button>
      </div>
    );
  }

  const currentStatus = ticket.status?.toLowerCase().replace(' ', '-') || 'backlog';
  const currentPriority = ticket.priority?.toUpperCase() || 'LOW';

  const handleUpdate = async (field, value) => {
    await updateTicketInDB(ticket.id, { [field]: value });
    addNotification(`Ticket Updated`, `Changed ${field} to ${formatBadgeText(value)}.`);
    setShowStatusMenu(false);
    setShowPriorityMenu(false);
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

  // Keyboard handler for Main Comment box (Enter = Send, Shift+Enter = New Line)
  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Keyboard handler for Reply box
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
    'backlog': 'bg-slate-100 text-slate-600 border-slate-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'in-review': 'bg-purple-50 text-purple-700 border-purple-200',
    'done': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const priorityColors = {
    'LOW': 'bg-slate-100 text-slate-600 border-slate-200',
    'MEDIUM': 'bg-amber-50 text-amber-700 border-amber-200',
    'HIGH': 'bg-orange-50 text-orange-700 border-orange-200',
    'URGENT': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <button onClick={() => navigate('/')} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Workspace
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold truncate max-w-[200px] md:max-w-[400px]">{ticket.title}</span>
        </div>
        
        <button className="flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
          <Edit2 className="h-4 w-4" /> Edit Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-6">{ticket.title}</h1>
            
            <div className="prose prose-slate max-w-none mb-8">
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description || 'No description provided.'}</p>
            </div>

            {ticket.techStack && ticket.techStack.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {ticket.techStack.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md border border-slate-200">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(ticket.repoLink || ticket.liveLink) && (
              <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                {ticket.repoLink && (
                  <a href={ticket.repoLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors">
                    <Code className="h-4 w-4" /> View Repository
                  </a>
                )}
                {ticket.liveLink && (
                  <a href={ticket.liveLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    <ExternalLink className="h-4 w-4" /> Live Demo
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-slate-400" /> Activity Thread
            </h3>

            <div className="flex flex-col gap-8 mb-8">
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No comments yet. Start the discussion!
                </p>
              ) : (
                ticket.comments.map(comment => {
                  const isAuthor = comment.authorEmail === currentUser?.email;
                  
                  return (
                    <div key={comment.id} className="flex flex-col gap-2">
                      <div className="flex gap-4 group">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 mt-1 shadow-sm">
                          {comment.authorInitials}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900" title={comment.authorEmail}>
                              {comment.authorName || comment.authorEmail?.split('@')[0]}
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              {new Date(comment.timestamp).toLocaleDateString()} at {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              {comment.isEdited && <span className="italic ml-1">(edited)</span>}
                            </span>
                          </div>
                          
                          {editingId === comment.id ? (
                            <div className="flex flex-col gap-2 mt-1 w-full max-w-2xl">
                              <textarea 
                                autoFocus
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full text-sm rounded-lg border border-blue-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm resize-none bg-blue-50/30"
                                rows={2}
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 transition-colors">Cancel</button>
                                <button onClick={() => handleSaveEdit(comment.id)} className="text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold px-4 py-1.5 shadow-sm transition-colors">Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl rounded-tl-none border border-slate-200 shadow-sm inline-block whitespace-pre-wrap">
                                {comment.text}
                              </p>
                              
                              <div className="flex items-center gap-1 mt-1.5 ml-1 opacity-80 transition-opacity group-hover:opacity-100">
                                <button onClick={() => startReply(comment.id)} title="Reply" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                  <Reply className="h-4 w-4" />
                                </button>
                                {isAuthor && (
                                  <>
                                    <button onClick={() => startEdit(comment.id, comment.text)} title="Edit" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => requestDeleteComment(comment.id, null, comment.text)} title="Delete" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* REPLY TEXTAREA WITH KEYDOWN SUPPORT */}
                      {replyingId === comment.id && (
                        <form onSubmit={(e) => handleAddReply(e, comment.id)} className="ml-12 mt-2 flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                          <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 mt-1.5">
                            {userProfile?.initials || currentUser?.email?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1 flex flex-col gap-2 relative">
                            <textarea
                              autoFocus
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                              placeholder="Write a reply..."
                              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm resize-none"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setReplyingId(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 transition-colors">Cancel</button>
                              <button type="submit" disabled={!replyText.trim()} className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-md px-4 py-1.5 transition-colors shadow-sm">Reply</button>
                            </div>
                          </div>
                        </form>
                      )}

                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-6 mt-1 pl-6 flex flex-col gap-4 border-l-2 border-slate-100">
                          {comment.replies.map(reply => {
                            const isReplyAuthor = reply.authorEmail === currentUser?.email;
                            return (
                              <div key={reply.id} className="flex gap-3 group/reply mt-2">
                                <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 mt-0.5">
                                  {reply.authorInitials}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-slate-900" title={reply.authorEmail}>
                                      {reply.authorName || reply.authorEmail?.split('@')[0]}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400">
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
                                        className="w-full text-sm rounded-lg border border-blue-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm resize-none bg-blue-50/30"
                                        rows={1}
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-700 font-bold px-3 py-1 transition-colors">Cancel</button>
                                        <button onClick={() => handleSaveEdit(reply.id, comment.id)} className="text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold px-3 py-1 shadow-sm transition-colors">Save</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl rounded-tl-none shadow-sm inline-block whitespace-pre-wrap">
                                        {reply.text}
                                      </p>
                                      
                                      <div className="flex items-center gap-1 mt-1 ml-1 opacity-0 transition-opacity group-hover/reply:opacity-100">
                                        <button 
                                          onClick={() => startReply(comment.id)} 
                                          title="Reply" 
                                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        >
                                          <Reply className="h-3.5 w-3.5" />
                                        </button>
                                        
                                        {isReplyAuthor && (
                                          <>
                                            <button onClick={() => startEdit(reply.id, reply.text)} title="Edit" className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                                              <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => requestDeleteComment(reply.id, comment.id, reply.text)} title="Delete" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                                              <Trash2 className="h-3.5 w-3.5" />
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

            {/* MAIN COMMENT TEXTAREA WITH KEYDOWN SUPPORT */}
            <form onSubmit={handleAddComment} className="mt-4 pt-6 border-t border-slate-100">
              <div className="relative flex items-center">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Ask a question or post a general update..."
                  className="w-full rounded-xl border border-slate-300 pl-4 pr-14 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm resize-none"
                  rows={2}
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 flex items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 mb-5 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-400" /> Ticket Properties
            </h3>
            
            <div className="flex flex-col gap-5">
              
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Status</label>
                <div className="relative">
                  <button 
                    onClick={() => { setShowStatusMenu(!showStatusMenu); setShowPriorityMenu(false); }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold rounded-lg border transition-colors hover:shadow-sm ${statusColors[currentStatus] || statusColors['backlog']}`}
                  >
                    {formatBadgeText(currentStatus)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                  
                  {showStatusMenu && (
                    <div className="absolute z-10 top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {Object.keys(statusColors).map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdate('status', status)}
                          className="block w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {formatBadgeText(status)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Priority</label>
                <div className="relative">
                  <button 
                    onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowStatusMenu(false); }}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-xs font-bold rounded-lg border transition-colors hover:shadow-sm ${priorityColors[currentPriority] || priorityColors['LOW']}`}
                  >
                    {formatBadgeText(currentPriority)}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                  
                  {showPriorityMenu && (
                    <div className="absolute z-10 top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {Object.keys(priorityColors).map(priority => (
                        <button
                          key={priority}
                          onClick={() => handleUpdate('priority', priority)}
                          className="block w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {formatBadgeText(priority)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-2 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700 font-bold text-xs">
                    {ticket.authorInitials || ticket.authorEmail?.substring(0,2).toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporter</span>
                    <span className="font-bold text-slate-900 text-xs truncate max-w-[150px] block" title={ticket.authorEmail}>
                      {ticket.authorName || ticket.authorEmail?.split('@')[0] || 'Unknown User'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activity</span>
                    <span className="font-bold text-slate-900 text-xs">Recently Updated</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen} 
        type="delete" 
        itemType="Comment"
        ticketTitle={confirmDelete.snippet} 
        onClose={() => setConfirmDelete({ isOpen: false, commentId: null, parentId: null, snippet: '' })} 
        onConfirm={executeDeleteComment} 
      />

    </div>
  );
}