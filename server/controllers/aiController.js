import { geminiModel } from "../lib/gemini.js";
import User from "../models/User.js";

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const suggestMessage = async (req, res) => {
    try {
        const { messages, tone, input } = req.body;
        const myId = req.user._id;

        if (!messages || messages.length === 0) {
            return res.json({ success: false, message: "No messages provided" });
        }

        const me = await User.findById(myId).select("fullName");

        const last10 = messages.slice(-10);
        const conversationText = last10.map(msg => {
            const role = msg.senderId === myId.toString() ? "You" : "Them";
            return `${role}: ${msg.text || "[image]"}`;
        }).join("\n");

        const toneText = tone ? `in a ${tone} tone` : "in a friendly tone";
        const inputHint = input ? `You have started typing: "${input}". Complete or improve this reply.` : `Suggest a short reply.`;
        const prompt = `This is a chat conversation. "You" are the person who needs a reply suggestion. "Them" is the other person.\n\n${conversationText}\n\nBased on this conversation, what should "You" say next? ${inputHint} ${toneText}. Return ONLY the reply text, nothing else.`;

        // Retry up to 3 times on 503
        let attempts = 0;
        let text;
        while(attempts < 3){
            try{
                const result = await geminiModel.generateContent(prompt);
                text = result.response.text().trim();
                break;
            } catch(err){
                attempts++;
                console.log(`Gemini attempt ${attempts} failed: ${err.message}`);
                if(attempts === 3) throw err;
                await wait(2000 * attempts);
            }
        }

        res.json({ success: true, suggestion: text });
    }
    catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}