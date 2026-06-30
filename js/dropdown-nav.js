/**
 * dropdown-nav.js  —  v2  (hover / touch to open)
 *
 * Desktop: mouseenter opens, mouseleave closes (with small delay to
 *          let the user move from button into the panel).
 * Keyboard: Enter/Space on button toggles; Escape closes; Tab-out closes.
 * Touch / mobile: first tap opens, second tap follows the link if the
 *          button itself is also an <a>, or just closes the panel.
 *          The mobile menu is a separate flat list so dropdowns aren't
 *          needed there.
 */

(function () {
    'use strict';
  
    const items = document.querySelectorAll('.navbar__links .has-dropdown');
    const CLOSE_DELAY = 120; // ms — grace period so cursor can reach panel
    const timers = new Map();
  
    function open(item) {
      clearTimeout(timers.get(item));
      items.forEach(function (other) {
        if (other !== item) close(other, true);
      });
      item.classList.add('is-open');
      const btn = item.querySelector('.nav-dropdown-btn');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    }
  
    function close(item, immediate) {
      if (immediate) {
        clearTimeout(timers.get(item));
        _doClose(item);
      } else {
        timers.set(item, setTimeout(function () { _doClose(item); }, CLOSE_DELAY));
      }
    }
  
    function _doClose(item) {
      item.classList.remove('is-open');
      const btn = item.querySelector('.nav-dropdown-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  
    function closeAll(immediate) {
      items.forEach(function (item) { close(item, immediate); });
    }
  
    items.forEach(function (item) {
      const btn = item.querySelector('.nav-dropdown-btn');
  
      // ── Mouse hover ──
      item.addEventListener('mouseenter', function () { open(item); });
      item.addEventListener('mouseleave', function () { close(item, false); });
  
      // ── Keyboard ──
      if (btn) {
        btn.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.classList.contains('is-open') ? close(item, true) : open(item);
          }
        });
      }
  
      // Tab away → close
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) {
          close(item, true);
        }
      });
    });
  
    // Escape closes all
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll(true);
    });
  
  })();