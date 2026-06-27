import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    fullName: {type: String, required: true},
    username: {type: String, required: true, unique: true, lowercase: true, trim: true},
    password: {type: String, required: true, minLength: 6},
    profilePic: {type: String, default: ""},
    bio: {type: String},
    contacts: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    pendingRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    sentRequests: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    blockedUsers: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;
