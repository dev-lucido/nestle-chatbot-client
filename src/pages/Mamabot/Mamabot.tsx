//Mamabot.tsx
import { useEffect, useRef, useState } from "react";
import "./Mamabot.css";
import ReactMarkdown from "react-markdown";
import { SERVER_URL } from "../../constants";

type Language = "en" | "si" | "ta" | null;
type Step = "language" | "onboarding" | "chat";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ONBOARDING_LABELS: Record<
  Exclude<Language, null>,
  {
    title: string;
    lmpLabel: string;
    eddLabel: string;
    orText: string;
    continueBtn: string;
    placeholder: string;
  }
> = {
  en: {
    title: "Let's get started",
    lmpLabel: "Last Menstrual Period (LMP)",
    eddLabel: "Expected Due Date (EDD)",
    orText: "or",
    continueBtn: "Continue",
    placeholder: "Select a date",
  },
  si: {
    title: "ආරම්භ කරමු",
    lmpLabel: "අවසාන ඔසප් දිනය (LMP)",
    eddLabel: "අපේක්ෂිත දරු උපත් දිනය (EDD)",
    orText: "හෝ",
    continueBtn: "ඉදිරියට යන්න",
    placeholder: "දිනයක් තෝරන්න",
  },
  ta: {
    title: "தொடங்குவோம்",
    lmpLabel: "கடைசி மாதவிடாய் தேதி (LMP)",
    eddLabel: "எதிர்பார்க்கப்படும் பிரசவ தேதி (EDD)",
    orText: "அல்லது",
    continueBtn: "தொடர்க",
    placeholder: "தேதியை தேர்ந்தெடுக்கவும்",
  },
};

