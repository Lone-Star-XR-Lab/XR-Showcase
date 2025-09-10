(function () {
  const deck = document.getElementById("deck");
  const slides = [...document.querySelectorAll(".slide")];
  const progress = document.getElementById("progress");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnFS = document.getElementById("btnFS");
  const btnNotes = document.getElementById("btnNotes");
  const btnGrid = document.getElementById("btnGrid");
  const gridOverlay = document.getElementById("gridOverlay");
  const grid = document.getElementById("grid");
  const gridClose = document.getElementById("gridClose");

  // Build grid thumbnails
  slides.forEach((s, i) => {
    const thumb = s.cloneNode(true);
    thumb.classList.add(
      "rounded-xl",
      "overflow-hidden",
      "border",
      "border-white/10"
    );
    thumb.style.height = "200px";
    thumb.style.scrollSnapAlign = "unset";
    thumb.querySelectorAll(".presenter-notes").forEach((n) => n.remove());
    const wrap = document.createElement("button");
    wrap.className = "text-left";
    wrap.appendChild(thumb);
    wrap.addEventListener("click", () => {
      gridOverlay.classList.add("hidden");
      goTo(i);
    });
    grid.appendChild(wrap);
  });

  // Helpers
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const idxFromScroll = () => Math.round(deck.scrollTop / window.innerHeight);
  const updateProgress = () => {
    const idx = idxFromScroll();
    progress.style.width = `${((idx + 1) / slides.length) * 100}%`;
    // Update URL hash (optional)
    history.replaceState(null, "", `#${idx}`);
  };

  const goTo = (i) => {
    const target = clamp(i, 0, slides.length - 1);
    deck.scrollTo({ top: target * window.innerHeight, behavior: "smooth" });
  };

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (gridOverlay && !gridOverlay.classList.contains("hidden")) return; // disable keys when grid open
    const idx = idxFromScroll();
    if (["ArrowDown", "PageDown", "ArrowRight", " "].includes(e.key)) {
      e.preventDefault();
      goTo(idx + 1);
    }
    if (["ArrowUp", "PageUp", "ArrowLeft"].includes(e.key)) {
      e.preventDefault();
      goTo(idx - 1);
    }
    if (e.key.toLowerCase() === "f") toggleFullscreen();
    if (e.key.toLowerCase() === "p") toggleNotes();
    if (e.key.toLowerCase() === "g") toggleGrid();
    if (e.key === "Home") goTo(0);
    if (e.key === "End") goTo(slides.length - 1);
  });

  // Buttons
  btnPrev.addEventListener("click", () => goTo(idxFromScroll() - 1));
  btnNext.addEventListener("click", () => goTo(idxFromScroll() + 1));
  btnFS.addEventListener("click", toggleFullscreen);
  btnNotes.addEventListener("click", toggleNotes);
  btnGrid.addEventListener("click", toggleGrid);
  gridClose.addEventListener("click", toggleGrid);

  // Notes toggle
  function toggleNotes() {
    document
      .querySelectorAll(".presenter-notes")
      .forEach((n) => n.classList.toggle("hidden"));
  }

  // Grid toggle
  function toggleGrid() {
    gridOverlay.classList.toggle("hidden");
  }

  // Fullscreen
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // Track scroll to update progress
  deck.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", () => goTo(idxFromScroll()));

  // Enter animation on view changes
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target.querySelector(".fade-enter");
          if (el) el.classList.add("fade-enter-active");
        }
      });
    },
    { root: deck, threshold: 0.6 }
  );
  slides.forEach((s) => io.observe(s));

  // Start at hash if provided
  const startIdx = parseInt(location.hash.replace("#", ""));
  if (!isNaN(startIdx)) {
    setTimeout(() => goTo(startIdx), 50);
  }

  // Touch swipe (basic)
  let touchStartY = null;
  deck.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.changedTouches[0].clientY;
    },
    { passive: true }
  );
  deck.addEventListener(
    "touchend",
    (e) => {
      if (touchStartY === null) return;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const idx = idxFromScroll();
      if (Math.abs(dy) > 60) {
        if (dy < 0) goTo(idx + 1);
        else goTo(idx - 1);
      }
      touchStartY = null;
    },
    { passive: true }
  );

  // Initial progress
  updateProgress();
})();
/* === VR/AR/MR GIF cycling ===
   Put your own files in /images (vr-1.gif, vr-2.gif, ar-1.gif, etc).
   We also include Wikimedia Commons fallbacks so it works immediately. */

