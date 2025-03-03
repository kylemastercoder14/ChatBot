/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // Import pathname
import { ChatForm } from "./chat";
import { MessageInput } from "./message-input";
import { generateAiResponse } from "@/actions/chat";
import { toast } from "sonner";
import { MessageList } from "./message-list";
import { CopyButton } from "./copy-button";
import { useUser } from "@clerk/nextjs";
import { createChat, getChatHistory } from "@/actions/chat"; // Fetch chat history

const ChatClient = ({ name }: { name: string | null }) => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname(); // Get the current URL path
  const [chatId, setChatId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string }[]
  >([]);
  const timeoutRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch chat history only if on /chat/[chatId]
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) return;

      // Only fetch chat history if on /chat/[chatId]
      if (pathname.startsWith("/chat/")) {
        try {
          const res = await getChatHistory(user.id);
          if (!("error" in res) && res.length > 0) {
            const latestChat = res[0];
            setChatId(latestChat.id);
            setMessages(
              latestChat.messages.map((msg) => ({
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content: msg.content,
              }))
            );
          }
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
        }
      }
    };

    fetchChatHistory();
  }, [user, pathname]); // Runs only when `user` or `pathname` changes

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cancelTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSubmit = async (event?: { preventDefault?: () => void }) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    if (!value.trim()) return;

    try {
      setIsGenerating(true);

      // Create a new chat only if chatId is null
      let activeChatId = chatId;
      if (!chatId && user) {
        const result = await createChat(user.id);
        if (typeof result === "object" && "error" in result) {
          toast.error(result.error);
          setIsGenerating(false);
          return;
        }
        activeChatId = result;
        setChatId(activeChatId);

        // Redirect to the new chat
        router.push(`/chat/${activeChatId}`);
      }

      // Add user message immediately
      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: value,
      };
      setMessages((prev) => [...prev, { ...userMessage, role: "user" }]);
      setValue("");

      if (user && activeChatId) {
        // Insert into the correct chatId
        const response = await generateAiResponse(activeChatId, value);

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
        }
      } else {
        toast.error("Chat ID not found. Try refreshing the page.");
      }
    } catch (error: any) {
      console.error("AI Error:", error.message);
      toast.error("Failed to generate response.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className={`flex ${
        messages.length === 0 && !pathname.startsWith("/chat/")
          ? "h-[200px]"
          : "h-[800px]"
      } flex-col items-center justify-center md:w-[1200px] w-full mx-auto`}
    >
      <div className="w-full max-w-[800px]">
        {/* Show messages only if in /chat/[chatId] */}
        {pathname.startsWith("/chat/") ? (
          <div
            className={`mb-4 ${
              messages.length === 0 ? "h-[400px]" : "h-[700px]"
            } overflow-y-auto`}
          >
            <MessageList isTyping={isGenerating} messages={messages} />
            <CopyButton
              content={messages
                .filter((msg) => msg.role === "assistant")
                .map((msg) => msg.content)
                .join("\n")}
            />
            <div ref={messagesEndRef} />
          </div>
        ) : (
          // Show welcome message on "/"
          <div className="text-center mb-5">
            {name && (
              <div className="text-2xl font-bold">
                Hello, {name}! {"I'm"} <span className="font-mono">ConBot</span>
              </div>
            )}
            <p className="text-muted-foreground">How can I help you today?</p>
          </div>
        )}

        {/* Chat form */}
        <ChatForm
          className="w-full"
          isPending={isGenerating}
          handleSubmit={handleSubmit}
        >
          {({ files, setFiles }) => (
            <MessageInput
              value={value}
              onChange={(event) => setValue(event.target.value)}
              allowAttachments={false}
              stop={() => {
                setIsGenerating(false);
                cancelTimeout();
              }}
              isGenerating={isGenerating}
            />
          )}
        </ChatForm>
      </div>
    </div>
  );
};

export default ChatClient;
