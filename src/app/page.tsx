"use client";

import { AppSidebar } from "@/components/global/app-sidebar";
import {
  SidebarInset,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import ChatClient from "@/components/global/chat-client";
import ModalClient from "@/components/global/modal-client";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Chat, Message } from "@prisma/client";
import React from "react";
import { toast } from "sonner";
import { getChatHistory } from "@/actions/chat";

interface ChatHistoryProps extends Chat {
  messages: Message[];
}

export default function Home() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [chatHistory, setChatHistory] = React.useState<ChatHistoryProps[]>([]);
  const [loading, setLoading] = React.useState(false);

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

  return (
    <>
      <ModalClient />
      <SidebarProvider>
        {isLoaded && user && (
          <AppSidebar
            pathname={pathname}
            messages={chatHistory}
            loading={loading}
            name={user?.fullName || ""}
          />
        )}
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 justify-between border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className='md:hidden block'>
              <UserButton afterSwitchSessionUrl="/" />
            </div>
          </header>
          <div className="flex justify-center items-center flex-col gap-4 p-4">
            <ChatClient name={user?.fullName || ""} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
