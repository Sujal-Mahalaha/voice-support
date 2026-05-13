import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  AlertCircle,
  Wifi,
} from "lucide-react";
import { Room, RoomEvent, Track } from "livekit-client";
import { useLyzrSession } from "../hooks/useLyzrSession";
import "./VoicePanel.css";

export default function VoicePanel({ selectedDevice, onCallEnd }) {
  const { sessionState, sessionInfo, error, startSession, endSession } =
    useLyzrSession();
  const [isMuted, setIsMuted] = useState(false);
  const [roomConnected, setRoomConnected] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [livekitError, setLivekitError] = useState(null);
  const [transcriptEntries, setTranscriptEntries] = useState([]);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);
  const roomRef = useRef(null);
  const audioElsRef = useRef(new Map());

  function pickFirstString(obj, keys) {
    if (!obj) return null;
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  function resolveConnectionDetails(info) {
    const candidates = [
      info,
      info?.session,
      info?.data,
      info?.livekit,
      info?.room,
      info?.result,
      info?.payload,
    ].filter(Boolean);

    for (const candidate of candidates) {
      const url = pickFirstString(candidate, [
        "url",
        "wsUrl",
        "livekitUrl",
        "roomUrl",
        "serverUrl",
      ]);
      const token = pickFirstString(candidate, [
        "userToken",
        "token",
        "accessToken",
        "participantToken",
      ]);

      if (url && token) {
        return { url, token };
      }
    }

    return { url: null, token: null };
  }

  function appendTranscriptEntry(entry) {
    if (!entry?.text) return;

    setTranscriptEntries((prev) => {
      const text = String(entry.text).trim();
      if (!text) return prev;

      const normalized = {
        speaker: entry.speaker || "Agent",
        text,
        at: entry.at || Date.now(),
      };

      const duplicate = prev.some(
        (item) =>
          item.speaker === normalized.speaker && item.text === normalized.text,
      );
      if (duplicate) return prev;

      return [...prev, normalized].slice(-200);
    });
  }

  function speakerFromParticipant(participant) {
    if (!participant?.identity || !roomRef.current) return "Agent";
    return participant.identity === roomRef.current.localParticipant.identity
      ? "You"
      : "Agent";
  }

  function handleTranscriptionReceived(segments, participant) {
    if (!Array.isArray(segments)) return;

    const speaker = speakerFromParticipant(participant);
    segments.forEach((segment) => {
      const isInterim =
        segment?.isFinal === false ||
        segment?.final === false ||
        segment?.finalized === false;
      if (isInterim) return;

      const text =
        typeof segment === "string"
          ? segment
          : segment?.text || segment?.transcript || segment?.content || "";

      appendTranscriptEntry({
        speaker,
        text,
        at: segment?.endTime || segment?.startTime || Date.now(),
      });
    });
  }

  function handleDataReceived(payload, participant) {
    let decoded = "";
    try {
      decoded = new TextDecoder().decode(payload);
    } catch (_) {
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(decoded);
    } catch (_) {
      return;
    }

    if (!parsed || typeof parsed !== "object") return;

    const text =
      parsed.text ||
      parsed.transcript ||
      parsed.message ||
      parsed.content ||
      "";

    const role =
      parsed.speaker || parsed.role || speakerFromParticipant(participant);

    appendTranscriptEntry({
      speaker: role === "user" ? "You" : role === "assistant" ? "Agent" : role,
      text,
      at: parsed.timestamp || Date.now(),
    });
  }

  const cleanupRemoteAudio = useCallback(() => {
    audioElsRef.current.forEach((el) => {
      try {
        el.pause();
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch (_) {
        // ignore audio element cleanup failures
      }
    });
    audioElsRef.current.clear();
  }, []);

  const disconnectRoom = useCallback(async () => {
    const room = roomRef.current;
    if (!room) {
      cleanupRemoteAudio();
      setRoomConnected(false);
      return;
    }

    try {
      await room.disconnect();
    } catch (_) {
      // best-effort disconnect
    }

    roomRef.current = null;
    cleanupRemoteAudio();
    setRoomConnected(false);
  }, [cleanupRemoteAudio]);

  function attachRemoteAudio(track) {
    const el = track.attach();
    el.autoplay = true;
    el.playsInline = true;
    el.style.display = "none";
    document.body.appendChild(el);
    audioElsRef.current.set(track.sid, el);
    el.play().catch(() => {
      // autoplay can still fail on some browsers; user interaction already happened via button click
    });
  }

  function detachRemoteAudio(track) {
    const existing = audioElsRef.current.get(track.sid);
    track.detach();
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    audioElsRef.current.delete(track.sid);
  }

  async function connectRoom(url, userToken) {
    const room = new Room({ adaptiveStream: true, dynacast: true });

    room.on(RoomEvent.Connected, () => {
      setRoomConnected(true);
    });

    room.on(RoomEvent.Disconnected, () => {
      setRoomConnected(false);
      cleanupRemoteAudio();
    });

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        attachRemoteAudio(track);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        detachRemoteAudio(track);
      }
    });

    room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
      handleTranscriptionReceived(segments, participant);
    });

    room.on(RoomEvent.DataReceived, (payload, participant) => {
      handleDataReceived(payload, participant);
    });

    roomRef.current = room;

    await room.connect(url, userToken);
    await room.localParticipant.setMicrophoneEnabled(true);
  }

  // Timer
  useEffect(() => {
    if (sessionState === "active" && roomConnected) {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionState, roomConnected]);

  useEffect(() => {
    return () => {
      disconnectRoom();
    };
  }, [disconnectRoom]);

  async function handleStart() {
    setDuration(0);
    setIsMuted(false);
    setLivekitError(null);
    setTranscriptEntries([]);
    const info = await startSession();
    if (!info) return;

    const { url, token } = resolveConnectionDetails(info);

    if (!url || !token) {
      await endSession();
      setLivekitError(
        "Session created, but room connection details are missing.",
      );
      return;
    }

    setIsJoiningRoom(true);
    try {
      await connectRoom(url, token);
    } catch (err) {
      await disconnectRoom();
      await endSession();
      setLivekitError(
        `LiveKit connection failed: ${err?.message || "unknown error"}`,
      );
    } finally {
      setIsJoiningRoom(false);
    }
  }

  async function handleEnd() {
    await disconnectRoom();
    await endSession();
    if (onCallEnd) {
      onCallEnd({
        duration,
        transcript: transcriptEntries,
        roomName: sessionInfo?.roomName || null,
      });
    }
    setDuration(0);
    setTranscriptEntries([]);
  }

  async function handleMuteToggle() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (!roomRef.current) return;

    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
    } catch (err) {
      setIsMuted(!nextMuted);
      setLivekitError(
        `Microphone update failed: ${err?.message || "unknown error"}`,
      );
    }
  }

  function formatDur(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const isIdle = sessionState === "idle";
  const isConnecting = sessionState === "connecting" || isJoiningRoom;
  const isActive = sessionState === "active" && roomConnected;
  const isEnding = sessionState === "ending";
  const isError = sessionState === "error" || Boolean(livekitError);
  const errorMessage = livekitError || error;

  return (
    <section className="voice-panel">
      {/* Header */}
      <div className="vp-header">
        <div className="vp-header-left">
          <div className="vp-header-icon">
            <Mic size={16} />
          </div>
          <div>
            <h2 className="vp-title">Customer Support Agent</h2>
            {isActive && sessionInfo?.roomName && (
              <p className="vp-session-id">Session: {sessionInfo.roomName}</p>
            )}
            {!isActive && (
              <p className="vp-session-id">AI-Powered Voice Support</p>
            )}
          </div>
        </div>

        {isActive && (
          <button className="vp-new-session-btn" onClick={handleEnd}>
            <RefreshCw size={14} />
            <span>New Session</span>
          </button>
        )}
      </div>

      {/* Status bar */}
      {isActive && (
        <div className="vp-status-bar">
          <div className="vp-status-dot" />
          <span className="vp-status-text">Live</span>
          <Wifi size={12} />
          <span className="vp-timer">{formatDur(duration)}</span>
          {selectedDevice && (
            <span className="vp-device-tag">{selectedDevice.name}</span>
          )}
        </div>
      )}

      {/* Main area */}
      <div className="vp-main">
        {isError && (
          <div className="vp-error-box">
            <AlertCircle size={18} />
            <div>
              <div className="vp-error-title">Connection Failed</div>
              <div className="vp-error-msg">{errorMessage}</div>
            </div>
          </div>
        )}

        {isIdle && (
          <div className="vp-idle">
            <div className="vp-mic-idle">
              <Mic size={40} />
            </div>
            <h3 className="vp-idle-title">Voice-Enabled Support</h3>
            <p className="vp-idle-desc">
              Click the microphone button below and speak to interact with the
              Customer Support agent.
            </p>
          </div>
        )}

        {isConnecting && (
          <div className="vp-connecting">
            <div className="vp-connecting-ring">
              <div className="vp-connecting-spinner" />
            </div>
            <p className="vp-connecting-text">Connecting to agent...</p>
          </div>
        )}

        {isEnding && (
          <div className="vp-connecting">
            <div className="vp-connecting-ring">
              <div
                className="vp-connecting-spinner"
                style={{ borderTopColor: "var(--accent-red)" }}
              />
            </div>
            <p className="vp-connecting-text">Ending session...</p>
          </div>
        )}

        {isActive && (
          <div className="vp-active">
            <div className="vp-wave-container">
              <div className="vp-mic-active">
                {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
              </div>
              {!isMuted && (
                <div className="vp-wave-bars">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="vp-wave-bar"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="vp-active-text">
              {isMuted ? "Microphone muted" : "Listening — speak now"}
            </p>
            {sessionInfo?.url && (
              <p className="vp-room-info">Room connected via LiveKit</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="vp-controls">
        {(isIdle || isError) && (
          <button className="vp-btn vp-btn--start" onClick={handleStart}>
            <Mic size={22} />
            <span>Start Call</span>
          </button>
        )}

        {isActive && (
          <>
            <button
              className={`vp-btn vp-btn--mute ${isMuted ? "vp-btn--muted" : ""}`}
              onClick={handleMuteToggle}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              <span>{isMuted ? "Unmute" : "Mute"}</span>
            </button>

            <button className="vp-btn vp-btn--end" onClick={handleEnd}>
              <PhoneOff size={20} />
              <span>End Call</span>
            </button>
          </>
        )}

        {(isConnecting || isEnding) && (
          <button className="vp-btn vp-btn--disabled" disabled>
            <RefreshCw size={20} className="vp-spin" />
            <span>{isConnecting ? "Connecting..." : "Ending..."}</span>
          </button>
        )}
      </div>
    </section>
  );
}
