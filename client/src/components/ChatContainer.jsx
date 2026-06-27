import React, { useContext, useEffect, useRef, useState } from 'react'
import toast from "react-hot-toast";
import assets from '../assets/assets'
import { FormatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const ChatContainer = () => {

  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages,
          blockedUsers, blockedByUsers, pendingRequests, acceptRequest, blockUser, unblockUser } = useContext(ChatContext)
  const { authUser, onlineUsers } = useContext(AuthContext)

  const scrollEnd = useRef()
  const [input, setInput] = useState('');

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
          <input onChange={(e)=> setInput(e.target.value)} value={input}
          onKeyDown={(e)=> e.key === "Enter" ? handleSendMessage(e) : null}
          type="text" placeholder="Send a message"
          className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400'/>
          <input onChange={handleSendImage} type="file" id="image" accept='image/png, image/jpeg' hidden/>
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer'/>
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-7 cursor-pointer'/>
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
