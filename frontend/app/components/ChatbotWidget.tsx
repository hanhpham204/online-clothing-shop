"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

// Routes where the floating chat bubble should not be rendered. Mostly
// auth flows where the user is expected to focus on the form. Add or
// remove paths here to tweak visibility.
const HIDDEN_ROUTES: ReadonlyArray<string> = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

interface Message {
  role: "user" | "model";
  text: string;
}

interface AddToCartPayload {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface Action {
  type: string;
  payload: AddToCartPayload;
}

interface ChatResponse {
  reply: string;
  actions?: Action[];
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  // Pixels of the layout viewport bottom that are covered by mobile
  // browser chrome (URL bar, gesture pill) or the on-screen keyboard.
  // We add this to the bubble's `bottom` so it never hides behind that UI.
  const [bottomOverlayPx, setBottomOverlayPx] = useState(0);
  // True on phones / small tablets where browser/system toolbars at the
  // bottom are common; lifts the bubble higher there.
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  // Track viewport width so we can give the bubble extra clearance on
  // mobile/tablet where browser URL bars and gesture areas live at the
  // bottom and can obscure interactive UI.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsCompactViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Track the visual viewport so the bubble lifts above mobile browser
  // chrome / keyboard. `position: fixed` anchors to the layout viewport, not
  // the visual one, so without this the bubble disappears behind the URL bar.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const covered = Math.max(
        0,
        window.innerHeight - (vv.height + vv.offsetTop),
      );
      setBottomOverlayPx(Math.round(covered));
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // When the modal is open: lock body scroll on small screens (so the page
  // doesn't peek behind the centered modal) and wire up ESC to close.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const isCompactViewport = window.matchMedia("(max-width: 1023px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (isCompactViewport) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      if (isCompactViewport) {
        document.body.style.overflow = prevOverflow;
      }
    };
  }, [isOpen]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const updatedMessages = [
      ...messages,
      { role: "user", text: userMessage } as const,
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const chatHistory = messages.map((msg) => ({
        role: msg.role,
        text: msg.text,
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
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);

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

  // Hide the widget entirely on routes where the chat would be a
  // distraction (auth flows). Pathname check happens after hooks so
  // the rules of hooks are preserved.
  const shouldHide = pathname
    ? HIDDEN_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
      )
    : false;
  if (shouldHide) return null;

  return (
    <>
      {/* Floating bubble — only mounted while the chat is closed so the icon
          is always visible and never overlaps the open modal. The bubble is
          anchored (not draggable) so it never drifts off-screen. */}
      {!isOpen && (
        <div
          className="fixed z-60 font-sans"
          style={{
            // Safe-area + visual-viewport offset keeps the bubble above iOS
            // notches, Android nav bars, mobile URL bars, and the keyboard.
            // On compact viewports we use a much larger base offset (4rem)
            // because browser / system toolbars frequently sit at the bottom
            // there and would otherwise overlap the bubble.
            bottom: `calc(max(env(safe-area-inset-bottom, 0px), ${
              isCompactViewport ? "4.5rem" : "1.5rem"
            }) + ${bottomOverlayPx}px)`,
            right: "max(env(safe-area-inset-right, 0px), 1.5rem)",
            transition: "bottom 0.2s ease-out",
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open LUA LA Assistant"
            className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-2xl ring-1 ring-black/5 transition-transform hover:scale-105 hover:bg-accent-hover active:scale-95"
          >
            <ChatBubbleIcon className="h-6 w-6" />
            {/* Notification ping — base dot stays solid, ring animates outward */}
            <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
          </button>
        </div>
      )}

      {/* Backdrop — only shown on compact viewports (mobile / tablet) so the
          user is forced to focus on the chat. Hidden on lg+ where the modal
          sits beside the page content. */}
      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat overlay"
          className="fixed inset-0 z-60 cursor-default bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Open chat modal.
          - Compact (< lg): fixed at the center of the viewport, near
            full-screen height/width, with the body locked behind a backdrop.
          - Desktop (lg+): anchored to the bottom-right corner with a height
            cap so it never overflows above the viewport top. */}
      {isOpen && (
        <div
          className="
            fixed z-70 font-sans flex flex-col overflow-hidden bg-white shadow-2xl border border-neutral-200/50
            left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-[min(440px,calc(100vw-1.5rem))]
            h-[min(640px,calc(100dvh-2rem))]
            rounded-[20px]
            lg:left-auto lg:top-auto lg:translate-x-0 lg:translate-y-0
            lg:right-6 lg:bottom-6
            lg:h-[600px] lg:w-[400px]
            lg:max-h-[calc(100dvh-6rem)]
            lg:rounded-[24px]
          "
          role="dialog"
          aria-modal="true"
          aria-label="LUA LA Assistant"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-accent px-5 py-3.5 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-jakarta text-sm font-semibold">
                  LA
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-accent bg-green-400" />
              </div>
              <div>
                <h3 className="font-jakarta text-sm font-semibold leading-tight">
                  LUA LA Assistant
                </h3>
                <span className="text-[11px] text-white/80">Online</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="cursor-pointer rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex grow flex-col gap-3 overflow-y-auto bg-[#fafaf5]/40 p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "self-end rounded-br-none bg-accent text-white"
                    : "self-start rounded-bl-none bg-[#e8e8e3]/70 text-[#1a1c19]"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="flex max-w-[80%] items-center gap-1.5 self-start rounded-[18px] rounded-bl-none bg-[#e8e8e3]/70 px-4 py-2.5 text-[#1a1c19]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:300ms]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSend}
            className="flex shrink-0 items-center gap-2 border-t border-neutral-100 bg-white p-3"
            style={{
              // Keep the input safely above the iOS home indicator when the
              // modal is full-screen on mobile.
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
              className="grow rounded-full border-none bg-neutral-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-white transition-opacity hover:bg-accent-hover disabled:opacity-50"
            >
              <SendIcon className="h-5 w-5 " />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
