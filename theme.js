/**
 * Theme toggle — Light / Dark / System (matches Acsaven / portfolio).
 * Preference in localStorage only for light/dark; system clears storage.
 */
(function () {
  var KEY = 'samsonpg-theme';
  var LIGHT_META = '#f1f5f9';
  var DARK_META = '#0b1220';

  function boot(root) {
    var key = root.getAttribute('data-theme-key') || KEY;
    var lightMeta = root.getAttribute('data-theme-light') || LIGHT_META;
    var darkMeta = root.getAttribute('data-theme-dark') || DARK_META;
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-theme-pref]'));

    function getStored() {
      try {
        var s = localStorage.getItem(key);
        if (s === 'light' || s === 'dark') return s;
      } catch (e) { /* private browsing */ }
      return 'system';
    }

    function getSystem() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function resolve(pref) {
      return pref === 'system' ? getSystem() : pref;
    }

    function apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme;
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? darkMeta : lightMeta);
    }

    function syncPressed(pref) {
      document.querySelectorAll('.theme-switch[data-theme-key] [data-theme-pref]').forEach(function (btn) {
        var id = btn.getAttribute('data-theme-pref');
        btn.setAttribute('aria-pressed', id === pref ? 'true' : 'false');
      });
    }

    function setPreference(pref) {
      try {
        if (pref === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, pref);
      } catch (e) { /* ignore */ }
      apply(resolve(pref));
      syncPressed(pref);
    }

    var initial = getStored();
    apply(resolve(initial));
    syncPressed(initial);
    root.classList.remove('theme-switch--pending');
    root.classList.add('theme-switch--ready');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pref = btn.getAttribute('data-theme-pref');
        if (pref === 'light' || pref === 'dark' || pref === 'system') setPreference(pref);
      });
    });

    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function () {
      if (getStored() !== 'system') return;
      apply(getSystem());
      syncPressed('system');
    });

    window.addEventListener('storage', function (event) {
      if (event.key !== key) return;
      var pref = getStored();
      apply(resolve(pref));
      syncPressed(pref);
    });
  }

  document.querySelectorAll('.theme-switch[data-theme-key]').forEach(boot);
})();
