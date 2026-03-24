import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

import topWhiteImg from '../assets/adidas_sambas_nobg.png';
import camiImg from '../assets/maroon_hoodie_nobg.png';
import glassesImg from '../assets/transparent_6.png';
import necklaceImg from '../assets/olive_polo_nobg.png';
import shoesImg from '../assets/transparent_0.png';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QUOTES = [
  "test 1",
  "test 2",
  "test 3",
  "test 4",
  "test 5",
  "test 5",
];

const WEATHER_OBJECTS = [
  {
    id: "top_white", label: "sambas",
    src: topWhiteImg,
    x: 8, y: 12, size: 300, quote: "perfect for a breezy evening out", rotate: -12, floatDelay: 0.0,
  },
  {
    id: "cami", label: "hoodie",
    src: camiImg,
    x: 75, y: 14, size: 300, quote: "quote", rotate: 8, floatDelay: 0.4,
  },
  {
    id: "glasses", label: "tortoise glasses",
    src: glassesImg,
    x: 12, y: 40, size: 200, quote: "accessorize — rain or shine", rotate: -6, floatDelay: 0.8,
  },
  {
    id: "necklace", label: "olive shirt",
    src: necklaceImg,
    x: 6, y: 60, size: 300, quote: "add some sparkle to any forecast", rotate: 10, floatDelay: 1.2,
  },
  {
    id: "jeans", label: "jeans",
    src: shoesImg,
    x: 68, y: 40, size: 350, quote: "chic even in cloudy weather", rotate: -15, floatDelay: 1.6,
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "good morning", color: "#F4A261" };
  if (h < 17) return { text: "good afternoon", color: "#E76F51" };
  return { text: "good evening", color: "#6A4C93" };
}

function WeatherWidget() {
  const conditions = [
    { icon: "⛅", temp: "64°F", desc: "Partly Cloudy", suggestion: "light jacket weather" },
    { icon: "🌧️", temp: "52°F", desc: "Rainy", suggestion: "raincoat & boots day" },
    { icon: "☀️", temp: "78°F", desc: "Sunny", suggestion: "breezy fits" },
    { icon: "❄️", temp: "32°F", desc: "Snowy", suggestion: "bundle up, it's cold" },
  ];
  const [condition] = useState(conditions[Math.floor(Math.random() * conditions.length)]);
  return (
    <div style={{
      position: "absolute", top: "78px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(255,255,255,0.82)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.9)", borderRadius: "40px",
      padding: "9px 22px", display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)", zIndex: 30,
      fontSize: "13px", fontFamily: "'DM Mono', monospace", color: "#333",
      whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: "20px" }}>{condition.icon}</span>
      <span style={{ fontWeight: 600 }}>{condition.temp}</span>
      <span style={{ color: "#ccc" }}>·</span>
      <span>{condition.desc}</span>
      <span style={{ color: "#ccc" }}>·</span>
      <span style={{ color: "#E76F51", fontStyle: "italic" }}>{condition.suggestion}</span>
    </div>
  );
}

function FloatingObject({ obj, onHover, isHovered }) {
  const animNames = ["floatA", "floatB", "floatC", "floatD", "floatE", "floatF"];
  const animName = animNames[WEATHER_OBJECTS.findIndex(o => o.id === obj.id) % 6];
  return (
    <div
      onMouseEnter={() => onHover(obj.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: "absolute", left: `${obj.x}%`, top: `${obj.y}%`,
        width: obj.size, height: obj.size, cursor: "pointer",
        zIndex: isHovered ? 20 : 10,
        transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s",
        transform: isHovered
          ? `rotate(${obj.rotate}deg) scale(1.22)`
          : `rotate(${obj.rotate}deg) scale(1)`,
        filter: isHovered
          ? "drop-shadow(0 12px 28px rgba(0,0,0,0.25))"
          : "drop-shadow(0 4px 10px rgba(0,0,0,0.12))",
        animation: `${animName} ${3.5 + obj.floatDelay * 0.3}s ease-in-out ${obj.floatDelay}s infinite`,
      }}
    >
      <img
        src={obj.src}
        alt={obj.label}
        style={{
          width: "100%", height: "100%", objectFit: "contain",
          transition: "opacity 0.2s",
          opacity: isHovered ? 1 : 0.88,
        }}
      />
      {isHovered && (
        <div style={{
          position: "absolute", bottom: "108%", left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#fff",
          borderRadius: "10px", padding: "7px 14px",
          fontSize: "11px", fontFamily: "'DM Mono', monospace",
          whiteSpace: "nowrap", letterSpacing: "0.05em",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          animation: "fadeUp 0.18s ease", zIndex: 50,
        }}>
          {obj.quote}
          <div style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #1a1a1a",
          }} />
        </div>
      )}
    </div>
  );
}

