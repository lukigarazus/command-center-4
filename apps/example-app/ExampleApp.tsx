import { useState } from 'react';
import { useEvents, useEventListener } from '../../shared/contexts/EventContext';

interface Message {
  text: string;
  timestamp: number;
}

export default function ExampleApp() {
  const events = useEvents();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Listen for messages from other apps
  useEventListener<Message>('app-message', (payload) => {
    setMessages((prev) => [...prev, payload]);
  });

  const sendMessage = async () => {
    if (!message.trim()) return;

    const messageData: Message = {
      text: message,
      timestamp: Date.now(),
    };

    await events.emit('app-message', messageData);
    setMessages((prev) => [...prev, messageData]);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Example App</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Send Message via Events
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Received Messages
          </h2>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <p className="text-gray-500 italic">No messages yet...</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <p className="text-gray-900">{msg.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
