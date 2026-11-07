(() => {
  'use strict';

  /* ====================================================================
     настройки доставки ответа кирюше (необязательно)
     вариант 1: formspree. ответ придёт тебе на почту, ничего не видно юле.
       зарегистрируйся на formspree.io, создай форму и вставь ссылку вида
       https://formspree.io/f/xxxxxxxx
     вариант 2: телеграм. впиши свой ник без @. после анимации у юли
       появится кнопка, которая откроет чат с тобой с готовым текстом.
     если оба пустые, голубь просто красиво улетает.
     ==================================================================== */
  const CONFIG = {
    formspreeUrl: '',
    telegramUsername: ''
  };

  /* ====================================================================
     вопросы. тексты можно спокойно править
     ==================================================================== */
  const Q = [
    {
      key: 'атмосфера',
      title: 'какую атмосферу ты хочешь?',
      photo: 'images/couple-lift1.jpg', pos: '50% 28%', cap: 'мы с тобой в зеркальце',
      opts: [
        { e: '💕', t: 'романтичное', say: 'ага, значит ты хочешь романтики. тёплый свет, тихая музыка и я рядом' },
        { e: '🧸', t: 'уютное', say: 'ага, значит ты хочешь уюта. плед, тепло и никуда не спешим' },
        { e: '🏃‍♀️', t: 'активное', say: 'ага, значит ты хочешь движа. хорошо, кроссовки надеваем' },
        { e: '🔮', t: 'нишевое', say: 'ага, значит ты хочешь чего-то нишевого. найду местечко, о котором знаем только мы' }
      ]
    },
    {
      key: 'еда',
      title: 'что по еде?',
      photo: 'images/yulia-tangerine.jpg', pos: '50% 30%', cap: 'юленька с мандаринкой',
      opts: [
        { e: '🍝', t: 'покушаем в рестике', say: 'ага, значит ты проголодалась. накормлю как королеву' },
        { e: '🚫', t: 'ваще без еды', say: 'ага, значит без еды. будем сыты друг другом, а если что, перекусим по дороге' },
        { e: '🍳', t: 'с вайбом домашней готовки', say: 'ага, значит хочешь домашнего вайба. приготовим что-нибудь вместе, а командуешь ты' },
        { e: '☕', t: 'гоу где кофе всякий десертики', say: 'ага, значит ты сладкоежка. кофе, десертики и твоя ложка в моей тарелке' }
      ]
    },
    {
      key: 'занятие',
      title: 'чем займёмся?',
      photo: 'images/couple-yellow.jpg', pos: '45% 40%', cap: 'два лимончика',
      opts: [
        { e: '🌳', t: 'чёт на погулять скорее', say: 'ага, значит гуляем. держимся за ручки и болтаем обо всём на свете' },
        { e: '🎭', t: 'чёт культурное давай', say: 'ага, значит культурная программа. будем умными и красивыми' },
        { e: '🎮', t: 'с игровым вайбом гоу', say: 'ага, значит игровой вайб. поддаваться не обещаю, но могу' },
        { e: '🏋️', t: 'качнуться вместе', say: 'ага, значит качаемся вместе. ты следишь за моей техникой, я за твоей' }
      ]
    },
    {
      key: 'время',
      title: 'когда начнём?',
      photo: 'images/yulia-roof.jpg', pos: '45% 50%', cap: 'юленька на закате',
      opts: [
        { e: '🌅', t: 'утром', say: 'ага, значит утром. рано, но ради тебя встану' },
        { e: '☀️', t: 'днём', say: 'ага, значит днём. светло, спокойно и всё успеем' },
        { e: '🌇', t: 'на закате', say: 'ага, значит на закате. золотой час и ты в нём, фоткаю обязательно' },
        { e: '🌙', t: 'поздним вечером', say: 'ага, значит поздним вечером. ооо, у кого-то намёки. я всё понял' }
      ]
    },
    {
      key: 'цветочки',
      title: 'какие цветочки ты бы хотела???',
      photo: 'images/couple-bench.jpg', pos: '50% 40%', cap: 'помнишь эти?',
      free: true,
      placeholder: 'напиши, какие хочешь',
      fallback: 'на твой вкус, удиви меня',
      chips: ['сирень', 'альстромерии', 'пионы', 'тюльпаны', 'ромашки'],
      sayFn: v => 'ага, значит цветочки: «' + v + '». запомнил, будут именно такие'
    }
  ];

  const $ = s => document.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const wipe = $('#wipe');
  const card = $('#card');
  const pg = $('#pigeon');
  const env = $('#env');

  let cur = 0;
  let busy = false;
  let sending = false;
  let answers = [];

  /* ---------- экраны и облачный переход ---------- */
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
    $('#' + id).scrollTop = 0;
  }

  function transition(mid) {
    if (busy) return;
    busy = true;
    if (reduce) { mid(); busy = false; return; }
    wipe.classList.remove('go');
    void wipe.offsetWidth;
    wipe.classList.add('go');
    setTimeout(mid, 520);
    setTimeout(() => { wipe.classList.remove('go'); busy = false; }, 1150);
  }

  /* ---------- цветочки (рисуем svg кодом) ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function lilacSVG(seed) {
    const r = rng(seed);
    const cols = ['#b79be8', '#c9b3f2', '#a587dc', '#d8c8f7', '#9d7fd6', '#e2d6fa'];
    let s = '<svg viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">';
    s += '<path d="M60 200 C57 160 63 120 60 70" stroke="#8fb58a" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M60 178 C30 170 18 150 20 136 C44 138 58 156 60 178Z" fill="#a7c9a0"/>';
    s += '<path d="M60 158 C90 150 104 132 102 118 C78 120 62 138 60 158Z" fill="#b6d5ae"/>';
    for (let i = 0; i < 62; i++) {
      const t = r();
      const y = 10 + t * 128;
      const w = 6 + 30 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04));
      const x = 60 + (r() * 2 - 1) * w;
      const c = cols[Math.floor(r() * cols.length)];
      s += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + c + '">'
        + '<circle cx="3.2" cy="0" r="3.3"/><circle cx="-3.2" cy="0" r="3.3"/>'
        + '<circle cx="0" cy="3.2" r="3.3"/><circle cx="0" cy="-3.2" r="3.3"/>'
        + '<circle r="1.5" fill="#f6efff"/></g>';
    }
    return s + '</svg>';
  }

  function alstroSVG(seed) {
    const r = rng(seed);
    let s = '<svg viewBox="0 0 140 190" xmlns="http://www.w3.org/2000/svg">';
    s += '<path d="M70 190 C68 150 72 120 70 84" stroke="#8fb58a" stroke-width="4" fill="none" stroke-linecap="round"/>';
    s += '<path d="M70 160 C42 152 30 134 32 122 C54 124 68 140 70 160Z" fill="#a7c9a0"/>';
    s += '<g transform="translate(70 66)">';
    [0, 120, 240].forEach(a => {
      s += '<path transform="rotate(' + a + ')" d="M0 0 C-26 -22 -22 -58 0 -62 C22 -58 26 -22 0 0Z" fill="#f9c0d4"/>';
    });
    [60, 180, 300].forEach(a => {
      s += '<g transform="rotate(' + a + ')"><path d="M0 0 C-18 -18 -16 -48 0 -52 C16 -48 18 -18 0 0Z" fill="#ffd9c9"/>'
        + '<path d="M0 -4 L0 -34" stroke="#ffcf6b" stroke-width="3" stroke-linecap="round"/>';
      for (let i = 0; i < 6; i++) {
        s += '<circle cx="' + ((r() * 2 - 1) * 6).toFixed(1) + '" cy="' + (-8 - r() * 24).toFixed(1) + '" r="1.1" fill="#c2467a"/>';
      }
      s += '</g>';
    });
    s += '<circle r="4" fill="#ffe29a"/></g></svg>';
    return s;
  }

  let flowerSeed = 7;
  document.querySelectorAll('[data-flower]').forEach(el => {
    flowerSeed += 11;
    el.innerHTML = el.dataset.flower === 'lilac' ? lilacSVG(flowerSeed) : alstroSVG(flowerSeed);
  });

  /* ---------- падающие лепестки ---------- */
  (function petals() {
    if (reduce) return;
    const box = $('#petals');
    const cols = ['#f9c0d4', '#d8c8f7', '#ffd9c9', '#c9b3f2', '#fde3ee'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('i');
      p.className = 'petal';
      const s = 9 + Math.random() * 9;
      p.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;--s:' + s.toFixed(1) + 'px;--c:' + cols[i % cols.length]
        + ';--t:' + (16 + Math.random() * 14).toFixed(1) + 's;--r:' + (3 + Math.random() * 3).toFixed(1) + 's;--d:-' + (Math.random() * 24).toFixed(1)
        + 's;--sway:' + ((Math.random() * 2 - 1) * 90).toFixed(0) + 'px';
      box.appendChild(p);
    }
  })();

  /* ---------- открытка ---------- */
  function burst() {
    if (reduce) return;
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + Math.min(r.height / 2, innerHeight / 2);
    const cols = ['#f9c0d4', '#d8c8f7', '#ffd9c9', '#c9b3f2', '#fff'];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('i');
      p.className = 'petal';
      p.style.cssText = 'position:fixed;left:' + cx + 'px;top:' + cy + 'px;--s:' + (10 + Math.random() * 10) + 'px;--c:' + cols[i % cols.length]
        + ';animation:none;z-index:45';
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 190;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 1 },
        { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d - 40) + 'px) rotate(' + (Math.random() * 360) + 'deg) scale(1)', opacity: 1, offset: .6 },
        { transform: 'translate(' + Math.cos(a) * d * 1.1 + 'px,' + (Math.sin(a) * d + 90) + 'px) rotate(' + (Math.random() * 540) + 'deg) scale(.9)', opacity: 0 }
      ], { duration: 1500 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove();
    }
  }

  $('#cover').addEventListener('click', () => {
    if (card.classList.contains('open')) return;
    card.classList.add('open');
    burst();
  });

  $('#start').addEventListener('click', () => {
    answers = [];
    transition(() => { cur = 0; renderQ(0); show('s-quiz'); });
  });

  /* ---------- вопросы ---------- */
  function renderQ(i) {
    const q = Q[i];
    const prog = $('#progress');
    prog.innerHTML = '';
    Q.forEach((_, k) => {
      const d = document.createElement('span');
      d.className = 'dot' + (k < i ? ' done' : k === i ? ' now' : '');
      prog.appendChild(d);
    });

    const ph = $('#qphoto');
    ph.classList.remove('swap'); void ph.offsetWidth; ph.classList.add('swap');
    const img = $('#qimg');
    img.src = q.photo;
    img.style.objectPosition = q.pos || '50% 50%';
    $('#qcap').textContent = q.cap || '';
    $('#qtitle').textContent = q.title;
    $('#qback').hidden = i === 0;

    const opts = $('#opts');
    const free = $('#free');
    opts.innerHTML = '';

    if (q.free) {
      opts.hidden = true;
      free.hidden = false;
      const inp = $('#finput');
      inp.placeholder = q.placeholder || '';
      inp.value = answers[i] ? answers[i].t : '';
      const chips = $('#chips');
      chips.innerHTML = '';
      (q.chips || []).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.textContent = c;
        b.addEventListener('click', () => {
          const v = inp.value.trim();
          inp.value = v ? v + ', ' + c : c;
          inp.focus();
        });
        chips.appendChild(b);
      });
    } else {
      free.hidden = true;
      opts.hidden = false;
      q.opts.forEach((o, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'opt' + (answers[i] && answers[i].t === o.t ? ' sel' : '');
        b.style.animationDelay = (0.08 * k + 0.1) + 's';
        const e = document.createElement('span'); e.className = 'e'; e.textContent = o.e;
        const t = document.createElement('span'); t.textContent = o.t;
        b.append(e, t);
        b.addEventListener('click', () => choose(i, o, b));
        opts.appendChild(b);
      });
    }
  }

  function choose(i, o, btn) {
    if (busy) return;
    answers[i] = { t: o.t, say: o.say };
    document.querySelectorAll('#opts .opt').forEach(x => x.classList.remove('sel'));
    btn.classList.add('sel');
    setTimeout(() => advance(), 380);
  }

  function advance() {
    if (cur < Q.length - 1) {
      transition(() => { cur++; renderQ(cur); });
    } else {
      transition(() => { buildRoute(); show('s-route'); });
    }
  }

  $('#fnext').addEventListener('click', () => {
    const q = Q[cur];
    let v = $('#finput').value.trim();
    if (!v) v = q.fallback;
    answers[cur] = { t: v, say: q.sayFn(v) };
    advance();
  });
  $('#finput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#fnext').click(); });

  $('#qback').addEventListener('click', () => {
    if (cur === 0) return;
    transition(() => { cur--; renderQ(cur); });
  });

  /* ---------- маршрут выбора ---------- */
  function buildRoute() {
    const ol = $('#stops');
    ol.innerHTML = '';
    answers.forEach((a, i) => {
      const li = document.createElement('li');
      li.className = 'stop';
      li.style.animationDelay = (0.2 + i * 0.16) + 's';
      const num = document.createElement('span'); num.className = 'num'; num.textContent = String(i + 1);
      const box = document.createElement('div');
      const lab = document.createElement('small'); lab.className = 'lab'; lab.textContent = Q[i].key;
      const pick = document.createElement('b'); pick.className = 'pick'; pick.textContent = a.t;
      const say = document.createElement('p'); say.className = 'say'; say.textContent = a.say;
      box.append(lab, pick, say);
      li.append(num, box);
      ol.appendChild(li);
    });
    $('#s-route').classList.remove('packing');
  }

  $('#redo').addEventListener('click', () => {
    answers = [];
    transition(() => { cur = 0; renderQ(0); show('s-quiz'); });
  });

  /* ---------- отправка ---------- */
  function messageText() {
    return 'юля собрала идеальное свидание:\n' + answers.map((a, i) => Q[i].key + ': ' + a.t).join('\n');
  }

  function deliver() {
    if (!CONFIG.formspreeUrl) return;
    fetch(CONFIG.formspreeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ subject: 'юля собрала свидание', message: messageText() })
    }).catch(() => {});
  }

  function buildPicks() {
    const box = $('#picks');
    box.innerHTML = '';
    answers.forEach((a, i) => {
      const row = document.createElement('div');
      row.className = 'pick-row';
      row.style.animationDelay = (0.15 + i * 0.12) + 's';
      const k = document.createElement('span'); k.className = 'k'; k.textContent = Q[i].key;
      const v = document.createElement('span'); v.className = 'v'; v.textContent = a.t;
      row.append(k, v);
      box.appendChild(row);
    });
    const tg = $('#tg');
    if (CONFIG.telegramUsername && !CONFIG.formspreeUrl) {
      tg.href = 'https://t.me/' + CONFIG.telegramUsername.replace('@', '') + '?text=' + encodeURIComponent(messageText());
      tg.hidden = false;
    } else {
      tg.hidden = true;
    }
  }

  $('#send').addEventListener('click', async () => {
    if (sending) return;
    sending = true;
    deliver();

    const route = $('#s-route');
    route.classList.add('packing');
    await wait(350);
    env.classList.add('show');
    await wait(750);

    // карточки летят в конверт
    const er = env.getBoundingClientRect();
    const cx = er.left + er.width / 2, cy = er.top + er.height / 2;
    const stops = Array.from(document.querySelectorAll('.stop'));
    stops.forEach((li, i) => {
      const r = li.getBoundingClientRect();
      const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
      const tilt = i % 2 ? 1 : -1;
      li.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'translate(' + dx * 0.55 + 'px,' + dy * 0.55 + 'px) scale(.55) rotate(' + tilt * 6 + 'deg)', opacity: 1, offset: 0.6 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08) rotate(' + tilt * 14 + 'deg)', opacity: 0 }
      ], { duration: 900, delay: i * 260, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' });
    });
    await wait((stops.length - 1) * 260 + 1000);

    env.classList.add('closed');
    await wait(1500);

    // голубь прилетает за конвертом
    const W = innerWidth, H = innerHeight;
    const pw = pg.offsetWidth;
    const baseTop = pg.getBoundingClientRect().top;
    pg.style.opacity = '1';
    const inA = pg.animate([
      { transform: 'translate(' + (-pw - 40) + 'px,' + (H * 0.08) + 'px)' },
      { transform: 'translate(' + (W / 2 - pw / 2) + 'px,' + (H * 0.5 - 70 - baseTop - 60) + 'px)' }
    ], { duration: 1500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    await inA.finished;

    env.classList.add('gone');
    pg.classList.add('carrying');
    await wait(550);

    const outA = pg.animate([
      { transform: 'translate(' + (W / 2 - pw / 2) + 'px,' + (H * 0.5 - 70 - baseTop - 60) + 'px)' },
      { transform: 'translate(' + (W + 80) + 'px,' + (-baseTop - 40) + 'px)' }
    ], { duration: 1700, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
    await outA.finished;

    buildPicks();
    show('s-sent');
    inA.cancel(); outA.cancel();
    pg.classList.add('loop');
  });

})();
