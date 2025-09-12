/* ========= XR Showcase — app.js (smooth mouse/touch paging) ========= */

(async function () {
  const deck        = document.getElementById('deck');
  const progress    = document.getElementById('progress');
  const btnPrev     = document.getElementById('btnPrev');
  const btnNext     = document.getElementById('btnNext');
  const btnFS       = document.getElementById('btnFS');
  const btnAuto     = document.getElementById('btnAuto');
  const btnBar      = document.getElementById('btnBar');
  const btnBarGhost = document.getElementById('btnBarGhost');
  const banner      = document.getElementById('banner');

  /* ---------- 1) Load slides (optional manifest) ---------- */
  async function loadSlidesIfNeeded() {
    const manifestUrl = deck?.dataset?.manifest;
    if (!manifestUrl) return;
    const res = await fetch(manifestUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load slides manifest');
    const manifest = await res.json();
    for (const item of manifest.slides) {
      const file = typeof item === 'string' ? item : item.file;
      const html = await (await fetch(`slides/${file}`, { cache: 'no-store' })).text();
      deck.insertAdjacentHTML('beforeend', html);
      if (typeof item === 'object' && item.duration) {
        const lastSection = deck.lastElementChild;
        if (lastSection && lastSection.classList.contains('slide')) {
          lastSection.dataset.duration = String(item.duration);
        }
      }
    }
  }

  try { await loadSlidesIfNeeded(); } catch (e) { console.error(e); }

  /* ---------- 2) Deck state + helpers ---------- */
  let slides      = [...document.querySelectorAll('.slide')];
  let activeIndex = 0;

  // Autoplay (OFF by default)
  const DEFAULT_INTERVAL = 12000;
  let autoplayEnabled    = false;
  let autoplayTimer      = null;

  // Wheel/swipe paging
  const NAV_COOLDOWN_MS  = 650;  // prevents double-advance on inertia
  const WHEEL_THRESH     = 45;   // pixels of deltaY before paging
  const SWIPE_THRESH     = 60;   // pixels of touch deltaY before paging
  let wheelLocked        = false;

  const mod = (n, m) => ((n % m) + m) % m;

  function updateBannerVar() {
    const h = (banner?.offsetHeight || 0);
    document.documentElement.style.setProperty('--banner-h', `${h}px`);
  }

  function topOf(el) {
    const elRect   = el.getBoundingClientRect();
    const deckRect = deck.getBoundingClientRect();
    return deck.scrollTop + (elRect.top - deckRect.top);
  }

  function updateProgressBar() {
    if (!progress || slides.length === 0) return;
    progress.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
    history.replaceState(null, "", `#${activeIndex}`);
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
    if (btnAuto) {
      btnAuto.setAttribute('aria-pressed', String(autoplayEnabled));
      btnAuto.setAttribute('aria-label', autoplayEnabled ? 'Turn autoplay off' : 'Turn autoplay on');
      btnAuto.title = 'Autoplay';
    }
    clearTimeout(autoplayTimer);
    if (autoplayEnabled) scheduleNext();
  }

  function goTo(i, smooth = true) {
    if (!deck || slides.length === 0) return;
    clearTimeout(autoplayTimer);
    const targetIndex = mod(i, slides.length);
    const y = Math.max(0, topOf(slides[targetIndex]));
    deck.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    if (autoplayEnabled) scheduleNext();
  }

  function toggleBanner() {
    const hidden = !document.body.classList.contains('banner-hidden');
    document.body.classList.toggle('banner-hidden', hidden);

    if (btnBar) {
      btnBar.setAttribute('aria-pressed', String(hidden));
      btnBar.setAttribute('aria-label', hidden ? 'Show top bar' : 'Hide top bar');
      btnBar.title = 'Hide/Show bar';
    }
    updateBannerVar();
    goTo(activeIndex, false);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  // Detect whether the wheel/touch should scroll inside a nested scrollable element
  function canScrollInTargetPath(startEl, deltaY) {
    // If target is inside an iframe/video or contentEditable etc., don’t hijack
    const TAG_DENY = new Set(['IFRAME', 'VIDEO', 'TEXTAREA', 'SELECT', 'INPUT']);
    let el = startEl;
    while (el && el !== deck) {
      if (TAG_DENY.has(el.tagName)) return true;

      const style = el instanceof Element ? getComputedStyle(el) : null;
      const overflowY = style ? style.overflowY : '';
      const isScrollable = /(auto|scroll)/.test(overflowY) && el.scrollHeight > el.clientHeight;

      if (isScrollable) {
        if (deltaY > 0) {
          // scrolling down: allow if not at bottom
          if (el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
        } else if (deltaY < 0) {
          // scrolling up: allow if not at top
          if (el.scrollTop > 0) return true;
        }
      }
      el = el.parentElement;
    }
    return false;
  }

  /* ---------- 3) Observers & events ---------- */

  // Track most-visible slide (sets activeIndex + progress + autoplay)
  const io = new IntersectionObserver(
    (entries) => {
      let best = { idx: activeIndex, ratio: 0 };
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = slides.indexOf(entry.target);
          if (entry.intersectionRatio > best.ratio) best = { idx, ratio: entry.intersectionRatio };
          const el = entry.target.querySelector('.fade-enter');
          if (el) el.classList.add('fade-enter-active');
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

  // Progress feedback during manual scroll
  deck?.addEventListener('scroll', () => {
    if (!progress || slides.length === 0) return;
    const center = deck.scrollTop + deck.clientHeight / 2;
    let idx = 0;
    for (let i = 0; i < slides.length; i++) {
      if (topOf(slides[i]) <= center) idx = i;
      else break;
    }
    progress.style.width = `${((idx + 1) / slides.length) * 100}%`;
  }, { passive: true });

  // Mouse wheel / trackpad: page one slide at a time (but don’t steal scroll from inner scrollables)
  deck?.addEventListener('wheel', (e) => {
    if (wheelLocked) return;
    if (Math.abs(e.deltaY) < WHEEL_THRESH) return; // ignore micro-movements
    if (canScrollInTargetPath(e.target, e.deltaY)) return; // let inner scroller handle it

    e.preventDefault(); // take over paging
    wheelLocked = true;
    if (e.deltaY > 0) goTo(activeIndex + 1);
    else              goTo(activeIndex - 1);
    setTimeout(() => { wheelLocked = false; }, NAV_COOLDOWN_MS);
  }, { passive: false });

  // Touch swipe (also respects inner scrollables)
  let touchStartY = null;
  let touchStartTarget = null;
  deck?.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].clientY;
    touchStartTarget = e.target;
  }, { passive: true });

  deck?.addEventListener('touchmove', (e) => {
    if (touchStartY == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // If inner target can scroll in this direction, do not hijack
    if (canScrollInTargetPath(touchStartTarget, -dy)) return;
    // Otherwise, prevent rubber-banding while deciding
    if (Math.abs(dy) > 6) e.preventDefault();
  }, { passive: false });

  deck?.addEventListener('touchend', (e) => {
    if (touchStartY == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartY = null;
    if (canScrollInTargetPath(touchStartTarget, -dy)) return;
    if (Math.abs(dy) >= SWIPE_THRESH) {
      if (dy < 0) goTo(activeIndex + 1);
      else        goTo(activeIndex - 1);
    }
    touchStartTarget = null;
  }, { passive: false });

  // Resize: keep banner var & alignment correct
  window.addEventListener('resize', () => {
    updateBannerVar();
    goTo(activeIndex, false);
  });

  // Pause autoplay when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(autoplayTimer);
    else if (autoplayEnabled) scheduleNext();
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['ArrowDown','PageDown','ArrowRight',' '].includes(e.key)) { e.preventDefault(); goTo(activeIndex + 1); }
    if (['ArrowUp','PageUp','ArrowLeft'].includes(e.key))          { e.preventDefault(); goTo(activeIndex - 1); }
    if (e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
    if (e.key.toLowerCase() === 'a') { e.preventDefault(); setAutoEnabled(!autoplayEnabled); }
    if (e.key.toLowerCase() === 'b') { e.preventDefault(); toggleBanner(); }
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End')  goTo(slides.length - 1);
  });

  // Buttons
  btnPrev     ?.addEventListener('click', () => goTo(activeIndex - 1));
  btnNext     ?.addEventListener('click', () => goTo(activeIndex + 1));
  btnFS       ?.addEventListener('click', toggleFullscreen);
  btnAuto     ?.addEventListener('click', () => setAutoEnabled(!autoplayEnabled));
  btnBar      ?.addEventListener('click', toggleBanner);
  btnBarGhost ?.addEventListener('click', toggleBanner);

  // Initial UI state
  btnAuto?.setAttribute('aria-pressed', 'false');
  btnAuto?.setAttribute('aria-label', 'Turn autoplay on');
  btnBar ?.setAttribute('aria-pressed', 'false');
  btnBar ?.setAttribute('aria-label', 'Hide top bar');

  // Banner var and start position
  updateBannerVar();
  const startIdx = parseInt(location.hash.replace('#',''));
  if (!isNaN(startIdx)) setTimeout(() => goTo(startIdx, false), 50);
  else updateProgressBar();

  // Initialize VR/AR/MR cycle tiles
  initCycleTiles();
})();

/* ===== VR/AR/MR GIF cycling ===== */

const MEDIA_SETS = {
  vr: [
    // Add local files if you have them: 'images/vr-1.gif','images/vr-2.gif',
    'images/vr-fLmq9Neevz5fGFP6Gw.webp',
    'images/vr-xTiN0AVV7Ebad21L7q.webp',
  ],
  ar: [
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTg3NWZmYThqNWNwenZjejM3MGU1dDdkYnpidDN2ZmM2eG1nNnF6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L0w91gyGwvLLXJQK9E/giphy.gif',
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExems1OGN2YXBicGtlNHc3MGw3N2xvNnlqbjFobDhuMXN3cmE1MHhvYyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3vl42670bDbbVR216S/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGl4NTdtemlhaW15bzNrazZxYndxaW9laXYxYnFwbW5udnIzeGdsMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TC4QmESqXj0IrVn3vI/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWYwMXByaDFtYmYxZmQ3bGJsamFhYmczYTJ2cHV3dWZqZWthYXpwMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JXKbd2qz0r6WBpg0zf/giphy.gif'
  ],
  mr: [
    // Add a local one if you like: 'images/mr-1.gif',
    'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMG81aGt4eW9scW1xcmoxaHRqbmZjZm1kYXFnMGNicWRncnF4YnlvZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tyttpGZNxgHOlv7Tffa/giphy.gif',
    'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmt5MW5kNnAybmduanVlaHYzYTVvYTVucTMxOGR5NjJnbjJmbXA4dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PGaQfbM27iucXz2BeW/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3A5NDJna3N2Z280MTAzN2gwZTQ4bGNlYnR4ZXl0b3R4aDFieG4wZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ICHPd6SXG9wQf1q95J/giphy.gif',
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjFiZjgwYnFscThmemc3ajlyMzJlZTZjM2RoZHJkZW53YzllMzEyNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xTiTntfYqy2yIOowla/giphy.gif',
    'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGF5ajB3cDAyOXJucHY5cjE0dDlnenBoa2E2ejFzMXZvMHFwNzNzdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/tyttpGNfRp5fb6c2By0/giphy.gif'
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
  const counter = tile.querySelector('.cycle-counter');
  if (counter) counter.textContent = `(${idx + 1}/${total})`;
}

async function initCycleTile(tile, kind) {
  const img     = tile.querySelector('.cycle-media');
  const loader  = tile.querySelector('.cycle-loading');
  const sources = MEDIA_SETS[kind] || [];
  tile.dataset.kind = kind;

  loader?.classList.remove('hidden');
  const first = await chooseFirstAvailable(sources);
  loader?.classList.add('hidden');

  if (!first) {
    img.alt = 'No media available';
    img.removeAttribute('src');
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
    loader?.classList.remove('hidden');
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
    loader?.classList.add('hidden');
    updateCounter(tile, Number(tile.dataset.index), total);
  };

  tile.addEventListener('click', advance);
  tile.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    if (e.key === 'ArrowRight')             { e.preventDefault(); advance(); }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const total = (MEDIA_SETS[kind] || []).length;
      let prev = (Number(tile.dataset.index) - 1 + total) % total;
      tile.dataset.index = String(prev);
      img.src = MEDIA_SETS[kind][prev];
      updateCounter(tile, prev, total);
    }
  });
}

