import React, { useState } from "react";
import Navbar from "./components/Navbar";
import DevicePanel from "./components/DevicePanel";
import VoicePanel from "./components/VoicePanel";
import CallHistory from "./components/CallHistory";
import HowItWorks from "./components/HowItWorks";
import { useCallHistory } from "./hooks/useCallHistory";
import { generateId } from "./utils/helpers";
import "./App.css";

export default function App() {
  const [showHIW, setShowHIW] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const { history, addCall, removeCall } = useCallHistory();

  function handleCallEnd(callMeta) {
    const duration = Number(callMeta?.duration || 0);
    const transcript = Array.isArray(callMeta?.transcript)
      ? callMeta.transcript
      : [];
    const preview = transcript[transcript.length - 1]?.text || "Session ended";

    addCall({
      id: generateId(),
      startedAt: Date.now() - duration * 1000,
      duration,
      device: selectedDevice?.name || null,
      preview,
      transcript,
      roomName: callMeta?.roomName || null,
    });
  }

  return (
    <div className="app">
      <Navbar onHowItWorks={() => setShowHIW(true)} />

      <div className="app-body">
        <DevicePanel selected={selectedDevice} onSelect={setSelectedDevice} />
        <VoicePanel selectedDevice={selectedDevice} onCallEnd={handleCallEnd} />
        <CallHistory history={history} onRemove={removeCall} />
      </div>

      {showHIW && <HowItWorks onClose={() => setShowHIW(false)} />}

      <footer className="app-footer">
        <span>Customer Support Demo v1.0.0</span>
      </footer>
    </div>
  );
}
