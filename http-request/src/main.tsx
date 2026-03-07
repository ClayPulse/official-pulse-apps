import React, { useEffect } from "react";
import "./tailwind.css";
import { useLoading } from "@pulse-editor/react-api";
import HttpRequestNode from "./components/HttpRequestNode";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  return (
    <div className="w-full h-full">
      <HttpRequestNode />
    </div>
  );
}
