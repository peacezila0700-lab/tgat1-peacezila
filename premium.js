/* ==========================================================================
   TGAT1 English Studio v48.21.0 — APEX 144Hz GPU-Accelerated & Pro UX Engine
   Preserves: TGAT1FX, 4-theme & font-size system, localStorage tgat1_ui_prefs_v1
   ========================================================================== */
(function(){'use strict';
var KEY='tgat1_motion_v1',D=document,W=window;
function level(){try{var v=localStorage.getItem(KEY);if(v==='full'||v==='calm'||v==='off')return v;}catch(_){}return '';}
function apply(){var v=level();if(v)D.documentElement.dataset.motion=v;else delete D.documentElement.dataset.motion;}
function reduced(){var v=level();if(v==='off')return true;if(v==='full')return false;try{return W.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(_){return false;}}
function set(v){try{if(v)localStorage.setItem(KEY,v);else localStorage.removeItem(KEY);}catch(_){}apply();D.querySelectorAll('.p-motion button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===(v||'')));});}
function controlHtml(){var v=level();var opts=[['','ตามระบบ'],['full','เต็ม'],['calm','พอดี'],['off','ปิด']];
  return '<div class="p-motion" role="group" aria-label="ระดับแอนิเมชัน">'+opts.map(function(o){return '<button type="button" data-v="'+o[0]+'" aria-pressed="'+(v===o[0])+'" onclick="TGAT1FX.setMotion(\''+o[0]+'\')">'+o[1]+'</button>';}).join('')+'</div>';}
function confetti(){if(W.TGAT1Apex&&W.TGAT1Apex.confetti){W.TGAT1Apex.confetti();return;}}
function wrapNav(){var n=W.studioNav;if(typeof n!=='function'||n.__vt)return;var w=function(){var a=arguments,self=this;if(!D.startViewTransition||reduced())return n.apply(self,a);var out;D.startViewTransition(function(){out=n.apply(self,a);});return out;};w.__vt=true;W.studioNav=w;}
apply();
W.TGAT1FX=Object.freeze({setMotion:set,motion:level,reduced:reduced,confetti:confetti,controlHtml:controlHtml});
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',wrapNav);else wrapNav();
})();

(function(){
  'use strict';
  var D = document, W = window;
  var PREF_KEY = 'tgat1_ui_prefs_v1';
  var FLUKE_KEY = 'tgat1_fluke_queue_v1';
  var DIAG_KEY = 'tgat1_error_diag_v1';
  var DEFAULTS = {
    theme: 'daylight',
    fontSize: 17,
    animSpeed: '0.25s',
    richMode: true,
    bionic: false,
    ruler: false,
    veil: false,
    sound: true,
    ambient: 'off',
    haptics: true,
    tapLookup: true,
    splitScreen: true
  };
  var THEMES = [
    { id: 'daylight', label: 'Daylight Paper' },
    { id: 'midnight', label: 'Midnight Navy' },
    { id: 'noir',     label: 'Noir Minimal' },
    { id: 'matcha',   label: 'Matcha Focus' }
  ];
  var FONTS = [
    { val: 15, label: 'เล็ก 15px' },
    { val: 17, label: 'กลาง 17px' },
    { val: 19, label: 'ใหญ่ 19px' }
  ];
  var SPEEDS = [
    { val: '0.1s',  label: 'เร็ว 0.1s' },
    { val: '0.25s', label: 'นุ่ม 0.25s' },
    { val: '0s',    label: 'ปิด 0s' }
  ];

  function loadPrefs() {
    var out = {};
    for (var k in DEFAULTS) out[k] = DEFAULTS[k];
    try {
      var raw = localStorage.getItem(PREF_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          if (p.theme === 'daylight' || p.theme === 'midnight' || p.theme === 'noir' || p.theme === 'matcha') out.theme = p.theme;
          if (p.fontSize === 15 || p.fontSize === 17 || p.fontSize === 19) out.fontSize = p.fontSize;
          if (p.animSpeed === '0.1s' || p.animSpeed === '0.25s' || p.animSpeed === '0s') out.animSpeed = p.animSpeed;
          if (typeof p.richMode === 'boolean') out.richMode = p.richMode;
          if (typeof p.bionic === 'boolean') out.bionic = p.bionic;
          if (typeof p.ruler === 'boolean') out.ruler = p.ruler;
          if (typeof p.veil === 'boolean') out.veil = p.veil;
          if (typeof p.sound === 'boolean') out.sound = p.sound;
          if (p.ambient === 'off' || p.ambient === 'rain' || p.ambient === 'clock') out.ambient = p.ambient;
          if (typeof p.haptics === 'boolean') out.haptics = p.haptics;
          if (typeof p.tapLookup === 'boolean') out.tapLookup = p.tapLookup;
          if (typeof p.splitScreen === 'boolean') out.splitScreen = p.splitScreen;
        }
      }
    } catch (_) {}
    return out;
  }

  function savePrefs(p) {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (_) {}
  }

  function updatePref(patch) {
    var p = loadPrefs();
    for (var k in patch) p[k] = patch[k];
    savePrefs(p);
    applyPrefs(p);
    return p;
  }

  function isMockExamActive() {
    try {
      return !!D.querySelector('.v17-clock-urgent, .lh-countdown, [id*="examTimer" i], [id*="mockTimer" i]');
    } catch (_) { return false; }
  }

  /* ------------------------------------------------------------------------
     MODULE 5A: Web Audio Synthesizer & Ambient Focus Sound + Haptics
     ------------------------------------------------------------------------ */
  var AudioSys = (function() {
    var ctx = null, ambNode = null, ambGain = null, clockTimer = 0;
    function getCtx() {
      try {
        if (!ctx) {
          var AC = W.AudioContext || W.webkitAudioContext;
          if (AC) ctx = new AC();
        }
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(function(){});
      } catch (_) {}
      return ctx;
    }
    function unlock() { getCtx(); }
    D.addEventListener('pointerdown', unlock, { once: true, passive: true });
    D.addEventListener('keydown', unlock, { once: true, passive: true });

    function tone(freq, dur, type, vol, delay) {
      try {
        var p = loadPrefs();
        if (!p.sound) return;
        var c = getCtx();
        if (!c) return;
        var now = c.currentTime + (delay || 0);
        var osc = c.createOscillator();
        var g = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol || 0.08, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      } catch (_) {}
    }

    function play(kind) {
      try {
        if (kind === 'click') tone(520, 0.045, 'triangle', 0.035, 0);
        else if (kind === 'correct') { tone(587.33, 0.14, 'sine', 0.09, 0); tone(880, 0.22, 'sine', 0.09, 0.09); }
        else if (kind === 'wrong') { tone(196, 0.18, 'triangle', 0.08, 0); tone(155, 0.2, 'triangle', 0.06, 0.08); }
        else if (kind === 'complete') {
          [523.25, 659.25, 783.99, 1046.5].forEach(function(f, i) { tone(f, 0.35, 'sine', 0.075, i * 0.09); });
        }
      } catch (_) {}
    }

    function stopAmbient() {
      try {
        if (ambNode) { ambNode.stop(); ambNode.disconnect(); ambNode = null; }
        if (ambGain) { ambGain.disconnect(); ambGain = null; }
        if (clockTimer) { clearInterval(clockTimer); clockTimer = 0; }
      } catch (_) {}
    }

    function setAmbient(mode) {
      stopAmbient();
      try {
        if (mode === 'off') return;
        var c = getCtx();
        if (!c) return;
        if (mode === 'rain') {
          var len = c.sampleRate * 5;
          var buf = c.createBuffer(1, len, c.sampleRate);
          var data = buf.getChannelData(0);
          var lastOut = 0;
          for (var i = 0; i < len; i++) {
            var white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 2.8;
          }
          var src = c.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          var g = c.createGain();
          g.gain.value = 0.045;
          src.connect(g);
          g.connect(c.destination);
          src.start();
          ambNode = src;
          ambGain = g;
        } else if (mode === 'clock') {
          clockTimer = setInterval(function() {
            if (!D.hidden) tone(920, 0.02, 'sine', 0.018, 0);
          }, 1000);
        }
      } catch (_) {}
    }

    function vibrate(pattern) {
      try {
        var p = loadPrefs();
        if (!p.haptics || !navigator.vibrate) return;
        navigator.vibrate(pattern);
      } catch (_) {}
    }

    return { play: play, setAmbient: setAmbient, vibrate: vibrate };
  })();

  /* ------------------------------------------------------------------------
     MODULE 1A: 144Hz GPU Particle Engine (0% Idle CPU, stops when hidden)
     ------------------------------------------------------------------------ */
  var ParticleEngine = (function() {
    var canvas = null, ctx = null, particles = [], raf = 0, lastT = 0;
    function ensureCanvas() {
      if (canvas) return canvas;
      canvas = D.createElement('canvas');
      canvas.id = 'apexParticleCanvas';
      D.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      resize();
      W.addEventListener('resize', resize, { passive: true });
      return canvas;
    }
    function resize() {
      if (!canvas) return;
      var dpr = Math.min(W.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W.innerWidth * dpr);
      canvas.height = Math.floor(W.innerHeight * dpr);
      canvas.style.width = W.innerWidth + 'px';
      canvas.style.height = W.innerHeight + 'px';
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (ctx && canvas) ctx.clearRect(0, 0, W.innerWidth, W.innerHeight);
    }
    function tick(now) {
      if (D.hidden || particles.length === 0) { stop(); return; }
      var dt = Math.min(0.05, (now - (lastT || now)) / 1000);
      lastT = now;
      ctx.clearRect(0, 0, W.innerWidth, W.innerHeight);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.age += dt;
        if (p.age >= p.life) { particles.splice(i, 1); continue; }
        var alpha = Math.max(0, 1 - p.age / p.life);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.g * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.globalAlpha = alpha;
        if (p.text) {
          ctx.font = '800 16px system-ui, sans-serif';
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.65);
        }
        ctx.restore();
      }
      if (particles.length > 0 && !D.hidden) raf = requestAnimationFrame(tick);
      else stop();
    }
    function start() {
      if (raf || D.hidden || particles.length === 0) return;
      ensureCanvas();
      lastT = performance.now();
      raf = requestAnimationFrame(tick);
    }
    D.addEventListener('visibilitychange', function() { if (D.hidden) stop(); else if (particles.length) start(); });

    function spawnXP(x, y, label) {
      try {
        var pref = loadPrefs();
        if (!pref.richMode || pref.animSpeed === '0s' || D.hidden) return;
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 24, vy: -75, g: 18, rot: 0, vr: 0, s: 12, life: 0.95, age: 0, color: '#16a34a', text: label || '+10 XP' });
        start();
      } catch (_) {}
    }
    function spawnConfetti() {
      try {
        var pref = loadPrefs();
        if (!pref.richMode || pref.animSpeed === '0s' || D.hidden) return;
        var cols = ['#38BDF8', '#22D3EE', '#2563EB', '#4ADE80', '#FBBF24', '#F472B6'];
        for (var i = 0; i < 48; i++) {
          particles.push({
            x: W.innerWidth * 0.5 + (Math.random() - 0.5) * 140,
            y: W.innerHeight * 0.32,
            vx: (Math.random() - 0.5) * 420,
            vy: -160 - Math.random() * 280,
            g: 620,
            rot: Math.random() * 6.28,
            vr: (Math.random() - 0.5) * 10,
            s: 6 + Math.random() * 6,
            life: 1.2 + Math.random() * 0.5,
            age: 0,
            color: cols[i % cols.length]
          });
        }
        start();
      } catch (_) {}
    }
    return { spawnXP: spawnXP, spawnConfetti: spawnConfetti };
  })();

  /* ------------------------------------------------------------------------
     MODULE 2: Smart Reading Tools (Bionic, Highlighter, Ruler, WPM, Peek, Veil, Scratchpad)
     ------------------------------------------------------------------------ */
  var ReadingTools = (function() {
    var passageStartMs = 0, passageWordCount = 0, currentPassageKey = '', lookupCount = 0;

    function applyBionicToNode(container, enable) {
      try {
        if (!container) return;
        if (!enable) {
          if (container.getAttribute('data-bionic') === '1' && container.__apexOrigHtml !== undefined) {
            container.innerHTML = container.__apexOrigHtml;
            container.removeAttribute('data-bionic');
          }
          return;
        }
        if (container.getAttribute('data-bionic') === '1') return;
        container.__apexOrigHtml = container.innerHTML;
        var walker = D.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        var nodes = [];
        var n;
        while ((n = walker.nextNode())) {
          if (n.nodeValue && /[A-Za-z]{2,}/.test(n.nodeValue)) {
            var pTag = n.parentNode && n.parentNode.nodeName;
            if (pTag !== 'SCRIPT' && pTag !== 'STYLE' && pTag !== 'B' && pTag !== 'BUTTON') nodes.push(n);
          }
        }
        nodes.forEach(function(tn) {
          var frag = D.createDocumentFragment();
          var parts = tn.nodeValue.split(/([A-Za-z]+)/);
          for (var i = 0; i < parts.length; i++) {
            var seg = parts[i];
            if (/^[A-Za-z]{2,}$/.test(seg)) {
              var cut = Math.max(1, Math.ceil(seg.length * 0.45));
              var span = D.createElement('span');
              span.className = 'b-word';
              var b = D.createElement('b');
              b.textContent = seg.slice(0, cut);
              span.appendChild(b);
              span.appendChild(D.createTextNode(seg.slice(cut)));
              frag.appendChild(span);
            } else if (seg) {
              frag.appendChild(D.createTextNode(seg));
            }
          }
          if (tn.parentNode) tn.parentNode.replaceChild(frag, tn);
        });
        container.setAttribute('data-bionic', '1');
      } catch (_) {}
    }

    function syncPassages() {
      try {
        var pref = loadPrefs();
        var panels = D.querySelectorAll('.v382-passage-panel');
        var peekBtn = D.getElementById('apexPeekBtn');
        if (peekBtn) peekBtn.style.display = panels.length ? 'inline-flex' : 'none';

        panels.forEach(function(panel) {
          var heading = panel.querySelector('.v382-passage-heading');
          if (heading && !heading.querySelector('.apex-split-toggle')) {
            var btn = D.createElement('button');
            btn.type = 'button';
            btn.className = 'apex-split-toggle';
            btn.textContent = 'สลับ 1/2 คอลัมน์';
            btn.addEventListener('click', function() {
              var layout = panel.closest('.v382-reading-layout');
              if (layout) layout.classList.toggle('apex-split-off');
              AudioSys.play('click');
            });
            heading.appendChild(btn);
          }

          var textKey = (panel.textContent || '').slice(0, 80);
          if (textKey !== currentPassageKey) {
            currentPassageKey = textKey;
            passageStartMs = Date.now();
            passageWordCount = (panel.textContent || '').trim().split(/\s+/).length;
            lookupCount = 0;
          }

          var paras = panel.querySelectorAll('p');
          paras.forEach(function(pEl) { applyBionicToNode(pEl, pref.bionic); });
        });
      } catch (_) {}
    }

    function recordFirstAnswerWPM() {
      try {
        if (!passageStartMs || passageWordCount < 25) return;
        var elapsedMin = Math.max(0.08, (Date.now() - passageStartMs) / 60000);
        var wpm = Math.round(passageWordCount / elapsedMin);
        passageStartMs = 0;
        var heading = D.querySelector('.v382-passage-heading');
        if (!heading) return;
        var badge = heading.querySelector('.apex-wpm-badge');
        if (!badge) {
          badge = D.createElement('span');
          badge.className = 'apex-wpm-badge';
          heading.appendChild(badge);
        }
        var status = wpm >= 180 && wpm <= 260 ? '🎯 ตามเกณฑ์ TGAT1' : (wpm < 180 ? '🐢 เร่งอีกนิด (เกณฑ์ 180–220)' : '⚡ อ่านเร็วมาก');
        badge.textContent = wpm + ' WPM · ' + status;
      } catch (_) {}
    }

    /* Smart Touch Highlighter (safe across <b> tags, never uses surroundContents) */
    function initHighlighter() {
      try {
        var bar = D.createElement('div');
        bar.id = 'apexHlBar';
        bar.innerHTML =
          '<button type="button" data-hl="apex-hl-yellow" style="background:#fde047" title="ไฮไลต์เหลือง"></button>' +
          '<button type="button" data-hl="apex-hl-pink" style="background:#f9a8d4" title="ไฮไลต์ชมพู"></button>' +
          '<button type="button" data-hl="apex-hl-mint" style="background:#6ee7b7" title="ไฮไลต์เขียวมิ้นต์"></button>' +
          '<button type="button" data-hl="clear" style="background:#fff;color:#111" title="ล้างไฮไลต์">✕</button>';
        D.body.appendChild(bar);

        function showBar() {
          var sel = W.getSelection();
          if (!sel || sel.isCollapsed || !sel.rangeCount) { bar.style.display = 'none'; return; }
          var range = sel.getRangeAt(0);
          var anc = range.commonAncestorContainer;
          var el = anc.nodeType === 1 ? anc : anc.parentElement;
          if (!el || !el.closest('.v382-passage-panel')) { bar.style.display = 'none'; return; }
          var rect = range.getBoundingClientRect();
          bar.style.display = 'flex';
          bar.style.left = Math.max(12, Math.min(W.innerWidth - 150, rect.left + rect.width / 2 - 68)) + 'px';
          bar.style.top = Math.max(12, rect.top - 46) + 'px';
        }

        D.addEventListener('mouseup', showBar);
        D.addEventListener('touchend', function() { setTimeout(showBar, 120); }, { passive: true });

        bar.addEventListener('click', function(e) {
          var btn = e.target.closest('button');
          if (!btn) return;
          var cls = btn.getAttribute('data-hl');
          var panel = D.querySelector('.v382-passage-panel');
          if (cls === 'clear' && panel) {
            panel.querySelectorAll('.apex-hl-yellow,.apex-hl-pink,.apex-hl-mint').forEach(function(x) {
              x.classList.remove('apex-hl-yellow', 'apex-hl-pink', 'apex-hl-mint');
            });
            bar.style.display = 'none';
            return;
          }
          var sel = W.getSelection();
          if (!sel || !sel.rangeCount) return;
          var range = sel.getRangeAt(0);
          if (panel) {
            var bwords = panel.querySelectorAll('.b-word');
            var matched = false;
            bwords.forEach(function(bw) {
              if (range.intersectsNode(bw)) {
                bw.classList.remove('apex-hl-yellow', 'apex-hl-pink', 'apex-hl-mint');
                bw.classList.add(cls);
                matched = true;
              }
            });
            if (!matched) {
              var walker = D.createTreeWalker(panel, NodeFilter.SHOW_TEXT, null, false);
              var tNodes = [], tn;
              while ((tn = walker.nextNode())) {
                if (range.intersectsNode(tn) && tn.nodeValue.trim()) tNodes.push(tn);
              }
              tNodes.forEach(function(node) {
                var sp = D.createElement('span');
                sp.className = cls;
                node.parentNode.insertBefore(sp, node);
                sp.appendChild(node);
              });
            }
          }
          sel.removeAllRanges();
          bar.style.display = 'none';
          AudioSys.play('click');
        });
      } catch (_) {}
    }

    /* Focus Reading Ruler & Active Recall Veil */
    function initRulerAndVeil() {
      try {
        D.addEventListener('pointerdown', function(e) {
          var pref = loadPrefs();
          if (pref.ruler) {
            var p = e.target.closest('.v382-passage-panel p, .v382-passage-panel li');
            if (p) {
              D.querySelectorAll('.apex-ruler-focus').forEach(function(x) { x.classList.remove('apex-ruler-focus'); });
              p.classList.add('apex-ruler-focus');
            }
          }
          if (pref.veil) {
            var vEl = e.target.closest('.st-flash-th, .st-poly-translation, .st-language-example-th, .v12-explain, .vault-feedback-detail, .v382-feedback');
            if (vEl) vEl.classList.toggle('apex-veil-open');
          }
        }, { passive: true });
      } catch (_) {}
    }

    /* Hold-to-Peek Passage */
    function initHoldToPeek() {
      try {
        var btn = D.createElement('button');
        btn.id = 'apexPeekBtn';
        btn.type = 'button';
        btn.textContent = '👁 กดค้างเพื่อดูบทอ่าน';
        D.body.appendChild(btn);

        var overlay = D.createElement('div');
        overlay.id = 'apexPeekOverlay';
        overlay.innerHTML = '<div id="apexPeekCard"></div>';
        D.body.appendChild(overlay);

        function openPeek(e) {
          e.preventDefault();
          var panel = D.querySelector('.v382-passage-panel');
          if (!panel) return;
          D.getElementById('apexPeekCard').innerHTML = panel.innerHTML;
          overlay.classList.add('show');
          AudioSys.vibrate(8);
        }
        function closePeek() { overlay.classList.remove('show'); }

        btn.addEventListener('pointerdown', openPeek);
        W.addEventListener('pointerup', closePeek);
        W.addEventListener('pointercancel', closePeek);
      } catch (_) {}
    }

    /* Smart Tap-to-Lookup (max 5 per passage, disabled in Mock Exam) */
    function initTapToLookup() {
      try {
        var card = D.createElement('div');
        card.id = 'apexLookupCard';
        D.body.appendChild(card);

        function findWord(word) {
          var clean = String(word || '').toLowerCase().replace(/[^a-z-]/g, '');
          if (clean.length < 2) return null;
          var list = (W.studio && W.studio.words) || (W.__TGAT1_DATA && W.__TGAT1_DATA.studio && W.__TGAT1_DATA.studio.words) || [];
          for (var i = 0; i < list.length; i++) {
            var w = (list[i].w || '').toLowerCase();
            if (w === clean || (clean.length > 4 && (w === clean.replace(/s$|ed$|ing$/, '')))) return list[i];
          }
          return null;
        }

        D.addEventListener('click', function(e) {
          if (!e.target.closest('#apexLookupCard')) card.style.display = 'none';
          var pref = loadPrefs();
          if (!pref.tapLookup || isMockExamActive()) return;
          var panel = e.target.closest('.v382-passage-panel');
          if (!panel) return;
          var sel = W.getSelection();
          if (sel && !sel.isCollapsed) return;

          var wordText = '';
          var bw = e.target.closest('.b-word');
          if (bw) wordText = bw.textContent;
          else if (D.caretRangeFromPoint) {
            var r = D.caretRangeFromPoint(e.clientX, e.clientY);
            if (r && r.startContainer && r.startContainer.nodeType === 3) {
              var s = r.startContainer.nodeValue, off = r.startOffset;
              var l = s.slice(0, off).search(/[A-Za-z]+$/);
              var rt = s.slice(off).search(/[^A-Za-z]/);
              wordText = s.slice(l >= 0 ? l : off, rt >= 0 ? off + rt : s.length);
            }
          }
          if (!wordText || wordText.length < 2) return;
          var entry = findWord(wordText);
          if (!entry) return;
          if (lookupCount >= 5) {
            card.innerHTML = '<b>ครบโควตา 5 คำต่อบทความแล้ว</b><br><small>ฝึกเดาบริบทต่อเพื่อความแม่นยำในห้องสอบ</small>';
          } else {
            lookupCount++;
            card.innerHTML = '<b>' + entry.w + '</b> <small>(' + (entry.pos || '') + ') ' + (entry.ipa || '') + '</small><div style="margin-top:4px">' + (entry.th || '') + '</div><small style="opacity:.7">เปิดดูแล้ว ' + lookupCount + '/5 คำ</small>';
          }
          card.style.display = 'block';
          card.style.left = Math.max(12, Math.min(W.innerWidth - 312, e.clientX - 40)) + 'px';
          card.style.top = Math.max(12, Math.min(W.innerHeight - 130, e.clientY + 14)) + 'px';
        });
      } catch (_) {}
    }

    /* Translucent Reading Scratchpad (devicePixelRatio + touch-action: none) */
    var scratchBackdrop = null;
    function openScratchpad() {
      try {
        if (!scratchBackdrop) {
          scratchBackdrop = D.createElement('div');
          scratchBackdrop.className = 'apex-modal-backdrop';
          scratchBackdrop.innerHTML =
            '<div class="apex-modal-card">' +
            '<div class="apex-hub-header"><b>📝 กระดาษทดโปร่งแสง (Scratchpad)</b><button type="button" class="apex-switch" id="apexScratchClose">ปิด</button></div>' +
            '<canvas id="apexScratchCanvas"></canvas>' +
            '<div style="display:flex;gap:8px;margin-top:8px;align-items:center">' +
            '<button type="button" class="apex-switch" id="apexScratchClear">ล้างกระดาน</button>' +
            '<span style="font-size:12px;opacity:.7">รองรับปากกา/นิ้วบน Xiaomi Pad 6</span>' +
            '</div>' +
            '<textarea id="apexScratchNotes" placeholder="จดคีย์เวิร์ด / Main Idea สั้นๆ ที่นี่..."></textarea>' +
            '</div>';
          D.body.appendChild(scratchBackdrop);

          var cv = D.getElementById('apexScratchCanvas');
          var cx = cv.getContext('2d');
          var drawing = false;
          function fitCanvas() {
            var dpr = Math.min(W.devicePixelRatio || 1, 2);
            var rect = cv.getBoundingClientRect();
            cv.width = Math.max(200, Math.floor(rect.width * dpr));
            cv.height = Math.max(160, Math.floor(rect.height * dpr));
            cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            cx.lineWidth = 2.2;
            cx.lineCap = 'round';
            cx.strokeStyle = getComputedStyle(D.documentElement).getPropertyValue('--acc') || '#2563eb';
          }
          cv.addEventListener('pointerdown', function(e) {
            drawing = true;
            var r = cv.getBoundingClientRect();
            cx.beginPath();
            cx.moveTo(e.clientX - r.left, e.clientY - r.top);
          });
          cv.addEventListener('pointermove', function(e) {
            if (!drawing) return;
            var r = cv.getBoundingClientRect();
            cx.lineTo(e.clientX - r.left, e.clientY - r.top);
            cx.stroke();
          });
          W.addEventListener('pointerup', function() { drawing = false; });
          D.getElementById('apexScratchClear').addEventListener('click', function() { cx.clearRect(0, 0, cv.width, cv.height); });
          D.getElementById('apexScratchClose').addEventListener('click', function() { scratchBackdrop.classList.remove('open'); });
          scratchBackdrop.addEventListener('click', function(e) { if (e.target === scratchBackdrop) scratchBackdrop.classList.remove('open'); });
          scratchBackdrop.__fit = fitCanvas;
        }
        scratchBackdrop.classList.add('open');
        setTimeout(function() { if (scratchBackdrop.__fit) scratchBackdrop.__fit(); }, 30);
      } catch (_) {}
    }

    return {
      syncPassages: syncPassages,
      recordFirstAnswerWPM: recordFirstAnswerWPM,
      initHighlighter: initHighlighter,
      initRulerAndVeil: initRulerAndVeil,
      initHoldToPeek: initHoldToPeek,
      initTapToLookup: initTapToLookup,
      openScratchpad: openScratchpad
    };
  })();

  /* ------------------------------------------------------------------------
     MODULE 3 & 5B: Exam Psychology, Fluke Queue, Pacing Coach, Diagnosis & Gamification
     ------------------------------------------------------------------------ */
  var ExamEngine = (function() {
    var combo = 0, wrongStreak = 0, comebackReady = false;
    var timerMaxSec = {};

    function loadFlukes() {
      try { return JSON.parse(localStorage.getItem(FLUKE_KEY) || '[]'); } catch (_) { return []; }
    }
    function saveFlukes(arr) {
      try { localStorage.setItem(FLUKE_KEY, JSON.stringify(arr.slice(-80))); } catch (_) {}
    }
    function recordDiag(ok) {
      try {
        var d = JSON.parse(localStorage.getItem(DIAG_KEY) || '{"total":0,"ok":0,"earlyOk":0,"earlyTotal":0,"lateOk":0,"lateTotal":0}');
        d.total++;
        if (ok) d.ok++;
        if (d.total % 10 < 5) { d.earlyTotal++; if (ok) d.earlyOk++; }
        else { d.lateTotal++; if (ok) d.lateOk++; }
        localStorage.setItem(DIAG_KEY, JSON.stringify(d));
      } catch (_) {}
    }

    function enhanceChoiceGroups(root) {
      try {
        var containers = (root || D).querySelectorAll('.lh-opts, .opts, .st-options, .v14-options, .v382-answer-list');
        containers.forEach(function(box) {
          var items = box.querySelectorAll(':scope > .opt, :scope > .lh-opt, :scope > .st-option, :scope > .v14-option, :scope > .v382-answer, :scope > button');
          if (items.length === 4) {
            var allShort = true;
            for (var i = 0; i < 4; i++) {
              if ((items[i].textContent || '').trim().replace(/\s+/g, ' ').length >= 32) { allShort = false; break; }
            }
            box.classList.toggle('p-opts-2col', allShort);
            box.classList.toggle('p-opts-1col', !allShort);
          }
          items.forEach(function(opt) {
            if (opt.querySelector('.apex-strike-btn')) return;
            opt.classList.add('apex-opt-wrap');
            var sbtn = D.createElement('button');
            sbtn.type = 'button';
            sbtn.className = 'apex-strike-btn';
            sbtn.title = 'ตัดช้อยส์นี้ทิ้ง';
            sbtn.setAttribute('aria-label', 'ตัดช้อยส์นี้ทิ้ง');
            sbtn.textContent = '✕';
            sbtn.addEventListener('click', function(e) {
              e.stopPropagation();
              e.preventDefault();
              opt.classList.toggle('apex-struck');
              AudioSys.play('click');
              AudioSys.vibrate(8);
            });
            opt.appendChild(sbtn);
          });
        });
      } catch (_) {}
    }

    function parseClockSeconds(text) {
      var m = String(text || '').match(/(\d{1,2}):(\d{2})/);
      return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
    }

    function enhanceTimers(root) {
      try {
        var nodes = (root || D).querySelectorAll('.v17-clock-urgent, .lh-countdown, [id*="timer" i], [class*="timer" i], [id*="clock" i]');
        nodes.forEach(function(el) {
          if (el.classList.contains('p-timer-wrap') || el.classList.contains('p-timer-fill') || el.classList.contains('apex-pacing-badge')) return;
          var sec = parseClockSeconds(el.textContent);
          if (sec === null || sec <= 0) return;
          var key = el.id || el.className || 'exam_timer';
          if (!timerMaxSec[key] || sec > timerMaxSec[key]) timerMaxSec[key] = sec;
          var ratio = Math.max(0, Math.min(1, sec / timerMaxSec[key]));
          var wrap = el.nextElementSibling;
          if (!wrap || !wrap.classList.contains('p-timer-wrap')) {
            wrap = D.createElement('div');
            wrap.className = 'p-timer-wrap';
            wrap.innerHTML = '<div class="p-timer-fill"></div>';
            if (el.parentNode) el.parentNode.insertBefore(wrap, el.nextSibling);
          }
          var fill = wrap.firstElementChild;
          if (fill) {
            fill.style.width = (ratio * 100).toFixed(1) + '%';
            fill.setAttribute('data-state', ratio <= 0.18 ? 'danger' : (ratio <= 0.42 ? 'warn' : 'ok'));
          }
          var pace = wrap.nextElementSibling;
          if (!pace || !pace.classList.contains('apex-pacing-badge')) {
            pace = D.createElement('span');
            pace.className = 'apex-pacing-badge';
            if (wrap.parentNode) wrap.parentNode.insertBefore(pace, wrap.nextSibling);
          }
          var minsLeft = Math.ceil(sec / 60);
          pace.className = 'apex-pacing-badge' + (ratio <= 0.18 ? ' danger' : (ratio <= 0.42 ? ' warn' : ''));
          pace.textContent = ratio > 0.42 ? ('⏱ เหลือ ' + minsLeft + ' นาที · จังหวะดี') : (ratio > 0.18 ? '⚡ ควรเร่งอีกนิด (เกณฑ์ 1 นาที/ข้อ)' : '🔥 ช่วงโค้งสุดท้าย');
        });
      } catch (_) {}
    }

    function enhanceFeedback(root) {
      try {
        var fbs = (root || D).querySelectorAll('.fb, .lh-fb, .v382-feedback, .vault-feedback');
        fbs.forEach(function(fb) {
          if (fb.getAttribute('data-apex-fb') === '1') return;
          fb.setAttribute('data-apex-fb', '1');
          ReadingTools.recordFirstAnswerWPM();
          var isGood = fb.classList.contains('good') || fb.classList.contains('ok') || fb.classList.contains('correct') || /ถูกต้อง|เก่งมาก|Correct/i.test(fb.textContent || '');
          recordDiag(isGood);
          var card = fb.closest('.st-card, .lh-q, .vault-qcard') || fb;

          if (isGood) {
            wrongStreak = 0;
            combo++;
            if (!isMockExamActive()) {
              card.classList.add('apex-correct-glow');
              card.addEventListener('animationend', function() { card.classList.remove('apex-correct-glow'); }, { once: true });
              var r = card.getBoundingClientRect();
              var bonusLabel = comebackReady ? '+20 XP Comeback!' : '+10 XP';
              comebackReady = false;
              ParticleEngine.spawnXP(r.left + r.width * 0.5, Math.max(80, r.top + 30), bonusLabel);
              updateComboPill(combo);
            }
            AudioSys.play('correct');
            AudioSys.vibrate([12, 35, 18]);

            if (!fb.querySelector('.apex-fluke-btn')) {
              var fbtn = D.createElement('button');
              fbtn.type = 'button';
              fbtn.className = 'apex-fluke-btn';
              fbtn.textContent = '🎲 เดาถูก / ไม่ชัวร์';
              fbtn.addEventListener('click', function() {
                var qText = (card.querySelector('h2, h3, .lh-q-stem, p') || {}).textContent || 'ข้อฝึก TGAT1';
                var list = loadFlukes();
                list.push({ q: qText.trim().slice(0, 180), note: (fb.textContent || '').trim().slice(0, 220), ts: Date.now() });
                saveFlukes(list);
                fbtn.classList.add('tagged');
                fbtn.textContent = '✓ บันทึกลงคิวทบทวนฟลุ๊คแล้ว';
                AudioSys.play('click');
              });
              fb.appendChild(fbtn);
            }
          } else {
            combo = 0;
            wrongStreak++;
            updateComboPill(0);
            card.classList.add('apex-wrong-shake');
            card.addEventListener('animationend', function() { card.classList.remove('apex-wrong-shake'); }, { once: true });
            AudioSys.play('wrong');
            AudioSys.vibrate([24]);
            if (wrongStreak >= 2) {
              comebackReady = true;
              showFocusReset();
            }
          }
        });

        /* Session completion celebration */
        var results = (root || D).querySelectorAll('.v382-quiz-result, .v17-result-grid');
        results.forEach(function(res) {
          if (res.getAttribute('data-apex-res') === '1') return;
          res.setAttribute('data-apex-res', '1');
          ParticleEngine.spawnConfetti();
          AudioSys.play('complete');
          if (!res.querySelector('.apex-3d-badge')) {
            var badge = D.createElement('div');
            badge.className = 'apex-3d-badge';
            badge.innerHTML = '<div style="font-size:36px">🏆</div><b>TGAT1 Milestone</b><small>ลากนิ้วเพื่อหมุนเหรียญ 3D</small>';
            badge.addEventListener('pointermove', function(e) {
              var r = badge.getBoundingClientRect();
              var rx = ((e.clientY - r.top) / r.height - 0.5) * -28;
              var ry = ((e.clientX - r.left) / r.width - 0.5) * 28;
              badge.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(1) + 'deg) rotateY(' + ry.toFixed(1) + 'deg) scale(1.04)';
            });
            badge.addEventListener('pointerleave', function() { badge.style.transform = ''; });
            res.appendChild(badge);
          }
        });
      } catch (_) {}
    }

    function updateComboPill(c) {
      var pill = D.getElementById('apexComboPill');
      if (!pill) {
        pill = D.createElement('div');
        pill.id = 'apexComboPill';
        D.body.appendChild(pill);
      }
      if (c >= 2 && !isMockExamActive()) {
        pill.innerHTML = '<span class="flame">🔥</span> Combo x' + c;
        pill.style.display = 'inline-flex';
      } else {
        pill.style.display = 'none';
      }
    }

    function showFocusReset() {
      var el = D.getElementById('apexFocusReset');
      if (!el) {
        el = D.createElement('div');
        el.id = 'apexFocusReset';
        D.body.appendChild(el);
      }
      el.textContent = '✨ Focus Reset — หายใจเข้าลึกๆ ข้อถัดไปรับโบนัสกู้จังหวะ!';
      el.style.display = 'block';
      setTimeout(function() { el.style.display = 'none'; }, 3500);
    }

    return {
      enhanceChoiceGroups: enhanceChoiceGroups,
      enhanceTimers: enhanceTimers,
      enhanceFeedback: enhanceFeedback,
      loadFlukes: loadFlukes,
      saveFlukes: saveFlukes
    };
  })();

  /* ------------------------------------------------------------------------
     MODULE 1B: Thumb-Zone Radial Trigger, Zen Mode & Bluetooth Keyboard Shortcuts
     ------------------------------------------------------------------------ */
  function initRadialAndZen() {
    try {
      var exitBtn = D.createElement('button');
      exitBtn.id = 'apexZenExit';
      exitBtn.type = 'button';
      exitBtn.textContent = '✕ ออกจากโหมด Zen';
      exitBtn.addEventListener('click', toggleZen);
      D.body.appendChild(exitBtn);

      var wrap = D.createElement('div');
      wrap.id = 'apexRadialWrap';
      wrap.style.right = '16px';
      wrap.style.bottom = '86px';

      var actions = [
        { id: 'bionic', icon: '𝐁', title: 'Bionic Reading' },
        { id: 'ruler',  icon: '📏', title: 'ไม้บรรทัดหรี่แสง' },
        { id: 'scratch',icon: '📝', title: 'กระดาษทดใส' },
        { id: 'veil',   icon: '🙈', title: 'ม่านเบลอคำแปล' },
        { id: 'zen',    icon: '🧘', title: 'โหมด Zen เต็มจอ' }
      ];

      actions.forEach(function(a) {
        var b = D.createElement('button');
        b.type = 'button';
        b.className = 'apex-radial-item';
        b.setAttribute('data-radial', a.id);
        b.title = a.title;
        b.setAttribute('aria-label', a.title);
        b.textContent = a.icon;
        b.addEventListener('click', function(e) {
          e.stopPropagation();
          var p = loadPrefs();
          if (a.id === 'bionic') updatePref({ bionic: !p.bionic });
          else if (a.id === 'ruler') updatePref({ ruler: !p.ruler });
          else if (a.id === 'veil') updatePref({ veil: !p.veil });
          else if (a.id === 'scratch') ReadingTools.openScratchpad();
          else if (a.id === 'zen') toggleZen();
          AudioSys.play('click');
          AudioSys.vibrate(8);
          wrap.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        });
        wrap.appendChild(b);
      });

      var trigger = D.createElement('button');
      trigger.id = 'apexRadialBtn';
      trigger.type = 'button';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', 'เมนูลัดนิ้วโป้ง');
      trigger.textContent = '✦';
      wrap.appendChild(trigger);
      D.body.appendChild(wrap);

      function layoutFan() {
        var r = wrap.getBoundingClientRect();
        var onRight = (r.left + r.width / 2) > W.innerWidth / 2;
        var items = wrap.querySelectorAll('.apex-radial-item');
        var radius = 78;
        var startDeg = onRight ? 105 : -75;
        var stepDeg = onRight ? 36 : 36;
        items.forEach(function(it, idx) {
          if (!wrap.classList.contains('open')) {
            it.style.transform = 'translate3d(0,0,0) scale(0.5)';
            return;
          }
          var rad = (startDeg + idx * stepDeg) * Math.PI / 180;
          var dx = Math.cos(rad) * radius;
          var dy = Math.sin(rad) * radius;
          it.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) scale(1)';
        });
      }

      /* Drag left/right edge with >8px threshold */
      var startX = 0, startY = 0, dragged = false, pointerActive = false;
      trigger.addEventListener('pointerdown', function(e) {
        pointerActive = true;
        dragged = false;
        startX = e.clientX;
        startY = e.clientY;
        trigger.setPointerCapture(e.pointerId);
      });
      trigger.addEventListener('pointermove', function(e) {
        if (!pointerActive) return;
        if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) {
          dragged = true;
          wrap.classList.remove('open');
          layoutFan();
          var y = Math.max(70, Math.min(W.innerHeight - 130, e.clientY - 25));
          wrap.style.top = y + 'px';
          wrap.style.bottom = 'auto';
          if (e.clientX < W.innerWidth / 2) { wrap.style.left = '14px'; wrap.style.right = 'auto'; }
          else { wrap.style.right = '14px'; wrap.style.left = 'auto'; }
        }
      });
      trigger.addEventListener('pointerup', function() {
        if (!pointerActive) return;
        pointerActive = false;
        if (!dragged) {
          var open = !wrap.classList.contains('open');
          wrap.classList.toggle('open', open);
          trigger.setAttribute('aria-expanded', String(open));
          layoutFan();
          AudioSys.play('click');
          AudioSys.vibrate(8);
        }
      });
    } catch (_) {}
  }

  function toggleZen() {
    var root = D.documentElement;
    var on = root.getAttribute('data-apex-zen') === '1';
    if (on) root.removeAttribute('data-apex-zen');
    else root.setAttribute('data-apex-zen', '1');
  }

  function initKeyboardShortcuts() {
    try {
      D.addEventListener('keydown', function(e) {
        var tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
        var k = e.key.toLowerCase();
        if (k === 'b') { updatePref({ bionic: !loadPrefs().bionic }); return; }
        if (k === 'z') { toggleZen(); return; }
        var map = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
        if (k in map && k !== 'b') {
          var opts = D.querySelectorAll('#app .v382-answer, #app .lh-opt, #app .opt, #app .vault-option');
          if (opts[map[k]]) { opts[map[k]].click(); AudioSys.play('click'); }
        } else if (e.key === ' ' || e.key === 'ArrowRight') {
          var next = D.querySelector('#app button[onclick*="next" i], #app .v382-next-btn, #app .lh-next');
          if (next) { e.preventDefault(); next.click(); }
        }
      });
    } catch (_) {}
  }

  /* ------------------------------------------------------------------------
     MODULE 4: Action Hub Settings Popover (4 Category Cards + Master Switch)
     ------------------------------------------------------------------------ */
  var activeHubCat = 'theme';
  function mountActionHub() {
    try {
      var actions = D.querySelector('.topbar-actions');
      if (!actions || D.getElementById('tgat1UiBtn')) return;

      var btn = D.createElement('button');
      btn.id = 'tgat1UiBtn';
      btn.type = 'button';
      btn.className = 'p-ui-btn';
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = '<span aria-hidden="true">✦</span><span>Action Hub</span>';
      actions.insertBefore(btn, actions.firstChild);

      var modal = D.createElement('div');
      modal.id = 'apexHubModal';
      modal.className = 'apex-modal-backdrop';
      modal.innerHTML =
        '<div class="apex-modal-card">' +
        '<div class="apex-hub-header"><b>✦ TGAT1 Action Hub</b><button type="button" class="apex-switch" id="apexHubClose">ปิด</button></div>' +
        '<div class="apex-hub-master"><div><b>โหมดจัดเต็ม / โหมดอ่านนิ่ง</b><div style="font-size:12px;opacity:.72">สลับเอฟเฟกต์ทั้งหมดในปุ่มเดียว</div></div><button type="button" class="apex-switch" id="apexMasterSwitch"></button></div>' +
        '<div class="apex-hub-cats" role="tablist">' +
        '<button type="button" class="apex-hub-cat" data-cat="theme">🎨 ธีมสี & ตัวอักษร</button>' +
        '<button type="button" class="apex-hub-cat" data-cat="read">📖 เครื่องมืออ่าน & แท็บเล็ต</button>' +
        '<button type="button" class="apex-hub-cat" data-cat="fx">🔊 แอนิเมชัน เสียง & สั่น</button>' +
        '<button type="button" class="apex-hub-cat" data-cat="diag">🎯 ข้อฟลุ๊ค & วิเคราะห์จุดอ่อน</button>' +
        '</div>' +
        '<div id="apexHubBody"></div>' +
        '</div>';
      D.body.appendChild(modal);

      function renderHub() {
        var p = loadPrefs();
        var ms = D.getElementById('apexMasterSwitch');
        if (ms) {
          ms.setAttribute('aria-pressed', String(p.richMode));
          ms.textContent = p.richMode ? 'โหมดจัดเต็ม (Rich)' : 'โหมดอ่านนิ่ง (Minimal)';
        }
        modal.querySelectorAll('.apex-hub-cat').forEach(function(c) {
          c.setAttribute('aria-selected', String(c.getAttribute('data-cat') === activeHubCat));
        });
        var body = D.getElementById('apexHubBody');
        if (!body) return;

        if (activeHubCat === 'theme') {
          body.innerHTML =
            '<div class="p-ui-sec"><span class="p-ui-label">ธีมสี (4 Themes)</span><div class="p-ui-grid">' +
            THEMES.map(function(t) { return '<button type="button" class="p-ui-chip" data-pref-theme="' + t.id + '" aria-pressed="' + (p.theme === t.id) + '">' + t.label + '</button>'; }).join('') +
            '</div></div>' +
            '<div class="p-ui-sec"><span class="p-ui-label">ขนาดตัวอักษร</span><div class="p-ui-row">' +
            FONTS.map(function(f) { return '<button type="button" class="p-ui-chip" data-pref-font="' + f.val + '" aria-pressed="' + (p.fontSize === f.val) + '">' + f.label + '</button>'; }).join('') +
            '</div></div>';
        } else if (activeHubCat === 'read') {
          body.innerHTML =
            rowSwitch('Bionic Reading (เน้นครึ่งหน้าคำ)', 'bionic', p.bionic) +
            rowSwitch('ไม้บรรทัดหรี่แสง (Focus Ruler)', 'ruler', p.ruler) +
            rowSwitch('ม่านเบลอคำแปล (Active Recall Veil)', 'veil', p.veil) +
            rowSwitch('แตะคำศัพท์เพื่อแปล (จำกัด 5 คำ/เรื่อง)', 'tapLookup', p.tapLookup) +
            rowSwitch('Split-Screen ล็อกบทอ่านบนแท็บเล็ต', 'splitScreen', p.splitScreen);
        } else if (activeHubCat === 'fx') {
          body.innerHTML =
            '<div class="p-ui-sec"><span class="p-ui-label">ความเร็วแอนิเมชัน</span><div class="p-ui-row">' +
            SPEEDS.map(function(s) { return '<button type="button" class="p-ui-chip" data-pref-speed="' + s.val + '" aria-pressed="' + (p.animSpeed === s.val) + '">' + s.label + '</button>'; }).join('') +
            '</div></div>' +
            rowSwitch('เสียงสังเคราะห์ (Web Audio)', 'sound', p.sound) +
            rowSwitch('แรงสั่นสะท้อน (Micro-Haptics)', 'haptics', p.haptics) +
            '<div class="apex-toggle-row"><span>เสียงโฟกัส (Ambient)</span><div style="display:flex;gap:6px">' +
            ['off', 'rain', 'clock'].map(function(m) {
              var lbl = m === 'off' ? 'ปิด' : (m === 'rain' ? '🌧 ฝนตก' : '⏱ นาฬิกา');
              return '<button type="button" class="apex-switch" data-pref-amb="' + m + '" aria-pressed="' + (p.ambient === m) + '">' + lbl + '</button>';
            }).join('') + '</div></div>';
        } else {
          var flukes = ExamEngine.loadFlukes();
          var diag = { total: 0, ok: 0, earlyOk: 0, earlyTotal: 0, lateOk: 0, lateTotal: 0 };
          try { diag = JSON.parse(localStorage.getItem(DIAG_KEY) || JSON.stringify(diag)); } catch (_) {}
          var ePct = diag.earlyTotal ? Math.round(diag.earlyOk * 100 / diag.earlyTotal) : 0;
          var lPct = diag.lateTotal ? Math.round(diag.lateOk * 100 / diag.lateTotal) : 0;
          body.innerHTML =
            '<div class="p-ui-sec" style="padding:12px;border-radius:14px;background:var(--p-surface-2)">' +
            '<b>📊 Error Pattern Diagnosis</b>' +
            '<div style="font-size:13px;margin-top:6px">ทำไปแล้ว <b>' + diag.total + '</b> ข้อ · แม่นยำช่วงต้น <b>' + ePct + '%</b> vs ช่วงท้าย <b>' + lPct + '%</b></div>' +
            '</div>' +
            '<div class="p-ui-sec"><b>🎲 คิวข้อที่แท็ก "ฟลุ๊ค / ไม่ชัวร์" (' + flukes.length + ' ข้อ)</b>' +
            (flukes.length ? flukes.slice(-5).reverse().map(function(f) {
              return '<div style="margin-top:8px;padding:8px 10px;border-radius:10px;border:1px solid var(--apex-border);font-size:12.5px"><b>' + f.q + '</b><div style="opacity:.75;margin-top:3px">' + f.note + '</div></div>';
            }).join('') : '<div style="font-size:13px;opacity:.7;margin-top:6px">ยังไม่มีข้อที่แท็กฟลุ๊ค</div>') +
            (flukes.length ? '<button type="button" class="apex-switch" id="apexClearFlukes" style="margin-top:10px">ล้างคิวข้อฟลุ๊ค</button>' : '') +
            '</div>';
        }
      }

      function rowSwitch(label, key, val) {
        return '<div class="apex-toggle-row"><span>' + label + '</span><button type="button" class="apex-switch" data-toggle-key="' + key + '" aria-pressed="' + val + '">' + (val ? 'เปิด' : 'ปิด') + '</button></div>';
      }

      btn.addEventListener('click', function() { modal.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); renderHub(); AudioSys.play('click'); });
      D.getElementById('apexHubClose').addEventListener('click', function() { modal.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
      modal.addEventListener('click', function(e) {
        if (e.target === modal) { modal.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); return; }
        var t = e.target.closest('button');
        if (!t) return;
        if (t.id === 'apexMasterSwitch') { updatePref({ richMode: !loadPrefs().richMode }); renderHub(); AudioSys.play('click'); return; }
        if (t.hasAttribute('data-cat')) { activeHubCat = t.getAttribute('data-cat'); renderHub(); AudioSys.play('click'); return; }
        if (t.hasAttribute('data-pref-theme')) { updatePref({ theme: t.getAttribute('data-pref-theme') }); renderHub(); return; }
        if (t.hasAttribute('data-pref-font')) { updatePref({ fontSize: Number(t.getAttribute('data-pref-font')) }); renderHub(); return; }
        if (t.hasAttribute('data-pref-speed')) { updatePref({ animSpeed: t.getAttribute('data-pref-speed') }); renderHub(); return; }
        if (t.hasAttribute('data-toggle-key')) {
          var k = t.getAttribute('data-toggle-key'), patch = {};
          patch[k] = !loadPrefs()[k];
          updatePref(patch); renderHub(); AudioSys.play('click'); return;
        }
        if (t.hasAttribute('data-pref-amb')) { updatePref({ ambient: t.getAttribute('data-pref-amb') }); renderHub(); return; }
        if (t.id === 'apexClearFlukes') { ExamEngine.saveFlukes([]); renderHub(); return; }
      });
    } catch (_) {}
  }

  /* ------------------------------------------------------------------------
     MODULE 5C: Time-of-Day Ambience, Auto-Hide Dock, Hairline Progress & Shimmer IO
     ------------------------------------------------------------------------ */
  function initAmbienceAndChrome() {
    try {
      /* 3px Reading Progress Hairline */
      var bar = D.createElement('div');
      bar.id = 'apexProgressBar';
      bar.innerHTML = '<div id="apexProgressFill"></div>';
      D.body.appendChild(bar);
      var fill = D.getElementById('apexProgressFill');

      /* Smart Auto-Hide Mobile Nav + Progress Scroll */
      var lastY = W.scrollY || 0;
      var nav = D.querySelector('.studio-mobile-nav');
      W.addEventListener('scroll', function() {
        var y = W.scrollY || 0;
        var max = Math.max(1, D.documentElement.scrollHeight - W.innerHeight);
        if (fill) fill.style.transform = 'scaleX(' + Math.min(1, Math.max(0, y / max)).toFixed(3) + ')';
        if (nav) {
          if (y > lastY + 18 && y > 80) nav.classList.add('apex-dock-hidden');
          else if (y < lastY - 10 || y <= 40) nav.classList.remove('apex-dock-hidden');
        }
        lastY = y;
      }, { passive: true });

      /* Dynamic Time-of-Day Ambience */
      var hr = new Date().getHours();
      var topbar = D.querySelector('.studio-topbar');
      var title = D.getElementById('studioTitle');
      if (topbar) {
        var tod = hr < 12 ? ['morning', '☀️ อรุณสวัสดิ์'] : (hr < 17 ? ['afternoon', '🌤 สวัสดีตอนบ่าย'] : (hr < 21 ? ['evening', '🌆 สวัสดีตอนเย็น'] : ['night', '🌙 โหมดติวดึก']));
        topbar.classList.add('apex-tod-' + tod[0]);
        if (title && !title.querySelector('.apex-tod-badge')) {
          var sp = D.createElement('span');
          sp.className = 'apex-tod-badge';
          sp.textContent = tod[1];
          title.appendChild(sp);
        }
      }

      /* Flashcard 3D flip */
      D.addEventListener('click', function(e) {
        var card = e.target.closest('.st-flash');
        if (!card) return;
        card.classList.remove('p-flipping');
        void card.offsetWidth;
        card.classList.add('p-flipping');
        AudioSys.play('click');
      });

      /* CTA & XP Shimmer with IntersectionObserver pause */
      if (typeof IntersectionObserver === 'function') {
        var io = new IntersectionObserver(function(entries) {
          entries.forEach(function(en) { en.target.classList.toggle('apex-shimmer-off', !en.isIntersecting); });
        });
        D.querySelectorAll('.lh-cta, .top-metric').forEach(function(el) {
          el.classList.add('apex-shimmer');
          io.observe(el);
        });
      }
    } catch (_) {}
  }

  /* ------------------------------------------------------------------------
     Apply Preferences & Throttled MutationObserver
     ------------------------------------------------------------------------ */
  function applyPrefs(p) {
    try {
      var root = D.documentElement;
      root.setAttribute('data-ui-theme', p.theme);
      root.setAttribute('data-theme', p.theme === 'midnight' ? 'dark' : 'light');
      root.style.setProperty('--p-font-size', p.fontSize + 'px');
      root.style.setProperty('--anim-speed', p.richMode ? p.animSpeed : '0s');
      root.setAttribute('data-apex-rich', p.richMode ? '1' : '0');
      root.setAttribute('data-apex-ruler', p.ruler ? '1' : '0');
      root.setAttribute('data-apex-veil', p.veil ? '1' : '0');
      root.setAttribute('data-apex-split', p.splitScreen ? '1' : '0');
      if (!p.richMode || p.animSpeed === '0s') root.setAttribute('data-motion', 'off');
      else if (p.animSpeed === '0.1s') root.setAttribute('data-motion', 'calm');
      else root.setAttribute('data-motion', 'full');

      var metaColors = { daylight: '#F7F6F2', midnight: '#0B1120', noir: '#FAFAFA', matcha: '#F2F6F3' };
      D.querySelectorAll('meta[name="theme-color"]').forEach(function(m) {
        m.setAttribute('content', metaColors[p.theme] || '#F7F6F2');
      });
      AudioSys.setAmbient(p.ambient);
      ReadingTools.syncPassages();

      D.querySelectorAll('.apex-radial-item').forEach(function(b) {
        var id = b.getAttribute('data-radial');
        if (id === 'bionic') b.setAttribute('aria-pressed', String(p.bionic));
        if (id === 'ruler') b.setAttribute('aria-pressed', String(p.ruler));
        if (id === 'veil') b.setAttribute('aria-pressed', String(p.veil));
      });
    } catch (_) {}
  }

  var rafId = 0;
  function scheduleEnhance() {
    if (rafId) return;
    rafId = requestAnimationFrame(function() {
      rafId = 0;
      var app = D.getElementById('app') || D.body;
      ExamEngine.enhanceChoiceGroups(app);
      ExamEngine.enhanceTimers(app);
      ExamEngine.enhanceFeedback(app);
      ReadingTools.syncPassages();
    });
  }

  function init() {
    applyPrefs(loadPrefs());
    mountActionHub();
    initRadialAndZen();
    initKeyboardShortcuts();
    initAmbienceAndChrome();
    ReadingTools.initHighlighter();
    ReadingTools.initRulerAndVeil();
    ReadingTools.initHoldToPeek();
    ReadingTools.initTapToLookup();
    scheduleEnhance();
    var target = D.getElementById('app') || D.body;
    if (target && typeof MutationObserver === 'function') {
      new MutationObserver(scheduleEnhance).observe(target, { childList: true, subtree: true });
    }
  }

  W.TGAT1Apex = Object.freeze({
    confetti: ParticleEngine.spawnConfetti,
    xp: ParticleEngine.spawnXP,
    play: AudioSys.play,
    prefs: loadPrefs,
    openScratchpad: ReadingTools.openScratchpad
  });

  applyPrefs(loadPrefs());
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init);
  else init();
})();
