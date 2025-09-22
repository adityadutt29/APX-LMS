"use client"
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Add welcome message from backend when chat is opened
        if (isOpen && messages.length === 0) {
            setIsLoading(true);
            fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Hello' })
            })
            .then(res => res.json())
            .then(data => {
                setMessages([{ text: data.response, sender: 'bot' }]);
            })
            .catch(() => {
                setMessages([{ text: "I apologize, but I'm having trouble connecting. Please try again later.", sender: 'bot' }]);
            })
            .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        setMessages([...messages, { text: input, sender: 'user' }]);
        
        try {
            // Use internal API route for Next.js
            const response = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input })
            });
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [...prev, { 
                text: "I apologize, but I'm having trouble connecting. Please try again or rephrase your question.", 
                sender: 'bot' 
            }]);
        }
        
        setIsLoading(false);
        setInput('');
    };

    const suggestedQuestions = [
        "How can I prepare for interviews?",
        "Tips for managing study stress?",
        "Help me choose a career path",
        "How to improve my study habits?"
    ];

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {!isOpen ? (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                    text-white rounded-full p-4 shadow-lg transform hover:scale-110 transition-all duration-300 
                    animate-bounce"
                >
                    <MessageCircle size={28} />
                </button>
            ) : (
                <div className="bg-white rounded-2xl shadow-2xl w-[400px] h-[600px] flex flex-col 
                transform transition-all duration-300 animate-slideIn">
                    <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl 
                    flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full">
                                <Bot size={24} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">AI Student Counselor</h3>
                                <p className="text-xs text-blue-100 opacity-80">Online | Ready to help</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="hover:bg-blue-600 p-2 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                        {messages.map((msg, index) => (
                            <div key={index} 
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} 
                                animate-fadeIn`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                                    msg.sender === 'user' 
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none' 
                                        : 'bg-white text-gray-800 rounded-tl-none'
                                }`}>
                                    {msg.text.split('\n').map((line, i) => (
                                        <p key={i} className="mb-1 last:mb-0">{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInput(q);
                                            handleSend();
                                        }}
                                        className="p-3 text-sm text-left text-gray-600 bg-white rounded-xl 
                                        hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 
                                        shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        {isLoading && (
                            <div className="flex items-center justify-center space-x-2 py-4">
                                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce delay-100"></div>
                                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-bounce delay-200"></div>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t bg-white rounded-b-2xl">
                        <div className="flex gap-3 items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask me anything about your education..."
                                className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 
                                bg-gray-50 hover:bg-gray-100 transition-colors"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl 
                                hover:from-blue-600 hover:to-blue-700 transition-all duration-200 
                                transform hover:scale-105 flex items-center justify-center"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add these animations to your globals.css
const styles = `
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.animate-slideIn {
    animation: slideIn 0.3s ease-out;
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}
`;

export default ChatBot;