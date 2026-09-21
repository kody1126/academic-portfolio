(() => {
  const root = document.documentElement;
  const intro = document.getElementById('intro');
  const introCopy = document.getElementById('intro-copy');
  const introName = document.getElementById('intro-name');
  const heroName = document.getElementById('hero-title');
  const pageShell = document.getElementById('page-shell');

  const shouldPlayIntro =
    root.dataset.intro === 'pending' &&
    intro &&
    introCopy &&
    introName &&
    heroName &&
    typeof intro.animate === 'function';

  if (shouldPlayIntro) {
    root.classList.add('intro-running');

    let finished = false;
    let transitionTimer;
    const animations = [];
    const previousScrollRestoration = 'scrollRestoration' in window.history
      ? window.history.scrollRestoration
      : null;

    const keepIntroAtTop = () => {
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      root.style.scrollBehavior = previousScrollBehavior;
    };

    const releaseScrollRestoration = () => {
      keepIntroAtTop();
      if (previousScrollRestoration !== null) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };

    if (previousScrollRestoration !== null) {
      window.history.scrollRestoration = 'manual';
    }
    keepIntroAtTop();
    if (document.readyState === 'complete') {
      releaseScrollRestoration();
    } else {
      window.addEventListener('load', releaseScrollRestoration, { once: true });
    }

    const skipIntroFromWheel = (event) => {
      event.preventDefault();
      finishIntro();
    };

    const skipIntroFromKeyboard = (event) => {
      if (!['Escape', 'Enter', ' ', 'Spacebar'].includes(event.key)) return;
      event.preventDefault();
      finishIntro();
    };

    const removeSkipListeners = () => {
      window.removeEventListener('wheel', skipIntroFromWheel);
      window.removeEventListener('keydown', skipIntroFromKeyboard);
      intro.removeEventListener('click', finishIntro);
    };

    function finishIntro() {
      if (finished) return;
      finished = true;
      window.clearTimeout(transitionTimer);
      animations.forEach((animation) => {
        try {
          animation.cancel();
        } catch (_) {
          // A completed animation no longer needs cancellation.
        }
      });
      removeSkipListeners();
      root.classList.remove('intro-running');
      root.removeAttribute('data-intro');
      intro.hidden = true;
      intro.style.display = 'none';
      pageShell.removeAttribute('aria-hidden');
      pageShell.removeAttribute('inert');
      keepIntroAtTop();
      if (document.readyState === 'complete') {
        releaseScrollRestoration();
      }
    }

    pageShell.setAttribute('aria-hidden', 'true');
    pageShell.setAttribute('inert', '');
    window.addEventListener('wheel', skipIntroFromWheel, { passive: false });
    window.addEventListener('keydown', skipIntroFromKeyboard);
    intro.addEventListener('click', finishIntro, { once: true });

    const startIntro = () => window.requestAnimationFrame(() => {
      if (finished) return;

      transitionTimer = window.setTimeout(() => {
        if (finished) return;

        const from = introName.getBoundingClientRect();
        const to = heroName.getBoundingClientRect();
        const deltaX = to.left - from.left;
        const deltaY = to.top - from.top;
        const rawScale = from.width ? to.width / from.width : 1;
        const scale = Number.isFinite(rawScale) ? rawScale : 1;

        const nameMove = introName.animate(
          [
            { transform: 'translate3d(0, 0, 0) scale(1)' },
            { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scale})` }
          ],
          {
            duration: 620,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
          }
        );

        const detailsOut = introCopy
          .querySelectorAll('.intro-kicker, .intro-role');
        detailsOut.forEach((element) => {
          const animation = element.animate(
            [
              { opacity: 1, transform: 'translate3d(0, 0, 0)' },
              { opacity: 0, transform: 'translate3d(0, -6px, 0)' }
            ],
            {
              duration: 240,
              easing: 'ease-out',
              fill: 'forwards'
            }
          );
          animations.push(animation);
        });

        const overlayOut = intro.animate(
          [
            { backgroundColor: 'rgba(255, 255, 255, 1)' },
            { backgroundColor: 'rgba(255, 255, 255, 0.92)', offset: 0.56 },
            { backgroundColor: 'rgba(255, 255, 255, 0)' }
          ],
          {
            duration: 620,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
          }
        );

        const contentIn = pageShell.animate(
          [
            { opacity: 0.9, transform: 'translate3d(0, 8px, 0)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' }
          ],
          {
            duration: 560,
            delay: 70,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both'
          }
        );

        animations.push(nameMove, overlayOut, contentIn);
        Promise.allSettled([
          nameMove.finished,
          overlayOut.finished,
          contentIn.finished
        ]).then(() => {
          finishIntro();
        });
      }, 520);
    });

    startIntro();
  } else {
    root.removeAttribute('data-intro');
    if (intro) intro.hidden = true;
  }

  const header = document.getElementById('site-header');
  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const menuButton = document.getElementById('menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  const setMenu = (open) => {
    if (!menuButton || !mobileMenu) return;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    mobileMenu.dataset.open = String(open);
  };

  menuButton?.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  document.addEventListener('pointerdown', (event) => {
    if (
      menuButton?.getAttribute('aria-expanded') === 'true' &&
      !mobileMenu?.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenu(false);
    }
  });

  const carousel = document.querySelector('[data-news-carousel]');
  if (carousel) {
    const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
    const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
    const previous = carousel.querySelector('[data-carousel-previous]');
    const next = carousel.querySelector('[data-carousel-next]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let activeIndex = 0;
    let rotationTimer;
    let isPaused = false;

    const stopRotation = () => window.clearTimeout(rotationTimer);

    const showSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', String(isActive));
      });
    };

    const scheduleRotation = () => {
      stopRotation();
      if (isPaused || reducedMotion.matches || document.hidden) return;
      rotationTimer = window.setTimeout(() => {
        showSlide(activeIndex + 1);
        scheduleRotation();
      }, 7000);
    };

    previous?.addEventListener('click', () => {
      showSlide(activeIndex - 1);
      scheduleRotation();
    });

    next?.addEventListener('click', () => {
      showSlide(activeIndex + 1);
      scheduleRotation();
    });

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        scheduleRotation();
      });
    });

    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(activeIndex - 1);
        scheduleRotation();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showSlide(activeIndex + 1);
        scheduleRotation();
      }
    });

    carousel.addEventListener('pointerenter', () => {
      isPaused = true;
      stopRotation();
    });
    carousel.addEventListener('pointerleave', () => {
      isPaused = false;
      scheduleRotation();
    });
    carousel.addEventListener('focusin', () => {
      isPaused = true;
      stopRotation();
    });
    carousel.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!carousel.contains(document.activeElement)) {
          isPaused = false;
          scheduleRotation();
        }
      });
    });
    document.addEventListener('visibilitychange', scheduleRotation);
    reducedMotion.addEventListener?.('change', scheduleRotation);
    scheduleRotation();
  }

  document.querySelectorAll('[data-github-stars]').forEach((counter) => {
    const repository = counter.dataset.githubStars;
    const value = counter.querySelector('[data-star-count]');
    if (!repository || !value) return;

    fetch(`https://api.github.com/repos/${repository}`, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!Number.isInteger(data?.stargazers_count)) return;
        const stars = new Intl.NumberFormat('en').format(data.stargazers_count);
        value.textContent = stars;
        counter.setAttribute('aria-label', `${stars} GitHub stars`);
      })
      .catch(() => {
        // Keep the last known count visible if GitHub is unavailable.
      });
  });

})();
