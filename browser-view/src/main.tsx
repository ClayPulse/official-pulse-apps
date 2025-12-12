import React, { useEffect } from "react";
import "./tailwind.css";
import { useLoading } from "@pulse-editor/react-api";
import { BrowserRouter } from "react-router";
import Browser from "./components/browser";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  return (
    <div className="w-full h-full">
      <BrowserRouter>
        <Browser />
      </BrowserRouter>
    </div>
  );
}
