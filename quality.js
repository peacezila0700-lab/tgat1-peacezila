/* TGAT1 English Studio — quality layer (v48.2)
   One small, testable file that holds the things the app kept getting wrong in prose: what a real TGAT1 set looks like,
   what a score actually means, and whether a mock set is being re-used. Loaded last, patches only through public
   functions, and never touches the question bank.

   Sources this file is built on
   -------------------------------------------------------------------------------------------------------------
   [1] ทปอ. (ที่ประชุมอธิการบดีแห่งประเทศไทย) — Test Blueprint TGAT1 การสื่อสารภาษาอังกฤษ, TCAS69/TCAS70:
       60 ข้อ · 60 นาที · 100 คะแนน · ปรนัย 4 ตัวเลือก
       Speaking 30 ข้อ (Question–Response 10 · Short conversations 10 = 3 บท × 3–4 ข้อ · Long conversations 10 = 2 บท × 5 ข้อ)
       Reading  30 ข้อ (Text completion 15 = 2 บทความ × 7–8 ข้อ · Reading comprehension 15 = 3 บทความ × 5 ข้อ)
       บทความ ≈ 100–200 คำ (สรุป blueprint: smartmathpro.com/article/test-blueprint-tcas68, admissionpremium.com/content/8224,
       highskill.me/tgat1-english, aims.co.th — ระดับความยากของ Question–Response: ง่าย 2 / กลาง 6 / ยาก 2 ต่อ 10 ข้อ)
   [2] Haladyna & Downing (1989) A taxonomy of multiple-choice item-writing rules, Applied Measurement in Education 2(1) 37–50;
       Haladyna, Downing & Rodriguez (2002) A review of multiple-choice item-writing guidelines, 15(3) 309–334 —
       ใช้กับกฎที่ตรวจได้ด้วยเครื่อง: คำตอบถูกต้องมีข้อเดียว · ตัวเลือกต้องมี 4 ตัวที่ขนานกัน · ไม่ใช้ "ทั้งหมดข้างต้น" ·
       ไม่ใช้คำปฏิเสธซ้อนในโจทย์ · ตัวลวงต้องมีเหตุผลรองรับ (แอปนี้เก็บเหตุผลตัวลวงไว้ใน `why` ของแต่ละข้อ)
   [3] Wilson (1927) score interval — ใช้คำนวณ "ช่วงคะแนน" แทน ±1.96·SE บนสัดส่วน (แม่นกว่าที่ขอบ 0/100 และที่ n เล็ก)
   -------------------------------------------------------------------------------------------------------------
   ไม่มีการเรียกเครือข่าย ไม่มีการเก็บข้อมูลเพิ่ม และไม่แตะ localStorage ยกเว้นผ่านฟังก์ชันที่แอปมีอยู่แล้ว */
