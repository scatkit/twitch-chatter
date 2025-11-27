import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env'), quiet: true });

export const authConfig = {
    twitchClientId: process.env.TWITCH_CLIENT_ID,
    twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
};

export const llmConfig = {
    apiKey: process.env.CR_API_KEY,
    systemPrompt: fs.readFileSync(
        path.join(__dirname, "system_prompt_v2.txt"),
        "utf-8",
    ),
    botNames: fs.readFileSync(
        path.join(__dirname, "bot_names.json"),
        "utf-8",
    ),
    badChat: fs.readFileSync(
        path.join(__dirname, "bad_chat.json"),
        "utf-8",
    ),
};
