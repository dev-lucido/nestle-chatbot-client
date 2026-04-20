// Namegenerator.tsx
import { useState, useRef, useEffect } from "react";
import "./Namegenerator.css";
import ReactMarkdown from "react-markdown";
import { SERVER_URL } from "../../constants";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type Question = {
  key: string;
  question: string;
  options?: string[];
  freeText?: boolean;
};

const WELCOME_MESSAGE = `👶✨ Looking for the perfect Sri Lankan baby name? I'll suggest meaningful names in Sinhala, Tamil, or English based on your preferences.\n\nLet's begin! 🌟`;

const QUESTIONS: Question[] = [
  {
    key: "language",
    question: "🌐 Which language do you prefer?",
    options: ["Sinhala", "Tamil", "English", "Any"],
  },
  {
    key: "gender",
    question: "👶 Is the baby a:",
    options: ["Boy", "Girl", "Unisex", "Neutral"],
  },
  {
    key: "startingLetter",
    question: "🔤 Preferred starting letter?\n(e.g. A, S, K…)",
    options: ["No preference"],
    freeText: true,
  },
  {
    key: "length",
    question: "📏 Name length preference?",
    options: [
      "Short (1–2 syllables)",
      "Medium",
      "Traditional",
      "No preference",
    ],
  },
  {
    key: "style",
    question: "✨ What style do you prefer?",
    options: [
      "Traditional Sri Lankan",
      "Modern & trendy",
      "Unique & rare",
      "Spiritual / Religious",
      "Nature-inspired",
      "Royal / Strong",
    ],
  },
  {
    key: "meaning",
    question: "💬 Preferred meaning?",
    options: [
      "Strength & courage",
      "Intelligence & wisdom",
      "Beauty & grace",
      "Blessings & prosperity",
      "Light & positivity",
      "Love & kindness",
      "Nature (sun, moon…)",
      "No specific theme",
    ],
  },
];

export default function Namegenerator() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      { role: "assistant", content: WELCOME_MESSAGE },
      { role: "assistant", content: QUESTIONS[0].question },
    ]);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }, [messages]);

  const handleAnswer = (answer: string) => {
    if (loading || done) return;

    const currentQuestion = QUESTIONS[step];
    setMessages((prev) => [...prev, { role: "user", content: answer }]);
    setInput("");

    const newAnswers = { ...answers, [currentQuestion.key]: answer };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: QUESTIONS[nextStep].question },
        ]);
      }, 300);
    } else {
      setDone(true);
      generateNames(newAnswers);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading || done) return;
    handleAnswer(input.trim());
  };

  const streamFromServer = async (
    prompt: string,
    history: Message[],
  ): Promise<void> => {
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const response = await fetch(`${SERVER_URL}/chat-stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt, history }),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream from server");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const text = line.replace("data: ", "");
        if (!text || text === "[DONE]") continue;

        const unescapedText = text.replace(/\\n/g, "\n");

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + unescapedText,
            };
          }
          return updated;
        });
      }
    }
  };

  const generateNames = async (preferences: Record<string, string>) => {
    setLoading(true);

    const lang = (preferences.language || "").toLowerCase();

    // Explicitly define naming conventions per language
    let namingContext = "";
    if (lang.includes("sinhala")) {
      namingContext =
        "Provide traditional and modern Sinhala names. Include Sinhala script (සිංහල) and Romanized versions.";
    } else if (lang.includes("tamil")) {
      namingContext =
        "Provide traditional and modern Tamil names. Include Tamil script (தமிழ்) and Romanized versions.";
    } else if (lang.includes("english")) {
      namingContext =
        "Provide modern International/Western names (e.g., Liam, Sophia, Sebastian). DO NOT provide Sinhala or Tamil names. These should be names that work well in a global or urban Sri Lankan context.";
    }

    const prompt = `
    Generate 8 unique names for a ${preferences.gender}.
    Theme: ${preferences.style} - ${preferences.meaning}
    Length: ${preferences.length}
    Starting letter: ${preferences.startingLetter}

    LANGUAGE RULE: ${namingContext}

    Format as a numbered list with:
    1. **Name**
    2. Meaning (1 sentence)
  `;

    try {
      await streamFromServer(prompt, []);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Oops! Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setInput("");
    setDone(false);
    setLoading(false);
    setMessages([
      { role: "assistant", content: WELCOME_MESSAGE },
      { role: "assistant", content: QUESTIONS[0].question },
    ]);
  };

  const currentQuestion = QUESTIONS[step];
  const showButtons = !done && !loading && currentQuestion?.options;
  const showTextInput =
    !done &&
    !loading &&
    (currentQuestion?.freeText || !currentQuestion?.options);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        backgroundColor: "#fff",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid #f0f0f0",
          backgroundColor: "#fff",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: "#333" }}>
          🍼 Baby Name Generator
        </span>
        <button
          onClick={handleRestart}
          title="Start over"
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            border: "1.5px solid #e57373",
            backgroundColor: "transparent",
            color: "#e57373",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          🔄 Restart
        </button>
      </div>

      {/* Chat window — flex-grow fills remaining space */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px 10px 4px",
          backgroundColor: "#f9f9f9",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.map((m, i) => {
          const isStreaming =
            i === messages.length - 1 && m.role === "assistant" && loading;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                className="ng-bubble"
                style={{
                  backgroundColor: m.role === "user" ? "#4caf50" : "#fff",
                  color: m.role === "user" ? "white" : "#222",
                  padding: "8px 11px",
                  borderRadius:
                    m.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  maxWidth: "85%",
                  wordWrap: "break-word",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  border: m.role === "assistant" ? "1px solid #eee" : "none",
                }}
              >
                <ReactMarkdown>{m.content}</ReactMarkdown>
                {isStreaming && (
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: 2,
                      animation: "blink 1s infinite",
                    }}
                  >
                    ▌
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {/* <div ref={bottomRef} /> */}
      </div>

      {/* Bottom controls — fixed height, doesn't grow */}
      <div
        style={{
          flexShrink: 0,
          padding: "8px 10px 10px",
          backgroundColor: "#fff",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        {showButtons && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {currentQuestion.options!.map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "1.5px solid #4caf50",
                  backgroundColor: "#fff",
                  color: "#4caf50",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4caf50";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.color = "#4caf50";
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {showTextInput && (
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading}
              placeholder="Type a letter or your answer…"
              style={{
                flex: 1,
                padding: "8px 11px",
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: 12.5,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "#4caf50",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 12.5,
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              Send
            </button>
          </div>
        )}

        {done && !loading && (
          <button
            onClick={handleRestart}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#4caf50",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            🔄 Start Over
          </button>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
      `}</style>
    </div>
  );
}
