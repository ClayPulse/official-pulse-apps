import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading } from "@pulse-editor/react-api";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  return (
    <div className="p-2 flex flex-col w-full h-full">
      <iframe src="https://opencut.app" className="w-full h-full"/>
    </div>
  );
}
