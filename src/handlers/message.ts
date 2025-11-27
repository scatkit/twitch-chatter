import tmi from "tmi.js";
import fs from "fs";
import { askLLM } from "../llm/chat.ts";
import { llmConfig } from "@/appConfig.ts";
import { withRateLimit } from "./rate_limit.ts";
import { tryCatchAsync } from "@/utils/try-catch.ts";
import { userInfo } from "os";

export interface ChatMessage {
    id?: string,
    timestamp: string
    username: string,
    message: string,
    bot: boolean
    answered: boolean
}

export const ChatHistory = {
    _messageWindow: [] as ChatMessage[],
    _msgIdx: 1,
    _MAX_CONTEXT_WINDOW: 50,

    add(msg: ChatMessage) {
        msg.id = `msg_${this._msgIdx++}`
        this._messageWindow.push(msg);
        if (this._messageWindow.length > this._MAX_CONTEXT_WINDOW) this._messageWindow.shift();
    },
    getAll() {
        return this._messageWindow.slice().reverse();
    },
    getSize() {
        return this._messageWindow.length;
    },
    userExists(un: string) {
        return this._messageWindow.some((msg: ChatMessage) => msg.username === un);
    },
    beenAnswered(id: string) {
        return this._messageWindow.some((msg: ChatMessage) => msg.id === id && msg.answered === true)
    },
    getMessage(id: string) {
        const msg = this._messageWindow.find((msg: ChatMessage) => msg.id === id);
        if (msg) return msg
        else return;
    },
    markAsRead(id: string) {
        const msg = this.getMessage(id);
        if (!msg) {
            console.error("message not found", id);
            return;
        };
        msg.answered = true;
    }
};
const botNames: Set<string> = new Set(JSON.parse(llmConfig.botNames));

export async function handleMessage(userstate: tmi.ChatUserstate, message: string, self: boolean) {
    if (message.toLocaleLowerCase().startsWith("!")) return;
    if (userstate.username === "nightbot") return;

    if (!userstate.username) {
        console.error("username missing", userstate);
        return;
    };

    const formatter = new Intl.DateTimeFormat("default", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const isBot = botNames.has(userstate.username);
    const isReply = userstate["reply-parent-msg-id"];

    const x = userstate.emotes;

    const msg: ChatMessage = {
        timestamp: formatter.format(new Date()),
        username: userstate.username,
        message: cleanChatMessage(message),
        bot: botNames.has(userstate.username),
        answered: false,
    };
    ChatHistory.add(msg);

    // Check before allowig reply
    if (isBot || self || isReply) return;

    // ADD min context window size

    const chatMessages = ChatHistory.getAll();

    const [llmResp, err] = await tryCatchAsync(async () => withRateLimit(() => askLLM(chatMessages)));
    if (err) return;

    if (!llmResp) return;

    const validResponse = validateResponse(llmResp.trim());
    if (!validResponse) return;

    return validResponse;
};

export function validateResponse(llmResponse: string) {
    if (llmResponse === "SKIP") {
        console.log("skipped")
        return;
    };
    const regexResult = llmResponse.match(/^(\w+)\s(msg_\d+)\s(.+)$/)
    if (!regexResult) {
        console.log("validateResponse: invalid response format:", llmResponse);
        return;
    };
    const [fullResponse, username, msgId, responseMessage] = regexResult;

    if (!ChatHistory.userExists(username)) {
        console.log("username not found in chat:", username);
        return;
    };
    if (botNames.has(username)) {
        console.log("username is known bot:", username);
        return;
    };
    if (ChatHistory.beenAnswered(msgId)) {
        console.log(`message (${msgId}) been answered previously`);
        return;
    };

    console.log(`@${username} ${responseMessage} replied to: ${ChatHistory.getMessage(msgId).message} ${msgId}`)

    ChatHistory.markAsRead(msgId);
    return { username, responseMessage };
};

function removeEmotes(chatMsg: string, state: tmi.ChatUserstate) {
    const emotes = state.emotes;
    if (!emotes) return;

    const emotesPositions = [];
    const idxs = Object.values(emotes).flatMap(arr => arr);
    idxs.forEach(pos => {
        const [start, end] = pos.split("-").map(Number);
        emotesPositions.push({ start, end });
    });

    // reverse to positions are in descending order
    emotesPositions.sort((a, b) => b.start - a.start)
    console.log(emotesPositions);

    let msgBuffer = Buffer.from(chatMsg, "utf-8");
    for (const { start, end } of emotesPositions) {
        msgBuffer = Buffer.concat([
            msgBuffer.slice(0, start),
            msgBuffer.slice(end + 1),
        ])
    };
    return msgBuffer.toString("utf-8").trim().replace(/\s+/g, " ");
};

