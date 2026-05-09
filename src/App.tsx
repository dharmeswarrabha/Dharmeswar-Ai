/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Menu, X, Plus, Settings, Send, MessageSquareText, Copy, ThumbsUp, ThumbsDown, Volume2, Share2, MoreVertical, Mic, AudioLines, Check, Square, Split, RefreshCw, Globe, Folder, Image as ImageIcon, LayoutGrid, Search, Bot, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

const MessageActions = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thumbState, setThumbState] = useState<'up'|'down'|null>(null);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    };
    if (showMore) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMore]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.onend = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setSpeaking(true);
      }
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Chat',
          text: content,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopy();
      alert("Text copied to clipboard!");
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-3 text-gray-400">
      <button onClick={handleCopy} className="p-1.5 hover:bg-gemini-surface hover:text-white rounded-md transition-colors" title="Copy">
        {copied ? <Check className="w-[18px] h-[18px] text-green-500" strokeWidth={2} /> : <Copy className="w-[18px] h-[18px]" strokeWidth={2} />}
      </button>
      <button onClick={() => setThumbState(thumbState === 'up' ? null : 'up')} className={`p-1.5 rounded-md transition-colors ${thumbState === 'up' ? 'bg-gemini-surface text-white' : 'hover:bg-gemini-surface hover:text-white'}`} title="Good response">
        <ThumbsUp className="w-[18px] h-[18px]" strokeWidth={2} />
      </button>
      <button onClick={() => setThumbState(thumbState === 'down' ? null : 'down')} className={`p-1.5 rounded-md transition-colors ${thumbState === 'down' ? 'bg-gemini-surface text-white' : 'hover:bg-gemini-surface hover:text-white'}`} title="Bad response">
        <ThumbsDown className="w-[18px] h-[18px]" strokeWidth={2} />
      </button>
      <button onClick={handleSpeak} className={`p-1.5 rounded-md transition-colors ${speaking ? 'bg-gemini-surface text-white' : 'hover:bg-gemini-surface hover:text-white'}`} title="Read aloud">
        <Volume2 className="w-[18px] h-[18px]" strokeWidth={2} />
      </button>
      <button onClick={handleShare} className="p-1.5 hover:bg-gemini-surface hover:text-white rounded-md transition-colors" title="Share">
        <Share2 className="w-[18px] h-[18px]" strokeWidth={2} />
      </button>
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setShowMore(!showMore)} className={`p-1.5 rounded-md transition-colors ${showMore ? 'bg-gemini-surface text-white' : 'hover:bg-gemini-surface hover:text-white'}`} title="More">
          <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
        {showMore && (
          <div className="absolute top-full left-0 mt-1 w-52 bg-[#1e1f20] border border-[#444746] rounded-2xl shadow-xl py-2 z-10 flex flex-col">
            <button 
              className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] transition-colors flex items-center gap-3.5"
              onClick={() => { alert('Branching coming soon!'); setShowMore(false); }}
            >
              <Split className="w-5 h-5 text-[#e3e3e3]" strokeWidth={2.2} />
              Branch in new chat
            </button>
            <div className="h-[1px] bg-[#444746]/60 my-0.5 mx-4" />
            <button 
              className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] transition-colors flex items-center gap-3.5"
              onClick={() => { alert('Retry functionality coming soon!'); setShowMore(false); }}
            >
              <RefreshCw className="w-5 h-5 text-[#e3e3e3]" strokeWidth={2.2} />
              Retry
            </button>
            <button 
              className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] transition-colors flex items-center gap-3.5"
              onClick={() => { 
                window.open(`https://www.google.com/search?q=${encodeURIComponent(content.slice(0, 100))}`, '_blank'); 
                setShowMore(false); 
              }}
            >
              <Globe className="w-5 h-5 text-[#e3e3e3]" strokeWidth={2.2} />
              Search the web
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [apiKey, setApiKey] = useState<string>(
    () => localStorage.getItem('universal_ai_key') || ''
  );
  const [model, setModel] = useState<string>(
    () => localStorage.getItem('universal_ai_model') || 'google/gemini-2.5-pro'
  );
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('universal_ai_chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [inputText, setInputText] = useState('');
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Settings Form State
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempModel, setTempModel] = useState('');

  const [showChatOptions, setShowChatOptions] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [currentView, setCurrentView] = useState<'chat' | 'images' | 'projects' | 'apps'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAllImages = () => {
    const images: { src: string, alt: string, chatId: string, chatTitle: string }[] = [];
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    chats.forEach(chat => {
      chat.messages.forEach(msg => {
        let match;
        const msgContent = msg.content;
        while ((match = regex.exec(msgContent)) !== null) {
          images.push({ alt: match[1], src: match[2], chatId: chat.id, chatTitle: chat.title });
        }
      });
    });
    return images;
  };

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.delete-btn')) return;
      setShowChatOptions(null);
    };
    if (showChatOptions) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [showChatOptions]);

  const handleDeleteChat = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const newChats = chats.filter(c => c.id !== id);
    if (newChats.length === 0) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [],
      };
      setChats([newChat]);
      setCurrentChatId(newChat.id);
    } else {
      setChats(newChats);
      if (currentChatId === id) {
        setCurrentChatId(newChats[0].id);
      }
    }
    setShowChatOptions(null);
  };

  // Initialize and load saved values
  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    } else if (!currentChatId) {
      setCurrentChatId(chats[0].id);
    }
  }, []); // Run once on mount

  // Sync to local storage on change
  useEffect(() => {
    localStorage.setItem('universal_ai_chats', JSON.stringify(chats));
    localStorage.setItem('universal_ai_key', apiKey);
    localStorage.setItem('universal_ai_model', model);
  }, [chats, apiKey, model]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId, isGenerating]);

  const currentChat = chats.find(c => c.id === currentChatId) || null;

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isGenerating || !currentChat) return;

    if (!apiKey) {
      alert('Please set your OpenRouter API Key in Settings first.');
      openSettings();
      return;
    }

    // Add user message locally
    const newUserMessage: Message = { role: 'user', content: text };
    
    setChats(prevChats => prevChats.map(c => {
      if (c.id === currentChatId) {
        // Auto-generate title if it's the first message
        const newTitle = c.messages.length === 0 
          ? (text.length > 30 ? text.substring(0, 30) + '...' : text)
          : c.title;

        return { ...c, title: newTitle, messages: [...c.messages, newUserMessage] };
      }
      return c;
    }));

    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsGenerating(true);

    try {
      // Get the updated chat message history since React state may not be flushed synchronously
      const currentMessages = [...currentChat.messages, newUserMessage];
      const apiMessages = currentMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href, // Required by OpenRouter
          'X-Title': 'Universal AI Chat'        // Required by OpenRouter
        },
        body: JSON.stringify({
          model: model,
          messages: apiMessages
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API Request Failed');
      }

      const data = await response.json();
      let aiContent = data.choices[0].message.content;

      // Local intercept for image generation to populate Images section
      let imagePrompt = null;
      const generateMatch = userText.toLowerCase().match(/^(?:generate|draw|create) (?:an? )?(?:image|picture|photo) of (.*)/i);
      const simpleMatch = userText.toLowerCase().match(/^(?:image|picture|photo) of (.*)/i);
      
      if (generateMatch && generateMatch[1]) {
        imagePrompt = generateMatch[1];
      } else if (simpleMatch && simpleMatch[1]) {
        imagePrompt = simpleMatch[1];
      } else if (userText.toLowerCase().includes('generate image')) {
        imagePrompt = userText.toLowerCase().replace('generate image', '').trim() || 'random image';
      }
                             
      if (imagePrompt) {
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&nologo=1&seed=${Math.floor(Math.random() * 10000)}`;
        aiContent += `\n\nHere is your generated image:\n![${imagePrompt}](${imageUrl})`;
      }

      setChats(prevChats => prevChats.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: [...c.messages, { role: 'assistant', content: aiContent }] };
        }
        return c;
      }));

    } catch (error: any) {
      console.error('API Error:', error);
      setChats(prevChats => prevChats.map(c => {
        if (c.id === currentChatId) {
          return { ...c, messages: [...c.messages, { role: 'assistant', content: `**Error:** ${error.message}` }] };
        }
        return c;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openSettings = () => {
    setTempApiKey(apiKey);
    setTempModel(model);
    setIsSettingsOpen(true);
  };

  const saveSettings = () => {
    setApiKey(tempApiKey.trim());
    setModel(tempModel.trim() || 'google/gemini-2.5-pro');
    setIsSettingsOpen(false);
  };

  const toggleRecording = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isRecording) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(err) {}
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice recognition is not supported in this browser. Try Chrome.");
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; // Better for mobile reliability
        recognition.interimResults = true;

        // Capture what's already typed
        const startText = textareaRef.current?.value || '';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInputText(startText + (startText && currentTranscript ? ' ' : '') + currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please check your system/browser permissions.');
          } else if (event.error !== 'no-speech') {
            // Suppress generic network errors which happen often silently
          }
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (err) {
        console.error("Recording init error:", err);
        setIsRecording(false);
      }
    }
  };

  // Adjust textarea height on Input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  return (
    <div className="bg-gemini-bg text-gemini-text h-screen flex overflow-hidden font-sans selection:bg-gemini-accent selection:text-gemini-bg">
      
      {/* Sidebar */}
      <aside 
        className={`w-64 bg-gemini-sidebar border-r border-gemini-border flex flex-col transition-transform duration-300 absolute md:relative z-20 h-full ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-4 py-5 flex items-center justify-between">
          <span className="font-semibold text-[19px] tracking-wide cursor-pointer hover:text-gray-300 transition-colors">Dharmeswar Ai</span>
          <div className="flex items-center gap-1.5 bg-[#171717] rounded-full px-1 py-1 border border-[#303030]">
            <button className="text-gray-300 hover:text-white p-1 rounded-full transition-colors">
               <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>
            <div className="w-[26px] h-[26px] rounded-full bg-orange-500 flex items-center justify-center text-[11px] font-medium text-white shadow-sm mr-0.5">
              DR
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-gray-400 hover:text-white ml-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-2 space-y-1">
          <button onClick={() => setCurrentView('projects')} className={`w-full flex items-center gap-3.5 text-left px-3 py-2 text-[17px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] rounded-xl transition-colors ${currentView === 'projects' ? 'bg-[#3d3f42]' : ''}`}>
            <Folder className="w-[22px] h-[22px]" strokeWidth={2} />
            Projects
          </button>
          <button onClick={() => setCurrentView('images')} className={`w-full flex items-center gap-3.5 text-left px-3 py-2 text-[17px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] rounded-xl transition-colors ${currentView === 'images' ? 'bg-[#3d3f42]' : ''}`}>
            <ImageIcon className="w-[22px] h-[22px]" strokeWidth={2} />
            Images
          </button>
          <button onClick={() => setCurrentView('apps')} className={`w-full flex items-center gap-3.5 text-left px-3 py-2 text-[17px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] rounded-xl transition-colors mb-2 ${currentView === 'apps' ? 'bg-[#3d3f42]' : ''}`}>
            <LayoutGrid className="w-[22px] h-[22px]" strokeWidth={2} />
            Apps
          </button>
        </div>

        <div className="px-4 pt-6 pb-2">
          <span className="text-[19px] font-bold text-[#e3e3e3] tracking-wide">GPTs</span>
        </div>

        <div className="px-2 space-y-1 border-b border-gemini-border pb-4 mb-2">
          <button onClick={() => alert('Video AI by invideo coming soon!')} className="w-full flex items-center gap-3.5 text-left px-3 py-2 text-[17px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] rounded-xl transition-colors">
            <Bot className="w-[22px] h-[22px]" strokeWidth={2} />
            Video AI by invideo
          </button>
          <button onClick={() => alert('Veo 3 coming soon!')} className="w-full flex items-center gap-3.5 text-left px-3 py-2 text-[17px] font-medium text-[#e3e3e3] hover:bg-[#3d3f42] rounded-xl transition-colors">
            <div className="w-[22px] h-[22px] rounded flex items-center justify-center border border-[#303030] bg-[#1e1f20]">
              <span className="text-[#3b82f6] font-bold text-[12px] transform scale-[1.2]">V</span>
            </div>
            <span className="truncate">Veo 3- Text/Image to Vide...</span>
          </button>
        </div>
        
        <div className="px-3 pb-2 pt-2">
          <button 
            onClick={() => { createNewChat(); setCurrentView('chat'); }}
            className="w-full flex items-center gap-2 bg-gemini-surface hover:bg-gray-700 text-white py-2.5 px-4 rounded-xl transition-colors border border-gemini-border"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              className="relative group"
              onContextMenu={(e) => { 
                e.preventDefault(); 
                setShowChatOptions(chat.id); 
              }}
              onTouchStart={() => {
                longPressTimer.current = setTimeout(() => {
                  setShowChatOptions(chat.id);
                }, 500);
              }}
              onTouchEnd={() => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
              }}
              onTouchMove={() => {
                if (longPressTimer.current) clearTimeout(longPressTimer.current);
              }}
            >
              <button
                onClick={() => {
                  setCurrentChatId(chat.id);
                  setCurrentView('chat');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full text-left truncate px-3 py-2 pr-10 rounded-lg text-sm transition-colors ${
                  chat.id === currentChatId && currentView === 'chat'
                    ? 'bg-gemini-surface text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {chat.title}
              </button>
              
              <button 
                onClick={(e) => handleDeleteChat(e, chat.id)}
                className={`delete-btn absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#444746] text-gray-300 rounded-md hover:bg-red-500 hover:text-white transition-colors flex-shrink-0 z-20 ${
                  showChatOptions === chat.id ? 'flex' : 'hidden md:group-hover:flex'
                }`}
                title="Delete chat"
              >
                <Trash2 className="w-[14px] h-[14px]" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gemini-border">
          <button 
            onClick={openSettings}
            className="w-full flex items-center gap-2 text-sm text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-gemini-surface transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] relative w-full overflow-hidden">
        <header className="h-14 flex shrink-0 items-center justify-between px-4 border-b border-gemini-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-medium text-lg flex items-center gap-2 capitalize">
              {currentView === 'chat' ? 'Dharmeswar Ai' : currentView}
              {currentView === 'chat' && (
                <span className="text-xs bg-gemini-surface text-gray-400 px-2 py-1 rounded-md border border-gemini-border hidden sm:inline-block">
                 {model.split('/').pop()}
                </span>
              )}
            </h1>
          </div>
        </header>

        {currentView === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
              {(!currentChat || currentChat.messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                  <MessageSquareText className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
                  <h2 className="text-2xl font-medium text-gray-200">How can I help you today?</h2>
                  <p className="max-w-md text-sm">Enter a prompt below to start a new conversation. Don't forget to configure your API key in settings.</p>
                </div>
              ) : (
                currentChat.messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full mb-6`}>
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl ${
                      msg.role === 'user' 
                        ? 'px-5 py-3 bg-gemini-user-message text-white' 
                        : 'bg-transparent text-gray-200'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div>
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          <MessageActions content={msg.content} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isGenerating && (
                <div className="flex items-center gap-3 text-gray-400 bg-gemini-surface w-max px-4 py-3 rounded-2xl mb-6">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1 invisible" />
            </div>

            {/* Input Area */}
            <div className="p-4 md:px-8 md:pb-8 w-full max-w-4xl mx-auto shrink-0">
          <div className="flex items-end bg-[#202123] md:bg-gemini-surface border border-gemini-border rounded-[28px] focus-within:ring-1 focus-within:ring-gray-500 transition-all px-2 py-1.5">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-300 hover:text-white transition-colors flex-shrink-0 mb-0.5"
              title="Attach file"
            >
              <Plus className="w-[26px] h-[26px]" strokeWidth={2} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setInputText(prev => prev + (prev ? ' ' : '') + `[Attached: ${file.name}] `);
                }
                e.target.value = '';
              }} 
            />
            <textarea 
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1} 
              className="w-full bg-transparent text-white py-3.5 px-2 focus:outline-none resize-none max-h-48 block text-[17px]" 
              placeholder="Reply to Chat..." 
            />
            <button 
              type="button"
              onClick={toggleRecording} 
              className={`p-2.5 transition-colors flex-shrink-0 mb-0.5 mr-1 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-300 hover:text-white'}`}
              title="Voice Input"
            >
              <Mic className="w-[22px] h-[22px]" strokeWidth={2} />
            </button>
            <button 
              type="button"
              onClick={(e) => inputText.trim() !== '' ? handleSend() : toggleRecording(e)}
              disabled={isGenerating && inputText.trim() !== ''}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors flex-shrink-0 mb-0.5 ${
                inputText.trim() 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : isRecording
                    ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                    : 'bg-[#10a37f] text-white hover:bg-[#0e906f]'
              }`}
            >
              {inputText.trim() !== '' ? (
                <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
              ) : isRecording ? (
                <Square className="w-4 h-4 fill-current" strokeWidth={2} />
              ) : (
                <AudioLines className="w-[22px] h-[22px]" strokeWidth={2} />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">AI can make mistakes. Consider verifying important information.</p>
        </div>
        </>
        )}

        {currentView === 'images' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {getAllImages().length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
                <ImageIcon className="w-16 h-16 text-gray-600" strokeWidth={1.5} />
                <h2 className="text-2xl font-medium text-gray-200">No images yet</h2>
                <p className="max-w-md text-sm">Images generated or attached in your chats will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {getAllImages().map((img, i) => (
                  <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-[#202123] border border-gemini-border shadow-md">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <p className="text-sm font-medium text-white line-clamp-2 mb-2">{img.alt || 'Generated Image'}</p>
                      <button 
                        onClick={() => {
                          setCurrentChatId(img.chatId);
                          setCurrentView('chat');
                        }} 
                        className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-1.5 rounded-lg w-max transition-colors"
                      >
                        View in chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(currentView === 'projects' || currentView === 'apps') && (
           <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 space-y-4 p-8">
             {currentView === 'projects' ? <Folder className="w-16 h-16 text-gray-600" strokeWidth={1.5} /> : <LayoutGrid className="w-16 h-16 text-gray-600" strokeWidth={1.5} />}
             <h2 className="text-2xl font-medium text-gray-200 capitalize">{currentView} coming soon</h2>
             <p className="max-w-md text-sm">We are working on this feature. Stay tuned!</p>
           </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gemini-surface border border-gemini-border w-full max-w-md rounded-2xl shadow-2xl p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">OpenRouter API Key</label>
                <input 
                  type="password" 
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full bg-gemini-bg border border-gemini-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gemini-accent focus:ring-1 focus:ring-gemini-accent placeholder-gray-600" 
                  placeholder="sk-or-v1-..." 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                <input 
                  type="text" 
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  className="w-full bg-gemini-bg border border-gemini-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gemini-accent focus:ring-1 focus:ring-gemini-accent" 
                  placeholder="google/gemini-2.5-pro" 
                />
                <p className="text-xs text-gray-400 mt-1">Must match OpenRouter model IDs (e.g., google/gemini-pro, openai/gpt-4o)</p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

