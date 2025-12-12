import React, { useEffect } from "react";
import "./tailwind.css";
import { SnapshotProvider, useLoading } from "@pulse-editor/react-api";
import SpinWheel from "./spin-wheel";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  return (
    <SnapshotProvider>
      <div className="flex flex-col w-full h-full overflow-hidden">
        <SpinWheel />
      </div>
    </SnapshotProvider>
  );
}
