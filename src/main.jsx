import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  ArrowUp, ExternalLink, Clock, User, ChevronDown, ChevronRight, 
  Loader2, Hash, Monitor, HelpCircle, Briefcase, Zap,
  Trophy, Bookmark, CheckCircle, AlertTriangle, Trash2, Calendar, 
  Award, RefreshCw, MessageCircle, MessageSquare, Settings, X,
  ListFilter, CornerDownRight
} from 'lucide-react';
import BookmarkManager from './bookmark.js';
import { api } from './api.js';
import { timeAgo, classifyStory, handleContentClick } from './utils.js';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-red-500 font-mono flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle size={48} className="mb-4" />
          <h1 className="text-xl font-bold mb-2">SYSTEM_FAILURE</h1>
          <p className="text-sm text-gray-500 mb-4">The application encountered a critical error.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-900/20 border border-red-500/50 hover:bg-red-900/40 text-red-400 rounded transition-colors uppercase text-sm"
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const dbManager = new BookmarkManager();

const SettingsModal = ({ isOpen, onClose, settings, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#0a0a0a] border border-gray-800 w-full max-w-sm m-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-mono font-bold text-gray-100 flex items-center gap-2"><Settings size={16} /> SYSTEM_CONFIG</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors"><X size={18} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Default Boot View</label>
            <div className="grid grid-cols-3 gap-2">
              {['top', 'new', 'best', 'ask', 'show', 'job', 'bookmarks'].map((view) => (
                <button
                  key={view}
                  onClick={() => onSave({ ...settings, defaultView: view })}
                  className={`text-xs font-mono py-2 border transition-all uppercase ${settings.defaultView === view ? 'bg-orange-500 text-black border-orange-500 font-bold' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-600'}`}
                >
                  {view}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Default Sort Order</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'time', label: 'NEWEST' },
                { id: 'rank', label: 'RANK' },
                { id: 'score', label: 'POPULAR' },
                { id: 'comments', label: 'DISCUSSED' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onSave({ ...settings, defaultSort: opt.id })}
                  className={`text-xs font-mono py-2 border transition-all uppercase ${settings.defaultSort === opt.id ? 'bg-orange-500 text-black border-orange-500 font-bold' : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-600'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Interaction Protocol</label>
            <div 
              className="flex items-center justify-between p-3 border border-gray-800 cursor-pointer hover:bg-gray-900 transition-colors group"
              onClick={() => onSave({ ...settings, openLinksExternally: !settings.openLinksExternally })}
            >
              <div className="flex flex-col">
                <span className="text-sm font-mono text-gray-300 group-hover:text-white">Direct External Link</span>
                <span className="text-[10px] text-gray-500">Open URL immediately on title click</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.openLinksExternally ? 'bg-orange-500' : 'bg-gray-800'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.openLinksExternally ? 'left-6' : 'left-1'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#050505]">
          <button onClick={onClose} className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-mono text-xs border border-gray-800 hover:border-gray-700 transition-all uppercase">Close & Apply</button>
        </div>
      </div>
    </div>
  );
};

const SortDropdown = ({ currentSort, onSortChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { id: 'time', label: 'NEWEST' },
    { id: 'rank', label: 'RANK' },
    { id: 'score', label: 'POPULAR' },
    { id: 'comments', label: 'DISCUSSED' }
  ];

  const currentLabel = options.find(o => o.id === currentSort)?.label || 'RANK';

  return (
    <div className="relative" ref={dropdownRef}>
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono font-bold tracking-wider transition-all text-gray-500 hover:text-gray-300 border border-transparent hover:border-gray-800">
            <ListFilter size={12} />
            <span>SORT: <span className="text-orange-500">{currentLabel}</span></span>
            <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#0a0a0a] border border-gray-800 shadow-xl rounded-sm z-50 animate-in fade-in zoom-in-95 duration-100 py-1">
                {options.map((opt) => (
                    <button key={opt.id} onClick={() => { onSortChange(opt.id); setIsOpen(false); }} className={`w-full text-left px-4 py-2 text-[10px] font-mono font-bold transition-colors uppercase ${currentSort === opt.id ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'}`}>{opt.label}</button>
                ))}
            </div>
        )}
    </div>
  );
};

