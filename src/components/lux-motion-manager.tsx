import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function LuxMotionManager() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Smooth Inertia Scroll (Lenis + GSAP) for window
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.8,
    });

    const updateProgress = () => {
      ScrollTrigger.update();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const progressBar = document.getElementById("header-scroll-progress");
      if (progressBar) {
        progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    lenis.on("scroll", updateProgress);
    window.addEventListener("scroll", updateProgress, { passive: true });

    const updateRaf = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);
    updateProgress();

    // 2. Reversible Headings & Titles Reveal on Scroll
    const headings = document.querySelectorAll("h1, h2, .gold-text-sheen, .gold-pulse-section");
    const headingTriggers: ScrollTrigger[] = [];

    headings.forEach((heading) => {
      const anim = gsap.fromTo(
        heading,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", paused: true }
      );

      const trigger = ScrollTrigger.create({
        trigger: heading,
        start: "top 88%",
        end: "bottom 10%",
        onEnter: () => anim.play(),
        onLeaveBack: () => anim.reverse(),
        onEnterBack: () => anim.play(),
        onLeave: () => anim.reverse(),
      });

      headingTriggers.push(trigger);
    });

    // 3. Card Animation Engine: Works across Window AND Overflow Containers (Inventory desktop & mobile)
    // Supports: Left-to-Right Stagger (0.08s) + Curtain Reveal + Reversible (Down & Up)
    const cardTimelines = new WeakMap<HTMLElement, gsap.core.Timeline>();
    const observedCards = new Set<HTMLElement>();

    const getOrCreateCardTimeline = (card: HTMLElement, isRightCol: boolean) => {
      let tl = cardTimelines.get(card);
      if (!tl) {
        const curtain = card.querySelector<HTMLElement>(".lux-curtain");
        const img = card.querySelector<HTMLElement>(".luxury-image-frame img, .luxury-image-frame video");
        const staggerDelay = isRightCol ? 0.08 : 0; // 0.08s left-to-right stagger

        tl = gsap.timeline({ paused: true });

        // 1. Card container entrance
        tl.fromTo(
          card,
          { opacity: 0, y: 35, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            ease: "power3.out",
            delay: staggerDelay,
          },
          0
        );

        // 2. Curtain reveal on image (rolls up)
        if (curtain) {
          tl.fromTo(
            curtain,
            { scaleY: 1, opacity: 1 },
            {
              scaleY: 0,
              opacity: 0,
              duration: 0.55,
              ease: "power3.inOut",
              delay: staggerDelay + 0.04,
            },
            0
          );
        }

        // 3. Image subtle zoom settle
        if (img) {
          tl.fromTo(
            img,
            { scale: 1.15, filter: "brightness(0.9)" },
            {
              scale: 1,
              filter: "brightness(1.05)",
              duration: 0.7,
              ease: "power2.out",
              delay: staggerDelay + 0.04,
            },
            0
          );
        }

        cardTimelines.set(card, tl);
      }
      return tl;
    };

    // IntersectionObserver natively tracks viewport intersection whether scrolled via window OR overflow-y-auto
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          const rect = card.getBoundingClientRect();
          const parent = card.parentElement;
          const parentRect = parent ? parent.getBoundingClientRect() : null;
          const isRightCol = parentRect ? rect.left > parentRect.left + parentRect.width * 0.45 : false;

          const tl = getOrCreateCardTimeline(card, isRightCol);

          if (entry.isIntersecting) {
            tl.play();
          } else {
            // Reversible on both directions (scroll down or scroll up past the element)
            tl.reverse();
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    const registerAllCards = () => {
      const cards = Array.from(
        document.querySelectorAll<HTMLElement>("[data-lux-card], .luxury-card-depth")
      );

      cards.forEach((card) => {
        if (!observedCards.has(card)) {
          observedCards.add(card);
          intersectionObserver.observe(card);

          // If already in viewport on register, play immediately
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.95 && rect.bottom > window.innerHeight * 0.05) {
            const parent = card.parentElement;
            const parentRect = parent ? parent.getBoundingClientRect() : null;
            const isRightCol = parentRect ? rect.left > parentRect.left + parentRect.width * 0.45 : false;
            const tl = getOrCreateCardTimeline(card, isRightCol);
            tl.play();
          }
        }
      });
    };

    registerAllCards();

    // 4. 3D Magnetic Tilt Effect (Apple/Rolex Style - strictly ±4 degrees)
    // Using Document-level Event Delegation so EVERY card (even dynamically filtered ones) always tilts
    let currentTiltCard: HTMLElement | null = null;
    const isPointerFine = window.matchMedia("(hover: hover)").matches;

    // 4b. Custom luxury cursor-following tooltip
    let tooltipEl = document.getElementById("lux-cursor-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = "lux-cursor-tooltip";
      tooltipEl.className = "lux-cursor-tooltip";
      document.body.appendChild(tooltipEl);
    }

    let hoverTooltipTimer: NodeJS.Timeout | null = null;
    let activeTooltipTarget: HTMLElement | null = null;

    const handlePointerMove = (e: MouseEvent) => {
      if (!isPointerFine) return;
      const target = e.target as HTMLElement | null;

      // Handle custom mouse tooltip
      const tooltipTarget = target?.closest<HTMLElement>("[data-tooltip]");
      if (tooltipTarget) {
        const text = tooltipTarget.getAttribute("data-tooltip") || "Click Here To View";
        if (tooltipEl.textContent !== text) {
          tooltipEl.textContent = text;
        }

        // Clamp tooltip coordinates STRICTLY inside the image box boundary (never outside the box)
        const rect = tooltipTarget.getBoundingClientRect();
        const width = tooltipEl.offsetWidth || 135;
        const height = tooltipEl.offsetHeight || 28;

        const clampedX = Math.max(rect.left + 8, Math.min(e.clientX + 10, rect.right - width - 8));
        const clampedY = Math.max(rect.top + 8, Math.min(e.clientY + 10, rect.bottom - height - 8));

        tooltipEl.style.setProperty("--tooltip-x", `${clampedX}px`);
        tooltipEl.style.setProperty("--tooltip-y", `${clampedY}px`);

        if (activeTooltipTarget !== tooltipTarget) {
          activeTooltipTarget = tooltipTarget;
          tooltipEl.classList.remove("is-visible");
          if (hoverTooltipTimer) clearTimeout(hoverTooltipTimer);
          // Wait 4 seconds (as requested by user) before revealing
          hoverTooltipTimer = setTimeout(() => {
            if (activeTooltipTarget === tooltipTarget) {
              tooltipEl.classList.add("is-visible");
            }
          }, 4000);
        }
      } else {
        if (hoverTooltipTimer) {
          clearTimeout(hoverTooltipTimer);
          hoverTooltipTimer = null;
        }
        activeTooltipTarget = null;
        tooltipEl.classList.remove("is-visible");
      }

      const card = target?.closest<HTMLElement>("[data-lux-card], .luxury-card-depth");

      if (!card) {
        if (currentTiltCard) {
          gsap.to(currentTiltCard, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
          currentTiltCard = null;
        }
        return;
      }

      if (currentTiltCard && currentTiltCard !== card) {
        gsap.to(currentTiltCard, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      currentTiltCard = card;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      const clampedX = Math.max(-1, Math.min(1, x));
      const clampedY = Math.max(-1, Math.min(1, y));

      gsap.to(card, {
        rotateY: clampedX * 4, // strictly ±4 degrees
        rotateX: -clampedY * 4, // strictly ±4 degrees
        transformPerspective: 1000,
        transformOrigin: "center center",
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const handlePointerLeave = () => {
      if (hoverTooltipTimer) {
        clearTimeout(hoverTooltipTimer);
        hoverTooltipTimer = null;
      }
      activeTooltipTarget = null;
      tooltipEl.classList.remove("is-visible");
      if (currentTiltCard) {
        gsap.to(currentTiltCard, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
        currentTiltCard = null;
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseleave", handlePointerLeave, { passive: true });

    // 5. Dynamic MutationObserver: Watch for filter/search/tab changes across the entire page
    let mutationDebounceTimer: NodeJS.Timeout | null = null;
    const mutationObserver = new MutationObserver(() => {
      if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
      mutationDebounceTimer = setTimeout(() => {
        registerAllCards();
      }, 60);
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Also listen to internal inventory scroll container reliably via capture
    const handleScrollCapture = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.id === "inventory-listings-scroll" || target?.closest?.("#inventory-listings-scroll")) {
        registerAllCards();
      }
    };
    window.addEventListener("scroll", handleScrollCapture, { capture: true, passive: true });

    const initialTimer = setTimeout(() => {
      ScrollTrigger.refresh();
      registerAllCards();
    }, 200);

    return () => {
      clearTimeout(initialTimer);
      if (hoverTooltipTimer) clearTimeout(hoverTooltipTimer);
      if (mutationDebounceTimer) clearTimeout(mutationDebounceTimer);
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("scroll", handleScrollCapture, true);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
      headingTriggers.forEach((t) => t.kill());
    };
  }, [currentPath]);

  return null;
}
