import OpenAI from "openai";
import fs, { appendFile } from "fs";
import { llmConfig } from "../appConfig.ts";
import type { ChatMessage } from "@/handlers/message.ts";

const client = new OpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: "https://foundation-models.api.cloud.ru/v1"
});

export async function askLLM(chatMessages: ChatMessage[]) {
    const resp = await client.chat.completions.create({
        model: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
        max_tokens: 2500,
        temperature: 0.9,
        presence_penalty: 0.8,
        frequency_penalty: 1.2,
        top_p: 0.8,
        // stop: ["\n", "<think", "</think"],
        logprobs: false,
        messages: [
            { role: "system", content: llmConfig.systemPrompt, },
            { role: "user", content: `Вход: ${JSON.stringify(chatMessages, null, 2)}` },
        ],
    });

    const out = resp.choices?.[0]?.message?.content ?? "";
    return out;
};