(function () {
  'use strict';
  if (window.TGAT1_QUALITY) return;
  var W = window, D = document;

  /* ------------------------------------------------------------------ 1. blueprint */
  var BLUEPRINT = {
    version: 'TCAS69/70',
    items: 60,
    minutes: 60,
    options: 4,
    parts: { qr: 10, short: 10, long: 10, tc: 15, rc: 15 },
    partNames: {
      qr: 'Question–Response',
      short: 'Short conversations',
      long: 'Long conversations',
      tc: 'Text completion',
      rc: 'Reading comprehension'
    },
    // [1] ระดับความยากถูกกำหนดชัดเฉพาะ Question–Response 10 ข้อ = ง่าย 2 / กลาง 6 / ยาก 2
    // คลังของแอปนี้ทั้ง 1,200 ข้อได้ 20 / 60 / 20 ต่อหมวดพอดี (วัดจริง) และหลัง v48.3.0 ทุกชุดอยู่ในกรอบ 2/6/2 ±2
    difficulty: { 1: 2, 2: 6, 3: 2 },
    difficultyFor: 'qr',
    difficultyTolerance: 2,
    // ทุกชุดต้องมีข้ออย่างน้อย 1 ข้อในทุกระดับ: ชุดที่ไม่มีข้อยากเลยจะประเมินผู้เรียนสูงเกินจริง
    minPerLevel: 1,
    // [1] ข้อกำหนด 100–200 คำ ใช้กับ "บทอ่าน" (Text Completion + Reading Comprehension) เท่านั้น
    // บทสนทนาส่วน Speaking (Short/Long) เป็นบทสนทนาพูดสั้นตามธรรมชาติ blueprint ไม่ได้กำหนดความยาว
    passageWords: { min: 100, max: 200 },
    readingCategories: { tc: 1, rc: 1 }
  };

  /* โครงสร้างไวยากรณ์ที่ต้อง "สอนก่อนออกข้อสอบ" — ค่าแรกคือบทที่สอนเรื่องนั้น
     inversion สอนในบทที่ 5 (ยูนิต 43 = Cloze: รูปคำและโครงสร้าง) ก่อนข้อสอบที่ต้องใช้ inversion ทุกข้อ
     ถ้ามีคนย้ายข้อหรือแก้หลักสูตรจนลำดับกลับกัน curriculumAudit() จะจับได้ */
  var STRUCTURE_ORDER = {
    inversion: {
      label: 'inversion (สลับกริยาช่วย)', chapter: 5, unit: 43,
      // เกณฑ์หลัก (ตรวจจากข้อมูลจริง ไม่ใช่จากคำอธิบาย): ช่องว่างต้องอยู่ติดกับ "ตัวกระตุ้น inversion"
      triggers: /(under no circumstances|not only|never|rarely|seldom|hardly|no sooner|little|only after|only when|only if|not until|in no way|at no time|on no account)[\s\S]{0,40}?\(\d+\)\s*_{2,}/i,
      // เกณฑ์รอง: คำอธิบายบอกให้สลับกริยาช่วย
      pattern: /สลับกริยาช่วย|inversion หลัง|ทำ inversion/i,
      mustMention: /inversion/i
    },
    /* C4 (v48.11.0): เจ็ดหัวข้อไวยากรณ์ที่เคยขาด — ตรวจด้วย "แฟมิลีข้อ" ของ structure-extra
       เพราะช่องว่างของโครงเหล่านี้มักเป็นตัวโครงสร้างเอง (used to ___, wish + ___) จึงตรวจจากเนื้อหาข้อไม่ได้ */
    usedTo: {
      label: 'used to / would (นิสัยในอดีต)', chapter: 10, unit: 11, families: ['tc.used-to'],
      mustMention: /used to/i, pattern: /used to|เคย/i
    },
    perfectContinuous: {
      label: 'perfect continuous', chapter: 11, unit: 12, families: ['tc.perfect-cont'],
      mustMention: /perfect continuous/i, pattern: /perfect continuous|been \+ V-ing/i
    },
    futurePerfect: {
      label: 'future perfect', chapter: 13, unit: 13, families: ['tc.future-perfect'],
      mustMention: /future perfect/i, pattern: /will have \+ V3/i
    },
    causative: {
      label: 'causative (have/get something done)', chapter: 16, unit: 16, families: ['tc.causative'],
      mustMention: /causative/i, pattern: /causative|have \+ .*V3/i
    },
    resultClause: {
      label: 'so / such … that', chapter: 25, unit: 25, families: ['tc.result-clause'],
      mustMention: /so … that|such … that/i, pattern: /so … that|such … that/i
    },
    correlative: {
      label: 'both / either / neither', chapter: 22, unit: 22, families: ['tc.correlative'],
      mustMention: /both … and|either … or|neither … nor/i, pattern: /either … or|neither … nor/i
    },
    wish: {
      label: 'wish / if only', chapter: 28, unit: 28, families: ['tc.wish'],
      mustMention: /wish|if only/i, pattern: /wish \+ past|if only/i
    },
    nounClause: {
      label: 'นามานุประโยค (noun clause)', chapter: 8, unit: 8, families: ['tc.noun-clause'],
      mustMention: /noun clause|นามานุประโยค/i, pattern: /noun clause|นามานุประโยค/i
    },
    participleClause: {
      label: 'วลีขยาย (participle clause)', chapter: 27, unit: 27, families: ['tc.participle'],
      mustMention: /participle clause|วลีขยาย/i, pattern: /participle clause|วลีขยาย/i
    },
    reportedSpeech: {
      label: 'reported speech (เลื่อนกาล)', chapter: 3, unit: 42, mustMention: /reported speech/i,
      // ช่องว่างอยู่ใน clause ที่ตามหลังคำกริยารายงาน
      triggers: /(said|says|asked|asks|told|tells|wonders?|wondered|replied|explained|mentioned|added|adds|announced)\b[^.;!?]{0,40}\(\d+\)\s*_{2,}/i,
      // คำตอบที่เป็นตัวเชื่อม clause หรือกริยาที่เลื่อนกาลแล้ว
      answers: ['whether', 'if', 'that', 'was', 'were', 'had', 'would', 'could', 'might', 'should', 'had been', 'would have'],
      pattern: /reported speech|เลื่อนกาล|backshift/i
    }
  };

  var AUXILIARIES = ['am', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did', 'can', 'could', 'should', 'will', 'would', 'shall', 'may', 'might', 'must'];

  /* ข้อนี้ "ต้องรู้โครงสร้างนั้น" จริงหรือไม่ — ตัดสินจากตำแหน่งช่องว่างและคำตอบ ไม่ใช่เดาจากคำอธิบาย
     tc: ดูข้อความก่อนช่องว่างของข้อนั้นโดยตรง (hint ของบทความพูดถึงทั้งบท จึงใช้ไม่ได้)
     หมวดอื่น: ไม่มีช่องว่างให้ตรวจ ใช้คำอธิบายเป็นหลัก */
  function requiresStructure(key, q) {
    var rule = STRUCTURE_ORDER[key];
    if (!rule) return false;
    var q2 = q || {};
    // ข้อจาก structure-extra ระบุแฟมิลีมาแล้ว จึงตรวจตรง ๆ (ช่องว่างของโครงเหล่านี้มักเป็นตัวโครงสร้างเอง)
    if (rule.families && q2.f && rule.families.indexOf(q2.f) > -1) return true;
    // โครงที่ตรวจด้วยแฟมิลีอย่างเดียว ไม่ต้องเดาจากเนื้อหาข้อในคลังกลาง
    if (!rule.triggers && !rule.pattern) return false;
    if (q2.category === 'tc') {
      if (!q2.context || !rule.triggers) return false;
      var m = /blank \((\d+)\)/.exec(String(q2.prompt || ''));
      var mark = m ? '(' + m[1] + ')' : null;
      var at = mark ? String(q2.context).indexOf(' ' + mark) : -1;
      if (at < 0) return false;
      var win = key === 'reportedSpeech' ? 80 : 60;
      var before = String(q2.context).slice(Math.max(0, at - win), at + mark.length + 8);
      if (!rule.triggers.test(before)) return false;
      var ans = String((q2.options || [])[q2.answer] || '').trim().toLowerCase();
      if (key === 'inversion') {
        // ต้องเป็นกริยาช่วย/do-support ด้วย ถ้าคำตอบเป็นกริยาแท้ (feels, leave) แปลว่าช่องนั้นทดสอบรูปกริยา ไม่ใช่ inversion
        return AUXILIARIES.indexOf(ans) > -1;
      }
      if (key === 'reportedSpeech') return (rule.answers || []).indexOf(ans) > -1;
      return true;
    }
    // โครงที่ผูกกับแฟมิลีแล้ว ตัดสินจากแฟมิลีเท่านั้น ไม่เดาจากคำอธิบายของข้อในคลังกลาง
    if (rule.families) return false;
    return rule.pattern.test(String(q2.explanation || '') + ' ' + String(q2.hint || ''));
  }

  // FNV-1a — ใช้ระบุบทอ่านซ้ำโดยไม่ต้องเก็บสตริงทั้งก้อนเป็นคีย์
  function hash(str) {
    var h = 2166136261, t = String(str || '');
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  function words(s) {
    var t = String(s || '').replace(/[_]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
    return t ? t.split(' ').length : 0;
  }

  function countBy(items, key) {
    var out = {};
    for (var i = 0; i < items.length; i++) {
      var v = items[i] && items[i][key];
      if (v === undefined || v === null) continue;
      out[v] = (out[v] || 0) + 1;
    }
    return out;
  }

  /* ตรวจชุดข้อสอบหนึ่งชุดเทียบ blueprint [1] + กฎข้อสอบ [2]
     คืน { ok, total, parts, partProblems[], difficulty, difficultyProblems[], optionProblems[], notes[] } */
  function validateSet(items) {
    items = Array.isArray(items) ? items : [];
    var parts = countBy(items, 'category');
    var partProblems = [];
    Object.keys(BLUEPRINT.parts).forEach(function (k) {
      var want = BLUEPRINT.parts[k], got = parts[k] || 0;
      if (got !== want) partProblems.push(k + ': ' + got + '/' + want + ' (' + BLUEPRINT.partNames[k] + ')');
    });
    var total = items.length;
    if (total !== BLUEPRINT.items) partProblems.push('total: ' + total + '/' + BLUEPRINT.items);

    var optProblems = [];
    var seenIds = {};
    for (var i = 0; i < items.length; i++) {
      var q = items[i] || {};
      var opts = Array.isArray(q.options) ? q.options : [];
      if (opts.length !== BLUEPRINT.options) optProblems.push(q.id + ': ' + opts.length + ' ตัวเลือก');
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < opts.length)) optProblems.push(q.id + ': answer นอกช่วง');
      var keys = opts.map(function (o) { return String(o || '').trim().toLowerCase(); });
      if (new Set(keys).size !== keys.length) optProblems.push(q.id + ': ตัวเลือกซ้ำกัน');
      if (keys.some(function (k) { return /^(all|none) of (the )?above/.test(k); })) optProblems.push(q.id + ': ใช้ "all/none of the above"');
      if (seenIds[q.id]) optProblems.push(q.id + ': id ซ้ำในชุด'); else seenIds[q.id] = 1;
      if (!String(q.prompt || '').trim()) optProblems.push(q.id + ': ไม่มีโจทย์');
    }

    // ความยาก: เทียบเฉพาะหมวดที่ทางการกำหนด (Question–Response) และยอมให้แกว่งได้ ± tolerance
    var qrItems = items.filter(function (q) { return q && q.category === BLUEPRINT.difficultyFor; });
    var diff = countBy(qrItems, 'difficulty');
    var diffProblems = [];
    Object.keys(BLUEPRINT.difficulty).forEach(function (k) {
      var want = BLUEPRINT.difficulty[k], got = diff[k] || 0;
      if (Math.abs(got - want) > BLUEPRINT.difficultyTolerance) {
        diffProblems.push('QR ระดับ ' + k + ': ' + got + '/~' + want);
      }
      if (got < BLUEPRINT.minPerLevel) diffProblems.push('QR ไม่มีข้อระดับ ' + k + ' เลย');
    });

    return {
      ok: !partProblems.length && !optProblems.length,
      total: total,
      parts: parts,
      partProblems: partProblems,
      difficulty: diff,
      difficultyAll: countBy(items, 'difficulty'),
      difficultyProblems: diffProblems,
      optionProblems: optProblems
    };
  }

  /* บทอ่าน: ยาวเท่าไร และอยู่ในกรอบ 100–200 คำของ blueprint ไหม
     v48.3.0: แยก "บทอ่าน" (tc/rc) ออกจาก "บทสนทนา" (short/long) แล้วนับบทที่ไม่ซ้ำเท่านั้น
     ของเดิมนับทุกข้อและรวมบทสนทนาพูดเข้าไปด้วย ทำให้ตัวเลข "บทสั้นกว่า 100 คำ" สูงเกินจริง */
  function stat(list) {
    var lens = list.map(function (p) { return p.words; }).sort(function (a, b) { return a - b; });
    var out = { count: list.length, short: 0, long: 0, min: lens[0] || 0, max: lens[lens.length - 1] || 0, median: lens[Math.floor(lens.length / 2)] || 0 };
    list.forEach(function (p) {
      if (p.words < BLUEPRINT.passageWords.min) out.short++;
      if (p.words > BLUEPRINT.passageWords.max) out.long++;
    });
    return out;
  }
  function passages(items) {
    items = Array.isArray(items) ? items : [];
    var map = {};
    items.forEach(function (q) {
      if (!q || !q.context) return;
      var key = hash(q.context) + ':' + String(q.context).length;
      var rec = map[key] || (map[key] = { words: words(q.context), items: 0, cats: {}, text: q.context });
      rec.items++;
      rec.cats[q.category] = (rec.cats[q.category] || 0) + 1;
    });
    var list = Object.keys(map).map(function (k) { return map[k]; });
    var reading = list.filter(function (p) {
      return Object.keys(p.cats).some(function (c) { return BLUEPRINT.readingCategories[c]; });
    });
    var speaking = list.filter(function (p) { return reading.indexOf(p) === -1; });
    var out = { count: list.length, list: list };
    out.reading = stat(reading);
    out.speaking = stat(speaking);
    // ตัวเลขที่ต้องเป็น 0 ตาม blueprint คือของ "บทอ่าน" เท่านั้น
    out.short = out.reading.short;
    out.long = out.reading.long;
    return out;
  }

  /* ------------------------------------------------------------------ 2. score range */
  // Wilson score interval [3] บนสัดส่วน p = score/total ที่ระดับความเชื่อมั่น 95%
  function wilson(correct, total, z) {
    z = z || 1.96;
    if (!total) return { p: 0, lo: 0, hi: 0, n: 0 };
    var p = correct / total;
    var z2 = z * z, denom = 1 + z2 / total;
    var centre = (p + z2 / (2 * total)) / denom;
    var half = (z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)) / denom;
    return {
      p: p,
      lo: Math.max(0, centre - half),
      hi: Math.min(1, centre + half),
      n: total,
      half: half
    };
  }

  // คะแนนที่แอปแสดงเป็น /100 → แปลงเป็นช่วง
  function scoreRange(correct, total, opts) {
    opts = opts || {};
    var w = wilson(correct, total, opts.z);
    var pct = Math.round(w.p * 100);
    var lo = Math.max(0, Math.round(w.lo * 100));
    var hi = Math.min(100, Math.round(w.hi * 100));
    var width = hi - lo;
    // ข้อความบอกความหมาย ไม่ใช่คำสัญญา: ช่วงแคบ = ข้อเยอะพอ, ช่วงกว้าง = ข้อน้อย/ยังไม่นิ่ง
    var meaning = width <= 6
      ? 'ช่วงแคบ แปลว่าจำนวนข้อยังให้ภาพที่ค่อนข้างนิ่ง'
      : width <= 14
        ? 'ช่วงกลาง ๆ ยังขยับได้อีก 2–3 ชุดก่อนสรุป'
        : 'ช่วงกว้าง เพราะข้อในชุดนี้ไม่มากพอ อย่าด่วนสรุปจากชุดเดียว';
    return {
      pct: pct,
      lo: lo,
      hi: hi,
      width: width,
      label: lo === hi ? (pct + '/100') : ('≈ ' + lo + '–' + hi + ' จาก 100'),
      meaning: meaning,
      n: total
    };
  }

  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ใช้ในหน้าผลสอบ (app.js เรียกผ่าน window.VLT_scoreRangeNote ถ้ามี)
  window.VLT_scoreRangeNote = function (r) {
    try {
      if (!r || !r.total) return '';
      var correct = Number(r.score) || 0, total = Number(r.total) || 0;
      var range = scoreRange(correct, total);
      var goal = null;
      try { goal = typeof window.target === 'function' ? Number(window.target()) : null; } catch (_) { goal = null; }
      var verdict = '';
      if (goal) {
        if (range.lo >= goal) verdict = 'ต่ำสุดของช่วงยังถึงเป้า ' + goal + ' คะแนน';
        else if (range.hi < goal) verdict = 'สูงสุดของช่วงยังไม่ถึงเป้า ' + goal + ' คะแนน';
        else verdict = 'ช่วงนี้คร่อมเป้า ' + goal + ' คะแนน — ยังสรุปไม่ได้ว่าถึงหรือไม่';
      }
      return '<section class="vault-hero" style="margin-top:14px" aria-label="ช่วงคะแนนโดยประมาณ">' +
        '<h2 style="font-size:18px">📏 ช่วงคะแนนที่น่าจะเป็น</h2>' +
        '<p class="vault-sub" style="font-size:22px;font-weight:700;color:#fff;margin:6px 0">' + esc(range.label) + '</p>' +
        '<p class="vault-muted">' + esc(range.pct) + '% จาก ' + total + ' ข้อ · ' + esc(range.meaning) + (verdict ? ' · ' + esc(verdict) : '') + '</p>' +
        '<p class="vault-muted">ตัวเลขนี้เป็น <b>ช่วงความเชื่อมั่น 95%</b> ของคะแนนชุดนี้ ไม่ใช่การทำนายคะแนนสอบจริง ' +
        '(วันสอบจริงมีข้อต่างกัน ระดับความยากต่างกัน และมีคนสอบพร้อมกันทั้งประเทศ)</p>' +
        '</section>';
    } catch (e) {
      if (W.TGAT1_ERR) W.TGAT1_ERR(e, 'quality');
      return '';
    }
  };

  /* ------------------------------------------------------------------ 3. mock set re-use guard (C13) */
  // ชุดสอบจำลองมี 20 ชุดและไม่มีการเตือนเมื่อทำซ้ำ → คะแนนรอบสองสูงเกินจริงเพราะจำข้อได้
  function completed(setNo) {
    try {
      var st = W.VLT_STATE && W.VLT_STATE.completedSets;
      var rec = st && st[setNo];
      return rec && rec.date ? rec : null;
    } catch (_) { return null; }
  }

  function installMockGuard() {
    if (typeof W.VLT_startMock !== 'function' || W.VLT_startMock.__quality) return;
    var prev = W.VLT_startMock;
    var wrapped = function (setNo) {
      try {
        var rec = completed(setNo);
        if (rec && typeof W.TGConfirm === 'function' && !W.__qualitySkipSetWarn) {
          var when = rec.date;
          var best = Number(rec.best || rec.score || 0);
          return W.TGConfirm('ชุดที่ ' + setNo + ' เคยทำแล้วเมื่อ ' + when + ' (ดีที่สุด ' + best + '/100)\n\n' +
            'ทำซ้ำคะแนนจะสูงเกินจริงเพราะจำข้อได้ ถ้าต้องการวัดจริงควรทำชุดที่ยังไม่เคยทำ\n\nเริ่มชุดนี้อีกครั้งหรือไม่?')
            .then(function (ok) { if (ok) return prev.apply(this, arguments); });
        }
      } catch (e) { if (W.TGAT1_ERR) W.TGAT1_ERR(e, 'quality'); }
      return prev.apply(this, arguments);
    };
    wrapped.__quality = true;
    W.VLT_startMock = wrapped;
  }

  /* ------------------------------------------------------------------ 4. whole-bank audit */
  function auditAll(bank) {
    bank = Array.isArray(bank) ? bank : (W.VLT_BANK || []);
    if (!bank.length) return { ready: false, reason: 'ยังไม่โหลดคลังข้อสอบ' };
    var sets = {};
    bank.forEach(function (q) { (sets[q.set] = sets[q.set] || []).push(q); });
    var rows = Object.keys(sets).map(Number).sort(function (a, b) { return a - b; }).map(function (n) {
      var v = validateSet(sets[n]);
      var p = passages(sets[n]);
      return {
        set: n,
        ok: v.ok,
        total: v.total,
        parts: v.parts,
        partProblems: v.partProblems,
        difficultyProblems: v.difficultyProblems,
        difficulty: v.difficulty,
        optionProblems: v.optionProblems,
        passages: { count: p.count, short: p.short, long: p.long }
      };
    });
    var bad = rows.filter(function (r) { return !r.ok; });
    var shortPassages = rows.reduce(function (a, r) { return a + r.passages.short; }, 0);
    var longPassages = rows.reduce(function (a, r) { return a + r.passages.long; }, 0);
    var allP = passages(bank);
    var zeroLevel = rows.filter(function (r) {
      return Object.keys(BLUEPRINT.difficulty).some(function (k) { return !(r.difficulty && r.difficulty[k] > 0); });
    });
    return {
      ready: true,
      blueprint: BLUEPRINT.version,
      sets: rows.length,
      conforming: rows.length - bad,
      nonConforming: bad.map(function (r) { return r.set + ' → ' + r.partProblems.join(' · '); }),
      optionProblems: rows.reduce(function (a, r) { return a.concat(r.optionProblems); }, []),
      difficultyProblems: rows.reduce(function (a, r) { return a.concat(r.difficultyProblems.map(function (x) { return 'set ' + r.set + ' ' + x; })); }, []),
      passages: {
        short: shortPassages, long: longPassages, expected: '100–200 คำ',
        reading: allP.reading, speaking: allP.speaking,
        readingTotal: allP.reading.count, duplicatePassages: allP.count - allP.reading.count - allP.speaking.count
      },
      qrLevels: rows.map(function (r) { return { set: r.set, easy: r.difficulty[1] || 0, medium: r.difficulty[2] || 0, hard: r.difficulty[3] || 0 }; }),
      emptyLevelSets: zeroLevel.map(function (r) { return r.set; }),
      rows: rows
    };
  }

  /* ------------------------------------------------------------------ 4b. curriculum order (B1)
     ตรวจว่าไม่มีข้อสอบที่ "ต้องใช้โครงสร้างซึ่งยังไม่ได้สอน" อยู่ในบทก่อนบทที่สอนเรื่องนั้น
     และตรวจว่าบทเรียนที่อ้างว่าสอนเรื่องนั้นมีเนื้อหาจริง (ไม่ใช่แค่ชื่อหัวข้อ) */
  function curriculumAudit(opts) {
    opts = opts || {};
    var path = opts.path || W.TGAT1_PATH_DATA;
    var units = opts.units || (W.TGAT1_HUB_CURRICULUM && W.TGAT1_HUB_CURRICULUM.units);
    var bank = opts.bank || W.VLT_BANK;
    if (!path || !Array.isArray(path.chapters) || !Array.isArray(units) || !Array.isArray(bank)) {
      return { ready: false, reason: 'ต้องมี learning-path-data.js, learning-hub-curriculum.js และคลังข้อสอบก่อน' };
    }
    var chapterOf = {};
    path.chapters.forEach(function (c) {
      var ids = [];
      Object.keys(c.practice || {}).forEach(function (role) {
        (c.practice[role] || []).forEach(function (it) { ids.push(it.id); });
      });
      (c.test || []).forEach(function (it) { ids.push(it.id); });
      ids.forEach(function (id) { (chapterOf[id] = chapterOf[id] || []).push(c.n); });
    });
    var byId = {};
    bank.forEach(function (q) { byId[q.id] = q; });
    // C4: ข้อของหัวข้อใหม่อยู่ใน structure-extra (ไม่ได้ผูกกับชุดสอบ 60 ข้อ) แต่ต้องนับว่ามีข้อรองรับจริง
    var scan = bank.slice();
    var S = sxDoc();
    if (S && Array.isArray(S.items)) S.items.forEach(function (x) {
      scan.push({ id: x.i, options: x.o, answer: x.a, prompt: x.s, f: x.f, category: 'tc', explanation: x.w, hint: x.h });
    });

    var gaps = [];
    Object.keys(STRUCTURE_ORDER).forEach(function (key) {
      var rule = STRUCTURE_ORDER[key];
      var unit = units.filter(function (u) { return u.n === rule.unit; })[0];
      var teach = unit && unit.learn ? JSON.stringify(unit.learn) : '';
      var exCount = (JSON.parse(teach || '{}').ex || []).length;
      var coverage = {
        key: key, unit: rule.unit, chapter: rule.chapter,
        teachingChars: teach.length,
        examples: exCount,
        mentionsStructure: (rule.mustMention || /inversion/i).test(teach),
        ok: teach.length >= 1500 && exCount >= 3 && (rule.mustMention || /inversion/i).test(teach)
      };
      scan.forEach(function (q) {
        if (!requiresStructure(key, q)) return;
        var chs = chapterOf[q.id] || [];
        chs.forEach(function (n) {
          if (n < rule.chapter) gaps.push({ id: q.id, structure: key, chapter: n, teachChapter: rule.chapter, topic: q.topic });
        });
        coverage['items'] = (coverage['items'] || 0) + 1;
      });
      coverage.gaps = gaps.filter(function (g) { return g.structure === key; }).length;
      STRUCTURE_ORDER[key]._coverage = coverage;
    });

    return {
      ready: true,
      gaps: gaps,
      coverage: Object.keys(STRUCTURE_ORDER).map(function (k) { return STRUCTURE_ORDER[k]._coverage; }),
      chapters: path.chapters.length,
      itemsMapped: Object.keys(chapterOf).length
    };
  }

  /* ------------------------------------------------------------------ 4c. difficulty rule (C6c) + teaching depth (C3)
     C6c: กฎที่ใช้ตัดสินความยากของข้อที่ "คำตอบเป็นสำนวน" (idiom rule)
       - คำตอบเป็นสำนวน → ห้ามติดป้าย "ง่าย" (ต้องเป็นกลางหรือยาก)
       - คำตอบเป็นสำนวน + มีตัวลวงที่ชวนตีความตามตัวอักษร → ต้องเป็น "ยาก"
     เกณฑ์นี้ตรวจได้ด้วยเครื่อง จึงใช้เป็นตาข่ายกันการติดป้ายย้อนหลังให้ตัวเลขผ่าน */
  var IDIOMS = ['play it by ear','sleep on it','in hot water','out of the blue','under the weather','a long shot','on me','wouldn’t miss it',
    'you can say that again','not that i know of','it’s a deal','make yourself at home','on the house','break the ice','piece of cake','call it a day',
    'in the same boat','get the hang of','keep an eye on','miss the boat','off the top of my head','once in a blue moon','small world','it slipped my mind',
    'cross that bridge','bite the bullet','hit the books','lost my train of thought','have a lot on my plate','up in the air','change of heart','see eye to eye',
    'cut corners','run out of steam','turn a blind eye','big picture','rule of thumb','in the long run','at the drop of a hat','on second thought',
    'speak of the devil','the last straw','beat around the bush','sit on the fence','throw in the towel','get cold feet','take it easy','fingers crossed',
    'go the extra mile','break a leg','see how it goes','play it safe','no big deal','not my cup of tea','for the time being','all ears','have a word',
    'spilled the beans','spill the beans','cost an arm and a leg','an arm and a leg','tied up','hands are full','count me in','i’m game','hang in there',
    'blew me away','inside out','paid off','worth a shot','keep me posted','dead on your feet','what a steal','on the fence','over the moon',
    'long time no see','not rocket science','on cloud nine','ring a bell','by all means'];

  var STOPWORDS = {};
  'the a an i you me my your it its is are was were do does did to of in on at for and or but so not no yes that this these those very really just about from with as be been am we they he she him her them us our their there here what when where who which why how can could would should will shall may might must have has had if then than too also all some any more most much many few little one two three four five six seven eight nine ten'.split(' ').forEach(function (w) { STOPWORDS[w] = 1; });

  function contentWords(text) {
    return String(text || '').toLowerCase().replace(/[^a-z’' ]+/g, ' ').split(/\s+/).filter(function (w) {
      return w.length >= 3 && !STOPWORDS[w];
    });
  }
  function idiomIn(item) {
    var t = ' ' + String((item && item.options && item.options[item.answer]) || '').toLowerCase().replace(/[^a-z’' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    for (var i = 0; i < IDIOMS.length; i++) if (t.indexOf(IDIOMS[i]) > -1) return IDIOMS[i];
    return null;
  }
  function literalDecoys(item) {
    var phrase = idiomIn(item);
    if (!phrase) return 0;
    var key = contentWords(phrase);
    var opts = (item && item.options) || [];
    var n = 0;
    for (var i = 0; i < opts.length; i++) {
      if (i === item.answer) continue;
      var w = contentWords(opts[i]);
      for (var j = 0; j < w.length; j++) { if (key.indexOf(w[j]) > -1) { n++; break; } }
    }
    return n;
  }
  function idiomAudit(bank) {
    bank = Array.isArray(bank) ? bank : (W.VLT_BANK || []);
    var problems = [];
    bank.forEach(function (q) {
      if (!q || !q.options) return;
      var phrase = idiomIn(q);
      if (!phrase) return;
      var level = Number(q.difficulty);
      var decoys = literalDecoys(q);
      if (level === 1) problems.push({ id: q.id, kind: 'idiom-easy', phrase: phrase, difficulty: level });
      else if (decoys >= 1 && level < 3) problems.push({ id: q.id, kind: 'idiom-with-literal-decoy-not-hard', phrase: phrase, difficulty: level, decoys: decoys });
    });
    return { total: bank.length, withIdiom: bank.filter(function (q) { return q && q.options && idiomIn(q); }).length, problems: problems };
  }

  /* C3: ความลึกของบทเรียนต่อบท = เนื้อหาสอน (ตัวอักษร) + จำนวนตัวอย่างวิเคราะห์ */
  function curriculumDepth(opts) {
    opts = opts || {};
    var path = opts.path || W.TGAT1_PATH_DATA;
    var units = opts.units || (W.TGAT1_HUB_CURRICULUM && W.TGAT1_HUB_CURRICULUM.units) || [];
    if (!path || !Array.isArray(path.chapters)) return { ready: false, reason: 'ต้องมี learning-path-data.js และ learning-hub-curriculum.js' };
    var byN = {}; units.forEach(function (u) { byN[u.n] = u; });
    var targets = opts.minChars || 1500, minExamples = opts.minExamples || 3;
    var rows = path.chapters.map(function (ch) {
      var us = (ch.learn || []).map(function (l) { return l.u; });
      var chars = 0, examples = 0;
      us.forEach(function (n) {
        var learn = (byN[n] && byN[n].learn) || {};
        chars += JSON.stringify(learn).length;
        examples += (learn.ex || []).length;
      });
      return { chapter: ch.n, units: us, chars: chars, examples: examples, pass: chars >= targets && examples >= minExamples };
    });
    var lens = rows.map(function (r) { return r.chars; }).sort(function (a, b) { return a - b; });
    var exs = rows.map(function (r) { return r.examples; }).sort(function (a, b) { return a - b; });
    return {
      ready: true, targets: { minChars: targets, minExamples: minExamples },
      chapters: rows.length, passing: rows.filter(function (r) { return r.pass; }).length,
      minChars: lens[0] || 0, medianChars: lens[Math.floor(lens.length / 2)] || 0, maxChars: lens[lens.length - 1] || 0,
      minExamples: exs[0] || 0, medianExamples: exs[Math.floor(exs.length / 2)] || 0,
      failing: rows.filter(function (r) { return !r.pass; }).map(function (r) { return r.chapter; }),
      rows: rows
    };
  }

  /* ------------------------------------------------------------------ 4d. word rotation (C8)
     C8: คำผ่านตา (คำที่ index ≥ ch.srs) เดิมถูกใช้แค่แสดงในหน้ารายการ ไม่เคยถูกถาม
     ฟังก์ชันนี้หมุนคำผ่านตาเข้าชุดที่ถูกถาม 2 คำต่อรอบ — ครบทุกคำภายใน ceil(expo/2) รอบ
     ไม่มีสถานะ ใช้ cycle ที่เรียกซ้ำได้ (ผลลัพธ์เดิมทุกครั้งสำหรับ cycle เดียวกัน) */
  function wordRotation(ch, cycle, opts) {
    opts = opts || {};
    var step = opts.step || 2;
    var all = ((ch && ch.words) || []).slice();
    var nS = Number((ch && ch.srs) || opts.srsDefault || 20);
    var core = all.slice(0, nS), expo = all.slice(nS);
    if (!expo.length) return { core: core, expo: [], cycled: [], quizzed: core.slice(), cyclesToCover: 0 };
    var k = Math.min(step, expo.length);
    var start = ((Math.max(0, Number(cycle) || 0) * k) % expo.length);
    var cycled = [];
    for (var i = 0; i < k; i++) cycled.push(expo[(start + i) % expo.length]);
    return {
      core: core, expo: expo, cycled: cycled, quizzed: core.concat(cycled),
      cyclesToCover: Math.ceil(expo.length / k)
    };
  }

  /* C8: รายงานความครอบคลุมของคำผ่านตา — ทุกคำต้องถูกถามได้จริงภายใน N รอบ */
  function wordCoverage(opts) {
    opts = opts || {};
    var path = opts.path || W.TGAT1_PATH_DATA;
    if (!path || !Array.isArray(path.chapters)) return { ready: false, reason: 'ต้องมี learning-path-data.js' };
    var maxCycles = opts.maxCycles || 10, step = opts.step || 2;
    var rows = path.chapters.map(function (ch) {
      var r = wordRotation(ch, 0, { step: step });
      var asked = {}, firstSeen = {};
      for (var c = 0; c < maxCycles; c++) {
        wordRotation(ch, c, { step: step }).cycled.forEach(function (w) { if (firstSeen[w] == null) firstSeen[w] = c; asked[w] = 1; });
      }
      var never = r.expo.filter(function (w) { return !asked[w]; });
      var total = r.core.length + r.expo.length;
      var reachable = r.core.length + r.expo.length - never.length;
      return {
        chapter: ch.n, total: total, core: r.core.length, expo: r.expo.length,
        reachable: reachable, never: never, cyclesToCover: r.cyclesToCover,
        pass: never.length === 0 && r.expo.every(function (w) { return firstSeen[w] < r.cyclesToCover; })
      };
    });
    var sum = function (k) { return rows.reduce(function (a, r) { return a + r[k]; }, 0); };
    return {
      ready: true, chapters: rows.length, maxCycles: maxCycles,
      words: sum('total'), core: sum('core'), expo: sum('expo'), reachable: sum('reachable'),
      passing: rows.filter(function (r) { return r.pass; }).length,
      worstCycles: rows.reduce(function (a, r) { return Math.max(a, r.cyclesToCover); }, 0),
      failing: rows.filter(function (r) { return !r.pass; }).map(function (r) { return r.chapter; }),
      rows: rows
    };
  }

  /* ------------------------------------------------------------------ 4e. speaking idiom bank (C11)
     C11: Speaking ต้องมีคลังสำนวน + คำตอบมาตรฐานแยกตามฟังก์ชัน
     ตรวจ: จำนวนสำนวน · ฟังก์ชันละกี่สำนวน · ทุก entry มีคำตอบมาตรฐาน · สำนวนซ้ำ · การเชื่อมกับข้อสอบในคลัง */
  /* ใช้สำนวนจริงหรือไม่: เทียบ “คำเนื้อหา” ของสำนวนกับประโยค (ทนการตัดคำสรรพนาม/คำช่วยออก เช่น “it paid off”) */
  var ID_STOP = ['the', 'and', 'for', 'not', 'you', 'your', 'that', 'this', 'but', 'with', 'from', 'all', 'any', 'can', 'have', 'out'];
  function idiomWords(phrase) {
    return String(phrase || '').toLowerCase().replace(/’/g, "'").replace(/[^a-z' ]+/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length >= 3 && ID_STOP.indexOf(w) < 0; });
  }
  function usesIdiom(phrase, sentence) {
    var w = idiomWords(phrase);
    if (!w.length) return true;
    var t = ' ' + String(sentence || '').toLowerCase().replace(/’/g, "'").replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    var hits = w.filter(function (x) { return t.indexOf(' ' + x) > -1; }).length;
    return hits >= Math.max(1, Math.ceil(w.length * 0.6));
  }

  function idiomBankAudit(bank, opts) {
    opts = opts || {};
    var doc = opts.doc || W.TGAT1_IDIOMS;
    var minEntries = opts.minEntries || 60, minPerFn = opts.minPerFn || 6;
    if (!doc || !Array.isArray(doc.entries)) return { ready: false, reason: 'ต้องมี speaking-idioms.js' };
    var fns = (doc.functions || []).map(function (f) { return f.id; });
    var problems = [], seen = {}, perFn = {};
    doc.entries.forEach(function (e) {
      var key = String(e.idiom || '').toLowerCase().replace(/’/g, "'").trim();
      if (!key) problems.push('entry ไม่มีสำนวน: ' + e.id);
      else if (seen[key]) problems.push('สำนวนซ้ำ: ' + e.idiom);
      seen[key] = 1;
      if ((e.idiom || '').indexOf(' ') < 0 && !opts.allowSingleWord) problems.push('สำนวนต้องมีมากกว่าหนึ่งคำ: ' + e.idiom);
      if (fns.indexOf(e.fn) < 0) problems.push('ฟังก์ชันไม่รู้จัก: ' + e.fn + ' (' + e.idiom + ')');
      else perFn[e.fn] = (perFn[e.fn] || 0) + 1;
      ['th', 'resp', 'respTh'].forEach(function (k) { if (!e[k] || String(e[k]).trim().length < 2) problems.push('ขาด ' + k + ': ' + e.id); });
      if (!e.ex || !e.ex.q || !e.ex.a) problems.push('ขาดบทสนทนาตัวอย่าง: ' + e.id);
      // คำตอบมาตรฐานต้องใช้เนื้อหาของสำนวนจริง (ไม่ใช่แค่คำแรก — สำนวนอย่าง “it paid off” อาจตัด it ทิ้งได้)
      if (!usesIdiom(e.idiom, e.resp)) problems.push('คำตอบมาตรฐานไม่ได้ใช้สำนวน: ' + e.id);
    });
    fns.forEach(function (f) { if ((perFn[f] || 0) < minPerFn) problems.push('ฟังก์ชัน ' + f + ' มีเพียง ' + (perFn[f] || 0) + ' สำนวน (< ' + minPerFn + ')'); });

    // การเชื่อมกับคลังข้อสอบ: สำนวนที่มีในข้อสอบต้องอยู่ในคลังนี้ และคลังนี้ควรอ้างข้อได้
    var bank2 = Array.isArray(bank) ? bank : (W.VLT_BANK || []);
    var linked = doc.entries.filter(function (e) { return !!e.item; }).length;
    var missingFromBankDoc = [], missingItems = [];
    if (bank2.length) {
      var byId = {};
      bank2.forEach(function (q) { byId[q.id] = q; });
      doc.entries.forEach(function (e) {
        if (e.item && !byId[e.item]) missingItems.push(e.id + '→' + e.item);
        if (e.item && byId[e.item]) {
          var ans = String((byId[e.item].options || [])[byId[e.item].answer] || '');
          if (!usesIdiom(e.idiom, ans)) missingItems.push('คำตอบของข้อไม่ตรงสำนวน: ' + e.id + '→' + e.item);
        }
      });
      (opts.idiomItems || []).forEach(function (q) {
        var ans = String((q.options || [])[q.answer] || '');
        var hit = doc.entries.some(function (e) { return usesIdiom(e.idiom, ans); });
        if (!hit) missingFromBankDoc.push(q.id);
      });
    }
    if (doc.entries.length < minEntries) problems.push('สำนวนทั้งคลัง ' + doc.entries.length + ' < ' + minEntries);
    return {
      ready: true, entries: doc.entries.length, functions: fns.length, perFn: perFn,
      linked: linked, problems: problems, missingItems: missingItems,
      bankIdiomsNotInDoc: missingFromBankDoc,
      thin: fns.filter(function (f) { return (perFn[f] || 0) < minPerFn; })
    };
  }

  /* ------------------------------------------------------------------ 4f. extended reading (C12)
     C12: ต้องมีบทอ่าน 150–200 คำ หลายแนว + ข้ออนุมาน/ทัศนคติ ≥ 3 ข้อ/บท
     คลังนี้แยกจากชุดสอบ 60 ข้อ (blueprint: Speaking 30 + Reading 30) จึงไม่กระทบโครงสร้างชุด */
  var HO_TYPES = ['rc.inference', 'rc.attitude', 'rc.purpose', 'rc.tone'];
  function readingExtendedAudit(opts) {
    opts = opts || {};
    var doc = opts.doc || W.TGAT1_READING;
    var minWords = opts.minWords || 150, maxWords = opts.maxWords || 200;
    var minHigher = opts.minHigher || 3, minPassages = opts.minPassages || 12;
    if (!doc || !Array.isArray(doc.passages)) return { ready: false, reason: 'ต้องมี reading-extended.js' };
    var problems = [], ids = {}, prompts = {}, genres = {}, perPos = { 0: 0, 1: 0, 2: 0, 3: 0 }, diff = { 1: 0, 2: 0, 3: 0 };
    var rows = doc.passages.map(function (p) {
      var words = String(p.text || '').split(/\s+/).filter(Boolean).length;
      var ho = 0;
      genres[p.genre] = 1;
      if (words < minWords || words > maxWords) problems.push(p.id + ': ความยาว ' + words + ' คำ');
      (p.items || []).forEach(function (it) {
        if (ids[it.id]) problems.push('id ซ้ำ: ' + it.id);
        ids[it.id] = 1;
        if (prompts[it.prompt]) problems.push('คำถามซ้ำ: ' + it.id);
        prompts[it.prompt] = 1;
        if (HO_TYPES.indexOf(it.type) > -1) ho++;
        if (!Array.isArray(it.options) || it.options.length !== 4) problems.push(it.id + ': ต้องมี 4 ตัวเลือก');
        else if (new Set(it.options).size !== 4) problems.push(it.id + ': ตัวเลือกซ้ำ');
        if (!(it.answer >= 0 && it.answer < 4)) problems.push(it.id + ': index คำตอบผิด');
        else perPos[it.answer]++;
        if (!it.why || String(it.why).length < 40) problems.push(it.id + ': คำอธิบายสั้นเกิน');
        if (!it.hint) problems.push(it.id + ': ไม่มีคำใบ้');
        if ([1, 2, 3].indexOf(it.difficulty) < 0) problems.push(it.id + ': difficulty ผิด');
        else diff[it.difficulty]++;
      });
      if (ho < minHigher) problems.push(p.id + ': ข้อคิดขั้นสูง ' + ho + ' < ' + minHigher);
      return { id: p.id, genre: p.genre, words: words, items: (p.items || []).length, higher: ho };
    });
    var totalItems = rows.reduce(function (a, r) { return a + r.items; }, 0);
    var maxPerPos = Math.max(perPos[0], perPos[1], perPos[2], perPos[3]);
    return {
      ready: true, passages: rows.length, genres: Object.keys(genres).length, items: totalItems,
      minWords: Math.min.apply(null, rows.map(function (r) { return r.words; })),
      maxWords: Math.max.apply(null, rows.map(function (r) { return r.words; })),
      minHigher: Math.min.apply(null, rows.map(function (r) { return r.higher; })),
      answerPositions: perPos, difficulty: diff,
      problems: problems, rows: rows,
      pass: problems.length === 0 && rows.length >= minPassages && Object.keys(genres).length >= minPassages && maxPerPos <= Math.ceil(totalItems / 4) + 3
    };
  }

  /* ------------------------------------------------------------------ 4g. concept coverage (C5)
     C5: “ทุกหัวข้อ ≥ 25 ข้อ” — นับจากคอนเซปต์ในหลักสูตร (curriculum.concepts) ไม่ใช่จากชื่อแท็ก
     เพราะบทเรียนผูกกับคอนเซปต์ผ่าน bank[] และตัวกรอง bre/kre จึงต้องนับแบบเดียวกับที่แอปใช้จริง
     คลังเสริม structure-extra.js (C5) อยู่นอกชุดสอบ 60 ข้อ/ชุด จึงไม่กระทบ blueprint */
  var COVER_MIN = 25;
  function sxDoc(opts) { return (opts && opts.extra) || W.TGAT1_STRUCTURE_EXTRA || null; }
  function curDoc(opts) { return (opts && opts.curriculum) || W.TGAT1_HUB_CURRICULUM || null; }
  function tagOf(q, tags) {
    if (q && q.f) return q.f;
    if (tags && tags[q.id]) return tags[q.id];
    var c = q && q.category;
    return ({ short: 'conv.short', long: 'conv.long', qr: 'qr.info', rc: 'rc.detail', tc: 'tc.vocab' })[c] || 'other';
  }
  function familyCounts(opts) {
    var tags = (W.TGAT1_HUB_DATA && W.TGAT1_HUB_DATA.tags) || {};
    var bank = (opts && opts.bank) || W.VLT_BANK || [];
    var out = {};
    bank.forEach(function (q) { var f = tagOf(q, tags); out[f] = (out[f] || 0) + 1; });
    var S = sxDoc(opts);
    if (S && Array.isArray(S.items)) S.items.forEach(function (x) { out[x.f] = (out[x.f] || 0) + 1; });
    return out;
  }
  function conceptCoverage(opts) {
    opts = opts || {};
    var C = curDoc(opts);
    if (!C || !C.concepts) return { ready: false, reason: 'ต้องมี learning-hub-curriculum.js' };
    var S = sxDoc(opts), bank = (opts && opts.bank) || W.VLT_BANK;
    if (!Array.isArray(bank) || !bank.length) return { ready: false, reason: 'ต้องโหลดคลังข้อสอบก่อน (VLT_ensureBank)' };
    var tags = (W.TGAT1_HUB_DATA && W.TGAT1_HUB_DATA.tags) || {};
    var pool = bank.map(function (q) {
      return { id: q.id, fam: tagOf(q, tags), ans: String((q.options || [])[q.answer] || ''),
               ex: String(q.explanation || '') + ' ' + String(q.prompt || '') };
    });
    if (S && Array.isArray(S.items)) S.items.forEach(function (x) {
      pool.push({ id: x.i, fam: x.f, ans: String((x.options || [])[x.answer] || ''), ex: String(x.explanation || '') + ' ' + String(x.prompt || '') });
    });
    var unitsBy = {};
    (C.units || []).forEach(function (u) {
      (u.concepts || []).forEach(function (c) { (unitsBy[c] = unitsBy[c] || []).push(u.n); });
    });
    var min = opts.min || COVER_MIN, rows = [], problems = [];
    var fam = familyCounts(opts);
    Object.keys(C.concepts).forEach(function (k) {
      var d = C.concepts[k] || {};
      var fams = Array.isArray(d.bank) ? d.bank : (/^(qr|conv|rc|tc)\./.test(k) ? [k] : []);
      var exempt = d.items === false;
      var re = d.bre ? new RegExp(d.bre, 'i') : null, kre = d.kre ? new RegExp(d.kre, 'i') : null;
      var n = fams.length ? pool.filter(function (i) {
        return fams.indexOf(i.fam) > -1 && (!re || re.test(i.ex)) && (!kre || kre.test(i.ans.trim()));
      }).length : 0;
      if (!exempt && !fams.length) problems.push(k + ': ไม่ได้ผูกคลังข้อ (ต้องระบุ items:false ถ้าเป็นทักษะล้วน)');
      else if (!exempt && n < min) problems.push(k + ': ' + n + ' ข้อ < ' + min);
      if (!exempt) fams.forEach(function (f) { if (!(fam[f] > 0)) problems.push(k + ': แฟมิลี ' + f + ' ไม่มีข้อในคลัง'); });
      rows.push({ c: k, t: d.t || k, skill: d.skill || 'mixed', families: fams, items: n, exempt: exempt, units: unitsBy[k] || [] });
    });
    rows.sort(function (a, b) { return a.items - b.items || (a.c < b.c ? -1 : 1); });
    var live = rows.filter(function (r) { return !r.exempt; });
    var counts = live.map(function (r) { return r.items; }).sort(function (a, b) { return a - b; });
    return {
      ready: true, concepts: rows.length, withItems: live.length, exempt: rows.length - live.length,
      min: counts[0], max: counts[counts.length - 1],
      median: counts[Math.floor(counts.length / 2)],
      underMin: live.filter(function (r) { return r.items < min; }).length,
      zero: live.filter(function (r) { return !r.items; }).length,
      families: Object.keys(fam).length, familyCounts: fam,
      extraItems: (S && Array.isArray(S.items)) ? S.items.length : 0,
      problems: problems, rows: rows,
      pass: problems.length === 0
    };
  }
  function structureExtraAudit(opts) {
    var S = sxDoc(opts);
    if (!S || !Array.isArray(S.items)) return { ready: false, reason: 'ต้องมี structure-extra.js' };
    var problems = [], ids = {}, prompts = {}, fams = {}, pos = { 0: 0, 1: 0, 2: 0, 3: 0 }, diff = { 1: 0, 2: 0, 3: 0 };
    S.items.forEach(function (x) {
      if (ids[x.i]) problems.push('id ซ้ำ: ' + x.i); ids[x.i] = 1;
      if (prompts[x.prompt + '|' + x.s]) problems.push('ข้อความซ้ำ: ' + x.i); prompts[x.prompt + '|' + x.s] = 1;
      fams[x.f] = (fams[x.f] || 0) + 1;
      if (!Array.isArray(x.o) || x.o.length !== 4) problems.push(x.i + ': ต้องมี 4 ตัวเลือก');
      else if (new Set(x.o).size !== 4) problems.push(x.i + ': ตัวเลือกซ้ำ');
      if (!(x.a >= 0 && x.a < 4)) problems.push(x.i + ': index คำตอบผิด'); else pos[x.a]++;
      if ([1, 2, 3].indexOf(x.d) < 0) problems.push(x.i + ': difficulty ผิด'); else diff[x.d]++;
      if (!x.w || String(x.w).length < 30) problems.push(x.i + ': คำอธิบายสั้นเกิน');
      if (!x.h) problems.push(x.i + ': ไม่มีคำใบ้');
      if (!x.s && !x.p) problems.push(x.i + ': ไม่มีบริบท/คำถาม');
      if (/[\u4e00-\u9fff\u0400-\u04ff\u3040-\u30ff\uac00-\ud7af]/.test(String(x.w) + String(x.h) + String(x.s) + String(x.p))) problems.push(x.i + ': มีอักษรต่างภาษาเล็ดลอด');
    });
    var total = S.items.length;
    var maxPerPos = Math.max(pos[0], pos[1], pos[2], pos[3]);
    return {
      ready: true, items: total, families: Object.keys(fams).length, byFamily: fams,
      answerPositions: pos, difficulty: diff, problems: problems,
      pass: problems.length === 0 && maxPerPos <= Math.ceil(total / 4) + 2
    };
  }

  /* ------------------------------------------------------------------ 4h. sight-word encounter (C8b)
     C8b: คำผ่านตา (คำที่เรียนแล้วแต่เดิมไม่เคยถูกถาม) ต้องมี “ที่ให้เจอ” ในแอปจริง
     นับตามคำ (word-boundary + รูปผันพื้นฐาน) จาก 4 แหล่ง: ชุดสอบ · คลังเสริมโครงสร้าง · บทอ่านเสริม · คลังบริบทคำผ่านตา
     เกณฑ์ผ่าน: ทุกคำผ่านตามีบริบทอย่างน้อยหนึ่งแห่ง (inApp = total) และรายงานแยกว่ากี่คำอยู่ใน “ข้อความแนวข้อสอบ” */
  var SW_SUFFIX = '(s|es|ed|d|ing|ly|er|est|ies|ied)?';
  function swNorm(s) {
    return ' ' + String(s || '').toLowerCase().replace(/[\u2019]/g, "'").replace(/[^a-z' -]/g, ' ')
      .replace(/\s+/g, ' ').trim() + ' ';
  }
  function swHas(text, word) {
    var k = String(word || '').toLowerCase().replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!k) return false;
    if (k.indexOf(' ') > -1) return text.indexOf(' ' + k + ' ') > -1;
    var esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z])' + esc + SW_SUFFIX + '([^a-z]|$)').test(text);
  }
  function sightWordCoverage(opts) {
    opts = opts || {};
    var path = opts.path || W.TGAT1_PATH_DATA;
    if (!path || !Array.isArray(path.chapters)) return { ready: false, reason: 'ต้องมี learning-path-data.js' };
    var bank = opts.bank || W.VLT_BANK;
    var uniq = [], seen = {};
    path.chapters.forEach(function (ch) {
      (ch.words || []).forEach(function (w) { if (!seen[w]) { seen[w] = 1; uniq.push(w); } });
    });
    var bankText = (Array.isArray(bank) ? bank : []).map(function (q) {
      return [q.context || '', q.prompt || '', (q.options || []).join(' '), q.explanation || ''].join(' ');
    }).join(' \n ');
    var S = opts.extra || W.TGAT1_STRUCTURE_EXTRA, R = opts.reading || W.TGAT1_READING, C = opts.context || W.TGAT1_SIGHT_CONTEXT;
    var extraText = (S && Array.isArray(S.items)) ? S.items.map(function (x) {
      return [x.s || '', x.p || '', (x.o || []).join(' '), x.w || ''].join(' ');
    }).join(' \n ') : '';
    var readingText = (R && Array.isArray(R.passages)) ? R.passages.map(function (p) {
      return [p.text || '', (p.items || []).map(function (i) { return [i.prompt, (i.options || []).join(' '), i.why].join(' '); }).join(' ')].join(' ');
    }).join(' \n ') : '';
    var ctxText = '';
    if (C) {
      ctxText = ((C.passages || []).map(function (p) { return p.text || ''; }).join(' \n ')) + ' \n ' +
        ((C.sentences || []).map(function (x) { return x.s || ''; }).join(' \n '));
    }
    var T = { bank: swNorm(bankText), extra: swNorm(extraText), reading: swNorm(readingText), context: swNorm(ctxText) };
    var sources = ['bank', 'extra', 'reading', 'context'], counts = { bank: 0, extra: 0, reading: 0, context: 0 };
    var rows = uniq.map(function (w) {
      var hit = [];
      sources.forEach(function (k) { if (T[k] && swHas(T[k], w)) hit.push(k); });
      hit.forEach(function (k) { counts[k]++; });
      var examLike = hit.indexOf('bank') > -1 || hit.indexOf('extra') > -1 || hit.indexOf('reading') > -1;
      return { w: w, sources: hit, examLike: examLike };
    });
    var missing = rows.filter(function (r) { return !r.sources.length; }).map(function (r) { return r.w; });
    var onlyContext = rows.filter(function (r) { return r.sources.length && !r.examLike; }).length;
    var examLike = rows.filter(function (r) { return r.examLike; }).length;
    return {
      ready: true, words: rows.length, inApp: rows.length - missing.length,
      examLike: examLike, onlyContext: onlyContext,
      bySource: counts, missing: missing.slice(0, 60), missingCount: missing.length,
      contextPassages: (C && C.passages || []).length, contextSentences: (C && C.sentences || []).length,
      rows: rows, pass: missing.length === 0
    };
  }
  function sightContextAudit(opts) {
    var C = (opts && opts.context) || W.TGAT1_SIGHT_CONTEXT;
    if (!C) return { ready: false, reason: 'ต้องมี sight-context.js' };
    var problems = [], ids = {}, titles = {}, wordCount = 0;
    (C.passages || []).forEach(function (p) {
      if (ids[p.id]) problems.push('id ซ้ำ: ' + p.id); ids[p.id] = 1;
      if (titles[p.title]) problems.push('ชื่อบทซ้ำ: ' + p.title); titles[p.title] = 1;
      var n = String(p.text || '').split(/\s+/).filter(Boolean).length;
      wordCount += n;
      if (n < 120 || n > 200) problems.push(p.id + ': ความยาว ' + n + ' คำ (ต้อง 120–200)');
      if (!Array.isArray(p.words) || p.words.length < 4) problems.push(p.id + ': คำเป้าหมายน้อยกว่า 4 คำ');
      if (/[\u0E00-\u0E7F]/.test(p.text)) problems.push(p.id + ': บทอ่านต้องเป็นภาษาอังกฤษ');
    });
    var seenW = {};
    (C.sentences || []).forEach(function (x, i) {
      if (!x.w || !x.s) { problems.push('ประโยคที่ ' + i + ' ไม่ครบข้อมูล'); return; }
      if (seenW[x.w]) problems.push('คำซ้ำในประโยคบริบท: ' + x.w); seenW[x.w] = 1;
      if (!swHas(swNorm(x.s), x.w)) problems.push(x.w + ': ประโยคไม่มีคำนี้');
      if (/[\u0E00-\u0E7F]/.test(x.s)) problems.push(x.w + ': ประโยคต้องเป็นภาษาอังกฤษ');
      if (String(x.s).split(/\s+/).length < 5) problems.push(x.w + ': ประโยคสั้นเกิน');
    });
    return {
      ready: true, passages: (C.passages || []).length, sentences: (C.sentences || []).length,
      words: wordCount, problems: problems, pass: problems.length === 0
    };
  }

  /* ------------------------------------------------------------------ 4d. QR difficulty calibration (C6c step 2)
     ความยากของข้อ Question–Response ตัดสินด้วย "ขั้นตอนตัดสิน" ที่เขียนไว้ใน DIFFICULTY-RUBRIC.md §4
     (R3 สำนวนเปรียบเปรย · R4 คำขอเชิงสุภาพที่ตอบด้วยตรรกะกลับด้าน · R5 คำถาม tag/ปฏิเสธที่ต้องอ่านเจตนา
      · R6 ตอบอ้อมหนึ่งขั้น · R7 ตอบตรง) แล้วจึงตามด้วย QR_HAND = คำตัดสินของคนที่กฎจับไม่ได้
     ทุกข้อต้องผ่าน 2 ด่าน: (1) ป้ายตรงกับ R3–R7/HAND  (2) ชุดยังอยู่ในกรอบ ง่าย 1–4 · กลาง 4–8 · ยาก 1–4
     ตัวเลขรวมของคลัง (22/112/66) ไม่ได้ไหลตามกรอบ 20/60/20 เพราะคลัง QR ถูกเขียนให้มีสำนวนและ
     การตอบอ้อมเยอะกว่าที่กรอบนั้นคาด — ตัวเลขจริงคือผลลัพธ์ ไม่ใช่เป้าที่ต้องบิดป้ายให้ถึง */
  var QR_EXTRA_IDIOMS = ['in two minds', 'back to square one', 'no wonder', 'third time lucky', 'in the nick of time',
    'better off', 'no harm done', 'the more the merrier', 'wouldn’t count on it', 'you must be', 'pull your leg', 'pull someone’s leg',
    'up to you', 'my cup of tea', 'on thin ice', 'not rocket science', 'long story short', 'cost a fortune', 'get the picture',
    'give me a hand', 'lend me a hand', 'go dutch', 'kill two birds', 'a piece of cake', 'have a word with'];
  var QR_HAND = {
    'S05-Q001': [2, 'ตอบด้วยคำถามกลับ/ชี้ให้ไปถามฝ่ายอื่น ไม่ได้ให้คำตอบตรง'],
    'S08-Q006': [2, 'ปฏิเสธอ้อมและขอเลื่อนนัด'],
    'S20-Q009': [2, 'เสนอทางเลือกแทนข้อเสนอเดิม'],
    'S15-Q008': [2, 'ปฏิเสธอ้อม (มีเพียงแบงก์ยี่สิบ)'],
    'S10-Q004': [2, 'ตอบแบบมีเงื่อนไข ไม่ใช่ตอบตรง'],
    'S13-Q001': [2, 'ตอบรับแบบมีเงื่อนไข (อายุเกินสิบ)'],
    'S12-Q006': [2, 'สูตรสนทนา No worries + ข้อมูลประกอบ'],
    'S13-Q005': [2, 'Any time = สูตรตอบรับคำขอบคุณ'],
    'S08-Q008': [2, 'By all means = สูตรตอบรับ'],
    'S20-Q010': [1, 'ยืนยันตรงด้วย Right + เหตุผลสั้น'],
    'S17-Q006': [2, 'ตอบรับแล้วขอให้ทำสิ่งอื่นต่อ'],
    'S17-Q002': [3, 'สำนวน not rocket science'],
    'S18-Q005': [3, 'สำนวน beat around the bush'],
    'S20-Q005': [3, 'สำนวน on thin ice'],
    'S08-Q010': [3, 'สำนวน fingers crossed'],
    'S10-Q005': [3, 'สำนวน blew me away'],
    'S08-Q009': [3, 'สำนวน would not count on it']
  };
  var QR_IDIOMS = IDIOMS.concat(QR_EXTRA_IDIOMS);

  function qrLoose(text) { return String(text || '').toLowerCase().replace(/[\u2018\u2019]/g, "'"); }
  function qrNorm(text) {
    return qrLoose(text)
      .replace(/[^a-z0-9' ]+/g, ' ')
      .replace(/\bn't\b/g, ' not').replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have')
      .replace(/'ll\b/g, ' will').replace(/'d\b/g, ' would').replace(/'m\b/g, ' am').replace(/'s\b/g, ' s')
      .replace(/\s+/g, ' ').trim();
  }
  function qrTok(text) { return qrNorm(text).split(' ').filter(Boolean); }
  function qrSame(a, b) { return a === b || a.indexOf(b) === 0 || b.indexOf(a) === 0 || a.slice(0, 4) === b.slice(0, 4); }
  function qrPhrase(text, list) {
    var t = qrTok(text);
    for (var i = 0; i < list.length; i++) {
      var p = qrTok(list[i]), n = p.length, hit = false;
      for (var j = 0; j + n <= t.length; j++) {
        var ok = true;
        for (var k = 0; k < n; k++) { if (!qrSame(t[j + k], p[k])) { ok = false; break; } }
        if (ok) { hit = true; break; }
      }
      if (hit) return list[i];
    }
    return null;
  }

  var QR_TAG = /(isn't it|aren't you|didn't you|don't you|doesn't it|wouldn't it|wasn't it|haven't you|hasn't it|won't you|shouldn't we|isn't there)\b[^?]*\?\s*$|,\s*right\s*\?\s*$/;
  var QR_NEGQ = /^(don't|doesn't|didn't|can't|couldn't|won't|wouldn't|aren't|isn't)\b/;
  var QR_MIND = /do you mind|would you mind/;
  var QR_SUGG = /^(why don't we|why not|how about|what about|shall we|shall i|let's|would you like|do you want|can you|could you|should we|would you prefer|do you think|can i|may i|is it ok|is it all right)\b/;
  var QR_CONCRETE = /\b(\d|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|half|quarter|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|morning|afternoon|evening|tonight|tomorrow|today|week|month|year|hour|minute|noon|night|free|sharp|outside|near|opposite|across|floor|street|road|station|hall|room|corner|gate|platform|desk|office|counter|library|cafe|bank|market|baht|dollar|mile|kilometre|meter)\b/;
  var QR_REDIRECT = /^(no need|better off|you had better ask|ask ms|ask mr|ask the|follow me|heading there|share it on|either is fine|whatever you|don't worry|instead|help yourself)/;
  var QR_REFUSE = /^(sorry|thanks but|i am afraid|not yet|i would rather not|no thanks|not really|happy to)\b/;
  var QR_FORMULA = /^(same here|any time|by all means|no harm done|lucky you|help yourself|no rush|take your time|no worries|no problem|my pleasure|never mind|good idea|sounds great|sounds good|of course|sure|congratulations|that would be great|that is great|you are welcome|come on in|not at all|it is ok|great|nice|well done)\b/;
  var QR_INVERT = /^(not at all|no problem|of course|sure|no |not really|by all means|absolutely|definitely|no need)/;
  var QR_PLAIN_YN = /^(yes|no|sure|of course|certainly|right|correct|exactly|true)\b/;
  var QR_REASON = /—|–|\bbecause\b|\bso\b|\bbut\b|\bthough\b|\bactually\b|\bif\b|\bthen\b|\bwhile\b/;

  /* ตัดสินระดับความยากของข้อ QR ข้อเดียว → { level, rule, why } */
  function qrRuleLabel(q) {
    if (!q) return { level: 2, rule: 'R6', why: 'ไม่มีข้อมูลข้อ' };
    var prompt = String(q.prompt || ''), answer = String((q.options || [])[q.answer] || '');
    var pLoose = qrLoose(prompt), pNorm = qrNorm(prompt), aNorm = qrNorm(answer);
    var aIdiom = qrPhrase(answer, QR_IDIOMS), pIdiom = qrPhrase(prompt, QR_IDIOMS);
    var mind = QR_MIND.test(pNorm), tag = QR_TAG.test(pLoose), neg = QR_NEGQ.test(pLoose.trim());
    var sugg = QR_SUGG.test(pNorm), conc = QR_CONCRETE.test(' ' + aNorm + ' ');
    var reason = QR_REASON.test(answer), redirect = QR_REDIRECT.test(aNorm), refuse = QR_REFUSE.test(aNorm);
    var formula = QR_FORMULA.test(aNorm);
    var plainYN = QR_PLAIN_YN.test(aNorm) && !/(no rush|no need|no worries|no problem|no thanks|not at all)/.test(aNorm);
    if (aIdiom) return { level: 3, rule: 'R3', why: 'สำนวน: ' + aIdiom };
    if (pIdiom) return { level: 3, rule: 'R3', why: 'สำนวนในคำถาม: ' + pIdiom };
    if (mind && QR_INVERT.test(aNorm)) return { level: 3, rule: 'R4', why: 'คำขอสุภาพ ตอบด้วยตรรกะกลับด้าน' };
    if (mind) return { level: 2, rule: 'R6', why: 'คำขอสุภาพ ตอบด้วยการยอมทำ/ขอโทษ' };
    if ((tag || neg) && !plainYN) return { level: 3, rule: 'R5', why: 'คำถาม tag/ปฏิเสธ ตอบอ้อม' };
    if (tag && plainYN && reason) return { level: 3, rule: 'R5', why: 'คำถาม tag ตอบพร้อมเหตุผล' };
    if (redirect && !conc) return { level: 2, rule: 'R6', why: 'เบนไปหาเจ้าของเรื่อง' };
    if (refuse) return { level: 2, rule: 'R6', why: 'ปฏิเสธ/เลี่ยงอย่างสุภาพ' };
    if (formula && !conc) return { level: 2, rule: 'R6', why: 'สูตรสนทนา ไม่ให้ข้อเท็จจริง' };
    if (conc && reason) return { level: 2, rule: 'R6', why: 'ให้ข้อเท็จจริงพร้อมเหตุผล/เงื่อนไข' };
    if (sugg && !conc) return { level: 2, rule: 'R6', why: 'ตอบข้อเสนอโดยไม่ให้ข้อเท็จจริง' };
    if (reason) return { level: 2, rule: 'R6', why: 'ตอบรับ/ปฏิเสธพร้อมเงื่อนไขหรือเหตุผล' };
    if (conc) return { level: 1, rule: 'R7', why: 'ตอบตรงด้วยข้อเท็จจริง' };
    if (plainYN) return { level: 1, rule: 'R7', why: 'ตอบรับ/ปฏิเสธตรง ๆ' };
    return { level: 2, rule: 'R6', why: 'ตอบอ้อม (ค่าเริ่มต้น)' };
  }

  /* C6c step 2: ตรวจว่า "ป้ายความยากที่ติดไว้" ตรงกับขั้นตอนตัดสิน R3–R7 + QR_HAND
     และชุดยังอยู่ในกรอบต่อชุด — คืนค่าตัวเลขจริงของคลังเพื่อใช้รายงาน/เทสต์ */
  function difficultyCalibration(bank) {
    bank = Array.isArray(bank) ? bank : (W.VLT_BANK || []);
    var qr = bank.filter(function (q) { return q && q.category === 'qr'; });
    if (!qr.length) return { ready: false, reason: 'ยังไม่โหลดคลังข้อสอบ' };
    var labels = { 1: 0, 2: 0, 3: 0 }, rules = {}, mismatches = [];
    var rows = [];
    qr.forEach(function (q) {
      var r = qrRuleLabel(q);
      var hand = QR_HAND[q.id];
      var expected = hand ? hand[0] : r.level;
      var rule = hand ? 'HAND' : r.rule;
      var why = hand ? hand[1] : r.why;
      labels[Number(q.difficulty)] = (labels[Number(q.difficulty)] || 0) + 1;
      rules[rule] = (rules[rule] || 0) + 1;
      rows.push({ id: q.id, set: Number(q.set), level: Number(q.difficulty), expected: expected, rule: rule });
      if (Number(q.difficulty) !== expected) mismatches.push({ id: q.id, label: Number(q.difficulty), expected: expected, rule: rule, why: why });
    });
    var bySet = {};
    rows.forEach(function (r) { (bySet[r.set] = bySet[r.set] || { 1: 0, 2: 0, 3: 0 })[r.level]++; });
    var setRows = Object.keys(bySet).map(Number).sort(function (a, b) { return a - b; }).map(function (n) {
      var d = bySet[n];
      return {
        set: n, easy: d[1], medium: d[2], hard: d[3],
        ok: d[1] >= 1 && d[1] <= 4 && d[2] >= 4 && d[2] <= 8 && d[3] >= 1 && d[3] <= 4
      };
    });
    var offMix = setRows.filter(function (r) { return !r.ok; });
    var handUsed = Object.keys(QR_HAND).filter(function (id) { return qr.some(function (q) { return q.id === id; }); });
    return {
      ready: true, items: qr.length, labels: labels, rules: rules,
      share: { easy: Math.round(labels[1] * 100 / qr.length), medium: Math.round(labels[2] * 100 / qr.length), hard: Math.round(labels[3] * 100 / qr.length) },
      mismatches: mismatches, setRows: setRows, offMix: offMix.map(function (r) { return r.set; }),
      handRules: handUsed.length, handDeclared: Object.keys(QR_HAND).length,
      pass: mismatches.length === 0 && offMix.length === 0 && handUsed.length === Object.keys(QR_HAND).length
    };
  }

  /* ------------------------------------------------------------------ 4i. structure coverage (C4)
     C4: เจ็ดหัวข้อไวยากรณ์ที่เคยขาด (used to/would · perfect continuous · future perfect · causative
     · so/such … that · both/either/neither · wish/if only) ต้องผ่านสองด้านพร้อมกัน
       (1) การสอน — ยูนิตที่รับผิดชอบมีเนื้อหา ≥1,500 ตัวอักษร · ตัวอย่าง ≥3 · กล่าวถึงชื่อโครงสร้างนั้นจริง
       (2) การฝึก — มีข้อในแฟมิลีของโครงสร้าง ≥16 ข้อ และเมื่อผ่านตัวกรอง bre/kre ของคอนเซปต์ที่ถือแฟมิลีนั้น
           แล้วยังเหลือข้อที่ผู้เรียนกดเข้าไปทำได้จริง ≥8 ข้อ (กันกรณี "เขียนข้อไว้แต่เด็กไม่เคยเห็น")
     ตัวเลขนี้วัดจากไฟล์จริงทุกครั้งที่เรียก ไม่ได้เก็บค่าคงที่ไว้ */
  /* C3b — ความลึกของเนื้อหาสอนรายยูนิต (ใช้ติดตามงานเขียนเนื้อหาที่ยังบาง)
     เกณฑ์เดียวกับ structureCoverage: เนื้อหาสอน >= 1,500 ตัวอักษร และมีตัวอย่างวิเคราะห์ >= 3 */
  /* C3b — ยูนิตที่เขียนไว้แต่ผู้เรียนเข้าไม่ถึง (ไม่ถูกอ้างในบทใดของเส้นทางเรียน) */
  function pathReach(opts) {
    opts = opts || {};
    var path = opts.path || W.TGAT1_PATH_DATA;
    var C = curDoc(opts);
    if (!path || !Array.isArray(path.chapters) || !C || !Array.isArray(C.units)) {
      return { ready: false, reason: 'ต้องมี learning-path-data.js และ learning-hub-curriculum.js' };
    }
    var used = {}, where = {};
    path.chapters.forEach(function (c) {
      (c.learn || []).forEach(function (l) {
        used[l.u] = true;
        (where[l.u] = where[l.u] || []).push({ chapter: c.n, role: l.role, mode: l.mode || null });
      });
    });
    var rows = C.units.map(function (u) {
      return { n: u.n, title: u.title, chapters: (where[u.n] || []).map(function (x) { return x.chapter; }),
        roles: (where[u.n] || []).map(function (x) { return x.role; }), reachable: !!used[u.n] };
    });
    var missing = rows.filter(function (r) { return !r.reachable; });
    return { ready: true, units: rows.length, reachable: rows.length - missing.length,
      missing: missing.length, missingList: missing.map(function (r) { return { n: r.n, title: r.title }; }),
      rows: rows, pass: missing.length === 0 };
  }

  /* C13 (v48.16.0): ชุดสำรองกันข้อซ้ำ
     นิยามที่ยืนยันกับผู้ใช้: ชุด 15–20 ถูกกันไว้ไม่ให้บทเรียนใช้ เพื่อไม่ให้ผู้เรียนเจอข้อเดิมซ้ำ
     - reservedSets ต้องอยู่ในช่วง 1..20 ไม่ซ้ำ
     - บทเรียน/บทอ่านต้องไม่อ้างเลขชุดที่ถูกกันไว้ (ถ้าอ้าง = ข้อซ้ำจะหลุดเข้าไปในบทเรียน)
     - ชุดที่ใช้เป็นข้อสอบจำลองต้องมาจาก reservedSets เท่านั้น
     - ชุดสำรองที่ยังไม่ถูกใช้ (tail) ต้องเหลืออย่างน้อย 1 ชุด มิฉะนั้น "กันสำรอง" หมดความหมาย
     - ทุกชุดที่ถูกกันไว้ต้องมี 60 ข้อและตรง blueprint 10/10/10/15/15 */
  function reservedSets(opts) {
    opts = opts || {};
    var P = W.TGAT1_PATH_DATA || {};
    var reserved = Array.isArray(P.reservedSets) ? P.reservedSets.slice() : [];
    var days = Array.isArray(P.days) ? P.days : [];
    var chapters = Array.isArray(P.chapters) ? P.chapters : [];
    var problems = [];

    if (!reserved.length) problems.push('ไม่พบ reservedSets ใน learning-path-data.js');
    reserved.forEach(function (n) {
      if (!Number.isInteger(n) || n < 1 || n > 20) problems.push('ชุด ' + n + ' อยู่นอกช่วง 1–20');
    });
    if (new Set(reserved).size !== reserved.length) problems.push('reservedSets มีเลขซ้ำ');

    /* เลขชุดที่บทเรียนอ้างถึง (ทั้ง ref และ set ใน act ของทุกบท) */
    var lessonSets = [];
    chapters.forEach(function (c) {
      var bucket = c.acts || c.act || [];
      bucket.forEach(function (a) {
        [a.ref, a.set].forEach(function (v) {
          if (v == null) return;
          var n = Number(v);
          if (Number.isInteger(n) && n >= 1 && n <= 20) lessonSets.push({ ch: c.n, set: n });
        });
      });
    });
    var clash = lessonSets.filter(function (x) { return reserved.indexOf(x.set) >= 0; });
    if (clash.length) {
      problems.push('บทเรียนอ้างชุดสำรอง: ' + clash.map(function (x) { return 'บท ' + x.ch + '→ชุด ' + x.set; }).join(', '));
    }

    var mockSets = [];
    days.forEach(function (d) { if (d.k === 'mock' && Number.isInteger(Number(d.set))) mockSets.push(Number(d.set)); });
    var mockUnique = Array.from(new Set(mockSets));
    var outside = mockUnique.filter(function (n) { return reserved.indexOf(n) < 0; });
    if (outside.length) problems.push('ข้อสอบจำลองใช้ชุดที่ไม่ได้กันไว้: ' + outside.join(', '));

    var tail = mockUnique.length ? reserved.filter(function (n) { return mockUnique.indexOf(n) < 0; }) : reserved.slice();
    if (!tail.length) problems.push('ชุดสำรองถูกใช้หมดแล้ว ไม่เหลือกันข้อซ้ำ');

    /* ตรวจชุดที่ถูกกันไว้ด้วย blueprint เดียวกับชุดสอบ */
    var bank = W.VLT_BANK || [];
    if (bank.length && W.TGAT1_QUALITY && typeof W.TGAT1_QUALITY.validateSet === 'function') {
      reserved.forEach(function (n) {
        var r = W.TGAT1_QUALITY.validateSet(n);
        if (r && !r.ok) problems.push('ชุด ' + n + ' ไม่ตรง blueprint: ' + ((r.problems || []).slice(0, 2).join(' / ')));
      });
    }

    return {
      ready: reserved.length > 0,
      reserved: reserved,
      mockUsed: mockUnique,
      tail: tail,
      lessonRefs: lessonSets.length,
      problems: problems,
      pass: problems.length === 0
    };
  }

  function unitDepth(opts) {
    opts = opts || {};
    var C = curDoc(opts);
    if (!C || !Array.isArray(C.units)) return { ready: false, reason: 'ต้องมี learning-hub-curriculum.js' };
    var rows = C.units.map(function (u) {
      var raw = JSON.stringify(u.learn || {});
      var o = {};
      try { o = JSON.parse(raw); } catch (_) { o = {}; }
      var ex = (o.ex || []).length, st = (o.steps || []).length, ru = (o.rules || []).length, tr = (o.traps || []).length;
      return { n: u.n, title: u.title, chars: raw.length, examples: ex, steps: st, rules: ru, traps: tr,
        ok: raw.length >= 1500 && ex >= 3 };
    });
    var chars = rows.map(function (r) { return r.chars; }).sort(function (a, b) { return a - b; });
    var below = rows.filter(function (r) { return !r.ok; }).sort(function (a, b) { return a.chars - b.chars; });
    return {
      ready: true, units: rows.length,
      passing: rows.length - below.length,
      below: below.length,
      minChars: chars[0], medianChars: chars[Math.floor(chars.length / 2)], maxChars: chars[chars.length - 1],
      belowList: below.map(function (r) { return { n: r.n, chars: r.chars, examples: r.examples, title: r.title }; }),
      rows: rows,
      pass: below.length === 0
    };
  }

  function structureCoverage(opts) {
    opts = opts || {};
    var C = curDoc(opts), S = sxDoc(opts);
    if (!C || !Array.isArray(C.units)) return { ready: false, reason: 'ต้องมี learning-hub-curriculum.js' };
    var rows = [], problems = [];
    Object.keys(STRUCTURE_ORDER).forEach(function (key) {
      var rule = STRUCTURE_ORDER[key];
      var unit = C.units.filter(function (u) { return u.n === rule.unit; })[0] || null;
      var learn = unit && unit.learn ? JSON.stringify(unit.learn) : '';
      var ex = 0;
      try { ex = ((JSON.parse(learn || '{}').ex) || []).length; } catch (_) { ex = 0; }
      var mention = !!unit && (rule.mustMention || /inversion/i).test(learn);
      var fams = rule.families || [];
      var authored = 0, reachable = 0, concept = null;
      if (C.concepts) {
        Object.keys(C.concepts).forEach(function (k) {
          var d = C.concepts[k] || {};
          if (fams.length && (d.bank || []).indexOf(fams[0]) > -1) concept = d;
        });
      }
      var re = (concept && concept.bre) ? new RegExp(concept.bre, 'i') : null;
      var kre = (concept && concept.kre) ? new RegExp(concept.kre, 'i') : null;
      if (S && Array.isArray(S.items) && fams.length) {
        S.items.forEach(function (x) {
          if (fams.indexOf(x.f) < 0) return;
          authored++;
          if (re && !re.test(String(x.w || '') + ' ' + String(x.s || ''))) return;
          if (kre && !kre.test(String((x.o || [])[x.a] || '').trim())) return;
          reachable++;
        });
      }
      var familyBased = fams.length > 0;
      var ok = !!unit && learn.length >= 1500 && ex >= 3 && mention && (!familyBased || (authored >= 16 && reachable >= 8));
      if (!ok) problems.push(key + ': ยูนิต ' + rule.unit + ' เนื้อหา ' + learn.length + ' ตัวอักษร · ตัวอย่าง ' + ex + ' · กล่าวถึง ' + mention + ' · ข้อ ' + authored + ' (เข้าถึงได้ ' + reachable + ')');
      rows.push({
        key: key, label: rule.label, unit: rule.unit, chapter: rule.chapter, families: fams,
        teachingChars: learn.length, examples: ex, mentions: mention,
        authored: authored, reachable: reachable, familyBased: familyBased, ok: ok
      });
    });
    var mins = rows.map(function (r) { return r.reachable; });
    return {
      ready: true, structures: rows.length,
      withItems: rows.filter(function (r) { return r.authored > 0; }).length,
      familyBased: rows.filter(function (r) { return r.familyBased; }).length,
      minReachable: (function () { var v = rows.filter(function (r) { return r.familyBased; }).map(function (r) { return r.reachable; }); return v.length ? Math.min.apply(null, v) : 0; })(),
      medianTeachingChars: (function () {
        var a = rows.map(function (r) { return r.teachingChars; }).sort(function (x, y) { return x - y; });
        return a[Math.floor(a.length / 2)];
      })(),
      rows: rows, problems: problems,
      pass: problems.length === 0
    };
  }

  /* ------------------------------------------------------------------ 5. settings bridge (A6) */
  // ตัวเลขแผนต้องมาจากที่เดียว: ตั้งค่าที่โปรไฟล์ แล้วทั้ง Hub และหน้าอื่นอ่านค่าเดียวกัน
  var SETTINGS_KEY = 'tgat1_english_studio_v1';
  // สำคัญ: app.js ประกาศ `let STUDIO_PROFILE` (ไม่ใช่ var) จึงไม่กลายเป็น property ของ window
  // ต้องอ่านผ่าน lexical binding ก่อนเสมอ ไม่งั้นจะได้ค่า default 120 แทนค่าที่ผู้ใช้ตั้งไว้
  function profile() {
    try { if (typeof STUDIO_PROFILE !== 'undefined' && STUDIO_PROFILE) return STUDIO_PROFILE; } catch (_) {}
    try { return (W.STUDIO_PROFILE || {}); } catch (_) { return {}; }
  }
  function setGoal(minutes) {
    var m = Math.max(15, Math.min(300, Math.round(Number(minutes) || 0)));
    if (!m) return null;
    try {
      var p = profile();
      if (p) {
        p.dailyGoal = m;
        if (typeof W.studioSave === 'function') W.studioSave(SETTINGS_KEY, p);
      }
      var hub = W.TGAT1Hub;
      if (hub && typeof hub.syncPlan === 'function') hub.syncPlan({ minutes: m });
      if (typeof W.studioToast === 'function') W.studioToast('ตั้งเป้า ' + m + ' นาที/วันแล้ว ทั้งแอปใช้ค่านี้');
      return m;
    } catch (e) {
      if (W.TGAT1_ERR) W.TGAT1_ERR(e, 'quality');
      return null;
    }
  }
  function effective() {
    var p = profile();
    var minutes = Number(p.dailyGoal);
    return {
      minutes: Number.isFinite(minutes) && minutes >= 15 ? minutes : 120,
      examDate: /^\d{4}-\d{2}-\d{2}$/.test(String(p.examDate || '')) ? p.examDate : '',
      targetScore: Number.isFinite(Number(p.target)) ? Number(p.target) : 75
    };
  }

  /* ------------------------------------------------------------------ public API */
  W.TGAT1_QUALITY = {
    BLUEPRINT: BLUEPRINT,
    validateSet: validateSet,
    passages: passages,
    words: words,
    hash: hash,
    wilson: wilson,
    scoreRange: scoreRange,
    audit: auditAll,
    curriculumAudit: curriculumAudit,
    curriculumDepth: curriculumDepth,
    wordRotation: wordRotation,
    idiomBankAudit: idiomBankAudit,
    readingExtendedAudit: readingExtendedAudit,
    conceptCoverage: conceptCoverage,
    sightWordCoverage: sightWordCoverage,
    sightContextAudit: sightContextAudit,
    structureExtraAudit: structureExtraAudit,
    COVER_MIN: COVER_MIN,
    usesIdiom: usesIdiom,
    wordCoverage: wordCoverage,
    idiomAudit: idiomAudit,
    qrRuleLabel: qrRuleLabel,
    difficultyCalibration: difficultyCalibration,
    structureCoverage: structureCoverage,
    unitDepth: unitDepth, reservedSets: reservedSets,
    pathReach: pathReach,
    QR_HAND: QR_HAND,
    idiomIn: idiomIn,
    IDIOMS: IDIOMS,
    requiresStructure: requiresStructure,
    settings: effective,
    setGoal: setGoal,
    // DevTools: TGAT1_QUALITY.audit() แล้วดูตารางต่อชุด / TGAT1_QUALITY.report() เพื่อคัดลอกเป็นข้อความ
    report: function () {
      var a = auditAll();
      if (!a.ready) return a.reason;
      var lines = ['TGAT1 blueprint ' + a.blueprint + ' — ชุดที่ตรงโครงสร้าง ' + a.conforming + '/' + a.sets];
      if (a.nonConforming.length) lines.push('ไม่ตรง: ' + a.nonConforming.join(' | '));
      if (a.optionProblems.length) lines.push('ปัญหาตัวเลือก: ' + a.optionProblems.slice(0, 20).join(' | '));
      if (a.difficultyProblems.length) lines.push('ความยากหลุดกรอบ: ' + a.difficultyProblems.slice(0, 20).join(' | '));
      if (a.emptyLevelSets.length) lines.push('ชุดที่ QR ขาดระดับใดระดับหนึ่ง: ' + a.emptyLevelSets.join(', '));
      var rd = a.passages.reading || {};
      lines.push('บทอ่าน (tc/rc) ' + rd.count + ' บท · สั้นกว่า 100 คำ: ' + rd.short + ' · ยาวเกิน 200 คำ: ' + rd.long +
        ' · ความยาว ' + rd.min + '–' + rd.max + ' คำ (มัธยฐาน ' + rd.median + ')');
      var sp = a.passages.speaking || {};
      lines.push('บทสนทนา (short/long) ' + sp.count + ' บท · ' + sp.min + '–' + sp.max + ' คำ (blueprint ไม่กำหนดความยาว)');
      var ida = idiomAudit();
      lines.push('ข้อที่คำตอบเป็นสำนวน: ' + ida.withIdiom + ' · ติดป้ายขัดกฎ: ' + ida.problems.length + (ida.problems.length ? ' → ' + ida.problems.slice(0, 8).map(function (x) { return x.id + '(' + x.kind + ')'; }).join(', ') : ''));
      var rx = readingExtendedAudit();
      if (rx.ready) lines.push('บทอ่านเสริม: ' + rx.passages + ' บท · ' + rx.genres + ' แนว · ' + rx.items + ' ข้อ · ' + rx.minWords + '–' + rx.maxWords + ' คำ/บท · ข้อคิดขั้นสูงขั้นต่ำ ' + rx.minHigher + '/บท · ปัญหา ' + rx.problems.length);
      var ib = idiomBankAudit();
      if (ib.ready) lines.push('คลังสำนวน Speaking: ' + ib.entries + ' สำนวน · ' + ib.functions + ' ฟังก์ชัน (ต่ำสุด ' + Math.min.apply(null, Object.keys(ib.perFn).map(function (k) { return ib.perFn[k]; })) + '/ฟังก์ชัน) · อ้างข้อในคลัง ' + ib.linked + ' · ปัญหา ' + ib.problems.length);
      var sc = structureCoverage();
      if (sc.ready) lines.push('หัวข้อไวยากรณ์ที่ต้องสอนก่อนสอบ: ' + sc.structures + ' โครง · ผ่าน ' + (sc.structures - sc.problems.length) + '/' + sc.structures +
        ' · เนื้อหาสอนมัธยฐาน ' + sc.medianTeachingChars + ' ตัวอักษร · ข้อที่เข้าถึงได้ต่ำสุด ' + sc.minReachable + ' ข้อ');
      var pr = pathReach();
      if (pr.ready) lines.push('ยูนิตที่ผู้เรียนเข้าได้: ' + pr.reachable + '/' + pr.units + ' · เข้าไม่ถึง ' + pr.missing +
        (pr.missing ? ' → ' + pr.missingList.map(function (x) { return 'ยูนิต ' + x.n; }).join(', ') : ''));
      var ud = unitDepth();
      if (ud.ready) lines.push('เนื้อหาสอนรายยูนิต: ผ่านเกณฑ์ ' + ud.passing + '/' + ud.units + ' ยูนิต · ต่ำกว่าเกณฑ์ ' + ud.below +
        ' · ความยาว ' + ud.minChars + '–' + ud.maxChars + ' ตัวอักษร (มัธยฐาน ' + ud.medianChars + ')' +
        (ud.below ? ' · บางที่สุด: ' + ud.belowList.slice(0, 5).map(function (x) { return 'ยูนิต ' + x.n + ' (' + x.chars + ')'; }).join(', ') : ''));
      var dc = difficultyCalibration();
      if (dc.ready) lines.push('ความยาก QR (calibrate): ง่าย ' + dc.labels[1] + ' · กลาง ' + dc.labels[2] + ' · ยาก ' + dc.labels[3] +
        ' (' + dc.share.easy + '/' + dc.share.medium + '/' + dc.share.hard + '%) · ป้ายไม่ตรงกฎ ' + dc.mismatches.length +
        ' · ชุดหลุดกรอบ ' + dc.offMix.length + ' · คำตัดสินของคน ' + dc.handRules + ' ข้อ');
      var wc = wordCoverage();
      if (wc.ready) lines.push('คำผ่านตา: ' + wc.words + ' คำ (หลัก ' + wc.core + ' + ผ่านตา ' + wc.expo + ') · ถูกถามได้ ' + wc.reachable + '/' + wc.words + ' · ครบทุกคำใน ' + wc.worstCycles + ' รอบ');
      var d = curriculumDepth();
      if (d.ready) lines.push('ความลึกบทเรียน: ผ่าน ' + d.passing + '/' + d.chapters + ' บท · เนื้อหา ' + d.minChars + '–' + d.maxChars + ' ตัวอักษร (มัธยฐาน ' + d.medianChars + ') · ตัวอย่าง ' + d.minExamples + '–' + d.medianExamples + ' ข้อ');
      var ca = curriculumAudit();
      if (ca.ready) {
        ca.coverage.forEach(function (c) {
          lines.push('โครงสร้าง ' + c.key + ': สอนที่ยูนิต ' + c.unit + ' (บท ' + c.chapter + ') · เนื้อหา ' + c.teachingChars + ' ตัวอักษร · ตัวอย่าง ' + c.examples + ' ข้อ · ข้อที่ใช้ ' + (c.items || 0) + ' · ข้อก่อนบทที่สอน ' + c.gaps);
        });
      }
      return lines.join('\n');
    }
  };

  function boot() {
    installMockGuard();
    try {
      if (W.console && console.info && W.VLT_BANK && W.VLT_BANK.length) {
        var a = auditAll();
        console.info('[TGAT1 quality] ชุดที่ตรง blueprint: ' + a.conforming + '/' + a.sets +
          ' · บทอ่านสั้นกว่า 100 คำ: ' + a.passages.short + ' · ยาวเกิน 200: ' + a.passages.long);
      }
    } catch (_) { /* audit is diagnostic only */ }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  W.addEventListener('load', function () { try { installMockGuard(); } catch (_) {} }, { once: true });
})();
