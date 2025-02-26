/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatForm } from "./chat";
import { MessageInput } from "./message-input";
import { generateAiResponse, getChatById } from "@/actions/chat";
import { toast } from "sonner";
import { MessageList } from "./message-list";
import { CopyButton } from "./copy-button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const RecentChatClient = ({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: { id: string; role: "user" | "assistant"; content: string }[];
}) => {
  const router = useRouter();
  const { user } = useUser();
  const [value, setValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState(initialMessages); // Load messages based on chatId
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch updated chat messages when chatId changes
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!chatId) return;
      try {
        const chatData = await getChatById(chatId);
        if (chatData && !("error" in chatData)) {
          setMessages(
            chatData.messages.map((msg: { id: any; role: string; content: any; }) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch chat messages:", error);
      }
    };

    fetchChatMessages();
  }, [chatId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (event?: { preventDefault?: () => void }) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    if (!value.trim()) return;

    try {
      setIsGenerating(true);

      // Add user message immediately
      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: value,
      };
      setMessages((prev) => [...prev, { ...userMessage, role: "user" }]);
      setValue("");

      let response;
      if (user && chatId) {
        response = await generateAiResponse(chatId, value);
      } else {
        response = await generateAiResponse(null, value);
      }

      if (response.error) {
        toast.error(response.error);
      } else {
        setMessages((prev) => [
          ...prev,
          ...(response.messages || []).map((msg) => ({
            id: Date.now().toString(),
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        ]);

        // Refresh the chat list
        router.refresh();
      }
    } catch (error: any) {
      console.error("AI Error:", error.message);
      toast.error("Failed to generate response.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex md:h-[800px] md:mt-0 h-full flex-col items-center justify-center md:w-[1200px] w-full mx-auto">
      <div className="w-full md:max-w-[800px]">
        {/* Display chat messages */}
        <div className="mb-4 md:h-[700px] h-full overflow-y-auto">
          <MessageList isTyping={isGenerating} messages={messages} />
          <CopyButton
            content={messages
              .filter((msg) => msg.role === "assistant")
              .map((msg) => msg.content)
              .join("\n")}
          />
          <div ref={messagesEndRef} />
        </div>

        {/* Chat form */}
        <ChatForm
          className="w-full pb-5 md:pb-0"
          isPending={isGenerating}
          handleSubmit={handleSubmit}
        >
          {({ files, setFiles }) => (
            <MessageInput
              value={value}
              onChange={(event) => setValue(event.target.value)}
              allowAttachments={false}
              isGenerating={isGenerating}
            />
          )}
        </ChatForm>
      </div>
    </div>
  );
};

export default RecentChatClient;
