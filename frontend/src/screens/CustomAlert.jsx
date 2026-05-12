import React from "react";

const CustomAlert = ({ message, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="terminal-alert-overlay">
      <div className="terminal-alert-box">
        <h2>[ System Error ]</h2>
        <p>&gt; {message}</p>
        <button className="terminal-alert-btn" onClick={onClose}>
          Acknowledge
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
