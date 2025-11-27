import { llmConfig } from "@/appConfig.ts";
import { askLLM } from "@/llm/chat.ts";
import { ChatHistory, validateResponse } from "./message.ts";

const _msgs = JSON.parse(llmConfig.badChat);
_msgs.forEach(msg => ChatHistory.add(msg));

const resp = await askLLM(ChatHistory.getAll().reverse());

const validResp = validateResponse(resp);
console.log(validResp);
