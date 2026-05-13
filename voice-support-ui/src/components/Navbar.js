import React from 'react';
import { HelpCircle, Settings } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ onHowItWorks }) {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div className="nav-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
              fill="currentColor" opacity="0.3"/>
            <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 2c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z"
              fill="currentColor"/>
            <path d="M9.5 9.5v5l4.5-2.5L9.5 9.5z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <div className="nav-title">Customer Support Agent</div>
          <div className="nav-sub">AI-Powered Customer Support</div>
        </div>
      </div>

      <div className="nav-actions">
        <button className="nav-btn" onClick={onHowItWorks}>
          <HelpCircle size={16} />
          <span>How it works</span>
        </button>
        <button className="nav-btn nav-btn--icon">
          <Settings size={16} />
        </button>
        <div className="nav-avatar">OP</div>
        <span className="nav-operator">Operator</span>
      </div>
    </header>
  );
}
