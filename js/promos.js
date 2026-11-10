/* ══ iSlay Studios — promo engine ═════════════════════════════════════════
 * Reads window.ISLAY_PROMOS (js/promo-config.js) and, entirely client-side
 * so the switch happens on schedule without a redeploy:
 *   1. <head>, before first paint: picks the active promo by America/Chicago
 *      wall-clock time and sets <html> classes (promo-<id>, theme-<name>,
 *      or no-site-banner when nothing should show in the top strip).
 *   2. DOMContentLoaded: fills the top banner ticker, removes elements whose
 *      data-show-from / data-show-until window has passed, adds theme
 *      decorations.
 *   3. window load: shows the promo intro once per browser session.
 * Load synchronously in <head>, right after promo-config.js.
 */
(function () {
  'use strict';

  var html = document.documentElement;
  var PROMOS = window.ISLAY_PROMOS || [];
  var STAMP = /^\d{4}-\d\d-\d\dT\d\d:\d\d$/;

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // Current time in Chicago as 'YYYY-MM-DDTHH:MM' — sortable as a string, so
  // window checks are plain string comparisons against the config.
  function chicagoNow() {
    var forced = param('promo_now');
    if (forced && STAMP.test(forced)) return forced;
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      if (p.hour === '24') p.hour = '00'; // old engines that ignore hourCycle
      var s = p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
      if (STAMP.test(s)) return s;
    } catch (e) { /* fall through */ }
    // No Intl time-zone data: apply US Central rules by hand.
    // CDT (UTC-5) from 2nd Sunday of March 2 AM to 1st Sunday of Nov 2 AM, else CST (UTC-6).
    var t = Date.now(), y = new Date(t).getUTCFullYear();
    function sunday(month, nth) {
      var dow = new Date(Date.UTC(y, month, 1)).getUTCDay();
      return 1 + (7 - dow) % 7 + (nth - 1) * 7;
    }
    var dst = t >= Date.UTC(y, 2, sunday(2, 2), 8) && t < Date.UTC(y, 10, sunday(10, 1), 7);
    var c = new Date(t + (dst ? -5 : -6) * 3600000);
    return c.getUTCFullYear() + '-' + pad(c.getUTCMonth() + 1) + '-' + pad(c.getUTCDate()) +
      'T' + pad(c.getUTCHours()) + ':' + pad(c.getUTCMinutes());
  }

  var NOW = chicagoNow();
  function inWindow(from, until) {
    return (!from || NOW >= from) && (!until || NOW <= until);
  }

  // ── Pick the active promo (?promo= override first, then the schedule) ──
  var override = param('promo'), active = null, forced = false, i;
  if (override === 'none') {
    forced = true;
  } else if (override) {
    for (i = 0; i < PROMOS.length; i++) {
      if (PROMOS[i].alias === override || PROMOS[i].id === override) { active = PROMOS[i]; forced = true; break; }
    }
  }
  if (!forced) {
    for (i = 0; i < PROMOS.length; i++) {
      if (inWindow(PROMOS[i].start, PROMOS[i].end)) { active = PROMOS[i]; break; }
    }
  }

  window.islayPromos = { now: NOW, active: active, forced: forced, inWindow: inWindow };

  if (active) {
    html.classList.add('promo-' + active.id);
    if (active.theme) html.classList.add('theme-' + active.theme);
  }
  if (!active || !active.banner) html.classList.add('no-site-banner');

  // ── helpers ──
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  var LEAF = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1.5C6.6 5.6 4.5 9.9 4.5 13.9c0 3.7 2.8 6.8 6.5 7.3V23h2v-1.8c3.7-.5 6.5-3.6 6.5-7.3 0-4-2.1-8.3-7.5-12.4z"/><path d="M12 6v14.5" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/></svg>';
  var LEAF_COLORS = ['#C8601E', '#D9A441', '#9C4A1A', '#E08A3C', '#7A3B16'];
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ── Date-gated elements: data-show-from / data-show-until ──
  function applyDateGates() {
    var nodes = document.querySelectorAll('[data-show-from],[data-show-until]');
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      if (!inWindow(n.getAttribute('data-show-from'), n.getAttribute('data-show-until'))) {
        n.parentNode && n.parentNode.removeChild(n);
      }
    }
  }

  // ── Top banner ticker ──
  function renderBanner(cfg) {
    var banner = document.querySelector('.site-banner');
    var track = banner && banner.querySelector('.site-banner-track');
    if (!track) return;
    if (cfg.ariaLabel) banner.setAttribute('aria-label', cfg.ariaLabel);
    track.textContent = '';
    // The track scrolls by -50%, so it holds two identical halves.
    var half = [];
    while (half.length < 3) half = half.concat(cfg.pills);
    half.concat(half).forEach(function (p) {
      var pill = el('span', 'pill');
      pill.appendChild(el('em', null, p.em));
      pill.appendChild(document.createTextNode(' '));
      pill.appendChild(el('span', 'sep', cfg.sep || '✦'));
      pill.appendChild(document.createTextNode(' ' + p.text));
      track.appendChild(pill);
    });
  }

  // ── Theme decorations (CSS for each theme lives in index.html) ──
  var THEMES = {
    thanksgiving: function () {
      if (reducedMotion()) return;
      var layer = el('div', 'tg-leaves');
      layer.setAttribute('aria-hidden', 'true');
      [
        { left: 6,  dur: 19, delay: 0,  size: 18, sway: 3.2 },
        { left: 24, dur: 26, delay: 7,  size: 13, sway: 4.1 },
        { left: 47, dur: 22, delay: 13, size: 20, sway: 3.6 },
        { left: 68, dur: 28, delay: 3,  size: 14, sway: 4.6 },
        { left: 86, dur: 21, delay: 10, size: 17, sway: 3.9 },
        { left: 36, dur: 31, delay: 18, size: 12, sway: 5.0 }
      ].forEach(function (l, idx) {
        var leaf = el('div', 'tg-leaf');
        leaf.style.left = l.left + '%';
        leaf.style.animationDuration = l.dur + 's';
        leaf.style.animationDelay = l.delay + 's';
        var sway = el('div', 'tg-leaf-sway');
        sway.style.animationDuration = l.sway + 's';
        sway.style.width = sway.style.height = l.size + 'px';
        sway.style.color = LEAF_COLORS[idx % LEAF_COLORS.length];
        sway.innerHTML = LEAF;
        leaf.appendChild(sway);
        layer.appendChild(leaf);
      });
      document.body.appendChild(layer);
    }
  };

  // ── Intro overlay ──
  function buildConfetti(cfg) {
    var wrap = el('div', 'pi-confetti');
    wrap.setAttribute('aria-hidden', 'true');
    var fall = cfg.direction === 'fall';
    var count = fall ? 42 : 64;
    for (var k = 0; k < count; k++) {
      var piece = el('span', 'pi-piece ' + (fall ? 'pi-piece--fall' : 'pi-piece--rise'));
      if (cfg.leaves) {
        piece.innerHTML = LEAF;
        piece.style.color = LEAF_COLORS[k % LEAF_COLORS.length];
        var s = (14 + Math.random() * 18).toFixed(0) + 'px';
        piece.style.width = piece.style.height = s;
      } else {
        piece.textContent = cfg.glyphs[k % cfg.glyphs.length];
        piece.style.fontSize = (0.8 + Math.random() * 1.4).toFixed(2) + 'rem';
      }
      piece.style.left = (Math.random() * 100).toFixed(1) + '%';
      piece.style.setProperty('--dx', ((Math.random() * 240) - 120).toFixed(0) + 'px');
      piece.style.setProperty('--rot', (Math.floor(Math.random() * 720) + 240) * (Math.random() < 0.5 ? -1 : 1) + 'deg');
      piece.style.animationDuration = (fall ? 3200 + Math.random() * 2200 : 2200 + Math.random() * 1400).toFixed(0) + 'ms';
      piece.style.animationDelay = (Math.random() * (fall ? 1400 : 700)).toFixed(0) + 'ms';
      wrap.appendChild(piece);
    }
    return wrap;
  }

  function showIntro(cfg) {
    var reduce = reducedMotion();
    var prevFocus = document.activeElement;
    var prevOverflow = document.body.style.overflow;

    var root = el('div', 'promo-intro promo-intro--' + cfg.variant + (reduce ? ' is-static' : ''));
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'promo-intro-title');
    if (cfg.confetti && !reduce) root.appendChild(buildConfetti(cfg.confetti));

    var card = el('div', 'pi-card');
    var closeBtn = el('button', 'pi-close', '✕');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    card.appendChild(closeBtn);

    var eyebrow = el('div', 'pi-eyebrow');
    eyebrow.appendChild(el('span', 'pulse'));
    eyebrow.appendChild(document.createTextNode(cfg.eyebrow));
    card.appendChild(eyebrow);

    if (cfg.image) {
      var pic = el('picture', 'pi-avatar');
      if (cfg.image.webp) {
        var src = el('source');
        src.type = 'image/webp';
        src.srcset = cfg.image.webp;
        src.sizes = '(max-width: 480px) 120px, 150px';
        pic.appendChild(src);
      }
      var img = el('img');
      img.src = cfg.image.src;
      img.alt = cfg.image.alt;
      img.width = cfg.image.width;
      img.height = cfg.image.height;
      img.decoding = 'async';
      pic.appendChild(img);
      card.appendChild(pic);
    }
    if (cfg.hero) {
      var hero = el('div', 'pi-hero', cfg.hero);
      hero.setAttribute('aria-hidden', 'true');
      card.appendChild(hero);
    }
    var title = el('h2', 'pi-title', cfg.title);
    title.id = 'promo-intro-title';
    card.appendChild(title);
    if (cfg.subtitle) card.appendChild(el('p', 'pi-sub', cfg.subtitle));
    if (cfg.tagline) card.appendChild(el('p', 'pi-tagline', cfg.tagline));
    if (cfg.handle) {
      var h = el('a', 'pi-handle', cfg.handle.text);
      h.href = cfg.handle.href; h.target = '_blank'; h.rel = 'noopener';
      card.appendChild(h);
    }

    var ctas = el('div', 'pi-ctas'), first = null;
    (cfg.ctas || []).forEach(function (c) {
      var b;
      if (c.dismiss) {
        b = el('button', 'btn-ghost', c.label);
        b.type = 'button';
        b.addEventListener('click', function () { close(); });
      } else {
        b = el('a', c.kind === 'primary' ? 'btn-gold' : 'btn-ghost', c.label);
        b.href = c.scrollTo || c.href;
        if (c.scrollTo) {
          b.addEventListener('click', function (e) {
            e.preventDefault();
            close(document.querySelector(c.scrollTo));
          });
        }
      }
      if (!first) first = b;
      ctas.appendChild(b);
    });
    card.appendChild(ctas);

    if (cfg.note) {
      var note = el('p', 'pi-note');
      var na = el('a', null, cfg.note.text);
      na.href = cfg.note.href;
      note.appendChild(na);
      card.appendChild(note);
    }

    root.appendChild(card);
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';

    var closed = false;
    function close(target) {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      root.classList.add('is-leaving');
      setTimeout(function () { root.parentNode && root.parentNode.removeChild(root); }, reduce ? 0 : 320);
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        try { target.focus({ preventScroll: true }); } catch (e) {}
      } else if (prevFocus && prevFocus.focus) {
        try { prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = card.querySelectorAll('a[href],button:not([disabled])');
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      else if (!card.contains(document.activeElement)) { e.preventDefault(); a.focus(); }
    }
    closeBtn.addEventListener('click', function () { close(); });
    root.addEventListener('click', function (e) {
      if (e.target === root || e.target.classList.contains('pi-confetti')) close();
    });
    document.addEventListener('keydown', onKey, true);
    if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }

    // Clear finished confetti so it isn't animating behind an open dialog.
    if (!reduce) setTimeout(function () {
      var c = root.querySelector('.pi-confetti');
      c && c.parentNode && c.parentNode.removeChild(c);
    }, 7500);
  }

  function scheduleIntro(p) {
    var key = 'islay_intro_seen_' + p.id;
    if (!forced) {
      try { if (sessionStorage.getItem(key) === '1') return; } catch (e) { /* private mode: show anyway */ }
    }
    function go() {
      setTimeout(function () {
        try { sessionStorage.setItem(key, '1'); } catch (e) {}
        showIntro(p.intro);
      }, 220);
    }
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  onReady(function () {
    applyDateGates();
    if (active && active.banner) renderBanner(active.banner);
    if (active && active.theme && THEMES[active.theme]) THEMES[active.theme]();
    if (active && active.intro) scheduleIntro(active);
  });
})();