const UserHoverCard = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const loadData = () => {
    if (!userData && !loading) {
      setLoading(true);
      api.getUser(username).then(data => { setUserData(data); setLoading(false); });
    }
  };

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => { setIsOpen(true); loadData(); }, 300); 
  };
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(false);
  };
  const handleClick = (e) => {
    e.stopPropagation();
    if (isOpen) setIsOpen(false); else { setIsOpen(true); loadData(); }
  };

  return (
    <div className="relative inline-block z-20" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button onClick={handleClick} className="hover:text-orange-500 transition-colors flex items-center gap-1 font-medium">
        <User size={10} className="inline sm:hidden" /> @{username}
      </button>

      {isOpen && (
        <div className="absolute z-[100] left-0 mt-2 w-72 max-w-[90vw] bg-[#0a0a0a] border border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.8)] rounded-sm p-4 animate-in fade-in zoom-in-95 duration-150" style={{ top: '100%' }} onClick={(e) => e.stopPropagation()}>
          {loading ? (
             <div className="flex items-center justify-center py-4 text-orange-500"><Loader2 className="animate-spin" size={16} /></div>
          ) : userData ? (
            <div className="text-left">
              <div className="flex justify-between items-start mb-3 border-b border-gray-800 pb-2">
                 <div className="overflow-hidden">
                    <div className="text-lg font-bold text-gray-100 font-mono truncate">@{userData.id}</div>
                    <div className="text-[10px] text-gray-500 font-mono">ID: {userData.created}</div>
                 </div>
                 <div className="shrink-0 w-8 h-8 bg-gray-900 border border-gray-800 rounded flex items-center justify-center text-gray-500 font-bold text-xs">{userData.id.charAt(0).toUpperCase()}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#050505] p-2 border border-gray-800">
                   <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono mb-1"><Award size={10} /> KARMA</div>
                   <div className="text-sm font-bold text-gray-300">{userData.karma?.toLocaleString() || 0}</div>
                </div>
                <div className="bg-[#050505] p-2 border border-gray-800">
                   <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono mb-1"><Calendar size={10} /> JOINED</div>
                   <div className="text-xs font-bold text-gray-300">{userData.created ? new Date(userData.created * 1000).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>
              {userData.about && (
                 <div className="text-xs text-gray-400 font-sans border-t border-gray-800 pt-2 max-h-32 overflow-y-auto no-scrollbar break-words">
                    <div dangerouslySetInnerHTML={{ __html: userData.about }} className="prose prose-invert prose-xs max-w-none" onClick={handleContentClick} />
                 </div>
              )}
            </div>
          ) : <div className="text-red-500 text-xs font-mono py-2">ERR_LOAD_USER</div>}
        </div>
      )}
    </div>
  );
};

const MAX_AUTO_EXPAND = 2;

