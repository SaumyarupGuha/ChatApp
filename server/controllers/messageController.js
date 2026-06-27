import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js";

// Get only users that the logged in user has chatted with
export const getUsersForSidebar = async(req, res)=>{
    try{
        const userId = req.user._id;

        const sentTo = await Message.distinct("receiverId", { senderId: userId });
        const receivedFrom = await Message.distinct("senderId", { receiverId: userId });

        const chattedUserIds = [...new Set([...sentTo, ...receivedFrom])];

        const filteredUsers = await User.find({
            _id: { $in: chattedUserIds }
        }).select("-password");

        // Get current user's blocked list
        const currentUser = await User.findById(userId).select("blockedUsers");

        // Find which of the chatted users have blocked the logged-in user
        const blockedByUsers = filteredUsers
            .filter(user => user.blockedUsers && user.blockedUsers.map(id => id.toString()).includes(userId.toString()))
            .map(user => user._id);

        // Count unseen messages
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);

        // Check pending request status for each user
        // A user is "pending" if their FIRST ever message to me has isRequest: true and not yet accepted
        const pendingRequests = {}
        const pendingPromises = filteredUsers.map(async (user)=>{
            const firstMessage = await Message.findOne({
                senderId: user._id,
                receiverId: userId,
                isRequest: true
            })
            if(firstMessage){
                pendingRequests[user._id] = true;
            }
        })
        await Promise.all(pendingPromises);

        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages,
            blockedUsers: currentUser.blockedUsers,
            blockedByUsers,
            pendingRequests
        })
    }
    catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Get all messages for selected user
export const getMessages = async(req, res) => {
    try{
        const{ id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId}, {seen:true});

        res.json({success: true, messages})
    }
    catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Mark message as seen
export const markMessageAsSeen = async(req,res)=>{
    try{
        const { id } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(id);

        if(!message){
            return res.json({success: false, message: "Message not found"});
        }
        if(message.receiverId.toString() !== userId.toString()){
            return res.json({success: false, message: "Unauthorized"});
        }

        await Message.findByIdAndUpdate(id, {seen: true});
        res.json({success: true})
    }
    catch(error){
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

// Send message
export const sendMessage = async (req, res) =>{
    try{
        const {text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        // Check if sender is blocked by receiver
        const receiver = await User.findById(receiverId).select("blockedUsers");
        if(receiver.blockedUsers.map(id => id.toString()).includes(senderId.toString())){
            return res.json({success: false, message: "Cannot send message"});
        }

        // Check if this is the first ever message between them
        const previousMessage = await Message.findOne({
            $or: [
                {senderId, receiverId},
                {senderId: receiverId, receiverId: senderId}
            ]
        });
        const isFirstMessage = !previousMessage;

        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            isRequest: isFirstMessage   // mark as request only if first message
        })

        // Emit to receiver
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({success: true, newMessage})
    }
    catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Accept chat request — removes isRequest flag from all messages of this sender
export const acceptRequest = async(req, res)=>{
    try{
        const { id: senderId } = req.params;
        const userId = req.user._id;

        await Message.updateMany(
            {senderId, receiverId: userId, isRequest: true},
            {isRequest: false}
        );

        res.json({success: true})
    }
    catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Block a user
export const blockUser = async(req, res)=>{
    try{
        const { id: blockId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $addToSet: {blockedUsers: blockId}  // addToSet prevents duplicates
        });

        res.json({success: true})
    }
    catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Unblock a user
export const unblockUser = async(req, res)=>{
    try{
        const { id: unblockId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: {blockedUsers: unblockId}
        });

        res.json({success: true})
    }
    catch(error){
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
