import React, { useState } from "react";
import { Clock, Trash2, ChevronRight, PhoneCall } from "lucide-react";
import { formatDate, formatTime, formatDuration } from "../utils/helpers";
import "./CallHistory.css";

export default function CallHistory({ history, onRemove }) {
  const [openCallId, setOpenCallId] = useState(null);

  function toggleTranscript(callId) {
    setOpenCallId((prev) => (prev === callId ? null : callId));
  }

  return (
    <aside className="call-history">
      <div className="ch-header">
        <Clock size={16} />
        <span>Call History</span>
      </div>

      <div className="ch-list">
        {history.length === 0 && (
          <div className="ch-empty">
            <PhoneCall size={28} />
            <p>No calls yet</p>
            <span>Start a session to see history</span>
          </div>
        )}

        {history.map((call) => (
          <div
            key={call.id}
            className={`ch-item ${openCallId === call.id ? "ch-item--open" : ""}`}
          >
            <div className="ch-item-left">
              <div className="ch-item-time">
                <Clock size={12} />
                <span>
                  {formatDate(call.startedAt)} {formatTime(call.startedAt)}
                </span>
              </div>
              <div className="ch-item-meta">
                <span className="ch-msg-count">
                  {call.duration ? formatDuration(call.duration) : "—"}
                </span>
                {call.device && (
                  <span className="ch-device">{call.device}</span>
                )}
              </div>
              {call.preview && <div className="ch-preview">{call.preview}</div>}

              {openCallId === call.id && (
                <div className="ch-transcript">
                  {Array.isArray(call.transcript) &&
                  call.transcript.length > 0 ? (
                    call.transcript.map((line, idx) => (
                      <div
                        key={`${call.id}-${idx}`}
                        className="ch-transcript-line"
                      >
                        <span className="ch-speaker">
                          {line.speaker || "Agent"}:
                        </span>
                        <span className="ch-text">{line.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="ch-transcript-empty">
                      Transcript not available for this session.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="ch-item-actions">
              <button
                className={`ch-detail-btn ${openCallId === call.id ? "ch-detail-btn--open" : ""}`}
                onClick={() => toggleTranscript(call.id)}
                title="Show transcript"
              >
                <ChevronRight size={14} />
              </button>
              <button
                className="ch-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(call.id);
                }}
                title="Delete session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
