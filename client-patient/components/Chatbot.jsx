import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaMinus, FaRobot } from 'react-icons/fa';
import logoImg from '../assets/logo.png';
import '../styles/chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const chatbotRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // First time opening the chat
      showWelcomeMessage();
    }
    scrollToBottom();
  }, [isOpen, messages]);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      // If chatbot is open, and click is outside the chatbot container
      if (isOpen && chatbotRef.current && !chatbotRef.current.contains(event.target)) {
        // Also ensure they didn't click the floating button to toggle it
        const isFloatingBtn = event.target.closest('.chatbot-floating-btn');
        if (!isFloatingBtn) {
          setIsOpen(false);
          setIsMinimized(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const showWelcomeMessage = () => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages([
        {
          id: 1,
          sender: 'Medi',
          text: `👋 Welcome to MediCare!\n\nHello! I'm Medi, your virtual hospital guide.\n\nI can help you:\n• Find doctors\n• Book appointments\n• Explore departments\n• Learn about our facilities\n• View health packages\n• Understand insurance services\n• Navigate the MediCare website\n• Answer frequently asked questions\n\nHow can I help you today?`
        }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const newUserMessage = {
      id: Date.now(),
      sender: 'You',
      text: inputMessage
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          sender: 'Medi',
          text: "Thanks for reaching out! As a demo, I'm currently just simulating a response, but I'm here to help you navigate MediCare."
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chatbot-floating-btn ${isOpen && !isMinimized ? 'hidden' : ''}`}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
      >
        <FaRobot />
        <span className="chatbot-btn-name">Medi</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div ref={chatbotRef} className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-logo-container">
                <img src={logoImg} alt="MediCare Logo" />
              </div>
              <div className="chatbot-title-area">
                <h3>🤖 Medi</h3>
                <span>Your Virtual Hospital Guide</span>
              </div>
            </div>
            <div className="chatbot-header-controls">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                <FaMinus />
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`chatbot-message-wrapper ${msg.sender === 'Medi' ? 'medi' : 'user'}`}>
                    <div className="chatbot-sender-name">{msg.sender}</div>
                    <div className="chatbot-bubble">
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="chatbot-message-wrapper medi">
                    <div className="chatbot-sender-name">Medi</div>
                    <div className="chatbot-bubble">
                      <div className="chatbot-typing">
                        Medi is typing
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="chatbot-input-area">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="chatbot-send-btn"
                  disabled={!inputMessage.trim() || isTyping}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