export default function Mamabot() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("language");
  const [language, setLanguage] = useState<Language>(null);

  // Onboarding state
  const [dateType, setDateType] = useState<"lmp" | "edd">("lmp");
  const [dateValue, setDateValue] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const [awaitingPhase2Confirm, setAwaitingPhase2Confirm] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLanguageSelect = (lang: Exclude<Language, null>) => {
    setLanguage(lang);
    setStep("onboarding");
  };

  const handleOnboardingSubmit = async () => {
    if (!dateValue || !language) return;

    const label =
      dateType === "lmp"
        ? "Last Menstrual Period (LMP)"
        : "Expected Due Date (EDD)";

    const contextMessage: Message = {
      role: "user",
      content: `My ${label} is ${dateValue}.`,
    };

    // Optimistically show the user message and move to chat
    setMessages((prev) => [...prev, contextMessage]);
    setStep("chat");
    setTyping(true);

    let assistantText = "";

    try {
      const res = await fetch(`${SERVER_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          language,
          messages: [...messages, contextMessage].slice(-10),
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const data = event.replace("data: ", "").trim();

          // if (data === "[DONE]") {
          //   setTyping(false);
          //   return;
          // }

          if (data === "[DONE]") {
            finalizeStream(assistantText);
            return;
          }

          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content;
            const finishReason = json.choices?.[0]?.finish_reason;
            if (finishReason) {
              console.log("Mamabot onboarding finish reason:", finishReason); // add this
            }
            if (!token) continue;

            assistantText += token;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return copy;
              }
              return [...prev, { role: "assistant", content: assistantText }];
            });
          } catch (err) {
            console.error("Stream parse error:", err);
          }
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTyping(false);
    }
  };

  // Inside handleOnboardingSubmit, replace the final setTyping(false) calls with a helper:
  const finalizeStream = (text: string) => {
    setTyping(false);
    if (
      text.includes("Would you like to know more") ||
      text.includes("දැන ගැනීමට කැමතිද") ||
      text.includes("தெரிந்துகொள்ள விரும்புகிறீர்களா")
    ) {
      setAwaitingPhase2Confirm(true);
    }
  };

  const handlePhase2Confirm = () => {
    setAwaitingPhase2Confirm(false);
    // Inject a "yes" as a user message and send it
    const confirmMessage =
      language === "si"
        ? "ඔව්, කරුණාකර මට තව කියන්න."
        : language === "ta"
          ? "ஆம், தயவுசெய்து சொல்லுங்கள்"
          : "Yes, please tell me more";

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: confirmMessage },
    ];
    setMessages(newMessages);
    sendMessageFromHistory(newMessages);
  };

  const sendMessageFromHistory = async (newMessages: Message[]) => {
    setTyping(true);
    let assistantText = "";

    try {
      const res = await fetch(`${SERVER_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          language,
          messages: newMessages.slice(-10),
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const data = event.replace("data: ", "").trim();
          if (data === "[DONE]") {
            setTyping(false);
            return;
          }

          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content;
            const finishReason = json.choices?.[0]?.finish_reason;
            if (finishReason) {
              console.log("Mamabot finish reason:", finishReason); // add this
            }
            if (!token) continue;
            assistantText += token;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return copy;
              }
              return [...prev, { role: "assistant", content: assistantText }];
            });
          } catch (err) {
            console.error("Stream parse error:", err);
          }
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTyping(false);
    }
  };

  // Now simplify sendMessage to use it:
  const sendMessage = async () => {
    if (!language || !input.trim() || typing) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    inputRef.current?.blur();
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      100,
    );
    sendMessageFromHistory(newMessages);
  };

  const labels = language ? ONBOARDING_LABELS[language] : ONBOARDING_LABELS.en;

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="title">🤱 Nestle MamaBot</div>
        <div className="subtitle">Pregnancy & Maternal Health Assistant</div>
      </header>

      <div className="messages">
        <div className="bubble assistant">
          <ReactMarkdown>
            {
              "👶 **Hi, I\'m MamaBot!**\n\nI\'m your pregnancy companion — here to guide you through every week of your journey, from conception to early newborn care.\n\nTo get started, please select your language below."
            }
          </ReactMarkdown>
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <ReactMarkdown>{m.content}</ReactMarkdown>
            {m.role === "assistant" && typing && i === messages.length - 1 && (
              <span className="typing-dots">
                <span />
                <span />
                <span />
              </span>
            )}
          </div>
        ))}

        {/* Step 1: Language picker */}
        {step === "language" && (
          <div className="language-picker">
            <div className="language-title">Please choose your language</div>
            <div className="language-buttons">
              <button onClick={() => handleLanguageSelect("en")}>
                English
              </button>
              <button onClick={() => handleLanguageSelect("si")}>සිංහල</button>
              <button onClick={() => handleLanguageSelect("ta")}>தமிழ்</button>
            </div>
          </div>
        )}

        {/* Step 2: Onboarding date input */}
        {step === "onboarding" && language && (
          <div className="onboarding-card">
            <div className="onboarding-title">{labels.title}</div>

            <div className="date-type-toggle">
              <button
                className={dateType === "lmp" ? "active" : ""}
                onClick={() => setDateType("lmp")}
              >
                {labels.lmpLabel}
              </button>
              <span className="or-divider">{labels.orText}</span>
              <button
                className={dateType === "edd" ? "active" : ""}
                onClick={() => setDateType("edd")}
              >
                {labels.eddLabel}
              </button>
            </div>

            <input
              type="date"
              className="date-input"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              min={
                new Date(Date.now() - 280 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0]
              }
              max={new Date().toISOString().split("T")[0]}
            />

            <button
              className="continue-btn"
              onClick={handleOnboardingSubmit}
              disabled={!dateValue}
            >
              {labels.continueBtn}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {awaitingPhase2Confirm && !typing && (
        <div className="phase2-confirm">
          <button onClick={handlePhase2Confirm}>
            {language === "si"
              ? "ඔව්, කරුණාකර මට තව කියන්න."
              : language === "ta"
                ? "ஆம், மேலும் சொல்லுங்கள்"
                : "Yes, tell me more 👇"}
          </button>
        </div>
      )}

      <div className="input-bar">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            step !== "chat"
              ? "Please complete the steps above to continue"
              : "Ask about pregnancy, baby care, or maternal health…"
          }
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={step !== "chat"}
        />
        <button onClick={sendMessage} disabled={typing || step !== "chat"}>
          Send
        </button>
      </div>

      <footer className="disclaimer">
        Educational support only • Not a replacement for medical advice
      </footer>
    </div>
  );
}