function initCycleTiles() {
  document.querySelectorAll('.cycle-tile[data-kind]').forEach((tile) => {
    initCycleTile(tile, tile.dataset.kind);
  });
}

/* ============================================================
   FIT SLIDES TO VIEWPORT (no content taller than 100% view)
   Drop this at the end of assets/js/app.js
   ============================================================ */

(function fitSlidesModule(){
  const deck  = document.getElementById('deck');
  if (!deck) return;

  // Helper: banner height → CSS var (so snap offsets work)
  function setBannerHeightVar() {
    const b = document.getElementById('banner');
    const h = b && getComputedStyle(b).display !== 'none' ? b.offsetHeight : 0;
    document.documentElement.style.setProperty('--banner-h', `${h}px`);
    return h;
  }

  // Wrap each slide’s contents into .fit > .fit-inner (once)
  function wrapSlides() {
    const slides = deck.querySelectorAll('.slide');
    slides.forEach(slide => {
      if (slide.dataset.fitWrapped === '1') return;

      // Create wrappers
      const fit = document.createElement('div');
      fit.className = 'fit';
      const inner = document.createElement('div');
      inner.className = 'fit-inner';

      // Move all existing children into inner
      // (preserves your slide content exactly as-is)
      while (slide.firstChild) inner.appendChild(slide.firstChild);

      // Attach wrappers
      fit.appendChild(inner);
      slide.appendChild(fit);

      slide.dataset.fitWrapped = '1';
    });
  }

  // Measure natural (unscaled) height of the .fit-inner
  function measureInnerHeight(inner) {
    const prev = inner.style.transform;
    inner.style.transform = 'none';
    // Force reflow & measure
    const h = inner.offsetHeight;
    // Restore any transform
    inner.style.transform = prev;
    return h;
  }

  // Scale one slide to fit its available box
  function fitSlide(slide, bannerH) {
    const fit   = slide.querySelector(':scope > .fit');
    const inner = fit && fit.querySelector(':scope > .fit-inner');
    if (!fit || !inner) return;

    // Available height = slide’s inner box minus the slide’s own paddings.
    // Slide is exactly 100dvh tall. If there is a sticky banner above the deck
    // that overlaps visually, we already compensated via scroll-margin/padding,
    // but we still compute actual visible box from the slide itself.
    const slideStyles = getComputedStyle(slide);
    const padTop    = parseFloat(slideStyles.paddingTop) || 0;
    const padBottom = parseFloat(slideStyles.paddingBottom) || 0;
    const available = slide.clientHeight - padTop - padBottom;

    // Natural content height (unscaled)
    const naturalH = measureInnerHeight(inner);

    // Scale so it fits available height (never scale up past 1)
    const scale = Math.min(1, available / Math.max(1, naturalH));

    // Apply transform
    inner.style.transform = `scale(${scale})`;

    // Center nicely inside the .fit box
    fit.style.alignItems = scale < 1 ? 'start' : 'center'; // start looks better when we shrunk
  }

  // Fit all slides now
  function fitAllSlides() {
    const bannerH = setBannerHeightVar();
    deck.querySelectorAll('.slide').forEach(slide => fitSlide(slide, bannerH));
  }

  // Refit on window resize / orientation change
  window.addEventListener('resize', fitAllSlides, { passive: true });

  // If your app has a button that shows/hides the bar, make sure it calls:
  //   document.body.classList.toggle('banner-hidden', true/false);
  // We’ll observe for that and refit automatically.
  const bodyObserver = new MutationObserver(fitAllSlides);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Refit when deck children change (e.g., slides loaded from manifest)
  const deckObserver = new MutationObserver(() => {
    wrapSlides();
    wireMediaLoadRefit();
    fitAllSlides();
  });
  deckObserver.observe(deck, { childList: true, subtree: false });

  // Refit when media finishes loading (images, videos)
  function wireMediaLoadRefit() {
    deck.querySelectorAll('.slide img').forEach(img => {
      if (img.dataset.fitListen === '1') return;
      img.dataset.fitListen = '1';
      img.addEventListener('load', fitAllSlides, { passive: true });
    });
    deck.querySelectorAll('.slide video').forEach(v => {
      if (v.dataset.fitListen === '1') return;
      v.dataset.fitListen = '1';
      v.addEventListener('loadedmetadata', fitAllSlides, { passive: true });
      v.addEventListener('loadeddata', fitAllSlides, { passive: true });
    });
  }

  // Initial run (in case slides are already present)
  wrapSlides();
  wireMediaLoadRefit();
  // Fit after the page finishes loading all assets (fonts can affect height)
  if (document.readyState === 'complete') {
    fitAllSlides();
  } else {
    window.addEventListener('load', fitAllSlides, { once: true });
    // Also run shortly after DOM is ready to feel snappy
    document.addEventListener('DOMContentLoaded', () => setTimeout(fitAllSlides, 0), { once: true });
  }
})();
