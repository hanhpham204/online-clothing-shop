"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCart } from "./CartProvider";

interface Message {
  role: "user" | "model";
  text: string;
}

interface Action {
  type: string;
  payload: any;
}

interface ChatResponse {
  reply: string;
  actions?: Action[];
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);
  const startedFromBubbleRef = useRef(false);

  const startDrag = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = { x: clientX, y: clientY };
    initialPosRef.current = { x: position.x, y: position.y };
  };

  const handleBubblePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    startedFromBubbleRef.current = true;
    startDrag(e.clientX, e.clientY);
  };

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if ((e.target as HTMLElement).closest("button")) return;
    startedFromBubbleRef.current = false;
    startDrag(e.clientX, e.clientY);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
    }
    
    setPosition({
      x: initialPosRef.current.x + deltaX,
      y: initialPosRef.current.y + deltaY,
    });
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    
    if (!hasDraggedRef.current && startedFromBubbleRef.current) {
      setIsOpen((prev) => !prev);
    }
    startedFromBubbleRef.current = false;
  }, []);

  const handlePointerCancel = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    startedFromBubbleRef.current = false;
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => handlePointerMove(e);
    const onPointerUp = (e: PointerEvent) => handlePointerUp(e);
    const onPointerCancel = () => handlePointerCancel();

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Xin chào! Tôi là trợ lý ảo LUA LA. Tôi có thể giúp bạn tìm kiếm sản phẩm, thêm hàng vào giỏ hoặc cập nhật thông tin cá nhân. Tôi giúp gì được cho bạn hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { addItem, openCart } = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to UI
    const updatedMessages = [...messages, { role: "user", text: userMessage } as const];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối đến chatbot service.");
      }

      const data: ChatResponse = await res.json();
      
      // Add chatbot reply to UI
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);

      // Process any actions returned by backend
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach((action) => {
          if (action.type === "ADD_TO_CART") {
            const item = action.payload;
            addItem({
              id: item.id,
              name: item.name,
              category: item.category,
              price: item.price,
              image: item.image,
            });
            // Open cart drawer for quick visual confirmation
            setTimeout(() => {
              openCart();
            }, 600);
          }
        });
      }
    } catch (err) {
      console.error("Lỗi chatbot:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Rất tiếc, đã có lỗi kết nối xảy ra. Bạn vui lòng thử lại sau.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 font-sans"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
      }}
    >
      <div
        onPointerDown={isOpen ? undefined : handleBubblePointerDown}
        style={{
          touchAction: isOpen ? "auto" : "none",
          transitionProperty: "width, height, border-radius, background-color, transform, border-color",
          transitionDuration: "500ms",
          transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)",
        }}
        className={`shadow-2xl flex flex-col overflow-hidden origin-bottom-right select-none ${
          isOpen
            ? "w-[calc(100vw-32px)] sm:w-[400px] h-[500px] rounded-[24px] bg-white border border-neutral-200/50 translate-y-[-16px] translate-x-[-16px]"
            : `w-14 h-14 rounded-full bg-accent hover:bg-accent-hover text-white justify-center items-center hover:scale-105 active:scale-95 translate-y-0 translate-x-0 border border-transparent ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`
        }`}
      >
        {/* Bubble Icon (shown when closed) */}
        <div
          style={{
            transitionProperty: "opacity, transform",
            transitionDuration: "300ms",
            transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)",
          }}
          className={`absolute inset-0 flex items-center justify-center ${
            isOpen ? "scale-50 opacity-0 pointer-events-none" : "scale-100 opacity-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          )}
        </div>

        {/* Chat Window Contents (shown when open) */}
        <div
          style={{
            transitionProperty: "opacity",
            transitionDuration: "300ms",
            transitionDelay: isOpen ? "200ms" : "0ms",
            transitionTimingFunction: "cubic-bezier(0.19, 1, 0.22, 1)",
          }}
          className={`flex flex-col h-full w-full ${
            isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Header */}
          <div
            onPointerDown={handleHeaderPointerDown}
            style={{ touchAction: "none" }}
            className="bg-accent text-white px-6 py-4 flex justify-between items-center shadow-md cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold font-jakarta">
                  LA
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-accent rounded-full" />
              </div>
              <div>
                <h3 className="font-jakarta font-semibold text-sm leading-tight">LUA LA Assistant</h3>
                <span className="text-[11px] text-white/80">Trực tuyến</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-white/10"
              aria-label="Minimize chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-5 bg-[#fafaf5]/40 flex flex-col gap-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] rounded-[18px] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "self-end bg-accent text-white rounded-br-none"
                    : "self-start bg-[#e8e8e3]/60 text-[#1a1c19] rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="self-start bg-[#e8e8e3]/60 text-[#1a1c19] rounded-[18px] rounded-bl-none px-4 py-2.5 max-w-[80%] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-200" />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-300" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-neutral-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
              className="flex-grow px-4 py-2.5 text-sm bg-neutral-100 rounded-full border-none focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-accent hover:bg-accent-hover text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 rotate-90"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
