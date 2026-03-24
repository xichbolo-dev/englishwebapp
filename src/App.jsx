import { useState, useEffect, useRef } from "react";
import data from "./vocab.json";

const TOTAL_ROUNDS = 9;

export default function App() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.5);
  const [fontSize, setFontSize] = useState(40);

  const synthRef = useRef(window.speechSynthesis);

  const dailyVocabulary = data[`day${selectedDay}`] || [];

  // 👉 Speak function
  const speak = (text, lang = "en-US") => {
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = speechRate;

      utter.onend = resolve;
      synthRef.current.speak(utter);
    });
  };

  const speakLoop = async () => {
    if (!isPlaying) return;

    const item = dailyVocabulary[currentWordIndex];
    setCurrentIndex(currentWordIndex);

    await speak(item.english, "en-US");
    await speak(item.vietnamese, "vi-VN");

    const delay = Math.max(800, 2000 / speechRate);
    await new Promise((r) => setTimeout(r, delay));

    let nextIndex = currentWordIndex + 1;
    let nextRound = currentRound;

    if (nextIndex >= dailyVocabulary.length) {
      nextIndex = 0;
      nextRound += 1;
    }

    if (nextRound > TOTAL_ROUNDS) {
      setIsPlaying(false);
      setCurrentIndex(null);
      setCurrentRound(0);
      return;
    }

    setCurrentWordIndex(nextIndex);
    setCurrentRound(nextRound);

  };

  // 👉 Loop trigger
  useEffect(() => {
    if (isPlaying) {
      speakLoop();
    }
  }, [currentWordIndex, isPlaying]);

  const startPractice = () => {
    if (!dailyVocabulary.length) return;

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
              fontSize: 20,
            }}
          >
            Day {day}
          </button>
        ))}
      </div>

      {/* STATUS */}
      {isPlaying && (
        <p>
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
        }}
      >
        {isPlaying ? "Dừng luyện" : "Bắt đầu luyện 9 vòng"}
      </button>

      {/* CONTROLS */}
      {isPlaying && (
        <>
          <div>
            <p>Tốc độ: {speechRate.toFixed(2)}</p>
            <input
              type="range"
              min="0.45"
              max="1.25"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(Number(e.target.value))}
            />
          </div>

          <div>
            <p>Font: {fontSize}px</p>
            <input
              type="range"
              min="18"
              max="100"
              step="2"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>
        </>
      )}

      {/* WORD LIST */}
      <div style={{ marginTop: 20 }}>
        {dailyVocabulary.map((item, index) => (
          <div key={index} style={{ marginBottom: 10 }}>
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