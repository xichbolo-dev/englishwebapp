import { useState, useEffect, useRef } from "react";
import data from "./vocab.json";

const TOTAL_ROUNDS = 9;

export default function App() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [fontSize, setFontSize] = useState(40);

  const synthRef = useRef(window.speechSynthesis);
  const itemRefs = useRef([]);

  const dailyVocabulary = data[`day${selectedDay}`] || [];

  // 🔊 Speak function (promise-based)
  const speak = (text, lang = "en-US") => {
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = speechRate;
      utter.onend = resolve;
      synthRef.current.speak(utter);
    });
  };

  // 🚀 MAIN LOOP (fix race condition)
  useEffect(() => {
    if (!isPlaying) return;

    let cancelled = false;

    const run = async () => {
      const item = dailyVocabulary[currentWordIndex];
      if (!item) return;

      setCurrentIndex(currentWordIndex);

      await speak(item.english, "en-US");
      if (cancelled) return;

      await speak(item.vietnamese, "vi-VN");
      if (cancelled) return;

      const delay = Math.max(800, 2000 / speechRate);
      await new Promise((r) => setTimeout(r, delay));

      if (cancelled) return;

      setCurrentWordIndex((prev) => {
        let next = prev + 1;
        let round = currentRound;

        if (next >= dailyVocabulary.length) {
          next = 0;
          round += 1;
          setCurrentRound(round);
        }

        if (round > TOTAL_ROUNDS) {
          setIsPlaying(false);
          setCurrentIndex(null);
          setCurrentRound(0);
          return 0;
        }

        return next;
      });
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [currentWordIndex, isPlaying]);

  // 🎯 AUTO SCROLL TO CENTER
  useEffect(() => {
    if (currentIndex !== null && itemRefs.current[currentIndex]) {
      itemRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex]);

  const startPractice = () => {
    if (!dailyVocabulary.length) return;

    synthRef.current.cancel();

    setCurrentWordIndex(0);
    setCurrentRound(1);
    setIsPlaying(true);
  };

  const stopPractice = () => {
    synthRef.current.cancel();
    setIsPlaying(false);
    setCurrentIndex(null);
    setCurrentWordIndex(0);
    setCurrentRound(0);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>📘 Luyện từ vựng</h1>

      {/* DAY SELECT */}
      <div style={{ display: "flex", overflowX: "auto", gap: 10 }}>
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => !isPlaying && setSelectedDay(day)}
            style={{
              padding: 10,
              background: selectedDay === day ? "blue" : "gray",
              color: "white",
              fontSize: 18,
              borderRadius: 8,
              cursor: isPlaying ? "not-allowed" : "pointer",
            }}
          >
            Day {day}
          </button>
        ))}
      </div>

      {/* STATUS */}
      {isPlaying && (
        <p style={{ marginTop: 10 }}>
          Vòng {currentRound}/{TOTAL_ROUNDS} - Từ{" "}
          {currentWordIndex + 1}/{dailyVocabulary.length}
        </p>
      )}

      {/* START/STOP */}
      <button
        onClick={isPlaying ? stopPractice : startPractice}
        style={{
          marginTop: 20,
          padding: 15,
          width: "100%",
          background: isPlaying ? "red" : "green",
          color: "white",
          borderRadius: 10,
          fontSize: 16,
        }}
      >
        {isPlaying ? "Dừng luyện" : "Bắt đầu luyện 9 vòng"}
      </button>

      {/* CONTROLS */}
      {isPlaying && (
        <>
          <div style={{ marginTop: 15 }}>
            <p>Tốc độ: {speechRate.toFixed(2)}x</p>
            <input
              type="range"
              min="0.75"
              max="1.75"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <p>Font: {fontSize}px</p>
            <input
              type="range"
              min="18"
              max="100"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </>
      )}

      {/* WORD LIST */}
      <div
        style={{
          marginTop: 20,
          height: "70vh",
          overflowY: "auto",
          borderTop: "1px solid #ddd",
          paddingTop: 10,
        }}
      >
        {dailyVocabulary.map((item, index) => (
          <div
            key={index}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 10,
              background:
                currentIndex === index ? "rgba(255,0,0,0.1)" : "transparent",
            }}
          >
            <div
              style={{
                fontSize,
                fontWeight: currentIndex === index ? "900" : "bold",
                color: currentIndex === index ? "red" : "black",
              }}
            >
              {item.english}
            </div>

            <div
              style={{
                fontSize: fontSize * 0.8,
                color: currentIndex === index ? "red" : "gray",
              }}
            >
              {item.vietnamese}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}