const NAV_FEATURES = [
  { label: "Wardrobe", desc: "Add and manage your clothing items with category, color, formality, and season.", cta: "Manage Wardrobe →", color: "#6A4C93", to: "/wardrobe" },
  { label: "Outfit Generator", desc: "Generate outfit combinations from your wardrobe using filters like formality and season.", cta: "Generate Outfits →", color: "#E76F51", to: "/outfit-generator" },
  { label: "Outfit Preview", desc: "Preview generated outfits on a 2D model — your virtual fitting room.", cta: "View Preview →", color: "#2A9D8F", to: "/outfit-preview" },
];

const STEPS = [
  { n: "01", title: "Add Your Items", desc: "Upload clothing photos and fill in details like color, category, season, and formality." },
  { n: "02", title: "Generate Outfits", desc: "Use smart filters to auto-generate outfit combos from your actual wardrobe." },
  { n: "03", title: "Preview the Look", desc: "See outfits displayed on a 2D model — your virtual fitting room." },
  { n: "04", title: "Style Intentionally", desc: "Make faster, smarter decisions every morning using your organized closet." },
];

function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredObj, setHoveredObj] = useState(null);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const greeting = getGreeting();

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch((err) => { console.error('Error fetching data:', err); setLoading(false); });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex(i => (i + 1) % QUOTES.length), 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sectionVisible = scrollY > 320;

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", background: "#F8F5F0", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(-12deg)} 50%{transform:translateY(-14px) rotate(-12deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(8deg)} 50%{transform:translateY(-10px) rotate(8deg)} }
        @keyframes floatC { 0%,100%{transform:translateY(0) rotate(-6deg)} 50%{transform:translateY(-18px) rotate(-6deg)} }
        @keyframes floatD { 0%,100%{transform:translateY(0) rotate(10deg)} 50%{transform:translateY(-12px) rotate(10deg)} }
        @keyframes floatE { 0%,100%{transform:translateY(0) rotate(-15deg)} 50%{transform:translateY(-16px) rotate(-15deg)} }
        @keyframes floatF { 0%,100%{transform:translateY(0) rotate(5deg)} 50%{transform:translateY(-11px) rotate(5deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateX(-50%) translateY(6px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes quoteSlide { 0%{opacity:0;transform:translateY(8px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-8px)} }
        .restyle-feature-card { background:white; border-radius:20px; padding:36px 28px; border:1px solid rgba(0,0,0,0.06); transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s; cursor:pointer; }
        .restyle-feature-card:hover { transform:translateY(-6px); box-shadow:0 12px 40px rgba(0,0,0,0.1); }
        .restyle-cta-btn { background:#1a1a1a; color:#fff; border:none; border-radius:40px; padding:14px 32px; font-family:'DM Mono',monospace; font-size:13px; letter-spacing:0.06em; cursor:pointer; transition:background 0.2s, transform 0.15s; text-decoration:none; display:inline-block; }
        .restyle-cta-btn:hover { background:#E76F51; transform:scale(1.03); color:#fff; }
        .restyle-feature-link { font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.04em; cursor:pointer; text-decoration:none; }
        .restyle-feature-link:hover { opacity:0.7; }
      `}</style>

      <section style={{
        position: "relative", height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <WeatherWidget />

        {WEATHER_OBJECTS.map(obj => (
          <FloatingObject key={obj.id} obj={obj} onHover={setHoveredObj} isHovered={hoveredObj === obj.id} />
        ))}

        <div style={{ textAlign: "center", zIndex: 20, position: "relative" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(72px, 12vw, 140px)",
            fontWeight: 400, fontStyle: "italic",
            color: "#1a1a1a", lineHeight: 1,
            letterSpacing: "-0.02em", marginBottom: "14px",
            animation: "fadeIn 0.8s ease both",
          }}>Restyle</h1>

          <p style={{
            fontFamily: "'DM Mono', monospace", fontSize: "12px",
            letterSpacing: "0.14em", color: "#aaa",
            textTransform: "uppercase", marginBottom: "24px",
            animation: "fadeIn 0.8s ease 0.2s both",
            margin: "0 0 24px 0",
          }}>
            wardrobe · outfits · style
          </p>

          <div style={{ height: "26px", overflow: "hidden", marginBottom: "38px", animation: "fadeIn 0.8s ease 0.4s both" }}>
            <p key={quoteIndex} style={{
              fontFamily: "'DM Mono', monospace", fontStyle: "italic",
              fontSize: "14px", color: "#666",
              animation: "quoteSlide 3.2s ease", letterSpacing: "0.02em",
              margin: 0,
            }}>
              {QUOTES[quoteIndex]}
            </p>
          </div>

          <Link to="/wardrobe" className="restyle-cta-btn" style={{ animation: "fadeIn 0.8s ease 0.6s both" }}>
            start building your wardrobe
          </Link>

          <div style={{
            marginTop: "16px", fontSize: "12px",
            fontFamily: "'DM Mono', monospace",
            color: greeting.color, fontStyle: "italic", letterSpacing: "0.04em",
          }}>
            {greeting.text}
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
          opacity: scrollY > 50 ? 0 : 1, transition: "opacity 0.3s",
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#bbb", letterSpacing: "0.1em" }}>scroll</span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, #bbb, transparent)" }} />
        </div>
      </section>

      {/* features */}
      <section style={{
        padding: "100px 48px 80px", maxWidth: "1100px", margin: "0 auto",
        opacity: sectionVisible ? 1 : 0,
        transform: sectionVisible ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.7s ease",
      }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.16em", color: "#bbb", textTransform: "uppercase", marginBottom: "14px" }}>explore</p>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 400, fontStyle: "italic",
          color: "#1a1a1a", marginBottom: "52px", lineHeight: 1.1,
        }}>
          your wardrobe, restyled
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {NAV_FEATURES.map(item => (
            <div key={item.label} className="restyle-feature-card">
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                fontSize: "21px", color: item.color, marginBottom: "10px", fontWeight: 400,
              }}>{item.label}</h3>
              <p style={{
                fontFamily: "'DM Mono', monospace", fontSize: "13px",
                color: "#777", lineHeight: 1.7, marginBottom: "18px",
              }}>{item.desc}</p>
              <Link to={item.to} className="restyle-feature-link" style={{ color: item.color }}>
                {item.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section style={{
        padding: "60px 48px 120px", maxWidth: "1100px", margin: "0 auto",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "start",
      }}>
        <div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.16em", color: "#bbb", textTransform: "uppercase", marginBottom: "14px" }}>how it works</p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 400, fontStyle: "italic",
            color: "#1a1a1a", lineHeight: 1.15,
          }}>
            four steps to<br />a better closet
          </h2>
        </div>
        <div>
          {STEPS.map((step) => (
            <div key={step.n} style={{ display: "flex", gap: "20px", alignItems: "flex-start", padding: "22px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                fontSize: "28px", color: "#E76F51", lineHeight: 1, minWidth: "44px", opacity: 0.55,
              }}>{step.n}</span>
              <div>
                <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: 500, color: "#1a1a1a", marginBottom: "5px", letterSpacing: "0.04em" }}>{step.title}</h4>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#888", lineHeight: 1.75, margin: 0 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* status */}
      {!loading && stats && (
        <div style={{ textAlign: "center", padding: "0 0 60px", fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#2A9D8F", letterSpacing: "0.06em" }}>
          ✓ system connected
        </div>
      )}
    </div>
  );
}

export default Home;