const Comment = ({ id, level = 0 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(level > MAX_AUTO_EXPAND);

  useEffect(() => {
    let isMounted = true;
    api.getItem(id).then(item => { if (isMounted) { setData(item); setLoading(false); }});
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <div className="animate-pulse h-6 bg-gray-900 border-y border-gray-800 w-full my-2 ml-4 opacity-50"></div>;
  if (!data || data.deleted || data.dead) return null;
  
  const hasKids = data.kids && data.kids.length > 0;

  const handleToggle = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    const selection = window.getSelection();
    if (selection.toString().length > 0) return;
    if (hasKids) setCollapsed(!collapsed);
  };

  return (
    <div className={`mt-2 ${level > 0 ? 'pl-3 sm:pl-4 border-l border-gray-800' : ''}`}>
      <div className="flex flex-col w-full overflow-hidden">
        <div 
            onClick={handleToggle}
            className={`
                relative group transition-all duration-200 
                border-y border-transparent cursor-pointer
                hover:bg-white/5 active:bg-white/10
                ${collapsed ? 'opacity-60' : 'opacity-100'}
            `}
        >
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 select-none mb-1">
              <button 
                 onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
                 className={`focus:outline-none transition-colors ${collapsed ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}`}
                 disabled={!hasKids}
              >
                {hasKids ? (collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />) : <span className="w-3.5 inline-block"/>}
              </button>
              <div onClick={(e) => e.stopPropagation()}>
                <UserHoverCard username={data.by} />
              </div>
              <span className="text-gray-600">[{timeAgo(data.time)}]</span>
              {collapsed && hasKids && <span className="text-gray-500 italic">({data.kids.length} replies hidden)</span>}
              
              {/* REPLY BUTTON */}
              <a 
                href={`https://news.ycombinator.com/reply?id=${data.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-gray-600 hover:text-orange-500 transition-colors"
                title="Reply on HN"
              >
                <CornerDownRight size={12} /> <span className="hidden sm:inline">REPLY</span>
              </a>
            </div>
            
            {!collapsed && (
              <div 
                className={`
                  pl-6 text-sm text-gray-400 group-hover:text-gray-200 break-words prose prose-invert prose-sm max-w-none leading-relaxed font-sans transition-colors overflow-hidden
                  [&_p]:mb-4 
                  [&_p:hover]:text-white [&_p:hover]:border-l-gray-600 
                  [&_p]:border-l-2 [&_p]:border-transparent [&_p]:pl-3 [&_p]:-ml-3 [&_p]:transition-colors
                  [&_pre]:bg-gray-900 [&_pre]:p-3 [&_pre]:rounded-sm [&_pre]:border [&_pre]:border-gray-800 [&_pre]:overflow-x-auto
                  [&_a]:text-orange-400/80 [&_a]:underline [&_a]:decoration-orange-400/30 [&_a:hover]:text-orange-400
                  [&_i]:italic [&_b]:font-bold
                `}
                dangerouslySetInnerHTML={{ __html: data.text }} 
                onClick={handleContentClick}
              />
            )}
          </div>
        </div>
        {!collapsed && hasKids && (
          <div className="mt-1 mb-2">
            {data.kids.map(kidId => <Comment key={kidId} id={kidId} level={level + 1} />)}
          </div>
        )}
      </div>
    </div>
  );
};

const StoryItem = ({ id, storyData, index, onClick, isBookmarked, isRead, onToggleBookmark, isBookmarkView }) => {
  const [story, setStory] = useState(storyData || null);
  const [category, setCategory] = useState('GENERIC');

  useEffect(() => {
    if (!storyData && id) {
      api.getItem(id).then(data => { setStory(data); if (data) setCategory(classifyStory(data.title, data.type)); });
    } else if (storyData) {
      setStory(storyData);
      setCategory(classifyStory(storyData.title, storyData.type));
    }
  }, [id, storyData]);

  if (!story) return (
    <div className="p-4 border-y border-gray-900 bg-[#0a0a0a] animate-pulse -mt-px"><div className="space-y-2"><div className="h-4 bg-gray-900 rounded w-3/4"></div><div className="h-3 bg-gray-900 rounded w-1/4"></div></div></div>
  );

  const finalIsRead = isRead || story.read; 
  const isExpired = isBookmarkView && story.deadline && Date.now() > story.deadline && !finalIsRead;

  // Color mapping for hashtags
  const categoryColor = 
    category === 'AI' ? 'text-purple-400' : 
    category === 'DEV' ? 'text-blue-400' :
    category === 'SEC' ? 'text-red-400' :
    category === 'POLL' ? 'text-yellow-400' :
    'text-gray-500';

  const displayTime = story.savedAt ? Math.floor(story.savedAt / 1000) : story.time;
  const exactDate = new Date(displayTime * 1000).toLocaleString();

  return (
    <article 
      className={`group relative p-4 cursor-pointer transition-all duration-200 border-l-2 border-y -mt-px z-0 hover:z-10
                 ${finalIsRead ? 'bg-[#050505] border-l-transparent border-y-gray-900' : 'bg-[#050505] border-l-transparent border-y-gray-800'}
                 hover:bg-[#0f0f0f] hover:border-l-orange-500 hover:border-y-gray-700
                 ${isExpired ? 'border-l-red-500' : ''}
      `}
      onClick={() => onClick(story)}
    >
      <div className="flex flex-col gap-1.5 w-full overflow-hidden">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
           <h3 
              className={`font-medium text-lg leading-snug transition-colors font-sans tracking-tight truncate pr-4 ${finalIsRead ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-100'}`}
              title={story.title}
           >
            {story.title}
            {story.url && (
                <span className="ml-2 text-xs font-mono text-gray-600 font-normal group-hover:text-gray-500 transition-colors">
                    ({new URL(story.url).hostname.replace('www.', '')})
                </span>
            )}
           </h3>
        </div>

        {/* Metadata Row */}
        <div 
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-gray-500 transition-opacity"
            onClick={(e) => e.stopPropagation()}
        >
          <a 
             href={`https://news.ycombinator.com/item?id=${story.id}`} 
             target="_blank" 
             rel="noopener noreferrer"
             className="font-bold text-gray-400 flex items-center gap-1 hover:text-orange-500 transition-colors"
             title="Upvote on HN"
          >
             <ArrowUp size={10} className="text-orange-500/50" /> {story.score}
          </a>

          <UserHoverCard username={story.by} />
          
          <span className="flex items-center gap-1 cursor-help" title={exactDate}><Clock size={10} /> {timeAgo(displayTime)}</span>
          
          <a 
             href={`https://news.ycombinator.com/item?id=${story.id}`}
             target="_blank"
             rel="noopener noreferrer" 
             className="flex items-center gap-1 hover:text-orange-500 transition-colors"
             title="Discuss on HN"
          >
             <MessageCircle size={10} /> {story.descendants || 0}
          </a>

          {/* OPEN ON HN - Explicit Link as Requested */}
          <a 
             href={`https://news.ycombinator.com/item?id=${story.id}`}
             target="_blank"
             rel="noopener noreferrer" 
             className="flex items-center gap-1 hover:text-orange-500 transition-colors uppercase font-bold"
             title="Open on HN"
          >
             <ExternalLink size={10} /> HN
          </a>

          {finalIsRead && (
            <span className="text-green-600 font-bold flex items-center gap-1">
                [READ]
            </span>
          )}

          <span className={`font-bold ${categoryColor}`}>
            #{category}
          </span>
          
          {!finalIsRead && (
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleBookmark(story); }}
                className={`group/btn flex items-center gap-1 h-6 px-2 rounded border border-transparent transition-colors ml-auto sm:ml-0
                    ${isBookmarked ? 'text-orange-500' : 'text-gray-600 hover:text-orange-500'}
                `}
            >
                <Bookmark size={12} fill={isBookmarked ? "currentColor" : "none"} />
                <span className={`${isBookmarked ? 'inline-block' : 'inline-block sm:hidden sm:group-hover/btn:inline-block'} text-[10px] font-bold`}>
                    {isBookmarked ? 'SAVED' : 'SAVE'}
                </span>
            </button>
          )}
          
          {isBookmarkView && (
             <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(story); }} className="text-gray-600 hover:text-red-500 transition-colors" title="Delete Bookmark">
               <Trash2 size={12} />
             </button>
        )}
        </div>
      </div>
    </article>
  );
};

const StoryDetail = ({ story, onBack, isBookmarked, onToggleBookmark, onMarkRead }) => {
  if (!story) return null;
  const category = classifyStory(story.title, story.type);
  
  const categoryColor = 
    category === 'AI' ? 'text-purple-400' : 
    category === 'DEV' ? 'text-blue-400' :
    category === 'SEC' ? 'text-red-400' :
    'text-gray-500';

  const displayTime = story.savedAt ? Math.floor(story.savedAt / 1000) : story.time;
  const exactDate = new Date(displayTime * 1000).toLocaleString();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-screen pb-20 w-full overflow-hidden">
      <div className="sticky top-0 z-20 bg-[#050505]/95 backdrop-blur border-b border-gray-800 py-3 px-2 mb-6 flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-mono text-gray-400 hover:text-orange-500 transition-colors uppercase tracking-wider cursor-pointer">
          <span className="text-orange-500">&lt;</span> Back
        </button>
        <div className="flex gap-2">
            {isBookmarked && (
                <button onClick={() => onMarkRead(story)} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${story.read ? 'border-green-900 text-green-500 bg-green-900/20' : 'border-gray-700 text-gray-400 hover:text-green-400'}`}>
                <CheckCircle size={14} /> {story.read ? 'READ' : 'MARK_READ'}
                </button>
            )}
            <button onClick={() => onToggleBookmark(story)} className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-colors ${isBookmarked ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-gray-700 text-gray-400 hover:text-white'}`}>
            <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} /> {isBookmarked ? 'SAVED' : 'SAVE'}
            </button>
        </div>
      </div>

      <div className="relative mb-6 group w-full">
         <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Hash size={120} className="text-white" /></div>
             <div className="absolute inset-0 bg-[#050505]"></div>
         </div>

         <div className="relative z-10 p-6 border-y border-transparent w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 mb-6 leading-tight font-sans tracking-tight break-words">{story.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-500 mb-6 border-b border-gray-800 pb-4 items-center">
                <a href={`https://news.ycombinator.com/item?id=${story.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-gray-400 hover:text-orange-500 transition-colors">
                    <ArrowUp size={12} className="text-orange-500/50" /> {story.score} pts
                </a>
                
                <div className="flex items-center gap-1 px-2 border-l border-gray-800">
                   <UserHoverCard username={story.by} />
                </div>
                
                <span className="flex items-center gap-1 px-2 border-l border-gray-800 cursor-help" title={exactDate}> {timeAgo(displayTime)}</span>

                {story.read && (
                    <span className="text-green-600 font-bold flex items-center gap-1 px-2 border-l border-gray-800">
                        [READ]
                    </span>
                )}

                <span className={`font-bold px-2 border-l border-gray-800 ${categoryColor}`}>
                    #{category}
                </span>

                {/* Explicit Open on HN in Detail */}
                <a href={`https://news.ycombinator.com/item?id=${story.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-400 hover:text-orange-500 px-2 border-l border-gray-800 transition-colors uppercase font-bold">
                    <ExternalLink size={12} /> HN
                </a>

                {story.url && (
                    <a href={story.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-2 bg-orange-900/10 hover:bg-orange-500 text-orange-500 hover:text-black border border-orange-500/30 hover:border-orange-500 font-bold font-mono text-[10px] px-3 py-1.5 rounded-sm transition-all uppercase tracking-wider">
                        OPEN_LINK [{new URL(story.url).hostname.replace('www.', '')}] <ExternalLink size={10} />
                    </a>
                )}
            </div>

            {!story.url && (
              <div 
                className={`
                  prose prose-invert max-w-none text-gray-300 font-sans break-words overflow-hidden
                  [&_p]:mb-6 [&_p]:leading-relaxed
                  [&_p]:relative [&_p]:pl-4 [&_p]:-ml-4 [&_p]:py-1 [&_p]:rounded-sm
                  [&_p]:border-l-2 [&_p]:border-transparent
                  hover:[&_p]:border-orange-500 hover:[&_p]:bg-white/5 hover:[&_p]:text-gray-100
                  [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:rounded-sm [&_pre]:border [&_pre]:border-gray-800 [&_pre]:overflow-x-auto
                  [&_a]:text-orange-400/80 [&_a]:underline [&_a]:decoration-orange-400/30 [&_a:hover]:text-orange-400
                  [&_i]:italic [&_b]:font-bold
                `}
                dangerouslySetInnerHTML={{ __html: story.text }}
                onClick={handleContentClick}
              />
            )}
         </div>
      </div>

      <div className="pt-2 w-full">
        <div className="flex items-center justify-between px-4 mb-4">
            <h3 className="text-sm font-mono font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
              <MessageSquare size={14} className="text-orange-500"/> COMMENTS ({story.descendants || 0})
            </h3>
            
            <a 
                href={`https://news.ycombinator.com/item?id=${story.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-gray-500 hover:text-orange-500 transition-colors uppercase"
            >
                <CornerDownRight size={12} /> Add Comment
            </a>
        </div>
        <div className="space-y-0 px-0 md:px-4">
          {story.kids ? story.kids.map(kidId => <Comment key={kidId} id={kidId} />) : <p className="text-gray-600 font-mono italic px-4 py-8 border-y border-gray-800 text-center">No entries found.</p>}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function HackerNewsApp() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('hn_settings');
    // Changed defaultSort to 'time' (Newest) per request
    return saved ? { defaultView: 'top', openLinksExternally: false, defaultSort: 'time', ...JSON.parse(saved) } : { defaultView: 'top', openLinksExternally: false, defaultSort: 'time' };
  });

  const [view, setView] = useState('list');
  const [selectedStory, setSelectedStory] = useState(null);
  const [category, setCategory] = useState(settings.defaultView);
  
  const [storyIds, setStoryIds] = useState([]);
  const [visibleStories, setVisibleStories] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState(settings.defaultSort || 'time'); // Initialize with setting (NEWEST default)
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0); 
  const refreshTimerRef = useRef(null);

  const ITEMS_PER_PAGE = 20;

  const categories = [
    { id: 'top', label: 'TOP', icon: <Trophy size={14} /> },
    { id: 'new', label: 'NEW', icon: <Zap size={14} /> },
    { id: 'best', label: 'BEST', icon: <ArrowUp size={14} /> },
    { id: 'ask', label: 'ASK', icon: <HelpCircle size={14} /> },
    { id: 'show', label: 'SHOW', icon: <Monitor size={14} /> },
    { id: 'job', label: 'JOBS', icon: <Briefcase size={14} /> },
    { id: 'bookmarks', label: 'SAVED', icon: <Bookmark size={14} /> },
  ];

  // FUNCTIONS DEFINED BEFORE USE
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('hn_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  const loadBookmarks = async () => {
    const saved = await dbManager.getAllBookmarks();
    saved.sort((a, b) => b.savedAt - a.savedAt);
    setBookmarks(saved);
  };

  const fetchStories = useCallback(async (isSilent = false) => {
    if (category === 'bookmarks') {
      setLoading(false);
      return; 
    }
    
    if (!isSilent) setLoading(true);
    
    try {
      const ids = await api.getStories(category);
      setStoryIds(ids);
      const pageIds = ids.slice(0, ITEMS_PER_PAGE);
      const stories = await Promise.all(pageIds.map(id => api.getItem(id)));
      setVisibleStories(stories.filter(Boolean));
      setPage(0);
    } catch (e) {
      console.error("Failed to load HN", e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [category, ITEMS_PER_PAGE]);

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    const start = nextPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const nextIds = storyIds.slice(start, end);
    const newStories = await Promise.all(nextIds.map(id => api.getItem(id)));
    setVisibleStories(prev => [...prev, ...newStories.filter(Boolean)]);
    setPage(nextPage);
    setLoading(false);
  };

  const handleStoryClick = (story) => {
    if (settings.openLinksExternally && story.url) {
        window.open(story.url, '_blank', 'noopener,noreferrer');
    } else {
        const savedState = bookmarks.find(b => b.id === story.id);
        setSelectedStory(savedState || story);
        setView('detail');
        window.scrollTo(0, 0);
    }
  };

  const handleToggleBookmark = async (story) => {
    const isSaved = bookmarks.some(b => b.id === story.id);
    if (isSaved) await dbManager.removeBookmark(story.id);
    else await dbManager.addBookmark(story);
    await loadBookmarks();
  };

  const handleMarkRead = async (story) => {
     const newStatus = !story.read;
     const updated = await dbManager.toggleReadStatus(story.id, newStatus);
     if (updated) {
         setSelectedStory(updated); 
         await loadBookmarks();
     }
  };

  const handleBack = () => {
    setView('list');
    setSelectedStory(null);
  };

  const sortedStories = useMemo(() => {
    let list = category === 'bookmarks' ? [...bookmarks] : [...visibleStories];
    switch (sortBy) {
      case 'score': return list.sort((a, b) => (b.score || 0) - (a.score || 0));
      case 'time': return list.sort((a, b) => (b.time || 0) - (a.time || 0));
      case 'comments': return list.sort((a, b) => (b.descendants || 0) - (a.descendants || 0));
      case 'rank': default: return list;
    }
  }, [visibleStories, bookmarks, category, sortBy]);

  // EFFECTS
  useEffect(() => { loadBookmarks(); }, []);

  useEffect(() => {
    if (category === 'bookmarks') {
        setLoading(false);
    } else {
        fetchStories();
    }
  }, [category, fetchStories]);

  useEffect(() => {
    if (autoRefreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => fetchStories(true), autoRefreshInterval);
    }
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [autoRefreshInterval, fetchStories]);

  return (
    <ErrorBoundary>
      <div className="dark min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
        
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          settings={settings} 
          onSave={handleSaveSettings} 
        />

        <header className="sticky top-0 z-30 bg-[#050505]/95 backdrop-blur border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 h-14 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setView('list'); setSelectedStory(null); }}>
              <div className="bg-orange-600 text-black font-bold font-mono px-2 py-0.5 text-sm select-none group-hover:bg-orange-500 transition-colors">Y</div>
              <h1 className="font-mono font-bold tracking-tight text-gray-100 group-hover:text-white">HACKER_NEWS<span className="text-orange-500 animate-pulse">_</span></h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSettings(true)} className="text-xs font-mono font-bold text-gray-500 hover:text-white border border-gray-800 hover:border-gray-600 px-3 py-1 rounded-sm transition-colors">
                  SETTINGS
              </button>
              <button onClick={() => fetchStories(false)} className="text-gray-500 hover:text-orange-500 transition-colors p-1" title="Refresh Feed"><RefreshCw size={16} /></button>
              <div className="hidden sm:flex bg-[#0a0a0a] rounded-sm border border-gray-800 overflow-hidden">
                  {[30000, 60000, 300000, 0].map(val => (
                      <button 
                          key={val}
                          onClick={() => setAutoRefreshInterval(val)} 
                          className={`px-2 py-1 text-[10px] font-mono transition-colors border-r border-gray-800 last:border-0 ${autoRefreshInterval === val ? 'bg-orange-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                          {val === 0 ? 'OFF' : val/1000 + 's'}
                      </button>
                  ))}
              </div>
            </div>
          </div>
        </header>

        {view === 'list' && (
          <div className="sticky top-14 z-20 bg-[#050505]/95 backdrop-blur border-b border-gray-800/50">
            <div className="max-w-4xl mx-auto px-2 sm:px-4">
              <div className="flex items-center justify-between py-2">
                  {/* MOBILE NAV SELECTOR (< SM) */}
                  <div className="block sm:hidden w-full mr-2">
                    <div className="relative">
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full appearance-none bg-[#0a0a0a] border border-gray-800 text-gray-300 py-1.5 px-3 pr-8 rounded-sm text-xs font-mono uppercase focus:outline-none focus:border-orange-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label} {cat.id === 'bookmarks' ? `(${bookmarks.length})` : ''}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ChevronDown size={12} />
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP NAV SCROLL CONTAINER (>= SM) */}
                  <div className="hidden sm:flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar flex-1 mr-2">
                  {categories.map((cat) => (
                      <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-mono tracking-wider transition-all whitespace-nowrap ${category === cat.id ? 'bg-orange-500/10 text-orange-500 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'text-gray-500 hover:text-gray-300 border border-transparent hover:border-gray-800'}`}
                      >
                      {cat.icon}{cat.label}
                      {cat.id === 'bookmarks' && bookmarks.length > 0 && <span className="ml-1 px-1 bg-gray-100 text-black rounded text-[9px] font-bold">{bookmarks.length}</span>}
                      </button>
                  ))}
                  </div>
                  
                  {/* SORT DROPDOWN - Compact & Fixed on Right */}
                  {category !== 'bookmarks' && (
                      <div className="shrink-0 border-l border-gray-800 pl-4">
                          <SortDropdown currentSort={sortBy} onSortChange={setSortBy} />
                      </div>
                  )}
              </div>
            </div>
          </div>
        )}

        <main className="max-w-4xl mx-auto px-0 sm:px-4 pb-10 mt-6 w-full overflow-hidden">
          {loading && view === 'list' && page === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 font-mono text-sm text-gray-500">
              <Loader2 className="animate-spin text-orange-500 mb-4" size={24} />
              <span className="animate-pulse">FETCHING_DATA_STREAM...</span>
            </div>
          ) : view === 'list' ? (
            <div className="space-y-4">
              <div className="border-t border-gray-800">
                {sortedStories.length === 0 && !loading ? (
                  <div className="py-20 text-center font-mono text-gray-600">NO_DATA_AVAILABLE</div>
                ) : (
                  sortedStories.map((story, index) => {
                    const bookmark = bookmarks.find(b => b.id === story.id);
                    return (
                      <StoryItem 
                          key={story.id} 
                          id={story.id} 
                          storyData={story}
                          index={index} 
                          onClick={handleStoryClick}
                          isBookmarked={!!bookmark}
                          isRead={bookmark?.read} 
                          onToggleBookmark={handleToggleBookmark}
                          isBookmarkView={category === 'bookmarks'}
                      />
                    );
                  })
                )}
              </div>
              
              {category !== 'bookmarks' && (
                <div className="text-center pt-4 pb-8">
                  <button 
                      onClick={loadMore} 
                      disabled={loading}
                      className="font-mono text-sm px-8 py-3 bg-[#0a0a0a] border border-gray-800 text-gray-400 hover:text-orange-500 hover:border-orange-500 transition-all uppercase tracking-widest active:bg-gray-900 disabled:opacity-50"
                  >
                    {loading ? 'LOADING...' : '[ Load_More_Data ]'}
                  </button>
                </div>
              )}
            </div>
          ) : view === 'detail' ? (
            <StoryDetail 
              story={selectedStory} 
              onBack={handleBack} 
              isBookmarked={bookmarks.some(b => b.id === selectedStory?.id)}
              onToggleBookmark={handleToggleBookmark}
              onMarkRead={handleMarkRead}
            />
          ) : null }
        </main>
      </div>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HackerNewsApp />
    </React.StrictMode>
  );
} else {
  console.error("FATAL: No se encontró el elemento 'root' en el HTML");
}
