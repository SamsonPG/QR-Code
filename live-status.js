/**
 * Per-product live swap on QR card:
 * - Live up → main row opens live URL (no Demo chip)
 * - Live down → main row opens offline /static demo instead
 * No global Homepage demos hub.
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

  function applyMain(main, up) {
    var live = main.getAttribute('data-live-href')
    var demo = main.getAttribute('data-demo-href')
    var desc = main.querySelector('.links__desc')
    var liveDesc = main.getAttribute('data-live-desc')
    var demoDesc = main.getAttribute('data-demo-desc') || 'Offline demo'
    if (!live || !demo) return

    if (up) {
      main.setAttribute('href', live)
      main.removeAttribute('data-using-demo')
      if (desc && liveDesc) desc.textContent = liveDesc
    } else {
      main.setAttribute('href', demo)
      main.setAttribute('data-using-demo', 'true')
      if (desc) desc.textContent = demoDesc
    }
  }

  var mains = document.querySelectorAll('.links__main[data-live-check]')
  if (!mains.length) return

  mains.forEach(function (main) {
    var liveDescEl = main.querySelector('.links__desc')
    if (liveDescEl && !main.getAttribute('data-live-desc')) {
      main.setAttribute('data-live-desc', liveDescEl.textContent.trim())
    }

    var check = main.getAttribute('data-live-check')
    // Empty check = always use offline demo as the open target
    if (!check) {
      applyMain(main, false)
      return
    }

    applyMain(main, true)
    probe(check).then(function (up) {
      applyMain(main, up)
    })
  })
})()
