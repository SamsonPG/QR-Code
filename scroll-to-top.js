/**
 * Floating back-to-top control — appears after scrolling down.
 * Matches Try family utility sites (TryTokka / Acsaven style).
 */
(function () {
  const SHOW_AFTER_PX = 320;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function scrollWindowTo(y) {
    window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'instant' });
  }

  function animateScrollToTop(onComplete) {
    const startY = window.scrollY;
    if (startY <= 0) {
      if (onComplete) onComplete();
      return function () {};
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scrollWindowTo(0);
      if (onComplete) onComplete();
      return function () {};
    }

    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const duration = Math.min(1100, Math.max(550, startY * 0.65));
    const startTime = performance.now();
    let frame = 0;

    function finish() {
      scrollWindowTo(0);
      html.style.scrollBehavior = previousScrollBehavior;
      if (onComplete) onComplete();
    }

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      scrollWindowTo(startY * (1 - easeOutCubic(progress)));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        finish();
      }
    }

    frame = requestAnimationFrame(step);
    return function () {
      cancelAnimationFrame(frame);
      html.style.scrollBehavior = previousScrollBehavior;
    };
  }

  function init() {
    const button = document.getElementById('scroll-to-top');
    if (!button) return;

    let scrolling = false;
    let cancelScroll = function () {};
    let lastVisible = null;
    let scrollFrame = 0;

    function setVisible(visible) {
      if (lastVisible === visible) return;
      lastVisible = visible;
      button.classList.toggle('scroll-to-top--visible', visible);
      button.classList.toggle('scroll-to-top--hidden', !visible);
      button.toggleAttribute('aria-hidden', !visible);
      button.tabIndex = visible ? 0 : -1;
    }

    function onScroll() {
      if (scrolling || scrollFrame) return;
      scrollFrame = requestAnimationFrame(function () {
        scrollFrame = 0;
        if (scrolling) return;
        setVisible(window.scrollY > SHOW_AFTER_PX);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    setVisible(window.scrollY > SHOW_AFTER_PX);

    button.addEventListener('click', function () {
      if (scrolling) return;

      scrolling = true;
      setVisible(true);
      button.classList.add('scroll-to-top--scrolling');
      cancelScroll();
      cancelScroll = animateScrollToTop(function () {
        scrolling = false;
        button.classList.remove('scroll-to-top--scrolling');
        setVisible(window.scrollY > SHOW_AFTER_PX);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
