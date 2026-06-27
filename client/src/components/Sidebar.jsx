import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import toast from 'react-hot-toast'

const Sidebar = () => {

    const { getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages, blockedUsers, pendingRequests } = useContext(ChatContext)
    const { logout, onlineUsers, axios } = useContext(AuthContext)

    const [input, setInput] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)

    const navigate = useNavigate();

    const isBlocked = (userId) => blockedUsers.map(id => id.toString()).includes(userId.toString());
    const isPending = (userId) => !!pendingRequests[userId];

    const handleSearch = async (e) => {
        const query = e.target.value;
        setInput(query);

        if(!query.trim()){
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try{
            const { data } = await axios.get(`/api/auth/search?query=${query}`);
            if(data.success) setSearchResults(data.users);
        } catch(error){
            toast.error(error.message);
        }
    }

    useEffect(()=>{
        getUsers();
    },[onlineUsers])

    // Returns styling based on user state
    const getUserStyle = (userId) => {
        if(isBlocked(userId)) return "opacity-40 grayscale";
        if(isPending(userId)) return "opacity-60";
        return "";
    }

    return (
        <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll 
        text-white ${selectedUser ? "max-md:hidden": ''}`}>
            <div className='pb-5'>
                <div className='flex justify-between items-center'>
                    <img src={assets.logo} alt="logo" className='max-w-40'/>
                    <div className='relative py-2 group'>
                        <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer'/>
                        <div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md 
                        bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
                            <p onClick={()=> navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
                            <hr className="my-2 border-t border-gray-500" />
                            <p onClick={()=>logout()} className='cursor-pointer text-sm'>Logout</p>
                        </div>
                    </div>
                </div>

                <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
                    <img src={assets.search_icon} alt="Search" className='w-3'/>
                    <input onChange={handleSearch} value={input} type="text"
                    className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
                    placeholder='Search by username or email...'/>
                </div>
            </div>

            <div>
                {isSearching ? (
                    searchResults.length > 0 ? (
                        <>
                            <p className='text-xs text-gray-400 mb-2 px-2'>Search Results</p>
                            {searchResults.map((user) => (
                                <div key={user._id} onClick={()=>{
                                    setSelectedUser(user);
                                    setIsSearching(false);
                                    setInput('');
                                }} className={`relative flex items-center gap-2 p-2 pl-4 rounded 
                                cursor-pointer max-sm:text-sm ${selectedUser?._id===user._id && 'bg-[#282142]/50'}`}>
                                    <img src={user?.profilePic || assets.avatar_icon} alt=""
                                    className='w-[35px] aspect-[1/1] rounded-full'/>
                                    <div className='flex flex-col leading-5'>
                                        <p>{user.fullName}</p>
                                        <span className='text-gray-400 text-xs'>@{user.username}</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <p className='text-center text-gray-400 text-sm mt-4'>No users found</p>
                    )
                ) : (
                    users.map((user) => (
                        <div key={user._id}
                        onClick={()=>{ setSelectedUser(user); setUnseenMessages(prev=>({...prev, [user._id]:0})) }}
                        className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer 
                        max-sm:text-sm ${selectedUser?._id===user._id && 'bg-[#282142]/50'} 
                        ${getUserStyle(user._id)}`}>

                            <div className='relative'>
                                <img src={user?.profilePic || assets.avatar_icon} alt=""
                                className='w-[35px] aspect-[1/1] rounded-full'/>
                                {/* Blocked icon overlay */}
                                {isBlocked(user._id) && (
                                    <div className='absolute -bottom-1 -right-1 bg-red-500 rounded-full w-4 h-4 
                                    flex items-center justify-center text-white text-[8px]'>🚫</div>
                                )}
                                {/* Pending badge */}
                                {isPending(user._id) && !isBlocked(user._id) && (
                                    <div className='absolute -bottom-1 -right-1 bg-yellow-500 rounded-full w-4 h-4 
                                    flex items-center justify-center text-white text-[8px]'>!</div>
                                )}
                            </div>

                            <div className='flex flex-col leading-5'>
                                <p className={isBlocked(user._id) ? 'line-through text-gray-500' : ''}>
                                    {user.fullName}
                                </p>
                                <span className='text-xs text-gray-400'>@{user.username}</span>
                                {!isBlocked(user._id) && !isPending(user._id) && (
                                    onlineUsers.includes(user._id)
                                    ? <span className='text-green-400 text-xs'>Online</span>
                                    : <span className='text-neutral-400 text-xs'>Offline</span>
                                )}
                                {isPending(user._id) && !isBlocked(user._id) && (
                                    <span className='text-yellow-400 text-xs'>Invite pending</span>
                                )}
                            </div>

                            {unseenMessages[user._id] > 0 && !isBlocked(user._id) && (
                                <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center 
                                items-center rounded-full bg-violet-500/50'>
                                    {unseenMessages[user._id]}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Sidebar
