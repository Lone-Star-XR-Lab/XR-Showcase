/* ===== Deck navigation with optional looping autoplay & banner toggle ===== */
(function () {
  const deck      = document.getElementById("deck");
  const slides    = [...document.querySelectorAll(".slide")];
  const progress  = document.getElementById("progress");
  const btnPrev   = document.getElementById("btnPrev");
  const btnNext   = document.getElementById("btnNext");
  const btnFS     = document.getElementById("btnFS");
  const btnAuto   = document.getElementById("btnAuto");
  const btnBar    = document.getElementById("btnBar");
  const btnBarGhost = document.getElementById("btnBarGhost"); // floating restore
  const banner    = document.getElementById("banner");

  // ---- Autoplay config (OFF by default) ----
  const DEFAULT_INTERVAL = 12000; // 12s per slide
  let   autoplayTimer    = null;
  let   autoplayEnabled  = false;
  let   activeIndex      = 0;

  // Helpers
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const mod   = (n, m) => ((n % m) + m) % m;
  const bannerH = () => (banner?.offsetHeight || 0);

  function topOf(el) {
    const elRect   = el.getBoundingClientRect();
    const deckRect = deck.getBoundingClientRect();
    return deck.scrollTop + (elRect.top - deckRect.top);
  }

  function updateProgressBar() {
    if (!progress) return;
    progress.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
    history.replaceState(null, "", `#${activeIndex}`);
  }

  function goTo(i, smooth = true) {
    clearTimeout(autoplayTimer);
    const targetIndex = mod(i, slides.length);
    const y = Math.max(0, topOf(slides[targetIndex]) - bannerH());
    deck.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
    if (autoplayEnabled) scheduleNext();
  }

  function scheduleNext() {
    clearTimeout(autoplayTimer);
    if (!autoplayEnabled) return;
    const attr = slides[activeIndex]?.dataset?.duration;
    const ms   = Number.isFinite(+attr) ? +attr : DEFAULT_INTERVAL;
    autoplayTimer = setTimeout(() => goTo(activeIndex + 1), ms);
  }

  function setAutoEnabled(on) {
    autoplayEnabled = !!on;
    if (btnAuto) btnAuto.textContent = autoplayEnabled ? "Auto On" : "Auto Off";
    clearTimeout(autoplayTimer);
    if (autoplayEnabled) scheduleNext();
  }

  function toggleBanner() {
    document.body.classList.toggle("banner-hidden");
    if (btnBar) btnBar.textContent = document.body.classList.contains("banner-hidden") ? "Show Bar" : "Hide Bar";
    // btnBarGhost visibility is controlled purely by CSS (based on .banner-hidden)
    // Re-align current slide top because banner height changed
    goTo(activeIndex, false);
  }

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (["ArrowDown","PageDown","ArrowRight"," "].includes(e.key)) { e.preventDefault(); goTo(activeIndex + 1); }
    if (["ArrowUp","PageUp","ArrowLeft"].includes(e.key))          { e.preventDefault(); goTo(activeIndex - 1); }
    if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
    if (e.key.toLowerCase() === "a") { e.preventDefault(); setAutoEnabled(!autoplayEnabled); }
    if (e.key.toLowerCase() === "b") { e.preventDefault(); toggleBanner(); }
    if (e.key === "Home") goTo(0);
    if (e.key === "End")  goTo(slides.length - 1);
  });

  // Buttons
  btnPrev?.addEventListener("click", () => goTo(activeIndex - 1));
  btnNext?.addEventListener("click", () => goTo(activeIndex + 1));
  btnFS  ?.addEventListener("click", toggleFullscreen);
  btnAuto?.addEventListener("click", () => setAutoEnabled(!autoplayEnabled));
  btnBar ?.addEventListener("click", toggleBanner);
  btnBarGhost?.addEventListener("click", toggleBanner); // restore bar when hidden

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // Track most-visible slide
  const io = new IntersectionObserver(
    (entries) => {
      let best = { idx: activeIndex, ratio: 0 };
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = slides.indexOf(entry.target);
          if (entry.intersectionRatio > best.ratio) best = { idx, ratio: entry.intersectionRatio };
          const el = entry.target.querySelector(".fade-enter");
          if (el) el.classList.add("fade-enter-active");
        }
      });
      if (best.ratio > 0 && best.idx !== activeIndex) {
        activeIndex = best.idx;
        updateProgressBar();
        if (autoplayEnabled) scheduleNext();
      }
    },
    { root: deck, threshold: [0.3, 0.6, 0.9] }
  );
  slides.forEach((s) => io.observe(s));

  // Smooth progress during scroll
  deck.addEventListener("scroll", () => {
    if (!progress) return;
    const center = deck.scrollTop + deck.clientHeight / 2;
    let idx = 0;
    for (let i = 0; i < slides.length; i++) {
      if (topOf(slides[i]) - bannerH() <= center) idx = i;
      else break;
    }
    progress.style.width = `${((idx + 1) / slides.length) * 100}%`;
  }, { passive: true });

  // Keep aligned on resize
  window.addEventListener("resize", () => goTo(activeIndex, false));

  // Pause autoplay when tab hidden; resume if enabled
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(autoplayTimer);
    else if (autoplayEnabled) scheduleNext();
  });

  // Start at hash if provided
  const startIdx = parseInt(location.hash.replace("#", ""));
  if (!isNaN(startIdx)) setTimeout(() => goTo(startIdx, false), 50);
  else updateProgressBar();

  // Touch swipe
  let touchStartY = null;
  deck.addEventListener("touchstart", (e) => { touchStartY = e.changedTouches[0].clientY; }, { passive: true });
  deck.addEventListener("touchend",   (e) => {
    if (touchStartY === null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dy) > 60) { if (dy < 0) goTo(activeIndex + 1); else goTo(activeIndex - 1); }
    touchStartY = null;
  }, { passive: true });
})();

