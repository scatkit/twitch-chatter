import tmi from "tmi.js";
import { getOauthToken } from "./get_oauth_token.ts";
import { handleMessage } from "./handlers/message.ts";

const oauthToken = await getOauthToken();
const client = new tmi.Client({
    options: { debug: false },
    identity: {
        username: "scatkit",
        password: `oauth:${oauthToken}`,
    },
    channels: ["Alfedov"],
});

client.on("connected", (address, port) => {
    console.log(`Connected to Twitch chat at ${address}:${port}`);
});

client.on("message", async (channel: string, userstate: tmi.ChatUserstate, message: string, self: boolean) => {
    function removeEmotes(chatMsg: string, state: tmi.ChatUserstate) {
        const emotes = state.emotes;
        if (!emotes) return;


        console.log(message, message.length);
        const emotesPositions = [];
        const idxs = Object.values(emotes).flatMap(arr => arr);
        idxs.forEach(pos => {
            const [start, end] = pos.split("-").map(Number);
            emotesPositions.push({ start, end });
        });

        // reverse to positions are in descending order
        emotesPositions.sort((a, b) => b.start - a.start)
        console.log(emotesPositions);

        let msgBuffer = Buffer.from(message, "utf-8");
        for (const { start, end } of emotesPositions) {
            msgBuffer = Buffer.concat([
                msgBuffer.slice(0, start),
                msgBuffer.slice(end + 1),
            ])
        };
        return msgBuffer.toString("utf-8").trim().replace(/\s+/g, " ");
    };
    const out = removeEmotes(message, userstate);
    console.log(out);
    // const resp = await handleMessage(channel, userstate, message, self);
    // if (!resp) return;

    // const { username, responseMessage } = resp;
    // if (!username || !responseMessage) {
    //     console.error(`username: ${username} responseMessage: ${responseMessage}`)
    //     return;
    // };
});

await client.connect();


