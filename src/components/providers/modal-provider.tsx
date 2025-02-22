"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ModalProvider = ({
  open,
}: {
  open: boolean;
}) => {
  const router = useRouter();
  return (
    <Dialog open={open}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle className="text-center">Welcome back</DialogTitle>
          <DialogDescription className="text-center">
            Log in or sign up to get smarter responses, chat and more.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Button onClick={() => router.push("/sign-in")} className="w-full">
            Login
          </Button>
          <Button
            onClick={() => router.push("/sign-up")}
            variant="outline"
            className="w-full"
          >
            Sign up
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalProvider;