/* === VR/AR/MR GIF cycling (unchanged) === */
const MEDIA_SETS = {
  vr: [
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWl3MXFjN2p4djdhcmQzZmpqd2Z2bTI0Mnh4N29oem5nZTRtbXpmYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xTiN0AVV7Ebad21L7q/giphy.gif",
    "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHdoM2l1cmZnOGVlMm8yNTBqcHBkZzZoOHQyMXVjNXdmdWI3cHkzaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fLmq9Neevz5fGFP6Gw/giphy.gif"<
    "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHdjdzcyOW53NXVnZ2ZoMWs3Y21jYnFtenFsMGZ0OGFxbHAwaXdqcCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/qKVPFWb0nzvAX9rzLI/giphy.gif",
  ],
  ar: [
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExY2VqemthYW1vYnR6aHF1cjRsYXRoZW5oajRiaWcwaTQ4a3YyYnhpdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/OUyUerhAL5lGvgwNzc/giphy.gif",
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTg3NWZmYThqNWNwenZjejM3MGU1dDdkYnpidDN2ZmM2eG1nNnF6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L0w91gyGwvLLXJQK9E/giphy.gif",
    "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExems1OGN2YXBicGtlNHc3MGw3N2xvNnlqbjFobDhuMXN3cmE1MHhvYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3vl42670bDbbVR216S/giphy.gif",
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGl4NTdtemlhaW15bzNrazZxYndxaW9laXYxYnFwbW5udnIzeGdsMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TC4QmESqXj0IrVn3vI/giphy.gif",
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWYwMXByaDFtYmYxZmQ3bGJsamFhYmczYTJ2cHV3dWZqZWthYXpwMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JXKbd2qz0r6WBpg0zf/giphy.gif"
  ],
  mr: [
    "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG81aGt4eW9scW1xcmoxaHRqbmZjZm1kYXFnMGNicWRncnF4YnlvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tyttpGZNxgHOlv7Tffa/giphy.gif",
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmt5MW5kNnAybmduanVlaHYzYTVvYTVucTMxOGR5NjJnbjJmbXA4dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PGaQfbM27iucXz2BeW/giphy.gif",
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3A5NDJna3N2Z280MTAzN2gwZTQ4bGNlYnR4ZXl0b3R4aDFieG4wZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ICHPd6SXG9wQf1q95J/giphy.gif",
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjFiZjgwYnFscThmemc3ajlyMzJlZTZjM2RoZHJkZW53YzllMzEyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xTiTntfYqy2yIOowla/giphy.gif",
    "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGF5ajB3cDAyOXJucHY5cjE0dDlnenBoa2E2ejFzMXZvMHFwNzNzdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tyttpGNfRp5fb6c2By0/giphy.gif"
  ]
};

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload  = () => resolve({ ok: true,  src });
    img.onerror = () => resolve({ ok: false, src });
    img.src = src;
  });
}

async function chooseFirstAvailable(sources) {
  for (const s of sources) {
    const res = await preload(s);
    if (res.ok) return s;
  }
  return null;
}

function updateCounter(tile, idx, total) {
  const counter = tile.querySelector(".cycle-counter");
  if (counter) counter.textContent = `(${idx + 1}/${total})`;
}

async function initCycleTile(tile, kind) {
  const img     = tile.querySelector(".cycle-media");
  const loader  = tile.querySelector(".cycle-loading");
  const sources = MEDIA_SETS[kind] || [];
  tile.dataset.kind = kind;

  loader?.classList.remove("hidden");
  const first = await chooseFirstAvailable(sources);
  loader?.classList.add("hidden");

  if (!first) {
    img.alt = "No media available";
    img.removeAttribute("src");
    updateCounter(tile, 0, 0);
    return;
  }

  tile.dataset.index = String(sources.indexOf(first));
  img.src = first;
  updateCounter(tile, Number(tile.dataset.index), sources.length);

  const advance = async () => {
    const total = sources.length;
    let next = (Number(tile.dataset.index) + 1) % total;

    let tries = 0;
    loader?.classList.remove("hidden");
    while (tries < total) {
      const res = await preload(sources[next]);
      if (res.ok) {
        img.src = sources[next];
        tile.dataset.index = String(next);
        break;
      }
      next = (next + 1) % total;
      tries++;
    }
    loader?.classList.add("hidden");
    updateCounter(tile, Number(tile.dataset.index), total);
  };

  tile.addEventListener("click", advance);
  tile.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
    if (e.key === "ArrowRight")             { e.preventDefault(); advance(); }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const total = (MEDIA_SETS[kind] || []).length;
      let prev = (Number(tile.dataset.index) - 1 + total) % total;
      tile.dataset.index = String(prev);
      img.src = MEDIA_SETS[kind][prev];
      updateCounter(tile, prev, total);
    }
  });
}

// Initialize tiles
document.querySelectorAll(".cycle-tile[data-kind]").forEach((tile) => {
  initCycleTile(tile, tile.dataset.kind);
});
