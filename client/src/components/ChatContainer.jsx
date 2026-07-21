import React, { useContext, useEffect, useRef, useState } from 'react'
import toast from "react-hot-toast";
import assets from '../assets/assets'
import { FormatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const ChatContainer = () => {

  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages,
          blockedUsers, blockedByUsers, pendingRequests, acceptRequest, blockUser, unblockUser } = useContext(ChatContext)
  const { authUser, onlineUsers, axios } = useContext(AuthContext)

  const scrollEnd = useRef()
  const [input, setInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');

  const isBlocked = selectedUser && blockedUsers.map(id => id.toString()).includes(selectedUser._id.toString());
  const isBlockedByThem = selectedUser && blockedByUsers.map(id => id.toString()).includes(selectedUser._id.toString());
  const isPending = selectedUser && !!pendingRequests[selectedUser._id];

  const handleSendMessage = async (e)=>{
    e.preventDefault()
    if(input.trim() === "") return;
    await sendMessage({text: input.trim()});
    setInput("")
  }

  const handleSendImage = async (e)=>{
    const file = e.target.files[0];
    if(!file || !file.type.startsWith("image/")){
      toast.error("Select an image file")
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async ()=>{
      await sendMessage({image: reader.result})
      e.target.value = ""
    }
    reader.readAsDataURL(file);
  }

  const handleAccept = async ()=>{
    await acceptRequest(selectedUser._id);
    getMessages(selectedUser._id);
  }

  const handleBlock = async ()=>{
    await blockUser(selectedUser._id);
  }

  const handleUnblock = async ()=>{
    await unblockUser(selectedUser._id);
  }

  const handleAiSuggest = async () => {
    if(messages.length === 0){
        toast.error("No messages to base suggestion on");
        return;
    }
    setIsAiLoading(true);
    setInput("AI is thinking...");
    try{
        const { data } = await axios.post("/api/ai/suggest", {
            messages,
            tone,
            input: input === "AI is thinking..." ? "" : input
        });
        if(data.success){
            setInput(data.suggestion);
        } else {
            setInput("");
            toast.error(data.message);
        }
    } catch(error){
        setInput("");
        const msg = error.message?.includes("503")
            ? "AI is busy, please try again"
            : error.message;
        toast.error(msg);
    } finally {
        setIsAiLoading(false);
    }
}

const handleScheduleMessage = async () => {
    if (!scheduleTime) {
        toast.error("Please select a time");
        return;
    }
    if (input.trim() === "" && !showScheduleMenu) {
        toast.error("Type a message first");
        return;
    }

    try {
        const { data } = await axios.post(`/api/messages/schedule/${selectedUser._id}`, {
            text: input.trim(),
            scheduledAt: scheduleTime
        });
        if(data.success) {
            toast.success("Message scheduled for " + new Date(scheduleTime).toLocaleString());
            setInput("");
            setShowScheduleMenu(false);
            setScheduleTime("");
            getMessages(selectedUser._id);
        } else {
            toast.error(data.message);
        }
    } catch(error) {
        toast.error(error.message);
    }
}

const handleSendScheduledMessage = async () => {
    if (input.trim() === "") return;
    
    try {
        const { data } = await axios.post(`/api/messages/schedule/${selectedUser._id}`, {
            text: input.trim(),
            scheduledAt: scheduleTime
        });
        if(data.success) {
            toast.success("Message scheduled for " + new Date(scheduleTime).toLocaleString());
            setInput("");
            setShowScheduleMenu(false);
            setScheduleTime("");
            getMessages(selectedUser._id);
        } else {
            toast.error(data.message);
        }
    } catch(error) {
        toast.error(error.message);
    }
}

const handleSendNow = () => {
    if (input.trim() === "") return;
    sendMessage({text: input.trim()});
    setInput("");
}


  useEffect(() => {
    if (!selectedUser || isBlocked || isBlockedByThem || isPending) return;
    getMessages(selectedUser._id);

    const interval = setInterval(() => {
      getMessages(selectedUser._id);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    if(scrollEnd.current && messages){
      scrollEnd.current.scrollIntoView({ behavior: "smooth" })
    }
  },[ messages, selectedUser ])

  // ---- Blocked By Them Screen ----
  if(selectedUser && isBlockedByThem){
    return (
      <div className='h-full flex flex-col backdrop-blur-lg'>
        {/* Header */}
        <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
          <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full opacity-50'/>
          <p className='flex-1 text-lg text-gray-400'>{selectedUser.fullName}</p>
          <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt="" className='max-w-7'/>
        </div>
        {/* Blocked by them message */}
        <div className='flex-1 flex flex-col items-center justify-center gap-4 text-center px-6'>
          <div className='text-5xl'>🚫</div>
          <p className='text-white text-lg font-medium'>You have been blocked</p>
          <p className='text-gray-400 text-sm'>You can no longer send messages to @{selectedUser.username}</p>
        </div>
      </div>
    )
  }

  // ---- Blocked Screen ----
  if(selectedUser && isBlocked){
    return (
      <div className='h-full flex flex-col backdrop-blur-lg'>
        {/* Header */}
        <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
          <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full opacity-50'/>
          <p className='flex-1 text-lg text-gray-400 line-through'>{selectedUser.fullName}</p>
          <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt="" className='max-w-7'/>
        </div>
        {/* Blocked message */}
        <div className='flex-1 flex flex-col items-center justify-center gap-4 text-center px-6'>
          <div className='text-5xl'>🚫</div>
          <p className='text-white text-lg font-medium'>You have blocked @{selectedUser.username}</p>
          <p className='text-gray-400 text-sm'>You can't send or receive messages from this person.</p>
          <button onClick={handleUnblock}
          className='mt-2 px-6 py-2 bg-gradient-to-r from-purple-400 to-violet-600 
          text-white rounded-full text-sm cursor-pointer'>
            Unblock User
          </button>
        </div>
      </div>
    )
  }

  // ---- Pending Invite Screen ----
  if(selectedUser && isPending){
    const firstMessage = messages[0];
    return (
      <div className='h-full flex flex-col backdrop-blur-lg'>
        {/* Header */}
        <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
          <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full'/>
          <p className='flex-1 text-lg text-white'>{selectedUser.fullName}</p>
          <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt="" className='max-w-7'/>
        </div>
        {/* Invite screen */}
        <div className='flex-1 flex flex-col items-center justify-center gap-4 text-center px-6'>
          <img src={selectedUser.profilePic || assets.avatar_icon} alt=""
          className='w-16 h-16 rounded-full'/>
          <p className='text-white text-lg font-medium'>@{selectedUser.username} wants to chat</p>
          {/* Show first message preview */}
          {firstMessage && (
            <div className='bg-white/10 rounded-lg px-4 py-3 max-w-xs'>
              <p className='text-gray-300 text-sm italic'>"{firstMessage.text || "📷 Image"}"</p>
            </div>
          )}
          <p className='text-gray-400 text-xs'>You haven't chatted with this person before</p>
          <div className='flex gap-3 mt-2'>
            <button onClick={handleAccept}
            className='px-6 py-2 bg-gradient-to-r from-purple-400 to-violet-600 
            text-white rounded-full text-sm cursor-pointer'>
              Accept Invite
            </button>
            <button onClick={handleBlock}
            className='px-6 py-2 bg-red-500/20 border border-red-500 
            text-red-400 rounded-full text-sm cursor-pointer'>
              Block
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Normal Chat Screen ----
  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* Header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full'/>
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500 inline-block'></span>}
        </p>
        <button onClick={handleBlock}
        className='text-xs text-red-400 border border-red-400/50 px-2 py-1 rounded-full 
        hover:bg-red-500/20 cursor-pointer transition-colors'>
          Block
        </button>
        <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt="" className='max-w-7'/>
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5'/>
      </div>

      {/* Messages */}
      <div>
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {msg.image ? (
              <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'/>
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white 
              ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                {msg.isScheduled && !msg.sent ? (
                  <>
                    <span className="text-xs text-yellow-400">⏳ Scheduled for {FormatMessageTime(msg.scheduledAt)}</span>
                    <br />
                  </>
                ) : null}
                {msg.isAutoReply ? (
                  <>
                    <span className="text-xs text-blue-300">🤖 Auto-reply</span>
                    <br />
                  </>
                ) : null}
                {msg.text}
              </p>
            )}
            <div className='text-center text-xs'>
              <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon}
              alt='' className='w-7 rounded-full'/>
              <p className='text-gray-500'>{FormatMessageTime(msg.createdAt)}</p>
            </div>
          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input Area */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input onChange={(e)=>{ setInput(e.target.value); }} value={input}
          onKeyDown={(e)=> e.key === "Enter" ? handleSendNow() : null}
          type="text" placeholder="Send a message"
          className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'/>

          {/* Regenerate button (shows after suggestions) */}
          {input && !isAiLoading && (
            <button onClick={handleAiSuggest}
            className='text-sm mr-1 cursor-pointer opacity-60 hover:opacity-100'
            title="Regenerate">🔄</button>
          )}

          {/* Tone selector */}
          <div className='relative'>
            <button onClick={()=>setShowToneMenu(!showToneMenu)}
            className='text-lg mr-1 cursor-pointer disabled:opacity-50'
            disabled={isAiLoading}
            title="AI Suggest">
              {isAiLoading ? "⏳" : "🤖"}
            </button>
            {showToneMenu && (
              <div className='absolute bottom-10 right-0 bg-[#282142] border border-gray-600
              rounded-lg p-2 flex flex-col gap-1 z-10 w-36'>
                {[{emoji:"😊",t:"friendly"},{emoji:"💼",t:"professional"},{emoji:"😂",t:"funny"},{emoji:"❤️",t:"romantic"}].map(({emoji, t}) => (
                  <button key={t}
                  onClick={()=>{ setTone(t); setShowToneMenu(false); handleAiSuggest(); }}
                  className={`text-xs px-3 py-1.5 rounded text-left cursor-pointer
                  hover:bg-violet-500/30 ${tone===t ? 'bg-violet-500/20 text-violet-300' : 'text-gray-300'}`}>
                    {emoji} {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Schedule menu */}
          <div className='relative'>
            <button onClick={() => setShowScheduleMenu(!showScheduleMenu)}
            className='text-lg mr-1 cursor-pointer disabled:opacity-50'
            title="Schedule Message">
              {showScheduleMenu ? "✅" : "⏱️"}
            </button>
            {showScheduleMenu && (
              <div className='absolute bottom-10 right-0 bg-[#282142] border border-gray-600
              rounded-lg p-3 flex flex-col gap-2 z-10 w-64'>
                <input type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className='p-2 rounded bg-gray-800 text-white text-sm w-full border border-gray-600 focus:border-violet-500 outline-none'/>
                <button onClick={handleSendScheduledMessage}
                className='px-4 py-2 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded text-sm'>
                  Schedule
                </button>
                <button onClick={() => { setShowScheduleMenu(false); setScheduleTime(''); }}
                className='px-4 py-2 bg-gray-600 text-white rounded text-sm'>
                  Cancel
                </button>
              </div>
            )}
          </div>

          <input onChange={handleSendImage} type="file" id="image" accept='image/png, image/jpeg' hidden/>
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer'/>
          </label>
        </div>
        <img onClick={handleSendNow} src={assets.send_button} alt="" className='w-7 cursor-pointer'/>
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10'>
      <img src={assets.logo_icon} className='max-w-16' alt=""/>
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer
