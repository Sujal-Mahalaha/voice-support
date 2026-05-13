import React from 'react';
import { X, Mic, PhoneCall, ShieldCheck, MessageCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import './HowItWorks.css';

const steps = [
  {
    icon: <PhoneCall size={18} />,
    title: 'Start a Session',
    desc: 'Click the microphone button to begin. The agent will greet you automatically and ask how it can help.',
  },
  {
    icon: <Mic size={18} />,
    title: 'Speak Naturally',
    desc: 'Talk as you would on a real phone call. The AI listens, understands your query, and responds in real time.',
  },
  {
    icon: <MessageCircle size={18} />,
    title: 'Get Instant Answers',
    desc: 'Ask about the data security incident, protective steps like credit freezes or fraud alerts, and what to do next.',
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Your Data is Safe',
    desc: 'Never share sensitive info like SSN or passwords. The agent will redirect you to a secure channel if needed.',
  },
  {
    icon: <AlertTriangle size={18} />,
    title: 'Escalation When Needed',
    desc: 'If your query requires personal verification or you want a human, the agent will transfer you automatically.',
  },
  {
    icon: <CheckCircle2 size={18} />,
    title: 'End the Call',
    desc: 'Click the red button to end the session at any time. Your call history is saved on the right panel.',
  },
];

const faqs = [
  { q: 'What can I ask the agent?', a: 'You can ask about the data security incident, what data may be affected, and protective steps to take.' },
  { q: 'Can the agent check my account?', a: 'No. For account-specific queries, it will transfer you to a human representative via secure channels.' },
  { q: 'Is this call recorded?', a: 'Yes, calls are recorded for quality and compliance purposes.' },
  { q: 'What if I accidentally share my SSN?', a: 'The agent will immediately stop, inform you it cannot process that info, and redirect you to a secure channel.' },
];

export default function HowItWorks({ onClose }) {
  return (
    <div className="hiw-overlay" onClick={onClose}>
      <div className="hiw-panel" onClick={e => e.stopPropagation()}>
        <div className="hiw-header">
          <div className="hiw-header-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="hiw-title">How It Works</h2>
            <p className="hiw-subtitle">Learn how to use the Voice Support Agent</p>
          </div>
          <button className="hiw-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="hiw-body">
          <p className="hiw-intro">
            This is an AI-powered voice support assistant designed to help customers with questions about 
            the recent <strong>data security incident</strong>. It can guide you through protective steps, 
            provide approved information, and escalate to a human agent when needed.
          </p>

          <h3 className="hiw-section-title">Step-by-step</h3>
          <div className="hiw-steps">
            {steps.map((step, i) => (
              <div className="hiw-step" key={i}>
                <div className="hiw-step-num">{i + 1}</div>
                <div className="hiw-step-icon">{step.icon}</div>
                <div className="hiw-step-content">
                  <div className="hiw-step-title">{step.title}</div>
                  <div className="hiw-step-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <h3 className="hiw-section-title" style={{ marginTop: 28 }}>Common Questions</h3>
          <div className="hiw-faqs">
            {faqs.map((faq, i) => (
              <div className="hiw-faq" key={i}>
                <div className="hiw-faq-q">{faq.q}</div>
                <div className="hiw-faq-a">{faq.a}</div>
              </div>
            ))}
          </div>

          <div className="hiw-footer-note">
            <ShieldCheck size={14} />
            <span>Do not share passwords, SSN, or payment details over this call.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