const MEDIA_SETS = {
  vr: [
    // Local (drop your own here)

    // External fallbacks (generic, non-app branding)
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWl3MXFjN2p4djdhcmQzZmpqd2Z2bTI0Mnh4N29oem5nZTRtbXpmYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xTiN0AVV7Ebad21L7q/giphy.gif", // MIT-licensed pen interaction :contentReference[oaicite:0]{index=0}
  ],
  ar: [
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTg3NWZmYThqNWNwenZjejM3MGU1dDdkYnpidDN2ZmM2eG1nNnF6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L0w91gyGwvLLXJQK9E/giphy.gif", // AR animation :contentReference[oaicite:2]{index=2}
    "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExems1OGN2YXBicGtlNHc3MGw3N2xvNnlqbjFobDhuMXN3cmE1MHhvYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3vl42670bDbbVR216S/giphy.gif", // AR overlay concept :contentReference[oaicite:3]{index=3}
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGl4NTdtemlhaW15bzNrazZxYndxaW9laXYxYnFwbW5udnIzeGdsMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TC4QmESqXj0IrVn3vI/giphy.gif",
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWYwMXByaDFtYmYxZmQ3bGJsamFhYmczYTJ2cHV3dWZqZWthYXpwMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JXKbd2qz0r6WBpg0zf/giphy.gif",
  ],
  mr: [
    "images/mr-1.gif",

    // Mixed/augmediated reality historical demos
    "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG81aGt4eW9scW1xcmoxaHRqbmZjZm1kYXFnMGNicWRncnF4YnlvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tyttpGZNxgHOlv7Tffa/giphy.gif", // early MR demo :contentReference[oaicite:4]{index=4}
    "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmt5MW5kNnAybmduanVlaHYzYTVvYTVucTMxOGR5NjJnbjJmbXA4dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PGaQfbM27iucXz2BeW/giphy.gif", // augmediated/mixed interaction :contentReference[oaicite:5]{index=5}
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3A5NDJna3N2Z280MTAzN2gwZTQ4bGNlYnR4ZXl0b3R4aDFieG4wZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ICHPd6SXG9wQf1q95J/giphy.gif",
    "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjFiZjgwYnFscThmemc3ajlyMzJlZTZjM2RoZHJkZW53YzllMzEyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xTiTntfYqy2yIOowla/giphy.gif",
    "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGF5ajB3cDAyOXJucHY5cjE0dDlnenBoa2E2ejFzMXZvMHFwNzNzdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tyttpGNfRp5fb6c2By0/giphy.gif",
  ],
};

function preload(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ ok: true, src });
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
  const img = tile.querySelector(".cycle-media");
  const loader = tile.querySelector(".cycle-loading");
  const sources = MEDIA_SETS[kind] || [];
  tile.dataset.kind = kind;

  // Find a starting image that actually loads
  loader.classList.remove("hidden");
  const first = await chooseFirstAvailable(sources);
  loader.classList.add("hidden");

  if (!first) {
    img.alt = "No media available";
    img.removeAttribute("src");
    updateCounter(tile, 0, 0);
    return;
  }

  tile.dataset.index = String(sources.indexOf(first));
  img.src = first;
  updateCounter(tile, Number(tile.dataset.index), sources.length);

  // Click / keyboard to advance
  const advance = async () => {
    const total = sources.length;
    let next = (Number(tile.dataset.index) + 1) % total;

    // Skip any sources that fail to load
    let tries = 0;
    loader.classList.remove("hidden");
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
    loader.classList.add("hidden");
    updateCounter(tile, Number(tile.dataset.index), total);
  };

  tile.addEventListener("click", advance);
  tile.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      advance();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      advance();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault(); /* go back */
      const total = (MEDIA_SETS[kind] || []).length;
      let prev = (Number(tile.dataset.index) - 1 + total) % total;
      tile.dataset.index = String(prev);
      img.src = MEDIA_SETS[kind][prev];
      updateCounter(tile, prev, total);
    }
  });
}

// Initialize all tiles on the page
document.querySelectorAll(".cycle-tile[data-kind]").forEach((tile) => {
  initCycleTile(tile, tile.dataset.kind);
});
