"use client";

import React, { useEffect } from "react";
import ModalProvider from "@/components/providers/modal-provider";
import { useUser } from "@clerk/nextjs";

const ModalClient = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);

  useEffect(() => {
    if (isLoaded) {
      setIsOpen(!isSignedIn);
    }
  }, [isLoaded, isSignedIn]);

  return <ModalProvider open={isOpen} />;
};

export default ModalClient;
