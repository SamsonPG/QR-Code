/**
 * Show "Demo" (static offline homepage) only when the live product is unreachable.
 * When down, also retarget the main product row to the offline demo so one tap still works.
 */
(function () {
  var TIMEOUT_MS = 4500

  function probe(url) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort()
    }, TIMEOUT_MS)

    var opts = { method: 'GET', mode: 'no-cors', cache: 'no-store', credentials: 'omit' }
    if (ctrl) opts.signal = ctrl.signal

    return fetch(url, opts)
      .then(function () {
        clearTimeout(timer)
        return true
      })
      .catch(function () {
        clearTimeout(timer)
        return new Promise(function (resolve) {
          var img = new Image()
          var done = false
          function finish(ok) {
            if (done) return
            done = true
            resolve(ok)
          }
          img.onload = function () {
            finish(true)
          }
          img.onerror = function () {
            finish(false)
          }
          setTimeout(function () {
            finish(false)
          }, TIMEOUT_MS)
          try {
            var u = new URL(url)
            img.src = u.origin + '/favicon.ico?_=' + Date.now()
          } catch (e) {
            finish(false)
          }
        })
      })
  }

  function setVisible(el, on) {
    if (!el) return
    if (on) {
      el.hidden = false
      el.removeAttribute('aria-hidden')
    } else {
      el.hidden = true
      el.setAttribute('aria-hidden', 'true')
    }
  }

  function syncMain(fallback, down) {
    var row = fallback.closest('.links__row')
    if (!row) return
    var main = row.querySelector('[data-live-href]')
    if (!main) return
    var live = main.getAttribute('data-live-href')
    var demo = fallback.getAttribute('href')
    if (!live) return
    main.setAttribute('href', down && demo ? demo : live)
    if (down) main.setAttribute('data-using-demo', 'true')
    else main.removeAttribute('data-using-demo')
  }

  var demos = document.querySelectorAll('[data-live-check]')
  var hubs = document.querySelectorAll('[data-offline-hub]')
  if (!demos.length) return

  demos.forEach(function (el) {
    setVisible(el, false)
  })
  hubs.forEach(function (el) {
    setVisible(el, false)
  })

  var pending = demos.length
  var anyDown = false

  demos.forEach(function (el) {
    var live = el.getAttribute('data-live-check')
    if (!live) {
      // Always-on offline (e.g. SoundShoppie has no live store) — keep main href as-is
      setVisible(el, true)
      pending -= 1
      if (pending <= 0) {
        hubs.forEach(function (h) {
          setVisible(h, anyDown)
        })
      }
      return
    }

    probe(live).then(function (up) {
      var down = !up
      if (down) anyDown = true
      setVisible(el, down)
      syncMain(el, down)
      pending -= 1
      if (pending <= 0) {
        hubs.forEach(function (h) {
          setVisible(h, anyDown)
        })
      }
    })
  })
})()
