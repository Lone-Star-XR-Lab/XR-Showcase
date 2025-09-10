


    (function(){
      const deck = document.getElementById('deck');
      const slides = [...document.querySelectorAll('.slide')];
      const progress = document.getElementById('progress');
      const btnPrev = document.getElementById('btnPrev');
      const btnNext = document.getElementById('btnNext');
      const btnFS = document.getElementById('btnFS');
      const btnNotes = document.getElementById('btnNotes');
      const btnGrid = document.getElementById('btnGrid');
      const gridOverlay = document.getElementById('gridOverlay');
      const grid = document.getElementById('grid');
      const gridClose = document.getElementById('gridClose');

      // Build grid thumbnails
      slides.forEach((s, i) => {
        const thumb = s.cloneNode(true);
        thumb.classList.add('rounded-xl','overflow-hidden','border','border-white/10');
        thumb.style.height = '200px';
        thumb.style.scrollSnapAlign = 'unset';
        thumb.querySelectorAll('.presenter-notes').forEach(n => n.remove());
        const wrap = document.createElement('button');
        wrap.className = 'text-left';
        wrap.appendChild(thumb);
        wrap.addEventListener('click', () => { gridOverlay.classList.add('hidden'); goTo(i); });
        grid.appendChild(wrap);
      });

      // Helpers
      const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
      const idxFromScroll = () => Math.round(deck.scrollTop / window.innerHeight);
      const updateProgress = () => {
        const idx = idxFromScroll();
        progress.style.width = `${((idx+1)/slides.length)*100}%`;
        // Update URL hash (optional)
        history.replaceState(null, '', `#${idx}`);
      };

      const goTo = (i) => {
        const target = clamp(i, 0, slides.length-1);
        deck.scrollTo({ top: target * window.innerHeight, behavior: 'smooth' });
      };

      // Keyboard navigation
      window.addEventListener('keydown', (e) => {
        if (gridOverlay && !gridOverlay.classList.contains('hidden')) return; // disable keys when grid open
        const idx = idxFromScroll();
        if (['ArrowDown','PageDown','ArrowRight',' '].includes(e.key)) { e.preventDefault(); goTo(idx+1); }
        if (['ArrowUp','PageUp','ArrowLeft'].includes(e.key)) { e.preventDefault(); goTo(idx-1); }
        if (e.key.toLowerCase() === 'f') toggleFullscreen();
        if (e.key.toLowerCase() === 'p') toggleNotes();
        if (e.key.toLowerCase() === 'g') toggleGrid();
        if (e.key === 'Home') goTo(0);
        if (e.key === 'End') goTo(slides.length-1);
      });

      // Buttons
      btnPrev.addEventListener('click', () => goTo(idxFromScroll()-1));
      btnNext.addEventListener('click', () => goTo(idxFromScroll()+1));
      btnFS.addEventListener('click', toggleFullscreen);
      btnNotes.addEventListener('click', toggleNotes);
      btnGrid.addEventListener('click', toggleGrid);
      gridClose.addEventListener('click', toggleGrid);

      // Notes toggle
      function toggleNotes(){
        document.querySelectorAll('.presenter-notes').forEach(n => n.classList.toggle('hidden'));
      }

      // Grid toggle
      function toggleGrid(){
        gridOverlay.classList.toggle('hidden');
      }

      // Fullscreen
      function toggleFullscreen(){
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen();
        }
      }

      // Track scroll to update progress
      deck.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', () => goTo(idxFromScroll()));

      // Enter animation on view changes
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target.querySelector('.fade-enter');
            if (el) el.classList.add('fade-enter-active');
          }
        })
      }, { root: deck, threshold: 0.6 });
      slides.forEach(s => io.observe(s));

      // Start at hash if provided
      const startIdx = parseInt(location.hash.replace('#',''));
      if (!isNaN(startIdx)) { setTimeout(() => goTo(startIdx), 50); }

      // Touch swipe (basic)
      let touchStartY = null;
      deck.addEventListener('touchstart', e => { touchStartY = e.changedTouches[0].clientY; }, {passive:true});
      deck.addEventListener('touchend', e => {
        if (touchStartY === null) return;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const idx = idxFromScroll();
        if (Math.abs(dy) > 60) { if (dy < 0) goTo(idx+1); else goTo(idx-1); }
        touchStartY = null;
      }, {passive:true});

      // Initial progress
      updateProgress();
    })();
 