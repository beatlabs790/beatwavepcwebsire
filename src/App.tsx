import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Check, ShieldCheck, RefreshCw, Layers, X, Smartphone, MessageSquare, Send, Settings, Lock, Zap, Music, HardDrive, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from './components/ui/button';
import {
  submitApplication,
  subscribeToApplicationsCount,
  subscribeToSettings,
  updateSystemSettings,
  fetchApplicationsList,
  subscribeToConnectionStatus,
} from './lib/firebase';
import type { ApplicationDetails, SystemSettings } from './lib/firebase';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4';

function hexToRgb(hex: string): string {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

const THEMES = {
  indigo: {
    gradient: 'linear-gradient(to left, #6366f1, #a855f7, #fcd34d)',
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#fcd34d',
    textColor: 'text-[#6366f1]',
    bgColor: 'bg-[#6366f1]',
    borderColor: 'border-[#6366f1]',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    accentGlow: 'rgba(168, 85, 247, 0.4)'
  },
  amber: {
    gradient: 'linear-gradient(to left, #f59e0b, #ea580c, #ef4444)',
    primary: '#f59e0b',
    secondary: '#ea580c',
    accent: '#ef4444',
    textColor: 'text-[#f59e0b]',
    bgColor: 'bg-[#f59e0b]',
    borderColor: 'border-[#f59e0b]',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    accentGlow: 'rgba(234, 88, 12, 0.4)'
  },
  emerald: {
    gradient: 'linear-gradient(to left, #10b981, #059669, #06b6d4)',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#06b6d4',
    textColor: 'text-[#10b981]',
    bgColor: 'bg-[#10b981]',
    borderColor: 'border-[#10b981]',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentGlow: 'rgba(5, 150, 105, 0.4)'
  },
  rose: {
    gradient: 'linear-gradient(to left, #f43f5e, #db2777, #6366f1)',
    primary: '#f43f5e',
    secondary: '#db2777',
    accent: '#6366f1',
    textColor: 'text-[#f43f5e]',
    bgColor: 'bg-[#f43f5e]',
    borderColor: 'border-[#f43f5e]',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    accentGlow: 'rgba(219, 39, 119, 0.4)'
  }
};

const FAQS = [
  {
    q: "What is WASAPI Exclusive Mode?",
    a: "WASAPI (Windows Audio Session API) Exclusive Mode allows BeatWave to bypass the Windows audio mixer and feed audio samples directly to your sound card or DAC. This prevents Windows from resampling or mixing audio, ensuring pure, bit-perfect, and lossless sound reproduction."
  },
  {
    q: "How does the Cloud Sync companion feature work?",
    a: "Your library metadata, custom playlists, and equalizer presets are automatically synchronized in real-time between your Windows desktop app and the Android companion app. Changes made on one device reflect instantly on the other via our secure database."
  },
  {
    q: "Is early access / beta participation free?",
    a: "Yes! Early access to the BeatWave PC beta is completely free for all approved waitlist applicants. We are currently rolling out access in waves of 1,000 slots."
  },
  {
    q: "How do I download the Android companion app?",
    a: "The companion app is already live! Simply hover over the 'Android App' button on the homepage to scan the QR code with your phone's camera, which will open the download link."
  }
];

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const FEATURE_CARDS = [
  { icon: Layers, title: 'WASAPI Exclusive', desc: 'Bit-perfect audio bypass — zero mixing, zero compromise.', color: '#6366f1' },
  { icon: RefreshCw, title: 'Cloud Sync', desc: 'Your library, in sync with your Android device in real time.', color: '#a855f7' },
  { icon: HardDrive, title: 'Local Sandbox', desc: 'Offline-first caching keeps playback fast with no buffering.', color: '#fcd34d' },
  { icon: Zap, title: 'Lossless EQ', desc: 'Parametric equalizer that never degrades the source signal.', color: '#6366f1' },
  { icon: Smartphone, title: 'Android Companion', desc: 'Seamlessly control playback from your phone. Already live.', color: '#a855f7' },
  { icon: Music, title: 'Auto-Download', desc: 'Smart background fetching for your most played tracks.', color: '#fcd34d' },
];

// const SCREENSHOTS = [
//   { src: '/ss1.png', label: 'Player View', desc: 'Bit-perfect WASAPI playback with full waveform visualizer.' },
//   { src: '/ss2.png', label: 'Equalizer', desc: 'Lossless 10-band parametric EQ — zero signal degradation.' },
//   { src: '/ss3.png', label: 'Cloud Sync', desc: 'Real-time library sync with your Android companion app.' },
// ];

// const TESTIMONIALS = [
//   { name: 'Rishi M.', handle: '@rishimusic', text: 'The WASAPI mode is a game-changer. Finally a Windows player that doesn\'t mess with my audio chain.' },
//   { name: 'Aditya K.', handle: '@aditya_hifi', text: 'The cloud sync between my phone and PC is seamless. BeatWave is the only app I need.' },
//   { name: 'Priya S.', handle: '@priya.listens', text: 'Joined the beta and I\'m blown away. The EQ sounds cleaner than anything else I\'ve used.' },
//   { name: 'Dev R.', handle: '@devbeats', text: 'The UI is absolutely premium. It feels like what Spotify should have been.' },
// ];

// const ROADMAP = [
//   { version: 'v0.1 Alpha', status: 'done', label: 'Released', items: ['Core WASAPI playback engine', 'Local library scanner', 'Android companion app'] },
//   { version: 'v0.5 Beta', status: 'active', label: 'In Progress', items: ['Cloud sync with Firebase', 'Parametric EQ', 'Beta waitlist rollout'] },
//   { version: 'v1.0 RC', status: 'upcoming', label: 'Coming Soon', items: ['Auto-download & smart caching', 'Lyrics engine', 'Last.fm scrobbling'] },
//   { version: 'v1.5', status: 'upcoming', label: 'Planned', items: ['Podcast support', 'Custom themes', 'Windows media key integration'] },
// ];

function App() {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Cookie consent — persisted in localStorage
  const [cookieConsent, setCookieConsent] = useState<'accepted' | 'declined' | null>(() => {
    const stored = localStorage.getItem('bw_cookie_consent');
    return (stored as 'accepted' | 'declined') || null;
  });

  const handleCookieAccept = () => {
    localStorage.setItem('bw_cookie_consent', 'accepted');
    setCookieConsent('accepted');
  };
  const handleCookieDecline = () => {
    localStorage.setItem('bw_cookie_consent', 'declined');
    setCookieConsent('declined');
  };

  // Splash screen
  // const [splashVisible, setSplashVisible] = useState(true);
  // const [splashFading, setSplashFading] = useState(false);

  // Scroll progress
  // const [scrollProgress, setScrollProgress] = useState(0);

  // Back to top
  // const [showBackToTop, setShowBackToTop] = useState(false);

  // Screenshot carousel
  // const [carouselIndex, setCarouselIndex] = useState(0);

  // Live visitor count
  // const [visitorCount, setVisitorCount] = useState(0);

  // Share copied state
  // const [shareCopied, setShareCopied] = useState(false);

  // Admin countdown label edit
  // const [editCountdownLabel, setEditCountdownLabel] = useState('Beta drops in');

  // Admin Panel states
  const [adminActive, setAdminActive] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [applicationsList, setApplicationsList] = useState<(ApplicationDetails & { id: string })[]>([]);

  // Custom states
  const [editCountdownLabel, setEditCountdownLabel] = useState('Beta drops in');
  const [editThemeColor, setEditThemeColor] = useState<'indigo' | 'amber' | 'emerald' | 'rose'>('indigo');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [chatAdminActive, setChatAdminActive] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [discordMsg, setDiscordMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [loadingFade, setLoadingFade] = useState(false);

  // Admin Config edit states
  const [editAnnouncement, setEditAnnouncement] = useState('');
  const [editTimerTarget, setEditTimerTarget] = useState('');
  const [editTimerActive, setEditTimerActive] = useState(true);
  const [adminSaved, setAdminSaved] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [maintenanceToggling, setMaintenanceToggling] = useState(false);
  const adminEditingRef = useRef(false);

  // Chat messaging states
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Waitlist form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [mobile, setMobile] = useState('');
  const [reason, setReason] = useState('');
  const [loadingWebhook, setLoadingWebhook] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Firebase Realtime settings state
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    maintenanceMessage: '',
    announcement: '',
    timerTarget: '2026-07-15T12:00:00',
    timerActive: true,
    countdownLabel: 'Beta drops in',
    themeColor: 'indigo'
  });

  // Admin edit state for maintenance message
  const [editMaintenanceMessage, setEditMaintenanceMessage] = useState('');

  // Toast notification state
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Firebase waitlist count
  const [slotsClaimed, setSlotsClaimed] = useState(0);

  // Countdown timer clock state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Refs for video player opacity
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOpacity, setVideoOpacity] = useState(0);

  // Refs for particle animation canvas
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const mousePositionRef = useRef({ x: -1000, y: -1000 });

  // Waveform canvas ref
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Scroll animation refs
  const featureSectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleCards, setVisibleCards] = useState<boolean[]>(Array(6).fill(false));

  // Initialize messages list once settings load release date info
  useEffect(() => {
    setMessages([
      { sender: 'bot', text: 'Hi! Ask me anything about BeatWave PC.' }
    ]);
  }, [settings.timerTarget]);

  // Subscribe to Firebase Waitlist count in real-time
  useEffect(() => {
    const unsubscribe = subscribeToApplicationsCount((count) => {
      setSlotsClaimed(count);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase Settings configurations in real-time
  useEffect(() => {
    const unsubscribe = subscribeToSettings((data) => {
      setSettings(data);
      // Only sync edit fields if admin is NOT actively editing
      if (!adminEditingRef.current) {
        setEditAnnouncement(data.announcement || '');
        setEditMaintenanceMessage(data.maintenanceMessage || '');
        setEditTimerTarget(data.timerTarget || '2026-07-15T12:00:00');
        setEditTimerActive(data.timerActive ?? true);
        setEditCountdownLabel(data.countdownLabel || 'Beta drops in');
        setEditThemeColor(data.themeColor || 'indigo');
      }
    });
    return () => unsubscribe();
  }, []);

  // Loading screen fade-out timers
  useEffect(() => {
    const timer1 = setTimeout(() => setLoadingFade(true), 1800);
    const timer2 = setTimeout(() => setLoadingScreen(false), 2200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Subscribe to Firebase database connection status
  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((connected) => {
      setDbConnected(connected);
    });
    return () => unsubscribe();
  }, []);

  // Listen for custom PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted PWA installation');
      addToast('🎉 BeatWave PC installed on your device!', 'success');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Discord Broadcast message handler
  const handleSendDiscordBroadcast = async () => {
    if (!discordMsg.trim()) {
      addToast('Please enter a message to broadcast.', 'error');
      return;
    }
    setBroadcasting(true);
    try {
      const webhookUrl = 'https://discord.com/api/webhooks/1522961361422778568/LtiwGiYMF7ia44cUV30lUZVLVhIgGKnQ2IqgKoTQMzXJISYsx8_69OG76UNTVjm9CfR6';
      const payload = {
        embeds: [
          {
            title: "📢 BeatWave PC Official Broadcast",
            color: 16738657,
            description: discordMsg.trim(),
            fields: [
              { name: "Sender", value: "System Administrator", inline: true },
              { name: "Active Theme", value: settings.themeColor || "indigo", inline: true }
            ],
            timestamp: new Date().toISOString()
          }
        ]
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Broadcast failed');
      addToast('📢 Broadcast sent to Discord successfully!', 'success');
      setDiscordMsg('');
    } catch (err) {
      addToast('Failed to send broadcast.', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  // Subscribe to waitlist applications if Admin mode is logged in
  useEffect(() => {
    if (adminActive) {
      const unsubscribe = fetchApplicationsList((list) => {
        setApplicationsList(list);
      });
      return () => unsubscribe();
    }
  }, [adminActive]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  // Ticking Countdown Timer calculation loop
  useEffect(() => {
    const updateCountdown = () => {
      if (!settings.timerActive) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const targetDate = new Date(settings.timerTarget).getTime();
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (isNaN(diff) || diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [settings.timerTarget, settings.timerActive]);

  // Track Mouse movement for interactive particles
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mousePositionRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Particle constellation network simulation loop
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const numParticles = 40;
    const currentTheme = THEMES[settings.themeColor || 'indigo'];

    // Set dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mousePositionRef.current;

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Boundary bounce
        if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;

        // Attract to mouse cursor if close
        if (mouse.x > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            // Faint pull acceleration
            p.x += dx * 0.003;
            p.y += dy * 0.003;
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentTheme.accentGlow;
        ctx.fill();
      });

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = currentTheme.primary.startsWith('#')
              ? `rgba(${hexToRgb(currentTheme.primary)}, ${alpha})`
              : `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw line from particle to cursor
        if (mouse.x > 0) {
          const p = particles[i];
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = currentTheme.secondary.startsWith('#')
              ? `rgba(${hexToRgb(currentTheme.secondary)}, ${alpha})`
              : `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [settings.themeColor]);

  // Custom JS-controlled video fade loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frameId: number;
    const fadeDuration = 0.5; // 0.5s fade-in, 0.5s fade-out

    const updateOpacity = () => {
      if (!video) return;
      const duration = video.duration;
      const currentTime = video.currentTime;

      if (!isNaN(duration) && duration > 0) {
        if (currentTime < fadeDuration) {
          // Fade in at start
          setVideoOpacity(currentTime / fadeDuration);
        } else if (currentTime > duration - fadeDuration) {
          // Fade out at end
          const remaining = duration - currentTime;
          setVideoOpacity(remaining / fadeDuration);
        } else {
          // Full opacity
          setVideoOpacity(1);
        }
      }
      frameId = requestAnimationFrame(updateOpacity);
    };

    const handlePlay = () => {
      frameId = requestAnimationFrame(updateOpacity);
    };

    const handleEnded = () => {
      cancelAnimationFrame(frameId);
      setVideoOpacity(0);
      setTimeout(() => {
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      }, 100);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);

    // Auto play on mount
    video.play().catch(() => {});

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Animated waveform canvas
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let t = 0;
    const currentTheme = THEMES[settings.themeColor || 'indigo'];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;

      const waves = [
        { amp: 18, freq: 0.018, speed: 0.04, alpha: 0.18, color: currentTheme.primary },
        { amp: 12, freq: 0.025, speed: 0.06, alpha: 0.13, color: currentTheme.secondary },
        { amp: 8,  freq: 0.035, speed: 0.09, alpha: 0.10, color: currentTheme.accent },
      ];

      waves.forEach(({ amp, freq, speed, alpha, color }) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x++) {
          const y = mid + Math.sin(x * freq + t * speed * 60) * amp
                       + Math.sin(x * freq * 1.7 + t * speed * 40) * (amp * 0.5);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      t++;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [settings.themeColor]);

  // Scroll-triggered IntersectionObserver for feature cards
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleCards((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
              });
            }, i * 100);
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Toast helper
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Download waitlist database to CSV
  const downloadCSV = () => {
    if (!applicationsList || applicationsList.length === 0) {
      addToast('No applications to export.', 'info');
      return;
    }

    const headers = ['Name', 'Email', 'Instagram ID', 'Mobile', 'Reason', 'Timestamp'];
    const rows = applicationsList.map(app => [
      `"${(app.name || '').replace(/"/g, '""')}"`,
      `"${(app.email || '').replace(/"/g, '""')}"`,
      `"${(app.instagramId || '').replace(/"/g, '""')}"`,
      `"${(app.mobile || '').replace(/"/g, '""')}"`,
      `"${(app.reason || '').replace(/"/g, '""')}"`,
      `"${(app.timestamp || '')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `beatwave_waitlist_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Waitlist CSV exported successfully!', 'success');
  };

  // AI assistant dialogue question matcher
  const handleAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    // Send user message to the live chat logger Discord Webhook
    try {
      const chatLoggerWebhook = 'https://discord.com/api/webhooks/1523204326200447127/fc7aQPlqLU0EfGx1kVJWOd3LYZreq_vBCk4To4S0u1HLo45KcemKu-Zn_BDFpdHL0Lke';
      fetch(chatLoggerWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: "💬 BeatWave PC Live Chat Submission",
              color: 6514417,
              fields: [
                { name: "Message", value: questionText },
                { name: "Context", value: chatAdminActive ? "Admin Mode" : "Visitor Mode", inline: true }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        })
      }).catch((err) => console.warn("Chat log webhook failed:", err));
    } catch (e) {
      console.warn("Chat logging exception:", e);
    }

    // Check for admin passcode in chat
    if (questionText.trim() === 'admin00') {
      setChatAdminActive(true);
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: questionText },
        { sender: 'bot', text: '🔒 Admin access granted to BeatWave AI! You can now configure settings (e.g., "change theme to emerald", "toggle maintenance on", "set announcement to Hello World", or "export waitlist"). To exit, say "logout".' }
      ]);
      return;
    }

    // Check for logout command
    if (chatAdminActive && (questionText.toLowerCase().trim() === 'logout' || questionText.toLowerCase().trim() === 'exit admin')) {
      setChatAdminActive(false);
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: questionText },
        { sender: 'bot', text: '🔓 Logged out of Admin mode. Chat assistant restored to default visitor mode.' }
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: questionText },
      { sender: 'bot', text: 'Typing...' }
    ]);

    let reply = "";

    try {
      const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || "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";
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

      const adminInstructions = chatAdminActive ? `
[ADMIN CONTROL PANEL ACTIVE]
The user is logged in as an administrator. You have permissions to configure settings dynamically.
When the user asks you to modify settings, export waitlists, or broadcast announcements, you MUST append a structured command at the very end of your response inside square brackets.

Format Rules:
1. To update settings, append: [ACTION: UPDATE_SETTINGS, key1=value1, key2=value2]
   Supported keys and formats:
   - themeColor: 'indigo' | 'amber' | 'emerald' | 'rose' (e.g. themeColor=rose)
   - maintenanceMode: 'true' | 'false' (e.g. maintenanceMode=true)
   - maintenanceMessage: text message (e.g. maintenanceMessage=Updating servers)
   - announcement: text banner message (e.g. announcement=Alpha Wave 2 signup open!)
   - timerTarget: ISO datetime string YYYY-MM-DDTHH:MM (e.g. timerTarget=2026-07-20T18:00)
   - timerActive: 'true' | 'false' (e.g. timerActive=true)
   - countdownLabel: text label (e.g. countdownLabel=Countdown Target)

2. To export the database waitlist: [ACTION: EXPORT_CSV]

3. To send a Discord broadcast announcement: [ACTION: DISCORD_BROADCAST, message=Your message text here]

Current configurations:
${JSON.stringify(settings)}

Examples:
- User: "change theme to amber" -> Reply: "Highlight theme updated to Amber! [ACTION: UPDATE_SETTINGS, themeColor=amber]"
- User: "set announcement banner to Maintenance tonight at 10" -> Reply: "Banner set successfully. [ACTION: UPDATE_SETTINGS, announcement=Maintenance tonight at 10]"
- User: "broadcast hello everyone to discord" -> Reply: "Sure! Sending Discord broadcast: hello everyone. [ACTION: DISCORD_BROADCAST, message=hello everyone]"
- User: "export waitlist" -> Reply: "Exporting database waitlist to CSV. [ACTION: EXPORT_CSV]"
` : "";

      const systemPrompt = `You are BeatWave Assistant, a friendly and concise AI helper on the BeatWave PC landing page.
Your job is to answer visitor questions about BeatWave PC.

Product details:
- Name: BeatWave PC (developed by BeatLabs).
- Core Feature: Bit-perfect WASAPI Exclusive Mode audio playback (bypasses Windows mixer for pure audiophile sound).
- Other Features: Lossless Parametric EQ, automated Cloud Sync with the Android companion app, local sandbox caching (offline-first).
- Android Companion App: Already live. Visitors can download it via the 'Android App' button (leads to https://beatwavy.vercel.app).
- Release Date: Expected around mid-to-late July 2026. Current countdown target is: ${settings.timerTarget}.
- Early Access / Waitlist: Users can click 'Sign Up' or 'Join Waitlist' to apply.
- GitHub: Code is open source on GitHub.

Rules:
1. Keep responses concise (under 2-3 sentences).
2. Be polite, engaging, and professional.
3. If they ask about unrelated topics, politely guide them back to BeatWave PC.
${adminInstructions}`;

      if (openRouterKey) {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openRouterKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "BeatWave PC"
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: questionText }
            ],
            temperature: 0.7,
            max_tokens: 150
          })
        });

        if (!response.ok) throw new Error("OpenRouter API error");
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Try again!";
      } else if (geminiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${questionText}` }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 150,
              temperature: 0.7
            }
          })
        });

        if (!response.ok) throw new Error("Gemini API error");
        const data = await response.json();
        reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get a response. Try again!";
      } else {
        const q = questionText.toLowerCase();
        reply = "I'm not sure about that. Try asking about the release date, waitlist steps, or features!";

        if (q.includes('release') || q.includes('july') || q.includes('when') || q.includes('date')) {
          reply = `BeatWave PC is expected to release by mid-July or late July. Current target: ${new Date(settings.timerTarget).toLocaleDateString()}`;
        } else if (q.includes('feature') || q.includes('wasapi') || q.includes('playback') || q.includes('audio') || q.includes('lossless')) {
          reply = "It features bit-perfect WASAPI Exclusive Mode audio playback, local sandbox caching, and automated cloud sync with your Android companion app.";
        } else if (q.includes('waitlist') || q.includes('join') || q.includes('beta') || q.includes('apply')) {
          reply = "Apply for early access by clicking the 'Join Waitlist' button on the hero section to submit your application form.";
        } else if (q.includes('android') || q.includes('phone') || q.includes('app')) {
          reply = "The Android app companion is already live! Click the 'Android App' button to download it.";
        } else if (q.includes('git') || q.includes('repo') || q.includes('code')) {
          reply = "The GitHub repository is public! You can explore the codebase by clicking the 'GitHub' button.";
        }
      }
    } catch (err) {
      console.warn("AI Chat API call failed, falling back to local handler:", err);
      const q = questionText.toLowerCase();
      reply = "I'm not sure about that. Try asking about the release date, waitlist steps, or features!";

      if (q.includes('release') || q.includes('july') || q.includes('when') || q.includes('date')) {
        reply = `BeatWave PC is expected to release by mid-July or late July. Current target: ${new Date(settings.timerTarget).toLocaleDateString()}`;
      } else if (q.includes('feature') || q.includes('wasapi') || q.includes('playback') || q.includes('audio') || q.includes('lossless')) {
        reply = "It features bit-perfect WASAPI Exclusive Mode audio playback, local sandbox caching, and automated cloud sync with your Android companion app.";
      } else if (q.includes('waitlist') || q.includes('join') || q.includes('beta') || q.includes('apply')) {
        reply = "Apply for early access by clicking the 'Join Waitlist' button on the hero section to submit your application form.";
      } else if (q.includes('android') || q.includes('phone') || q.includes('app')) {
        reply = "The Android app companion is already live! Click the 'Android App' button to download it.";
      } else if (q.includes('git') || q.includes('repo') || q.includes('code')) {
        reply = "The GitHub repository is public! You can explore the codebase by clicking the 'GitHub' button.";
      }
    }

    // Process structured actions from AI response if in Admin Mode
    if (chatAdminActive) {
      const actionRegex = /\[ACTION:\s*([^\]]+)\]/i;
      const match = reply.match(actionRegex);
      if (match) {
        const actionContent = match[1].trim();
        // Remove structured tag from user-facing text
        reply = reply.replace(actionRegex, '').trim();

        if (actionContent.toUpperCase() === 'EXPORT_CSV') {
          downloadCSV();
        } else if (actionContent.toUpperCase().startsWith('UPDATE_SETTINGS')) {
          const paramsPart = actionContent.substring('UPDATE_SETTINGS'.length).replace(/^,\s*/, '').trim();
          const newSettings = { ...settings };
          const pairs = paramsPart.split(',');
          
          pairs.forEach(pair => {
            const eqIdx = pair.indexOf('=');
            if (eqIdx > -1) {
              const key = pair.substring(0, eqIdx).trim();
              let val = pair.substring(eqIdx + 1).trim();

              if (key === 'maintenanceMode') {
                newSettings.maintenanceMode = val.toLowerCase() === 'true';
              } else if (key === 'maintenanceMessage') {
                newSettings.maintenanceMessage = val;
                setEditMaintenanceMessage(val);
              } else if (key === 'announcement') {
                newSettings.announcement = val;
                setEditAnnouncement(val);
              } else if (key === 'timerTarget') {
                newSettings.timerTarget = val;
                setEditTimerTarget(val);
              } else if (key === 'timerActive') {
                newSettings.timerActive = val.toLowerCase() === 'true';
                setEditTimerActive(val.toLowerCase() === 'true');
              } else if (key === 'countdownLabel') {
                newSettings.countdownLabel = val;
                setEditCountdownLabel(val);
              } else if (key === 'themeColor') {
                if (['indigo', 'amber', 'emerald', 'rose'].includes(val.toLowerCase())) {
                  newSettings.themeColor = val.toLowerCase() as any;
                  setEditThemeColor(val.toLowerCase() as any);
                }
              }
            }
          });

          try {
            await updateSystemSettings(newSettings);
            addToast('Settings updated successfully via AI!', 'success');
          } catch (updateError) {
            console.error("AI setting update failed:", updateError);
            addToast('AI settings update failed.', 'error');
          }
        } else if (actionContent.toUpperCase().startsWith('DISCORD_BROADCAST')) {
          const messageVal = actionContent.substring('DISCORD_BROADCAST'.length).replace(/^,\s*/, '').replace(/^message=\s*/i, '').trim();
          if (messageVal) {
            try {
              const webhookUrl = 'https://discord.com/api/webhooks/1522961361422778568/LtiwGiYMF7ia44cUV30lUZVLVhIgGKnQ2IqgKoTQMzXJISYsx8_69OG76UNTVjm9CfR6';
              const payload = {
                embeds: [
                  {
                    title: "📢 BeatWave PC Official Broadcast (via AI)",
                    color: 16738657,
                    description: messageVal,
                    fields: [
                      { name: "Sender", value: "AI Chat Administrator", inline: true },
                      { name: "Active Theme", value: settings.themeColor || "indigo", inline: true }
                    ],
                    timestamp: new Date().toISOString()
                  }
                ]
              };
              await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              addToast('📢 AI Broadcast sent to Discord!', 'success');
            } catch (err) {
              console.error("AI Discord broadcast failed:", err);
              addToast('Failed to broadcast via AI.', 'error');
            }
          }
        }
      }
    }

    setMessages((prev) => {
      const list = [...prev];
      if (list[list.length - 1]?.sender === 'bot' && list[list.length - 1]?.text === 'Typing...') {
        list[list.length - 1] = { sender: 'bot', text: reply };
      } else {
        list.push({ sender: 'bot', text: reply });
      }
      return list;
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    handleAskQuestion(userInput);
    setUserInput('');
  };

  // Submit Waitlist form to Firebase and Discord Webhook
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!instagramId.trim()) {
      setError('Instagram ID is required.');
      return;
    }
    if (!reason.trim()) {
      setError('Please let us know why you want to test BeatWave PC.');
      return;
    }

    setError('');
    setLoadingWebhook(true);

    try {
      const timestamp = new Date().toISOString();
      const application: ApplicationDetails = {
        name,
        email,
        instagramId,
        mobile: mobile.trim() || undefined,
        reason,
        timestamp
      };

      // 1. Submit to Firebase RTDB
      await submitApplication(application);

      // 2. Submit notify webhook to Discord
      const webhookUrl = 'https://discord.com/api/webhooks/1522961361422778568/LtiwGiYMF7ia44cUV30lUZVLVhIgGKnQ2IqgKoTQMzXJISYsx8_69OG76UNTVjm9CfR6';
      const payload = {
        embeds: [
          {
            title: "New BeatWave PC Beta Application (Firebase Sync)",
            color: 6514417, // Hex #6366F1
            fields: [
              { name: "Name", value: name, inline: true },
              { name: "Email", value: email, inline: true },
              { name: "Instagram ID", value: instagramId, inline: true },
              { name: "Mobile (Optional)", value: mobile.trim() || "Not provided", inline: true },
              { name: "Why do you want to test BeatWave PC?", value: reason }
            ],
            timestamp
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      setSubmitted(true);
      // Fire confetti celebration
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.55 }, colors: ['#6366f1', '#a855f7', '#fcd34d', '#ffffff', '#e0e7ff'] });
      setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 }, colors: ['#a855f7', '#fcd34d'] }), 400);
      addToast('🎉 Application submitted! We\'ll notify you when beta drops.', 'success');
    } catch (err) {
      setError('Network error. Check your internet connection.');
      addToast('Failed to submit. Check your connection.', 'error');
    } finally {
      setLoadingWebhook(false);
    }
  };

  // Submit Admin settings updates to Firebase
  const handleAdminSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    try {
      const newSettings: SystemSettings = {
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: editMaintenanceMessage,
        announcement: editAnnouncement,
        timerTarget: editTimerTarget,
        timerActive: editTimerActive,
        countdownLabel: editCountdownLabel,
        themeColor: editThemeColor
      };
      await updateSystemSettings(newSettings);
      adminEditingRef.current = false;
      setAdminSaved(true);
      setTimeout(() => setAdminSaved(false), 2500);
    } catch (err) {
      addToast('Failed to update settings. Please try again.', 'error');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleAdminToggleMaintenance = async () => {
    setMaintenanceToggling(true);
    try {
      const newSettings: SystemSettings = {
        ...settings,
        maintenanceMessage: editMaintenanceMessage,
        maintenanceMode: !settings.maintenanceMode
      };
      await updateSystemSettings(newSettings);
    } catch (err) {
      addToast('Failed to toggle maintenance mode.', 'error');
    } finally {
      setMaintenanceToggling(false);
    }
  };

  // Validate Admin Password
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin00') {
      setAdminActive(true);
      setAdminPanelOpen(true);
      setAdminLoginOpen(false);
      setAdminPasswordInput('');
      setAdminPasswordError('');
    } else {
      setAdminPasswordError('Incorrect passcode.');
    }
  };

  // Render top announcement bar if set
  const showAnnouncementBar = settings.announcement && !settings.maintenanceMode;

  return (
    <div className="bg-background min-h-screen text-foreground relative flex flex-col justify-between overflow-hidden">
      
      {/* Background Cinematic Video (JS-controlled fade loop, absolute inset-0) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video 
          ref={videoRef}
          muted 
          playsInline
          className="w-full h-full object-cover pointer-events-none transition-opacity duration-75"
          style={{ opacity: videoOpacity }}
          src={VIDEO_URL} 
        />
      </div>

      {/* Interactive Background Particle Constellation Overlay (Tracks cursor, behind content) */}
      <canvas 
        ref={particleCanvasRef} 
        className="absolute inset-0 z-[1] pointer-events-none" 
      />

      {/* Blurred Overlay Shape (centered behind content, pointer-events-none) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2] w-[984px] h-[527px] opacity-90 bg-gray-950 blur-[82px] pointer-events-none"
      />

      {/* Top Announcement System Marquee */}
      {showAnnouncementBar && (
        <div className="w-full bg-[#6366f1]/20 border-b border-white/5 py-3 px-8 text-center z-30 text-xs font-semibold relative overflow-hidden backdrop-blur-md flex justify-center items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#fcd34d] animate-pulse" />
          <span>{settings.announcement}</span>
        </div>
      )}

      {/* Header / Navbar (Frosted floating glass layout) */}
      <div className="relative z-10 flex flex-col p-4 w-full max-w-7xl mx-auto">
        <nav className="w-full py-4 px-8 flex items-center justify-between rounded-2xl liquid-glass border border-white/10 shadow-lg">
          {/* Left: Logo using image.png + connection status badge */}
          <div className="flex items-center gap-3">
            <img src="/image.png" alt="BeatWave Logo" className="h-8 w-auto object-contain rounded" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-sm font-bold tracking-wider uppercase opacity-85">BeatWave PC</span>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[7.5px] uppercase tracking-widest text-white/40 font-bold select-none">
                  {dbConnected ? 'Sync: Connected' : 'Sync: Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Sign Up Cta Button / Admin Settings control */}
          <div className="flex items-center gap-3">
            {adminActive && (
              <button 
                onClick={() => setAdminPanelOpen(true)}
                className="liquid-glass text-xs font-semibold px-4 py-2 rounded-full border border-[#6366f1]/30 hover:bg-[#6366f1]/10 text-[#6366f1] transition-all flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Admin Console</span>
              </button>
            )}
            <Button 
              variant="heroSecondary" 
              className="rounded-full px-5 py-2.5 text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/15 transition-all active:scale-[0.97]"
              onClick={() => setModalOpen(true)}
            >
              Sign Up
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Hero Content (vertically centered via flex-1, overflow-visible to prevent blur clipping) */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 text-center overflow-visible">
        
        {/* Headline */}
        <h1 
          className="font-display font-normal text-[3.8rem] sm:text-[6rem] md:text-[220px] leading-[1.02] tracking-[-0.024em] text-foreground select-none animate-fade-in"
        >
          BeatWave{' '}
          <span 
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: THEMES[settings.themeColor || 'indigo'].gradient }}
          >
            PC
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-hero-sub text-sm sm:text-lg leading-relaxed sm:leading-8 max-w-md mt-[9px] opacity-80 animate-fade-in">
          Shape scattered signals into lossless equalized audio. Experience pure, bit-perfect playback on your desktop.
        </p>

        {/* Glassmorphic Feature Pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 animate-fade-in">
          {['WASAPI', 'Lossless', 'Cloud Sync', 'Android'].map((pill) => (
            <span
              key={pill}
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-white/60 liquid-glass"
              style={{ backdropFilter: 'blur(16px)' }}
            >
              {pill}
            </span>
          ))}
        </div>

        {/* Animated Waveform */}
        <div className="mt-6 w-full max-w-sm mx-auto h-10 relative animate-fade-in">
          <canvas ref={waveCanvasRef} className="w-full h-full" />
        </div>

        {/* Ticking Countdown Timer (Rendered dynamically if active in settings) */}
        {settings.timerActive && (
          <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
            <span className="text-[10px] uppercase font-bold tracking-widest select-none opacity-80"
              style={{ color: THEMES[settings.themeColor || 'indigo'].secondary }}
            >
              {settings.countdownLabel || 'Beta drops in'}
            </span>
            <div className="flex gap-3 sm:gap-4 justify-center select-none">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="liquid-glass flex flex-col items-center p-3 w-16 sm:w-20 rounded-2xl border border-white/10 shadow-lg">
                  <span className="font-display text-lg sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-white/35 mt-1 font-semibold">{unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Waitlist Slots claimed Progress Bar (Syncs from 0 to 1000 based on applications list size) */}
        <div className="mt-10 w-full max-w-xs mx-auto animate-fade-in flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-white/50 px-1">
            <span>Beta Wave 1 Allocation</span>
            <span className="font-semibold" style={{ color: THEMES[settings.themeColor || 'indigo'].secondary }}>{slotsClaimed}/1000 claimed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 border border-white/10 p-[1px] overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.min((slotsClaimed / 1000) * 100, 100)}%`,
                backgroundImage: THEMES[settings.themeColor || 'indigo'].gradient.replace('to left', 'to right'),
                boxShadow: `0 0 10px ${THEMES[settings.themeColor || 'indigo'].secondary}66`
              }}
            />
          </div>
        </div>

        {/* Big CTA Waitlist Trigger (scaled up frosted glass capsule button) */}
        <button 
          className="liquid-glass px-[36px] py-[28px] text-xs uppercase tracking-wider font-bold mt-[20px] rounded-full border border-white/15 hover:bg-white/10 hover:border-white/30 text-white active:scale-95 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer animate-fade-in"
          onClick={() => setModalOpen(true)}
        >
          Join Waitlist
        </button>

        {/* Large, Frosted Glass Ecosystem Portal Links */}
        <div className="mt-12 flex flex-wrap gap-4 justify-center items-center max-w-2xl mx-auto">
          {/* Download Android App */}
          <div className="relative group">
            <a
              href="https://beatwavy.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="liquid-glass flex items-center gap-3 px-8 py-4 rounded-full active:scale-95 transition-all text-sm font-bold text-white/80 hover:text-white shadow-lg duration-300 transform hover:scale-[1.04]"
            >
              <Smartphone className="w-5 h-5 shrink-0" style={{ color: THEMES[settings.themeColor || 'indigo'].primary }} />
              <span>Android App</span>
            </a>
            {/* Custom SVG QR Code Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-40 p-3 bg-[#0a0a12]/95 backdrop-blur-md rounded-2xl border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 flex flex-col items-center gap-2 shadow-2xl z-50">
              <img 
                src="/qr-code.svg" 
                alt="Scan to Download Android App" 
                className="w-28 h-28 rounded-lg bg-white p-1 select-none"
              />
              <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider text-center">Scan to download</span>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#0a0a12]/95"></div>
            </div>
          </div>

          {/* GitHub Repo */}
          <a
            href="https://github.com/beatlabs790/beatwave"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass flex items-center gap-3 px-8 py-4 rounded-full active:scale-95 transition-all text-sm font-bold text-white/80 hover:text-white shadow-lg duration-300 transform hover:scale-[1.04]"
          >
            <svg className="w-5 h-5 text-[#a855f7] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>GitHub</span>
          </a>

          {/* Discord Server */}
          <a
            href="https://discord.gg/spbuDTePSR"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass flex items-center gap-3 px-8 py-4 rounded-full active:scale-95 transition-all text-sm font-bold text-white/80 hover:text-white shadow-lg duration-300 transform hover:scale-[1.04]"
          >
            <MessageSquare className="w-5 h-5 text-[#6366f1] shrink-0" />
            <span>Discord</span>
          </a>

          {/* Instagram Link */}
          <a
            href="https://instagram.com/_beat_labs"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass flex items-center gap-3 px-8 py-4 rounded-full active:scale-95 transition-all text-sm font-bold text-white/80 hover:text-white shadow-lg duration-300 transform hover:scale-[1.04]"
          >
            <svg className="w-5 h-5 text-[#fcd34d] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <span>Instagram</span>
          </a>

          {/* Support via UPI */}
          <button
            onClick={() => addToast('💖 UPI Support coming soon in Beta Wave 2! Thank you.', 'info')}
            className="liquid-glass flex items-center gap-3 px-8 py-4 rounded-full active:scale-95 transition-all text-sm font-bold text-white/80 hover:text-white shadow-lg duration-300 transform hover:scale-[1.04] cursor-pointer"
          >
            <img src="/upi logo.png" alt="UPI Logo" className="h-4 w-auto object-contain brightness-0 invert opacity-85 shrink-0" />
            <span className="flex items-center gap-1.5">
              <span>Support Us</span>
              <span className="text-[8px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">Soon</span>
            </span>
          </button>
        </div>

      </main>

      {/* FEATURE CARDS SECTION — scroll-triggered stagger */}
      <section
        ref={featureSectionRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-20"
      >
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">What's inside</span>
          <h2 className="font-display text-2xl sm:text-4xl font-semibold text-white mt-2">Everything you need.</h2>
          <p className="text-sm text-white/40 mt-2 max-w-sm mx-auto">Built for audiophiles who refuse to compromise.</p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                ref={(el) => { cardRefs.current[i] = el; }}
                className="liquid-glass rounded-2xl p-6 border border-white/8 flex flex-col gap-3 hover:border-white/15 transition-all duration-500 hover:-translate-y-1 group"
                style={{
                  opacity: visibleCards[i] ? 1 : 0,
                  transform: visibleCards[i] ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.55s ease ${i * 0.08}s, transform 0.55s ease ${i * 0.08}s, border-color 0.3s`,
                }}
              >
                {/* Icon badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}18`, border: `1px solid ${card.color}30` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <h3 className="text-sm font-bold text-white">{card.title}</h3>
                <p className="text-xs text-white/45 leading-relaxed">{card.desc}</p>
                {/* Hover glow line */}
                <div
                  className="h-[1px] w-0 group-hover:w-full transition-all duration-500 rounded-full mt-1"
                  style={{ background: `linear-gradient(to right, ${card.color}, transparent)` }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="relative z-10 w-full max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">FAQ</span>
          <h2 className="font-display text-2xl sm:text-4xl font-semibold text-white mt-2">Frequently Asked Questions</h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="liquid-glass rounded-2xl border border-white/8 transition-all duration-300 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex justify-between items-center px-6 py-4.5 text-left font-bold text-xs sm:text-sm text-white select-none cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`transform transition-transform duration-300 text-white/40 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-48 border-t border-white/5 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 py-4.5 text-[11px] sm:text-xs text-white/50 leading-relaxed bg-white/[0.01]">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating AI Bubble Chat Q&A widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto select-none">
        
        {/* Dynamic Q&A Panel */}
        {chatOpen && (
          <div className="liquid-glass w-80 rounded-2xl border border-white/10 shadow-2xl bg-black/60 backdrop-blur-2xl animate-fade-in flex flex-col mb-2 overflow-hidden max-h-[380px]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
              <span className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest">BeatWave AI Helper</span>
              <button 
                onClick={() => setChatOpen(false)} 
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable messages area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[160px] max-h-[220px]">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <span className={`text-[8px] uppercase tracking-wider text-white/30 mb-0.5`}>
                    {msg.sender === 'user' ? 'You' : 'AI'}
                  </span>
                  <div className={`p-3 rounded-2xl text-xs leading-normal ${
                    msg.sender === 'user' 
                      ? 'bg-[#6366f1] text-white rounded-tr-none' 
                      : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Predefined FAQ Quick-clicks */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2.5 bg-black/20">
              <button 
                onClick={() => handleAskQuestion("📅 When is the release date?")}
                className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 px-2 py-1 rounded-full transition-all"
              >
                📅 When is release?
              </button>
              <button 
                onClick={() => handleAskQuestion("⚡ What features does it have?")}
                className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 px-2 py-1 rounded-full transition-all"
              >
                ⚡ Features?
              </button>
              <button 
                onClick={() => handleAskQuestion("📝 How do I join the waitlist?")}
                className="text-[9px] bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 px-2 py-1 rounded-full transition-all"
              >
                📝 Join Waitlist?
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-black/40 flex gap-2">
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-[#6366f1]/40 transition-colors"
              />
              <button 
                type="submit"
                className="w-8 h-8 rounded-xl bg-[#6366f1] hover:bg-[#6366f1]/90 flex items-center justify-center shrink-0 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </form>

          </div>
        )}

        {/* Bouncing bubble trigger */}
        <div 
          className="animate-bounce cursor-pointer"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <div className="liquid-glass flex items-center gap-2.5 px-4 py-3 rounded-full border border-white/10 shadow-2xl bg-white/5 backdrop-blur-lg hover:bg-white/10 hover:border-[#6366f1]/30 transition-all duration-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366f1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#a855f7]"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-foreground/80">BeatWave AI</span>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-semibold shadow-2xl border backdrop-blur-xl animate-fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-red-950/80 border-red-500/30 text-red-300'
                : 'bg-black/70 border-white/10 text-white/80'
            }`}
          >
            <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Footer / Lock button for Admin login */}
      <footer className="relative z-10 w-full py-6 flex flex-col items-center justify-center gap-2 text-[10px] text-foreground/30 border-t border-white/5 bg-black/10">
        <span>BeatLabs &copy; 2026. All rights reserved.</span>
        <button
          onClick={() => setAdminLoginOpen(true)}
          className="hover:text-white transition-colors flex items-center gap-1 select-none pointer-events-auto"
        >
          <Lock className="w-3 h-3" />
          <span>Admin Access</span>
        </button>
        {/* Legal links */}
        <div className="flex items-center gap-4 mt-1">
          <button onClick={() => setPrivacyOpen(true)} className="hover:text-white/60 transition-colors">Privacy Policy</button>
          <span className="text-white/10">·</span>
          <button onClick={() => setTermsOpen(true)} className="hover:text-white/60 transition-colors">Terms of Service</button>
          <span className="text-white/10">·</span>
          <button onClick={() => setCookieConsent(null)} className="hover:text-white/60 transition-colors">Cookie Preferences</button>
        </div>
      </footer>

      {/* COOKIE CONSENT BANNER */}
      {cookieConsent === null && (
        <div className="fixed bottom-0 inset-x-0 z-[85] px-4 pb-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            style={{ background: 'rgba(10,10,18,0.92)', backdropFilter: 'blur(24px)' }}
          >
            <div className="flex-1">
              <p className="text-xs font-semibold text-white mb-1">🍪 We use cookies</p>
              <p className="text-[11px] text-white/50 leading-relaxed">
                We use essential cookies to remember your preferences. By accepting, you also consent to Firebase analytics. See our{' '}
                <button onClick={() => setPrivacyOpen(true)} className="text-[#a855f7] underline underline-offset-2 hover:text-white transition-colors">Privacy Policy</button>.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCookieDecline}
                className="px-4 py-2 rounded-xl text-[11px] font-bold text-white/50 border border-white/10 hover:bg-white/5 transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleCookieAccept}
                className="px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-[#6366f1] hover:bg-[#6366f1]/90 transition-all shadow-lg"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM MAINTENANCE OVERLAY */}
      {settings.maintenanceMode && !adminActive && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#06060a] text-center px-6" style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)' }}>

          {/* Subtle animated dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute rounded-full bg-white/5" style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4 + 0.1,
                animation: `pulse ${Math.random() * 3 + 2}s infinite alternate`
              }} />
            ))}
          </div>

          {/* Admin lock icon top-right */}
          <button
            onClick={() => setAdminLoginOpen(true)}
            className="fixed top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
            title="Admin login"
          >
            <Lock className="w-4 h-4 text-white/40" />
          </button>

          {/* Card */}
          <div className="relative z-10 w-full max-w-[420px] rounded-[24px] p-10 flex flex-col items-center gap-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              backdropFilter: 'blur(24px)'
            }}
          >
            {/* Wrench + Screwdriver icon */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-1"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="url(#wg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <defs>
                  <linearGradient id="wg" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h2 className="text-[1.6rem] font-bold text-white tracking-tight leading-tight">Under Maintenance</h2>

            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              {settings.maintenanceMessage && settings.maintenanceMessage.trim()
                ? settings.maintenanceMessage
                : 'BeatWave PC is undergoing scheduled enhancements. We\'ll return shortly!'}
            </p>

            {/* Subtle animated dots indicator */}
            <div className="flex gap-1.5 mt-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#6366f1]/60" style={{ animation: `pulse 1.4s ${i * 0.3}s infinite alternate` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WAITLIST APPLICATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          
          <div className="relative liquid-glass rounded-3xl w-full max-w-md p-8 text-left shadow-2xl z-10 border border-white/10 max-h-[90vh] !overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6366f1]" />
                <span>BeatWave PC Waitlist</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!submitted ? (
              <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Full Name *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Firstname Lastname"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6366f1]/40 transition-colors"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Email Address *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6366f1]/40 transition-colors"
                  />
                </div>

                {/* Instagram ID */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Instagram ID *</label>
                  <input 
                    type="text" 
                    value={instagramId}
                    onChange={(e) => setInstagramId(e.target.value)}
                    placeholder="e.g. @_beat_labs"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6366f1]/40 transition-colors"
                  />
                </div>

                {/* Mobile number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Mobile Number (Optional)</label>
                  <input 
                    type="tel" 
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 1234567890"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6366f1]/40 transition-colors"
                  />
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-white/50">Why do you want to test BeatWave PC? *</label>
                  <textarea 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us what features you are excited to test..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#6366f1]/40 transition-colors resize-none"
                  />
                </div>

                {error && <span className="text-[10px] text-red-400 font-bold ml-1">{error}</span>}

                <button 
                  type="submit"
                  disabled={loadingWebhook}
                  className="w-full bg-gradient-to-r from-white to-white/90 hover:from-[#6366f1] hover:to-[#a855f7] text-black hover:text-white text-xs font-black uppercase tracking-wider py-4.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                >
                  {loadingWebhook ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Submit Application</span>
                  )}
                </button>

              </form>
            ) : (
              <div className="flex items-center gap-3 p-5 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 text-xs text-[#a855f7] font-bold">
                <div className="w-6 h-6 rounded-full bg-[#6366f1]/10 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Thank you! Your application has been logged. We'll notify you as soon as the client beta drops.</span>
              </div>
            )}

            {/* Micro details links */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 mt-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <Layers className="w-4 h-4 text-[#6366f1] shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-bold text-white block">WASAPI</span>
                  <span className="text-[8px] text-white/40 block leading-tight">Exclusive mode</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <RefreshCw className="w-4 h-4 text-[#6366f1] shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-bold text-white block">Sync Library</span>
                  <span className="text-[8px] text-white/40 block leading-tight">Android link</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 justify-center">
                <ShieldCheck className="w-4 h-4 text-[#6366f1] shrink-0" />
                <div className="text-left">
                  <span className="text-[9px] font-bold text-white block">Sandbox</span>
                  <span className="text-[8px] text-white/40 block leading-tight">Local cache</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PASSCODE LOGIN DIALOG */}
      {adminLoginOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setAdminLoginOpen(false)} />
          
          <div className="relative liquid-glass rounded-2xl w-full max-w-sm p-6 text-left shadow-2xl z-10 border border-white/10">
            <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#6366f1]" />
                <span>Admin Login Required</span>
              </h3>
              <button onClick={() => setAdminLoginOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-white/40">Enter Password</label>
                <input 
                  type="password" 
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Passcode..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#6366f1]/40"
                />
              </div>
              {adminPasswordError && <span className="text-[9px] text-red-400 font-bold">{adminPasswordError}</span>}
              <button 
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#6366f1]/90 text-xs font-bold text-white transition-colors"
              >
                Authenticate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CONTROL PANEL DASHBOARD MODAL */}
      {adminPanelOpen && adminActive && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setAdminPanelOpen(false)} />
          
          <div className="relative liquid-glass rounded-3xl w-full max-w-3xl p-6 text-left shadow-2xl z-10 border border-white/10 max-h-[90vh] !overflow-y-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#6366f1] animate-spin" style={{ animationDuration: '8s' }} />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">BeatWave AI Admin Console</h2>
              </div>
              <button onClick={() => setAdminPanelOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Settings Configuration form */}
              <form onSubmit={handleAdminSettingsSubmit} className="flex flex-col gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Global System Config</span>

                {/* Maintenance mode toggle */}
                <div className="flex justify-between items-center py-2 border border-white/5 rounded-xl px-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Maintenance Mode</span>
                    <span className="text-[9px] text-white/40">Block all visitor traffic</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminToggleMaintenance}
                    disabled={maintenanceToggling}
                    className={`relative px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                      settings.maintenanceMode
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    } ${maintenanceToggling ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${settings.maintenanceMode ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                    {maintenanceToggling ? 'Saving...' : settings.maintenanceMode ? 'LIVE — Click to Disable' : 'OFF — Click to Enable'}
                  </button>
                </div>

                {/* Maintenance Custom Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-white/45">Maintenance Screen Message</label>
                  <textarea
                    value={editMaintenanceMessage}
                    onFocus={() => { adminEditingRef.current = true; }}
                    onChange={(e) => setEditMaintenanceMessage(e.target.value)}
                    placeholder="e.g. We're improving BeatWave PC. Back soon!"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]/40 resize-none"
                  />
                </div>

                {/* Announcement Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-white/45">Banner Announcement Text</label>
                  <input
                    type="text"
                    value={editAnnouncement}
                    onFocus={() => { adminEditingRef.current = true; }}
                    onChange={(e) => setEditAnnouncement(e.target.value)}
                    placeholder="e.g. Schedule maintenance at 10 PM..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]/40"
                  />
                </div>

                {/* Countdown Target Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-white/45">Countdown Timer Target Date</label>
                  <div className="flex gap-2">
                    <input 
                      type="datetime-local" 
                      value={editTimerTarget.substring(0, 16)}
                      onChange={(e) => setEditTimerTarget(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setEditTimerActive(!editTimerActive)}
                      className={`px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                        editTimerActive 
                          ? 'bg-[#6366f1]/20 text-[#6366f1] border-[#6366f1]/30' 
                          : 'bg-white/5 text-white/40 border-white/5'
                      }`}
                    >
                      {editTimerActive ? 'Active' : 'Stopped'}
                    </button>
                  </div>
                </div>

                {/* Countdown Label Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-white/45">Countdown Timer Label</label>
                  <input
                    type="text"
                    value={editCountdownLabel}
                    onFocus={() => { adminEditingRef.current = true; }}
                    onChange={(e) => setEditCountdownLabel(e.target.value)}
                    placeholder="e.g. Beta drops in..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]/40"
                  />
                </div>

                {/* Theme Color Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-white/45">Website Highlight Color Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['indigo', 'amber', 'emerald', 'rose'] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditThemeColor(color)}
                        className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                          editThemeColor === color
                            ? 'bg-white/15 text-white border-white/30 shadow-lg'
                            : 'bg-white/5 text-white/50 border-transparent hover:bg-white/10'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ 
                              backgroundColor: 
                                color === 'indigo' ? '#6366f1' :
                                color === 'amber' ? '#f59e0b' :
                                color === 'emerald' ? '#10b981' : '#f43f5e'
                            }} 
                          />
                          {color}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminSaving}
                  className={`w-full py-3 rounded-xl text-xs font-bold text-white transition-all mt-2 flex items-center justify-center gap-2 ${
                    adminSaved
                      ? 'bg-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
                      : 'hover:brightness-110'
                  } ${adminSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundColor: adminSaved ? undefined : THEMES[settings.themeColor || 'indigo'].primary
                  }}
                >
                  {adminSaving ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : adminSaved ? (
                    <><span>✓</span> Saved!</>
                  ) : 'Save Configuration'}
                </button>
              </form>

              {/* Right column: Waitlist + Discord Console */}
              <div className="flex flex-col gap-6 max-h-[500px]">
                {/* Real-time Submissions table */}
                <div className="flex flex-col bg-white/[0.02] p-4 rounded-2xl border border-white/5 overflow-hidden max-h-[220px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      Waitlist Database ({applicationsList.length} submissions)
                    </span>
                    {applicationsList.length > 0 && (
                      <button
                        type="button"
                        onClick={downloadCSV}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-600/30 transition-all select-none cursor-pointer"
                      >
                        Export CSV
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                    {applicationsList.map((app) => (
                      <div key={app.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-white">{app.name}</span>
                          <span className="text-white/40">{new Date(app.timestamp).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[9px] text-[#6366f1]">{app.email}</span>
                        <span className="text-[9px] text-white/45 font-mono">Instagram: {app.instagramId}</span>
                        {app.mobile && <span className="text-[9px] text-white/45 font-mono">Mobile: {app.mobile}</span>}
                        <p className="text-[10px] text-white/70 leading-normal border-t border-white/5 pt-1.5 mt-1 font-sans">
                          {app.reason}
                        </p>
                      </div>
                    ))}
                    {applicationsList.length === 0 && (
                      <span className="text-xs text-white/30 text-center py-6">No applications in database.</span>
                    )}
                  </div>
                </div>

                {/* Discord Broadcast Console */}
                <div className="flex flex-col bg-white/[0.02] p-4 rounded-2xl border border-white/5 gap-3">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 block">
                    Discord Broadcast Console
                  </span>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-white/45">Broadcast Message</label>
                    <textarea
                      value={discordMsg}
                      onChange={(e) => setDiscordMsg(e.target.value)}
                      placeholder="Type message to broadcast to Discord webhook..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]/40 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendDiscordBroadcast}
                    disabled={broadcasting}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    style={{
                      backgroundColor: THEMES[settings.themeColor || 'indigo'].primary
                    }}
                  >
                    {broadcasting ? 'Broadcasting...' : '📢 Send Announcement'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {privacyOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setPrivacyOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl z-10 flex flex-col"
            style={{ background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(24px)' }}
          >
            {/* Header */}
            <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md rounded-t-3xl">
              <h2 className="text-sm font-bold text-white tracking-wide">Privacy Policy</h2>
              <button onClick={() => setPrivacyOpen(false)} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 text-[12px] text-white/60 leading-relaxed flex flex-col gap-5">
              <p className="text-white/30 text-[10px]">Last updated: July 2026 · Applies to beatwavepc.vercel.app</p>

              {[
                {
                  title: '1. Information We Collect',
                  body: `When you join our waitlist, we collect your full name, email address, Instagram ID, optional mobile number, and a short reason for applying. This data is stored securely in Firebase Realtime Database (Google LLC). We do not collect payment information.`
                },
                {
                  title: '2. How We Use Your Information',
                  body: `Your information is used solely to manage the BeatWave PC early-access waitlist, notify you when the beta client becomes available, and communicate important product updates. We send a copy of each submission to a private Discord webhook for internal team review.`
                },
                {
                  title: '3. Cookies & Local Storage',
                  body: `We use browser localStorage to remember your cookie consent preference (key: bw_cookie_consent). No tracking cookies are placed without your explicit consent. If you accept cookies, Firebase may collect anonymised analytics data (page views, region) under Google's privacy policy.`
                },
                {
                  title: '4. Third-Party Services',
                  body: `We use Firebase (Google LLC) for database storage and optional analytics, and Discord webhooks for internal notifications. These services have their own privacy policies. We do not sell or share your personal data with any other third party.`
                },
                {
                  title: '5. Data Retention',
                  body: `Your waitlist submission is retained until the BeatWave PC beta programme concludes or you request deletion. To request removal of your data, contact us via Instagram @_beat_labs or Discord.`
                },
                {
                  title: '6. Your Rights',
                  body: `You have the right to access, correct, or request deletion of your personal data at any time. You may also withdraw consent for analytics cookies by updating your Cookie Preferences in the footer at any time.`
                },
                {
                  title: '7. Security',
                  body: `Data is stored in Firebase with restricted access rules. Only authorised BeatLabs team members with the admin passcode can view submitted applications.`
                },
                {
                  title: '8. Contact',
                  body: `For any privacy-related enquiries, contact BeatLabs via Instagram (@_beat_labs) or our Discord server (discord.gg/spbuDTePSR).`
                },
              ].map(({ title, body }) => (
                <div key={title}>
                  <h3 className="text-white font-semibold text-xs mb-1">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {termsOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setTermsOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl z-10 flex flex-col"
            style={{ background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(24px)' }}
          >
            {/* Header */}
            <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md rounded-t-3xl">
              <h2 className="text-sm font-bold text-white tracking-wide">Terms of Service</h2>
              <button onClick={() => setTermsOpen(false)} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 text-[12px] text-white/60 leading-relaxed flex flex-col gap-5">
              <p className="text-white/30 text-[10px]">Last updated: July 2026 · By using this site you agree to these terms.</p>

              {[
                {
                  title: '1. Acceptance of Terms',
                  body: `By accessing beatwavepc.vercel.app or joining the BeatWave PC waitlist, you agree to be bound by these Terms of Service. If you do not agree, please do not use this site.`
                },
                {
                  title: '2. Waitlist & Beta Access',
                  body: `Submitting a waitlist application does not guarantee early access. BeatLabs reserves the right to select, prioritise, or decline applications at its sole discretion. Beta access may be revoked at any time without notice.`
                },
                {
                  title: '3. Beta Software Disclaimer',
                  body: `BeatWave PC is pre-release software provided "as is" without warranties of any kind. Beta builds may contain bugs, incomplete features, or instability. BeatLabs is not liable for any data loss or system issues arising from beta usage.`
                },
                {
                  title: '4. Acceptable Use',
                  body: `You agree not to misuse this website, submit false or fraudulent applications, attempt to bypass authentication systems, or reverse-engineer any part of the BeatWave PC software. Violation may result in permanent disqualification from the beta programme.`
                },
                {
                  title: '5. Intellectual Property',
                  body: `All content on this site — including the BeatWave PC name, logo, design, and source code — is the property of BeatLabs. You may not reproduce, distribute, or create derivative works without explicit written permission.`
                },
                {
                  title: '6. Changes to Terms',
                  body: `BeatLabs reserves the right to update these Terms of Service at any time. Continued use of the site after changes constitutes acceptance of the updated terms.`
                },
                {
                  title: '7. Governing Law',
                  body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.`
                },
                {
                  title: '8. Contact',
                  body: `Questions about these terms? Reach us via Instagram (@_beat_labs) or join our Discord community at discord.gg/spbuDTePSR.`
                },
              ].map(({ title, body }) => (
                <div key={title}>
                  <h3 className="text-white font-semibold text-xs mb-1">{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* CUSTOM PWA INSTALL BANNER */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-6 left-6 z-40 max-w-sm w-full p-5 rounded-2xl liquid-glass border border-white/10 shadow-2xl bg-black/60 backdrop-blur-2xl animate-fade-in flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex gap-2.5 items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/5 border border-white/10">
                <img src="/image.png" alt="Logo" className="w-5 h-5 rounded" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Install BeatWave PC</span>
                <span className="text-[10px] text-white/50 leading-tight">Run offline with desktop shortcuts</span>
              </div>
            </div>
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleInstallPWA}
              className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-black bg-white hover:bg-white/95 transition-all text-center select-none cursor-pointer"
            >
              Install App
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/60 bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center select-none cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
      {/* IMMERSIVE LOADING SCREEN */}
      {loadingScreen && (
        <div 
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050508] transition-opacity duration-500 ${
            loadingFade ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Custom style for progress animation */}
          <style>{`
            @keyframes loadingProgress {
              0% { width: 0%; }
              100% { width: 100%; }
            }
          `}</style>
          
          {/* Neon gradient background glow */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#6366f1]/10 blur-[80px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo image with scale pulse animation */}
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2.5 shadow-2xl animate-bounce" style={{ animationDuration: '2s' }}>
              <img src="/image.png" alt="BeatWave Logo" className="w-full h-full object-contain rounded" />
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <span className="font-display text-2xl font-bold uppercase tracking-widest text-white">
                BeatWave
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: THEMES[settings.themeColor || 'indigo'].gradient }}> PC</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/35 font-bold">Bit-Perfect Audio</span>
            </div>

            {/* Glowing progress line */}
            <div className="w-32 h-1 rounded-full bg-white/5 overflow-hidden border border-white/5 mt-2">
              <div 
                className="h-full rounded-full"
                style={{ 
                  animation: 'loadingProgress 1.8s ease-in-out forwards',
                  backgroundImage: THEMES[settings.themeColor || 'indigo'].gradient
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
