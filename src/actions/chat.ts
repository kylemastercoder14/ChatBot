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
    const result = await model.generateContent(userMessage);
    const aiResponse = result?.response?.text?.() || "No response from AI";

    // If chatId is null, don't insert into the database
    if (!chatId) {
      return { messages: [{ role: "assistant", content: aiResponse }] };
    }

    // Insert user message
    await db.message.create({
      data: {
        chatId,
        role: "user",
        content: userMessage,
      },
    });

    // Insert AI message
    const aiMessage = await db.message.create({
      data: {
        chatId,
        role: "assistant",
        content: aiResponse,
      },
    });

    return { messages: [aiMessage] };
  } catch (error: any) {
    console.error(error);
    return { error: "An error occurred while generating AI response" };
  }
};

export const createChat = async (userId: string) => {
  const chat = await db.chat.create({
    data: { userId },
  });

  return chat.id;
};

export const getChatHistory = async (userId: string) => {
  try {
    if (!userId) {
      return { error: "User ID is required" };
    }

    const chat = await db.chat.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { messages: true },
    });

    return chat;
  } catch (error: any) {
    console.error(error);
    return { error: "An error occurred while fetching chat history" };
  }
};

export const getChatById = async (chatId: string) => {
  try {
    if (!chatId) {
      return { error: "Chat ID is required" };
    }

    const chat = await db.chat.findUnique({
      where: { id: chatId },
      include: { messages: true },
    });

    return chat || { error: "Chat not found" };
  } catch (error: any) {
    console.error(error);
    return { error: "An error occurred while fetching chat messages" };
  }
};
