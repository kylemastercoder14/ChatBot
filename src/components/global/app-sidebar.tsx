/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { EditIcon, Loader2 } from "lucide-react";

export function AppSidebar({
  messages,
  loading,
  pathname,
  name,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  name: string;
  messages: any[];
  loading: boolean;
  pathname: string;
}) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link
          href="/"
          className="text-center py-2 text-2xl font-bold font-mono"
        >
          ChatBot.ai
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* New Chat Button */}
        <Button className="w-[90%] mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <EditIcon />
            New Chat
          </Link>
        </Button>

        {name ? (
          <SidebarGroup>
            <SidebarGroupLabel>Chat History</SidebarGroupLabel>
            <SidebarGroupContent>
              {loading ? (
                <div className="flex items-center justify-center h-20 gap-2">
                  <Loader2 className="animate-spin w-6 h-6 text-center" />
                </div>
              ) : messages.length > 0 ? (
                <SidebarMenu>
                  {messages.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        className="line-clamp-1"
                        asChild
                        isActive={pathname === `/chat/${chat.id}`}
                      >
                        <Link href={`/chat/${chat.id}`}>
                          {chat.messages.length > 0
                            ? chat.messages[0].content
                            : "New Chat"}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : (
                <div className="text-center flex-col gap-2 flex items-center h-[50vh] justify-center text-muted-foreground font-semibold">
                  <Image
                    src="/empty-item.svg"
                    alt="Empty"
                    width={170}
                    height={170}
                  />
                  No chat history found. Start a new chat.
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <div className="text-center flex-col gap-2 flex items-center h-screen justify-center text-muted-foreground font-semibold">
            <Image src="/empty-item.svg" alt="Empty" width={170} height={170} />
            Login or sign up to view chat history.
          </div>
        )}
      </SidebarContent>

      <SidebarFooter>
        {name ? (
          <div className="flex gap-2 items-center px-5 py-2">
            <UserButton afterSwitchSessionUrl="/" />
            <p>{name}</p>
          </div>
        ) : (
          <Button>
            <Link href="/sign-in">Login or Sign up</Link>
          </Button>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
