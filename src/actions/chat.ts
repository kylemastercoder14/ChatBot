/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "@/lib/db";

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAiResponse = async (
  chatId: string | null,
  userMessage: string
) => {
  try {
    console.log("[generateAiResponse] Start", { chatId, userMessage });

    const result = await model.generateContent(userMessage);
    const aiResponse = result?.response?.text?.() || "No response from AI";

    console.log("[generateAiResponse] AI Response:", aiResponse);

    if (!chatId) {
      console.log(
        "[generateAiResponse] No chatId provided, returning response"
      );
      return { messages: [{ role: "assistant", content: aiResponse }] };
    }

    console.log("[generateAiResponse] Storing user message in DB");
    await db.message.create({
      data: { chatId, role: "user", content: userMessage },
    });

    console.log("[generateAiResponse] Storing AI message in DB");
    const aiMessage = await db.message.create({
      data: { chatId, role: "assistant", content: aiResponse },
    });

    console.log("[generateAiResponse] Success, returning AI message");
    return { messages: [aiMessage] };
  } catch (error: any) {
    console.error("[generateAiResponse] Error:", error);
    return { error: "An error occurred while generating AI response" };
  }
};

export const createChat = async (userId: string) => {
  try {
    console.log("[createChat] Creating chat for userId:", userId);
    const chat = await db.chat.create({ data: { userId } });
    console.log("[createChat] Chat created with ID:", chat.id);
    return chat.id;
  } catch (error: any) {
    console.error("[createChat] Error:", error);
    return { error: "An error occurred while creating chat" };
  }
};

export const getChatHistory = async (userId: string) => {
  try {
    console.log("[getChatHistory] Fetching chat history for userId:", userId);
    if (!userId) return { error: "User ID is required" };

    const chat = await db.chat.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { messages: true },
    });

    console.log("[getChatHistory] Found", chat.length, "chats");
    return chat;
  } catch (error: any) {
    console.error("[getChatHistory] Error:", error);
    return { error: "An error occurred while fetching chat history" };
  }
};

export const getChatById = async (chatId: string) => {
  try {
    console.log("[getChatById] Fetching chat for chatId:", chatId);
    if (!chatId) return { error: "Chat ID is required" };

    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: { messages: true },
    });

    if (chat) {
      console.log("[getChatById] Chat found:", chat);
      return chat;
    } else {
      console.warn("[getChatById] Chat not found for chatId:", chatId);
      return { error: "Chat not found" };
    }
  } catch (error: any) {
    console.error("[getChatById] Error:", error);
    return { error: "An error occurred while fetching chat messages" };
  }
};
