"use client";

import { AppSidebar } from "@/components/global/app-sidebar";
import {
  SidebarInset,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import { useParams, usePathname } from "next/navigation";
import { Chat, Message } from "@prisma/client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { getChatById, getChatHistory } from "@/actions/chat"; // Fetch both chat list & messages
import RecentChatClient from "@/components/global/recent-chat-client";

interface ChatHistoryProps extends Chat {
  messages: Message[];
}

export default function ChatPage() {
  const pathname = usePathname();
  const params = useParams();
  const { user, isLoaded } = useUser();
  const [chatHistory, setChatHistory] = useState<ChatHistoryProps[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const res = await getChatHistory(user?.id || "");

        console.log("Fetched chat history:", res); // Debugging log

        setTimeout(() => {
          if ("error" in res) {
            toast.error(res.error);
            setChatHistory([]); // Clear chat history on error
          } else if (res.length === 0) {
            setChatHistory([]); // No chats exist
          } else {
            setChatHistory(res); // Correctly set chat history
          }
          setLoading(false);
        }, 2000); // Delay by 2 seconds
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      fetchChatHistory();
    }, 500); // Delay fetching by 500ms

    return () => clearTimeout(timeout); // Cleanup on unmount
  }, [user]);

  // Fetch messages when chat ID changes
  useEffect(() => {
    if (!params.chatId) return;

    const fetchChatMessages = async () => {
      try {
        setLoading(true);
        const res = await getChatById(params.chatId as string);
        if ("error" in res) {
          toast.error(res.error);
          setSelectedMessages([]);
        } else {
          setSelectedMessages(res.messages);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatMessages();
  }, [params.chatId]);

  return (
    <>
      <SidebarProvider>
        {isLoaded && user && (
          <AppSidebar
            pathname={pathname}
            messages={chatHistory} // List of chats for the user
            loading={loading}
            name={user?.fullName || ""}
          />
        )}
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 justify-between border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="md:hidden block">
              <UserButton afterSwitchSessionUrl="/" />
            </div>
          </header>
          <div className="flex justify-center items-center flex-col gap-4 p-4">
            <RecentChatClient
              chatId={params.chatId as string}
              initialMessages={selectedMessages.map((message) => ({
                id: message.id,
                role: message.role as "user" | "assistant",
                content: message.content,
              }))}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
