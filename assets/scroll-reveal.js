(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window) ||
      typeof Element.prototype.animate !== 'function' ||
      !CSS.supports('translate', '0 1px')) return;

  const targets = [...document.querySelectorAll(
    '.section-header, .project-card, .publication, .news-item, .contact-layout > *'
  )];
  const pending = new Set();
  const active = new Map();
  const compact = window.matchMedia('(max-width: 720px)');
  // A gentler initial slope makes the full reveal legible, with no overshoot.
  const easing = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  let observer;

  const reveal = (element, immediate = false, delay = 0) => {
    if (immediate) {
      active.get(element)?.cancel();
      active.delete(element);
    }
    if (!pending.delete(element)) return;
    observer?.unobserve(element);
    element.classList.remove('reveal-pending');
    if (immediate || motion.matches) return;

    // Independent translate leaves the card's existing hover transform intact.
    try {
      const isCard = element.matches('.project-card');
      const distance = compact.matches ? (isCard ? 24 : 18) : (isCard ? 32 : 24);
      const animation = element.animate([
        { opacity: 0, translate: `0 ${distance}px` },
        { opacity: 1, translate: '0 0' }
      ], {
        duration: compact.matches ? 700 : 800,
        delay,
        easing,
        fill: 'backwards'
      });
      active.set(element, animation);
      const clear = () => {
        if (active.get(element) === animation) active.delete(element);
      };
      animation.finished.then(clear, clear);
    } catch (_) {
      // Visible content is the fallback if animation is unavailable.
    }
  };

  const showAll = () => {
    observer?.disconnect();
    [...pending].forEach((element) => reveal(element, true));
    active.forEach((animation) => animation.cancel());
    active.clear();
  };

  try {
    observer = new IntersectionObserver((entries) => {
      let previousCardTop = null;
      let cardDelay = 0;
      entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top ||
          a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry) => {
          let delay = 0;
          if (entry.target.matches('.project-card')) {
            const top = entry.boundingClientRect.top;
            cardDelay = previousCardTop !== null && Math.abs(top - previousCardTop) < 8
              ? Math.min(cardDelay + 120, 240) : 0;
            previousCardTop = top;
            delay = cardDelay;
          }
          reveal(entry.target, false, delay);
        });
    }, { threshold: 0, rootMargin: '0px 0px -64px 0px' });

    targets.forEach((element) => {
      // Keep first-screen and restored-scroll content visible from the outset.
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      pending.add(element);
      element.classList.add('reveal-pending');
      observer.observe(element);
    });
  } catch (_) {
    showAll();
  }

  document.addEventListener('focusin', (event) => {
    const target = targets.find((element) => element.contains(event.target));
    if (target) reveal(target, true);
  });
  motion.addEventListener('change', (event) => {
    if (event.matches) showAll();
  });
  window.addEventListener('beforeprint', showAll);
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) showAll();
  });
})();
