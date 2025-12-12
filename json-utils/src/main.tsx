import React, { useEffect, useState } from "react";
import "./tailwind.css";
import { useLoading, useRegisterAction } from "@pulse-editor/react-api";
import { preRegisteredActions } from "../pregistered-actions";

export default function Main() {
  const { isReady, toggleLoading } = useLoading();

  useEffect(() => {
    if (isReady) {
      toggleLoading(false);
    }
  }, [isReady, toggleLoading]);

  useRegisterAction(
    preRegisteredActions["parse-json"],
    async (params) => {
      const jsonString = params["string-value"] as string;
      const parsedObject = JSON.parse(jsonString);
      return {
        "parsed-object": parsedObject,
      };
    },
    []
  );

  useRegisterAction(
    preRegisteredActions["stringify-json"],
    async (params) => {
      const jsonObject = params["json-object"];
      const jsonString = JSON.stringify(jsonObject, null, 2);
      return {
        "string-value": jsonString,
      };
    },
    []
  );

  return (
    <div className="p-2 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Pulse App JSON Utils</h1>
      <p>Select an action to get started.</p>
      <div>
        Available Utils:
        <ul className="list-disc list-inside">
          <li>Parse JSON string to JSON object</li>
          <li>Stringify JSON object to JSON string</li>
        </ul>
      </div>
    </div>
  );
}
