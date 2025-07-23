import jwt from "jsonwebtoken";
import User from "../models/User";



export const protectRoute = async (req, res, next)=>{
    try{
        const token = req.headers.token;

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select("-password");

        if(!user) return res.json({ success: false, message: "User not found"});

        req.user = user;  // A new property
        next();
    }
    catch(error){
        console.log(error.message);
        
        res.json({success: false, message: error.message });
    }
}