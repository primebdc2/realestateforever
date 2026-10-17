import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Mail, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect, type FormEvent } from "react";
import mainVideoPoster from "@/assets/ure2-poster.jpg.asset.json";
import ogImageAsset from "@/assets/og-image.png.asset.json";
import { BrandLogo } from "@/components/brand-logo";
import { TalkLiveButton } from "@/components/talk-live-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockSite } from "@/lib/gate.functions";
import { sendFormEmail } from "@/lib/mail.functions";
import { clearVisitToken, setVisitToken } from "@/lib/visit-token";

export const Route = createFileRoute("/welcome")({
  head: () => {
    const ogImage = "https://realestateforever.com/og-image.jpg";
    return {
      meta: [
        { title: "RealEstateForever.com | Private access" },
        { name: "description", content: "RealEstateForever.com" },
        { property: "og:site_name", content: "RealEstateForever.com" },
        { property: "og:title", content: "Real Estate Investments & Development" },
        { property: "og:description", content: "RealEstateForever.com" },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1024" },
        { property: "og:image:height", content: "576" },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: "Real Estate Investments & Development" },
        { name: "twitter:description", content: "RealEstateForever.com" },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: Welcome,
});

function Welcome() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [waitingForGesture, setWaitingForGesture] = useState(false);
  const [activeTab, setActiveTab] = useState<"password" | "leadership">("password");
  const [leadershipSending, setLeadershipSending] = useState(false);
  const [leadershipSent, setLeadershipSent] = useState<boolean | null>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const activeVideoRef = useRef<1 | 2>(1);
  const crossfadingRef = useRef(false);
  const soundPlayCountRef = useRef(0);

  useEffect(() => {
    clearVisitToken();
    setPassword("");
    setError(false);

    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    v1.style.opacity = "1";
    v2.style.opacity = "0";

    let cleanupInteractionListeners: (() => void) | null = null;

    const CROSSFADE_TIME = 1.0;
    const checkCrossfade = (current: HTMLVideoElement, next: HTMLVideoElement, targetNum: 1 | 2) => {
      if (!current.duration || Number.isNaN(current.duration)) return;
      const timeLeft = current.duration - current.currentTime;
      if (timeLeft <= CROSSFADE_TIME && !crossfadingRef.current) {
        crossfadingRef.current = true;

        if (!current.muted) {
          soundPlayCountRef.current += 1;
          if (soundPlayCountRef.current >= 2) {
            current.muted = true;
            next.muted = true;
            setMuted(true);
          }
        }

        next.muted = current.muted;
        next.currentTime = 0;
        void next.play().catch(() => undefined);
        next.style.opacity = "1";
        current.style.opacity = "0";

        setTimeout(() => {
          current.pause();
          current.currentTime = 0;
          activeVideoRef.current = targetNum;
          crossfadingRef.current = false;
        }, 1000);
      }
    };

    const handleTime1 = () => {
      if (activeVideoRef.current === 1) checkCrossfade(v1, v2, 2);
    };
    const handleTime2 = () => {
      if (activeVideoRef.current === 2) checkCrossfade(v2, v1, 1);
    };

    v1.addEventListener("timeupdate", handleTime1);
    v2.addEventListener("timeupdate", handleTime2);

    const startUnmutedPlayback = () => {
      const active = activeVideoRef.current === 1 ? v1 : v2;
      active.muted = false;
      active.volume = 1;
      soundPlayCountRef.current = 0;
      setMuted(false);
      setWaitingForGesture(false);
      void active.play().catch(() => {
        v1.muted = true;
        v2.muted = true;
        setMuted(true);
      });
    };

    const handleUserGesture = () => {
      if (cleanupInteractionListeners) {
        cleanupInteractionListeners();
        cleanupInteractionListeners = null;
      }
      startUnmutedPlayback();
    };

    const setupUserGestureListeners = () => {
      window.addEventListener("pointerdown", handleUserGesture, true);
      window.addEventListener("touchstart", handleUserGesture, true);
      window.addEventListener("click", handleUserGesture, true);
      window.addEventListener("keydown", handleUserGesture, true);

      cleanupInteractionListeners = () => {
        window.removeEventListener("pointerdown", handleUserGesture, true);
        window.removeEventListener("touchstart", handleUserGesture, true);
        window.removeEventListener("click", handleUserGesture, true);
        window.removeEventListener("keydown", handleUserGesture, true);
      };
    };

    // Attempt unmuted playback initially
    v1.muted = false;
    v1.volume = 1;
    const playPromise = v1.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setMuted(false);
          setWaitingForGesture(false);
          soundPlayCountRef.current = 0;
        })
        .catch(() => {
          v1.muted = true;
          v2.muted = true;
          setMuted(true);
          setWaitingForGesture(true);
          void v1.play().catch(() => undefined);
          setupUserGestureListeners();
        });
    }

    return () => {
      v1.removeEventListener("timeupdate", handleTime1);
      v2.removeEventListener("timeupdate", handleTime2);
      if (cleanupInteractionListeners) {
        cleanupInteractionListeners();
      }
    };
  }, []);

  const toggleSound = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;
    if (!v1 || !v2) return;

    const active = activeVideoRef.current === 1 ? v1 : v2;
    const inactive = activeVideoRef.current === 1 ? v2 : v1;

    if (muted) {
      active.muted = false;
      active.volume = 1;
      inactive.muted = false;
      inactive.volume = 1;
      soundPlayCountRef.current = 0;
      setMuted(false);
      setWaitingForGesture(false);
      void active.play().catch(() => {
        active.muted = true;
        inactive.muted = true;
        setMuted(true);
      });
    } else {
      v1.muted = true;
      v2.muted = true;
      setMuted(true);
      setWaitingForGesture(false);
    }
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(false);
    setSubmitting(true);
    const enteredPassword = password.trim();

    try {
      const result = await unlock({ data: { password: enteredPassword } });
      if (result.ok) {
        setPassword("");
        setVisitToken(result.token);
        await router.navigate({ to: "/" });
        return;
      }
      setError(true);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  async function onLeadershipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const get = (k: string) => String(formData.get(k) ?? "");

    setLeadershipSending(true);
    setLeadershipSent(null);
    try {
      const res = await sendFormEmail({
        data: {
          form: "enquiry",
          name: get("name"),
          email: get("email"),
          phone: get("phone"),
          subject: get("phone") || "Access Request",
          message: get("message"),
        },
      });
      if (!res.ok) throw new Error(res.error);
      form.reset();
      setLeadershipSent(true);
    } catch (err) {
      console.error("[welcome] Leadership inquiry failed:", err);
      setLeadershipSent(false);
    } finally {
      setLeadershipSending(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-x-hidden overflow-y-auto bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-30 bg-background" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-background/25" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/50 via-transparent to-background/60" />

      <header className="order-1 flex h-20 shrink-0 items-center justify-between gap-4 px-5 pt-3 sm:order-none sm:h-24 sm:px-10 sm:pt-4 lg:px-14">
        <BrandLogo className="w-48 sm:w-56 md:w-64 lg:w-72" />
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <TalkLiveButton />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleSound}
            aria-label={muted ? "Play introduction film with sound" : "Mute introduction film"}
            className={`rounded-full backdrop-blur-sm transition-all ${
              !muted
                ? "border-primary bg-primary/20 text-primary shadow-lg shadow-primary/30 hover:bg-primary hover:text-primary-foreground"
                : "border-foreground/30 bg-background/30 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Heading */}
      <div className="order-2 px-5 pt-7 pb-1 text-center sm:hidden">
        <h1 className="mx-auto max-w-sm text-balance font-display text-2xl leading-tight tracking-[-0.01em]">
          BUY MORE REAL ESTATE.<br className="block" /> THEY DO NOT MAKE MORE IT.
        </h1>
      </div>

      {/* Video Container: Dual-video crossfade for seamless, gapless looping */}
      <div
        onClick={toggleSound}
        className="order-3 relative my-3 mx-auto w-[calc(100%-2.5rem)] max-w-md aspect-video cursor-pointer rounded-xl border border-primary/35 overflow-hidden shadow-2xl shadow-black/80 sm:order-none sm:my-0 sm:mx-auto sm:w-full sm:h-full sm:size-full sm:max-w-none sm:cursor-default sm:aspect-auto sm:rounded-none sm:border-0 sm:shadow-none sm:absolute sm:inset-0 sm:-z-20 sm:pointer-events-none"
      >
        <video
          ref={video1Ref}
          autoPlay
          muted={muted}
          playsInline
          preload="auto"
          poster={mainVideoPoster.url}
          aria-label="Real Estate Forever introduction film"
          className="absolute inset-0 size-full w-full h-full object-cover sm:object-contain sm:object-center transition-opacity duration-1000 ease-in-out"
        >
          <source src="/videos/main-video.mp4" type="video/mp4" />
        </video>
        <video
          ref={video2Ref}
          muted={muted}
          playsInline
          preload="auto"
          aria-label="Real Estate Forever introduction film buffer"
          className="absolute inset-0 size-full w-full h-full object-cover sm:object-contain sm:object-center transition-opacity duration-1000 ease-in-out opacity-0"
        >
          <source src="/videos/main-video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Section with Login / Leadership Switcher Box */}
      <section className="order-4 flex flex-1 items-center justify-center px-4 py-4 sm:order-none sm:py-8 md:py-10">
        <div className="reveal-up flex w-full max-w-4xl flex-col items-center text-center">
          {/* Desktop Heading */}
          <h1 className="hidden max-w-3xl text-balance font-display text-2xl sm:block sm:text-3xl md:text-4xl lg:text-5xl leading-tight sm:leading-[1.15] md:leading-[1.1] tracking-[-0.01em]">
            BUY MORE REAL ESTATE.<br className="block" /> THEY DO NOT MAKE MORE IT.
          </h1>

          <div
            className={`access-gold-frame relative overflow-hidden mt-2 w-full transition-all duration-300 ${
              activeTab === "leadership" ? "max-w-[560px]" : "max-w-[440px]"
            } rounded-lg border border-primary/50 bg-background/85 p-5 sm:p-7 backdrop-blur-md sm:mt-6`}
          >
            {/* 4-Sided Animated Traveling Gold Border Beam (from homepage) */}
            <span className="welcome-gold-box-border" aria-hidden="true" />
            <span className="welcome-gold-pulse-line" aria-hidden="true" />

            {/* Top Luxury Switcher Tabs - Single line guaranteed */}
            <div className="relative z-30 mx-auto mb-5 flex w-full max-w-[440px] items-center rounded-full border border-primary/35 bg-black/80 p-1 shadow-inner backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("password");
                  setLeadershipSent(null);
                }}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.11em] sm:tracking-[0.14em] whitespace-nowrap transition-all duration-300 ${
                  activeTab === "password"
                    ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(190,149,67,0.55)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <LockKeyhole className="size-3 sm:size-3.5 shrink-0" />
                <span className="whitespace-nowrap">Private Access</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("leadership");
                  setError(false);
                }}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.11em] sm:tracking-[0.14em] whitespace-nowrap transition-all duration-300 ${
                  activeTab === "leadership"
                    ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(190,149,67,0.55)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Mail className="size-3 sm:size-3.5 shrink-0" />
                <span className="whitespace-nowrap">Message Leadership</span>
              </button>
            </div>

            {/* TAB 1: ENTER PASSWORD */}
            {activeTab === "password" && (
              <div className="relative z-30">
                <div className="mx-auto mb-3 sm:mb-4 flex size-9 sm:size-10 items-center justify-center rounded-full border border-primary/45 bg-background/40 text-primary">
                  <LockKeyhole className="size-3.5 sm:size-4" />
                </div>
                <p className="text-[11px] sm:text-[13px] font-medium uppercase text-primary tracking-wider">
                  EXCLUSIVE & PRIVATE ACCESS ONLY
                </p>
                <form onSubmit={onSubmit} className="mt-4 sm:mt-5" noValidate autoComplete="off">
                  <label htmlFor="access-code" className="mb-2 block text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/80">
                    ENTER PASSWORD
                  </label>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative flex-1 min-w-0">
                      <KeyRound
                        aria-hidden
                        className="pointer-events-none absolute left-3.5 sm:left-4 top-1/2 size-4 -translate-y-1/2 text-primary/70"
                      />
                      <Input
                        id="access-code"
                        name="access_code"
                        type="password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(false);
                        }}
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        autoFocus
                        aria-invalid={error}
                        aria-describedby={error ? "password-error" : undefined}
                        className={`h-12 sm:h-14 w-full min-w-0 rounded-full border bg-background/50 pl-10 sm:pl-11 pr-3 sm:pr-4 text-base sm:text-[13px] tracking-[0.2em] sm:tracking-[0.25em] text-foreground transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 ${error ? "border-destructive/60" : "border-foreground/25 hover:border-foreground/45"}`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      aria-label="Enter site"
                      className="access-arrow-btn group relative size-12 sm:size-14 shrink-0 rounded-full bg-gradient-to-b from-primary to-primary/55 text-primary-foreground shadow-lg shadow-primary/40 transition-all duration-300 hover:scale-105 sm:hover:scale-110 hover:shadow-2xl hover:shadow-primary/80 active:scale-90 disabled:opacity-70"
                    >
                      <span
                        aria-hidden
                        className="access-arrow-ring absolute -inset-1 sm:-inset-1.5 rounded-full border border-primary/40 transition-[border-color,inset] duration-300 group-hover:-inset-1.5 sm:group-hover:-inset-2 group-hover:border-primary/90"
                      />
                      <span aria-hidden className="absolute inset-0 overflow-hidden rounded-full">
                        <span className="absolute -left-1/2 inset-y-0 w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[420%]" />
                      </span>
                      <ArrowRight className="relative mx-auto size-4.5 sm:size-5 transition-transform duration-300 group-hover:translate-x-1 sm:group-hover:translate-x-1.5" />
                    </button>
                  </div>
                  <p
                    id="password-error"
                    aria-live="polite"
                    className={`mt-2 min-h-5 text-left text-[12px] ${error ? "text-destructive" : "text-transparent"}`}
                  >
                    {error ? "Authentication failed. Please try again." : ""}
                  </p>
                </form>

                <div className="mt-2 pt-3 border-t border-primary/15 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("leadership")}
                    className="text-[11px] sm:text-[12px] text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    Need an invitation code? <span className="text-primary font-semibold">Message Leadership →</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MESSAGE LEADERSHIP FORM */}
            {activeTab === "leadership" && (
              <div className="relative z-30">
                <div className="mx-auto mb-2 flex size-9 sm:size-10 items-center justify-center rounded-full border border-primary/45 bg-background/40 text-primary">
                  <Mail className="size-3.5 sm:size-4" />
                </div>
                <p className="text-[11px] sm:text-[13px] font-medium uppercase text-primary tracking-wider">
                  DIRECT ACCESS TO LEADERSHIP
                </p>
                <p className="mt-1 text-[11px] sm:text-[12px] text-muted-foreground">
                  Submit Your Information To Review For Approval
                </p>

                {leadershipSent === true ? (
                  <div className="py-6 px-1 sm:px-2 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative mx-auto mb-4 flex size-14 sm:size-16 items-center justify-center rounded-full border border-primary/60 bg-gradient-to-b from-primary/25 to-primary/5 text-primary shadow-[0_0_28px_rgba(190,149,67,0.45)]">
                      <CheckCircle2 className="size-7 sm:size-8 text-primary drop-shadow-[0_0_10px_rgba(255,215,0,0.6)]" />
                    </div>

                    <div className="mx-auto rounded-xl border border-primary/45 bg-gradient-to-b from-black/85 via-black/75 to-black/85 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
                      <p className="font-display text-sm sm:text-[15px] font-extrabold tracking-[0.25em] text-[#fff0b3] uppercase drop-shadow-[0_0_12px_rgba(255,220,130,0.65)]">
                        APPLICATION RECEIVED
                      </p>
                      <p className="mt-3 text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight">
                        You Are Now In Review For Approval. Approvals Are Not Guaranteed.
                      </p>
                      <p className="mt-3 text-[11.5px] sm:text-[12.5px] text-muted-foreground/90 leading-relaxed border-t border-primary/15 pt-3">
                        Our executive committee reviews inquiries on a rolling basis. If approved, credentials will be provided directly.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLeadershipSent(null)}
                      className="mt-4 text-[11px] sm:text-[12px] uppercase tracking-wider text-muted-foreground/80 hover:text-primary transition-colors underline-offset-4 hover:underline"
                    >
                      ← Submit another request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={onLeadershipSubmit} className="mt-4 text-left" noValidate>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <label className="enquiry-field group relative block">
                        <span className="mb-1.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors group-focus-within:text-primary">
                          <span>FULL NAME</span>
                          <span className="text-primary font-bold text-sm leading-none" aria-label="required">*</span>
                        </span>
                        <input
                          name="name"
                          type="text"
                          required
                          className="peer w-full border-b border-primary/45 bg-transparent py-2 text-[14px] sm:text-base text-foreground outline-none transition-colors duration-300 focus:border-transparent"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 transition-transform duration-500 ease-out peer-focus:scale-x-100"
                        />
                      </label>

                      <label className="enquiry-field group relative block">
                        <span className="mb-1.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors group-focus-within:text-primary">
                          <span>EMAIL</span>
                          <span className="text-primary font-bold text-sm leading-none" aria-label="required">*</span>
                        </span>
                        <input
                          name="email"
                          type="email"
                          required
                          className="peer w-full border-b border-primary/45 bg-transparent py-2 text-[14px] sm:text-base text-foreground outline-none transition-colors duration-300 focus:border-transparent"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 transition-transform duration-500 ease-out peer-focus:scale-x-100"
                        />
                      </label>

                      <label className="enquiry-field group relative block sm:col-span-2">
                        <span className="mb-1.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors group-focus-within:text-primary">
                          <span>CELL PHONE</span>
                          <span className="text-primary font-bold text-sm leading-none" aria-label="required">*</span>
                        </span>
                        <input
                          name="phone"
                          type="tel"
                          required
                          placeholder="(555) 000-0000"
                          className="peer w-full border-b border-primary/45 bg-transparent py-2 text-[14px] sm:text-base text-foreground outline-none transition-colors duration-300 focus:border-transparent placeholder:text-muted-foreground/35"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 transition-transform duration-500 ease-out peer-focus:scale-x-100"
                        />
                      </label>

                      <label className="enquiry-field group relative block sm:col-span-2">
                        <span className="mb-1.5 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors group-focus-within:text-primary">
                          <span>DIRECT MESSAGE TO LEADERSHIP</span>
                          <span className="text-primary font-bold text-sm leading-none" aria-label="required">*</span>
                        </span>
                        <textarea
                          name="message"
                          required
                          rows={3}
                          className="peer w-full resize-none border-b border-primary/45 bg-transparent py-2 text-[14px] sm:text-base text-foreground outline-none transition-colors duration-300 focus:border-transparent"
                        />
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 transition-transform duration-500 ease-out peer-focus:scale-x-100"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={leadershipSending}
                      className="leadership-submit-btn group mt-6 relative flex h-14 sm:h-[58px] w-full items-center justify-between rounded-full pl-6 pr-2 sm:pr-2.5 text-[#0d0d0f] transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(181,134,43,0.45),0_0_20px_rgba(212,175,55,0.25)] hover:shadow-[0_8px_36px_rgba(212,175,55,0.75),0_0_30px_rgba(255,215,0,0.5)]"
                    >
                      <span className="leadership-btn-shimmer" aria-hidden="true" />
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="relative flex size-2.5">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-black/40 opacity-75" />
                          <span className="relative inline-flex size-2.5 rounded-full bg-[#0d0d0f]" />
                        </span>
                        <span className="font-sans text-[11.5px] sm:text-[13px] font-extrabold uppercase tracking-[0.22em] sm:tracking-[0.24em] text-[#0d0d0f] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
                          {leadershipSending ? "TRANSMITTING..." : "SUBMIT TO LEADERSHIP"}
                        </span>
                      </div>
                      <span className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full bg-[#0a0a0c] text-[#f3d078] border border-[#f3d078]/60 shadow-[0_3px_12px_rgba(0,0,0,0.6)] transition-all duration-300 group-hover:scale-105 group-hover:bg-black group-hover:text-white group-hover:border-white group-hover:shadow-[0_0_18px_rgba(255,215,0,0.7)]">
                        <ArrowRight className="size-4.5 stroke-[2.75] transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </button>

                    {leadershipSent === false && (
                      <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-[12px] text-destructive">
                        Transmission failed. Please try again or email Info@RealEstateForever.com directly.
                      </div>
                    )}
                  </form>
                )}

                <div className="mt-4 pt-3 border-t border-primary/15 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("password")}
                    className="text-[11px] sm:text-[12px] text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                  >
                    You Have The Elite Password? <span className="text-primary font-semibold">Enter It Here For Full Access →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-6 max-w-3xl text-balance font-display text-2xl font-light italic leading-snug tracking-[0.08em] text-foreground/95 sm:mt-8 sm:text-[28px] lg:text-3xl">
            Changing Lives Through{" "}
            <span className="text-primary">Real Estate</span>
          </p>
          <div aria-hidden className="mt-4 flex items-center justify-center gap-4 opacity-45">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary" />
            <span className="size-1.5 rotate-45 border border-primary bg-transparent" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary" />
          </div>
        </div>
      </section>

      <footer className="order-5 flex shrink-0 flex-col items-center justify-between gap-3 px-5 py-5 sm:order-none sm:flex-row sm:px-10 sm:py-6 lg:px-14">
        <a
          href="mailto:Info@RealEstateForever.com"
          className="group inline-flex flex-wrap items-center justify-center sm:justify-start gap-2.5 transition-colors"
        >
          <span className="font-display text-lg sm:text-xl md:text-[22px] font-normal tracking-[0.04em] text-foreground transition-colors group-hover:text-primary">
            Info@RealEstateForever.com
          </span>
          <span className="text-primary/60 font-light text-sm sm:text-base">|</span>
          <span className="text-[11px] sm:text-[12px] md:text-[13px] font-medium uppercase tracking-[0.22em] text-foreground/70 transition-colors group-hover:text-foreground/90">
            CORPORATE USE ONLY
          </span>
        </a>
        <span className="text-center sm:text-right text-[11px] sm:text-[12px] md:text-[13px] font-medium uppercase tracking-[0.22em] text-foreground/70">
          CONFIDENTIAL INVENTORY | SUBJECT TO CHANGE | © 2026
        </span>
      </footer>

      {waitingForGesture && (
        <button
          type="button"
          onClick={toggleSound}
          className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-primary/60 bg-background/90 px-5 py-2.5 text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-primary shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground active:scale-95 animate-pulse"
          aria-label="Click anywhere to enable soundtrack"
        >
          <Volume2 className="size-4 animate-bounce" />
          <span>Click anywhere for sound</span>
        </button>
      )}
    </main>
  );
}
