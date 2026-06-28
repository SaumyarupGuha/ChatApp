import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children })=>{

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedByUsers, setBlockedByUsers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState({});
    const [scheduledMessages, setScheduledMessages] = useState([]);

    const {socket, axios, authUser} = useContext(AuthContext);

    const getUsers = async ()=>{
        try{
            const { data } = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
                setBlockedUsers(data.blockedUsers || []);
                setBlockedByUsers(data.blockedByUsers || []);
                setPendingRequests(data.pendingRequests || {});
            }
        } catch(error) {
            toast.error(error.message)
        }
    }

    const getScheduledMessages = async ()=>{
        try {
            const { data } = await axios.get("/api/messages/scheduled");
            if(data.success) {
                setScheduledMessages(data.scheduledMessages);
            }
        } catch(error) {
            console.log("Error fetching scheduled messages:", error);
        }
    }

    const getMessages = async (userId)=>{
        try{
            const { data } = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
                setUnseenMessages((prev) => {
                    const updated = { ...prev };
                    delete updated[userId];
                    return updated;
                });
            }
        } catch(error){
            toast.error(error.message)
        }
    }

    const sendMessage = async (messageData)=>{
        try{
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prev)=>[...prev, data.newMessage])
            } else{
                toast.error(data.message);
            }
        } catch(error){
            toast.error(error.message);
        }
    }

    // Accept chat request from a user
    const acceptRequest = async (userId)=>{
        try{
            const { data } = await axios.put(`/api/messages/accept/${userId}`);
            if(data.success){
                // Remove from pendingRequests
                setPendingRequests((prev)=>{
                    const updated = {...prev};
                    delete updated[userId];
                    return updated;
                });
                toast.success("Chat accepted");
            }
        } catch(error){
            toast.error(error.message);
        }
    }

    // Block a user
    const blockUser = async (userId)=>{
        try{
            const { data } = await axios.put(`/api/messages/block/${userId}`);
            if(data.success){
                setBlockedUsers((prev)=>[...prev, userId]);
                // Remove from pending if was pending
                setPendingRequests((prev)=>{
                    const updated = {...prev};
                    delete updated[userId];
                    return updated;
                });
                toast.success("User blocked");
            }
        } catch(error){
            toast.error(error.message);
        }
    }

    // Unblock a user
    const unblockUser = async (userId)=>{
        try{
            const { data } = await axios.put(`/api/messages/unblock/${userId}`);
            if(data.success){
                setBlockedUsers((prev)=> prev.filter(id => id.toString() !== userId.toString()));
                toast.success("User unblocked");
            }
        } catch(error){
            toast.error(error.message);
        }
    }

    const subscribeToMessages = ()=>{
        if(!socket) return;
        socket.on("newMessage", (newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prev)=> [...prev, newMessage]);
                if(newMessage.receiverId === authUser._id){
                    axios.put(`/api/messages/mark/${newMessage._id}`);
                }
            } else{
                setUnseenMessages((prev)=>({
                    ...prev,
                    [newMessage.senderId]: prev[newMessage.senderId] ? prev[newMessage.senderId] + 1 : 1
                }))
                // If new message and no prior chat, mark as pending request
                if(newMessage.isRequest){
                    setPendingRequests((prev)=>({...prev, [newMessage.senderId]: true}))
                }
                // Refresh sidebar to show new user
                getUsers();
            }
        })
    }

    const unsubscribeFromMessages = ()=>{
        if(socket) socket.off("newMessage");
    }

    useEffect(()=>{
        subscribeToMessages();
        getScheduledMessages();
        return ()=> unsubscribeFromMessages();
    },[socket, selectedUser])

    const value = {
        messages, users, selectedUser, getUsers, getMessages, sendMessage,
        setSelectedUser, unseenMessages, setUnseenMessages,
        blockedUsers, blockedByUsers, pendingRequests, acceptRequest, blockUser, unblockUser,
        scheduledMessages, getScheduledMessages
    }

    return (
        <ChatContext.Provider value={value}>
            { children }
        </ChatContext.Provider>
    )
}
