import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";
import type { Message, BookingFormData } from "./types";
import "./App.css";

const ROOM_ID = "room1";

type MessageWithTS = Message & { timestamp?: string };

function App() {
  const [role, setRole] = useState<"owner" | "user" | null>(null);
  const [messages, setMessages] = useState<MessageWithTS[]>([]);
  const [text, setText] = useState("");
  const initRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!role || initRef.current) return;
    initRef.current = true;

    socket.emit("join_room", { roomId: ROOM_ID, role });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [role]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("send_message", {
      roomId: ROOM_ID,
      type: "text",
      sender: role,
      content: text.trim(),
    });
    setText("");
  };

  const sendPopup = () => {
    socket.emit("send_popup", {
      roomId: ROOM_ID,
      type: "popup",
      sender: "owner",
      data: {
        title: "Booking Request",
        status: "waiting",
      },
    });
  };

  const submitForm = (form: BookingFormData) => {
    socket.emit("send_confirmation", {
      roomId: ROOM_ID,
      type: "confirmation",
      sender: "user",
      data: form,
    });
  };

  if (!role) {
    return (
      <div className="role-overlay">
        <div className="role-card">
          <h2>Welcome to Chat</h2>
          <p>Please select your role to continue</p>
          <div className="role-options">
            <button className="role-btn user" onClick={() => setRole("user")}>
              <div style={{ fontSize: "2rem" }}>👤</div>
              <span>I am a User</span>
            </button>
            <button className="role-btn owner" onClick={() => setRole("owner")}>
              <div style={{ fontSize: "2rem" }}>🔑</div>
              <span>I am the Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-container">
        <div className="chat-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
              {role === "owner" ? "Admin Panel" : "Customer Support"}
            </h3>
            <div className="header-status">
              <div className="status-dot"></div>
              <span>Online</span>
            </div>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Room: {ROOM_ID}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <p>No messages yet.<br />Start the conversation below!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const isMe = m.sender === role;

            // TEXT MESSAGE
            if (m.type === "text") {
              return (
                <div key={i} className={`message-wrapper ${isMe ? "me" : "other"}`}>
                  <div className="message-bubble">{m.content}</div>
                  <div className="message-info">
                    <span>{m.sender}</span>
                    <span>{m.timestamp}</span>
                  </div>
                </div>
              );
            }

            // OWNER STATUS CARD
            if (m.type === "popup" && role === "owner") {
              return (
                <div key={i} className="booking-card pending">
                  <h4>🕒 Booking Request</h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    Waiting for user to complete the form...
                  </p>
                </div>
              );
            }

            // USER FORM
            if (m.type === "popup" && role === "user") {
              return <BookingForm key={i} onSubmit={submitForm} />;
            }

            // CONFIRMATION (BOTH SEE)
            if (m.type === "confirmation") {
              const d = m.data;
              return (
                <div key={i} className="booking-card success">
                  <h4>✅ Booking Confirmed</h4>
                  <div className="booking-details">
                    <DetailRow label="Name" value={d.name} />
                    <DetailRow label="Date" value={d.date} />
                    <DetailRow label="Ships" value={String(d.ships)} />
                    <DetailRow label="People" value={String(d.people)} />
                    <DetailRow label="Plan" value={d.pricePlan} />
                    {d.notes && <DetailRow label="Notes" value={d.notes} />}
                  </div>
                </div>
              );
            }

            return null;
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-bar">
          <input
            className="input-field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
          {role === "owner" && (
            <button className="action-btn" onClick={sendPopup}>
              <span>📋</span> Booking Form
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

function BookingForm({ onSubmit }: { onSubmit: (d: BookingFormData) => void }) {
  const [form, setForm] = useState<BookingFormData>({
    name: "",
    date: "",
    ships: 1,
    people: 1,
    pricePlan: "Basic",
    notes: "",
  });

  return (
    <div className="booking-card" style={{ maxWidth: "100%", borderLeft: "4px solid var(--primary)" }}>
      <div className="booking-form">
        <h4>Booking Information</h4>

        <div className="form-group full">
          <label>Full Name</label>
          <input
            placeholder="e.g. John Doe"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Price Plan</label>
          <select
            onChange={(e) =>
              setForm({ ...form, pricePlan: e.target.value as any })
            }
          >
            <option>Basic</option>
            <option>Standard</option>
            <option>Premium</option>
          </select>
        </div>

        <div className="form-group">
          <label>Ships Needed</label>
          <input
            type="number"
            min="1"
            value={form.ships}
            onChange={(e) => setForm({ ...form, ships: +e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Total People</label>
          <input
            type="number"
            min="1"
            value={form.people}
            onChange={(e) => setForm({ ...form, people: +e.target.value })}
          />
        </div>

        <div className="form-group full">
          <label>Additional Notes</label>
          <textarea
            placeholder="Any special requirements?"
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="form-group full">
          <button className="send-btn" style={{ width: "100%", borderRadius: "var(--radius-sm)" }} onClick={() => onSubmit(form)}>
            Submit Booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
