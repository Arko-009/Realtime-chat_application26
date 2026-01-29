import { useEffect, useRef, useState } from "react";
import { socket } from "./socket";
import type { Message, BookingFormData } from "./types";
import "./App.css";

const ROOM_ID = "room1";

function App() {
  const [role, setRole] = useState<"owner" | "user" | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const initRef = useRef(false);

  // Ask role once for register 
  useEffect(() => {
    if (!role) {
      const r = prompt("Enter role: owner or user") as "owner" | "user";
      if (r === "owner" || r === "user") setRole(r);
    }
  }, [role]);


  useEffect(() => {
    if (!role || initRef.current) return;
    initRef.current = true;

    socket.emit("join_room", { roomId: ROOM_ID, role });

    socket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
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
      content: text.trim()
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
        status: "waiting"
      }
    });
  };

  const submitForm = (form: BookingFormData) => {
    socket.emit("send_confirmation", {
      roomId: ROOM_ID,
      type: "confirmation",
      sender: "user",
      data: form
    });
  };

  if (!role) return <p>Loading…</p>;

  return (
    <div className="app">
      <h3>Role: {role}</h3>

      <div className="chat">
        {messages.map((m, i) => {
          // TEXT MESSAGE
          if (m.type === "text") {
            const isMe = m.sender === role;
            return (
              <div
                key={i}
                className={`message ${isMe ? "me" : "other"}`}
              >
                <span className="sender">{m.sender}</span>
                <p>{m.content}</p>
              </div>
            );
          }

          // OWNER STATUS CARD
          if (m.type === "popup" && role === "owner") {
            return (
              <div key={i} className="card pending">
                🕒 Booking request sent. Waiting for response…
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
              <div key={i} className="card success">
                <h4>✅ Booking Confirmed</h4>
                <p>Name: {d.name}</p>
                <p>Date: {d.date}</p>
                <p>Ships: {d.ships}</p>
                <p>People: {d.people}</p>
                <p>Plan: {d.pricePlan}</p>
                <p>Notes: {d.notes}</p>
              </div>
            );
          }

          return null;
        })}
      </div>

      <div className="input-bar">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>

        {role === "owner" && (
          <button onClick={sendPopup}>Send Booking Form</button>
        )}
      </div>
    </div>
  );
}

export default App;

function BookingForm({ onSubmit }: { onSubmit: (d: BookingFormData) => void }) {
  const [form, setForm] = useState<BookingFormData>({
    name: "",
    date: "",
    ships: 1,
    people: 1,
    pricePlan: "Basic",
    notes: ""
  });

  return (
    <div className="card form">
      <h4>Booking Info</h4>

      <input
        placeholder="Full Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        type="date"
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />
      <input
        type="number"
        placeholder="Ships Needed"
        onChange={(e) => setForm({ ...form, ships: +e.target.value })}
      />
      <input
        type="number"
        placeholder="Total People"
        onChange={(e) => setForm({ ...form, people: +e.target.value })}
      />

      <select
        onChange={(e) =>
          setForm({ ...form, pricePlan: e.target.value as any })
        }
      >
        <option>Basic</option>
        <option>Standard</option>
        <option>Premium</option>
      </select>

      <textarea
        placeholder="Notes"
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <button onClick={() => onSubmit(form)}>Submit</button>
    </div>
  );
}
