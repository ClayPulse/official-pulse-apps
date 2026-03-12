import React from "react";
import "./tailwind.css";
import { SnapshotProvider } from "@pulse-editor/react-api";
import { TextArea } from "./component/text-area";

export default function Main() {
  return (
    <SnapshotProvider>
      <TextArea />
    </SnapshotProvider>
  );
}
