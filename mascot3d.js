/* Itachi Journaling: 3D mascot companion.
   Loads a .glb model per character with Three.js, only after the page is ready.
   Adding a character: put models/<id>.glb next to index.html and add an entry to CHARS.
   Animation clips are matched by name: idle, happy, sad, tap (any clip whose name contains the word).
   If a model or WebGL is missing, the character's 2D artwork is shown instead and labelled as such. */
(() => {
  const V = "0.160.0", CDN = `https://cdn.jsdelivr.net/npm/three@${V}`;
  const T = (ar, en) => (typeof L === "function" ? L(ar, en) : ar);
  const CHARS = [
    // Each character can have its own personality: floating idle, particle colour and lines ([ar, en] pairs)
    {id: "yuki", name: "Yuki", url: "models/yuki.glb", art: 0, glow: 0x5d8cff, float: true, face: {eyes: [[-.15, .985], [.215, 1.005]], eyeR: .082},
      // App colours that match the character (only backgrounds and lines; green/red for profit and loss stay)
      theme: {dark: {bg: "#070a16", panel: "rgba(16,20,40,.86)", solid: "#11152b", soft: "#171c36", line: "rgba(130,150,255,.13)", muted: "#8b90a8"},
        light: {bg: "#e4e9f8", panel: "rgba(250,251,255,.8)", solid: "#f8f9ff", soft: "#edf0fb", line: "rgba(40,60,160,.1)", muted: "#6f7590"}},
      persona: "أنت «يوكي»، روح صغيرة ديال الثلج، لطيفة وهادئة، كتعاون متداول يفهم نتائجو. كتهضر بالدارجة بحنان وبجمل قصيرة، وكتشجّع على الهدوء والانضباط.", particle: 0xd6e6ff, lines: {
      hi: [["سلام! أنا يوكي ❄️ كليكي عليّ إلا بغيتي شي حاجة.", "Hi! I'm Yuki ❄️ Click me if you need anything."]],
      tap: [["هيهي، يدّك باردة بحالي 🥶", "Hehe, your hand is as cold as me 🥶"], ["❄️ بقا هادئ ومنظّم، أنا معاك.", "❄️ Stay calm and disciplined, I'm with you."],
        ["واش شربتي شي حاجة سخونة قبل ما تبدا؟ ☕", "Had something warm before trading? ☕"]],
      win: [["ياي! ❄️✨ ربحة نقية بحال الثلج!", "Yay! ❄️✨ A clean win, pure as snow!"], ["الثلج كيشطح معاك! بقا على نفس الخطة.", "The snow dances with you! Keep the same plan."]],
      loss: [["ما تقلقش… حتى الثلج كيذوب وكيرجع 🌨️", "Don't worry… even snow melts and comes back 🌨️"], ["خود نفس بارد، والصفقة الجاية بهدوء.", "Take a cool breath, the next trade calmly."]]}},
    {id: "ember", name: "Ember", url: "models/ember.glb", art: 1, glow: 0xff3040, float: true, particle: 0xff5a3c,
      // Dark face with glowing eyes: lids are the face colour and expressions are drawn in light
      face: {eyes: [[-.075, .96], [.105, .96]], eyeR: .064, skin: "#0b0709", ink: "#ffe3e3"},
      theme: {dark: {bg: "#0d0607", panel: "rgba(30,14,16,.86)", solid: "#1a0c0e", soft: "#231114", line: "rgba(255,90,90,.13)", muted: "#a88b8e"},
        light: {bg: "#f6e6e7", panel: "rgba(255,250,250,.8)", solid: "#fff8f8", soft: "#fbeeee", line: "rgba(160,30,40,.1)", muted: "#8a6f72"}},
      persona: "أنت «إمبر»، روح نارية صغيرة بقرون، مدرّب صارم ولكن عادل، كتهضر بالدارجة بجمل قصيرة ومباشرة على الانضباط واحترام الستوب، بلا ما تكون قاسي.",
      lines: {
        hi: [["إمبر هنا 🔥 الانضباط قبل الربح.", "Ember here 🔥 Discipline before profit."]],
        tap: [["🔥 واش الخطة ديال اليوم واجدة؟", "🔥 Is today's plan ready?"], ["ما كاينش دخول بلا ستوب. مفهوم؟", "No entry without a stop. Clear?"]],
        win: [["🔥 هاكا! نار منضبطة.", "🔥 That's it! Disciplined fire."], ["ربحة مزيانة. ما تكبّرش الحجم بسبب الحماس.", "Good win. Don't size up out of excitement."]],
        loss: [["الخسارة كتعلّم. شنو الغلطة؟ كتبها.", "Losses teach. What was the mistake? Write it down."], ["طفّي النار شوية، والصفقة الجاية بالخطة.", "Cool the fire, next trade by the plan."]]}},
    {id: "geeko", name: "Geeko", url: "models/geeko.glb", art: 2, glow: 0x9cff3a},
    {id: "dark", name: "Dark Ascendant", url: "models/dark.glb", art: 3, glow: 0xa060ff},
  ].filter(c => ["yuki", "ember"].includes(c.id));   // only characters whose 3D model is ready are offered (Geeko, Dark Ascendant: models still to make)
  const MOOD = {idle: null, win: 0x22c55e, loss: 0xef4444};
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {get: k => { try{ return localStorage.getItem(k); }catch(e){ return null; } }, set: (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} }};

  /* ---------- markup ---------- */
  const css = `
  #m3{position:fixed;left:14px;bottom:6px;z-index:60;width:124px;height:146px;pointer-events:none}
  .m3-glow{position:absolute;left:50%;bottom:4px;width:86px;height:22px;transform:translateX(-50%);border-radius:50%;
    background:radial-gradient(closest-side,var(--m3c,#5d8cff),transparent);opacity:.55;filter:blur(3px);animation:m3pulse 3.2s ease-in-out infinite;pointer-events:none}
  @keyframes m3pulse{50%{opacity:.3;transform:translateX(-50%) scale(.85)}}
  .m3-chat{position:absolute;bottom:calc(100% + 6px);left:0;width:330px;max-width:calc(100vw - 24px);background:rgba(14,14,19,.97);border:1px solid #2a2a33;border-radius:14px;
    box-shadow:0 12px 40px rgba(0,0,0,.55);display:none;flex-direction:column;pointer-events:auto;font:13px/1.55 system-ui;color:#e8e8ee;overflow:hidden}
  .m3-chat.on{display:flex}
  .m3-ch{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid #22222b}
  .m3-ch b{flex:1;font-size:13.5px}
  .m3-tabs{display:flex;gap:2px}
  .m3-tabs button,.m3-x2{background:none;border:0;color:#9a9aa8;cursor:pointer;padding:4px 7px;border-radius:7px;font:12px system-ui}
  .m3-tabs button.on{background:#22222b;color:#fff}
  .m3-log{max-height:300px;min-height:120px;overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
  .m3-m{padding:7px 10px;border-radius:11px;max-width:88%;white-space:pre-wrap;word-wrap:break-word}
  .m3-m.user{align-self:flex-end;background:#3b4bd8;color:#fff}
  .m3-m.assistant{align-self:flex-start;background:#1d1d26}
  .m3-sug{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 8px}
  .m3-sug button,.m3-feel button{background:#1b1b23;border:1px solid #2c2c37;color:#d6d6de;border-radius:999px;padding:4px 10px;font:12px system-ui;cursor:pointer}
  .m3-feel button.on{background:#3b4bd8;border-color:#3b4bd8;color:#fff}
  .m3-in{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #22222b}
  .m3-in input,.m3-mood textarea{flex:1;background:#121218;border:1px solid #2a2a33;border-radius:9px;color:#eee;padding:7px 9px;font:13px system-ui;outline:none}
  .m3-in button,.m3-mood .m3-save{background:#f2f2f2;color:#0a0a0a;border:0;border-radius:9px;padding:0 12px;font:600 12.5px system-ui;cursor:pointer}
  .m3-mood{padding:12px;display:none;flex-direction:column;gap:10px}
  .m3-chat.mood .m3-mood{display:flex}.m3-chat.mood .m3-log,.m3-chat.mood .m3-sug,.m3-chat.mood .m3-in{display:none}
  .m3-feel{display:flex;flex-wrap:wrap;gap:6px}
  .m3-mood textarea{min-height:56px;resize:vertical}
  .m3-mood .m3-save{align-self:flex-end;padding:7px 14px}
  body.m3-chatting .m3-say{display:none}
  /* Docked: the sidebar stays in view while the page scrolls, and the chat and speech bubble float next to it */
  /* The sidebar runs the full page height and the card sticks inside it, so it stays on screen while scrolling */
  /* Only "top" sticks (sticking to the bottom pushed the card over the menu items above it), and the card is
     opaque so the items that scroll under it are hidden instead of showing through */
  @media (min-width:901px){body.m3-docked-on #side{align-self:stretch}body.m3-docked-on .m3-dock{position:sticky;top:16px;z-index:2;background:var(--solid,#131315);box-shadow:0 0 0 6px var(--solid,#131315)}}
  .m3-pop{position:fixed !important;z-index:80}
  #m3.m3-docked .m3-think{right:6px;top:6px}
  .m3-sym{position:absolute;top:8px;left:62%;font:800 18px system-ui;color:#fff;text-shadow:0 0 8px var(--m3c,#5d8cff),0 0 2px #000;opacity:0;transform:translateY(4px);transition:opacity .25s,transform .25s;pointer-events:none;z-index:2}
  .m3-sym.on{opacity:1;transform:none;animation:m3float 1.6s ease-in-out infinite}
  @keyframes m3float{50%{transform:translateY(-4px)}}
  .m3-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .m3-acts button{background:#f2f2f2;color:#0a0a0a;border:0;border-radius:999px;padding:5px 12px;font:600 12px system-ui;cursor:pointer}
  .m3-acts button+button{background:#2a2a35;color:#ddd}
  .m3-think{position:absolute;top:18px;right:-30px;display:none;gap:4px;align-items:center;background:#f2f2f2;border-radius:14px;padding:7px 9px;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.35)}
  .m3-think:before,.m3-think:after{content:"";position:absolute;background:#f2f2f2;border-radius:50%}
  .m3-think:before{width:8px;height:8px;left:-3px;bottom:-5px}.m3-think:after{width:4px;height:4px;left:-8px;bottom:-10px}
  .m3-think.on{display:flex}
  .m3-think i,.m3-typing i{width:6px;height:6px;border-radius:50%;background:#555;animation:m3dot 1s infinite}
  .m3-typing{display:flex;gap:4px;padding:10px 12px}.m3-typing i{background:#9a9aa8}
  .m3-think i:nth-child(2),.m3-typing i:nth-child(2){animation-delay:.15s}.m3-think i:nth-child(3),.m3-typing i:nth-child(3){animation-delay:.3s}
  @keyframes m3dot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
  #m3 canvas{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;touch-action:none}
  #m3.m3-hot canvas,#m3.m3-drag canvas{pointer-events:auto;cursor:grab}
  #m3.m3-drag canvas{cursor:grabbing}
  .m3-bar{position:absolute;top:0;left:0;display:flex;gap:4px;opacity:0;transition:opacity .2s;pointer-events:none}
  #m3.m3-ui .m3-bar{opacity:1;pointer-events:auto}
  .m3-bar button{width:28px;height:28px;border-radius:8px;border:1px solid #2a2a33;background:rgba(14,14,19,.88);color:#d8d8de;cursor:pointer;font:13px/1 system-ui;display:grid;place-items:center;padding:0}
  .m3-bar button:hover{border-color:#55556a;color:#fff}
  .m3-menu{position:absolute;top:34px;left:0;background:rgba(14,14,19,.96);border:1px solid #2a2a33;border-radius:10px;padding:4px;display:none;pointer-events:auto;min-width:150px}
  .m3-menu.on{display:block}
  .m3-menu button{display:flex;justify-content:space-between;gap:10px;width:100%;background:none;border:0;color:#ddd;padding:7px 9px;border-radius:7px;font:12.5px system-ui;cursor:pointer;text-align:start}
  .m3-menu button:hover,.m3-menu button.on{background:#1f1f28;color:#fff}
  .m3-menu small{color:#777}
  .m3-say{position:absolute;bottom:100%;left:0;margin-bottom:6px;min-width:170px;max-width:240px;background:#f2f2f2;color:#0a0a0a;border-radius:12px;padding:8px 11px;font:13px/1.55 system-ui;box-shadow:0 6px 24px rgba(0,0,0,.45);opacity:0;transform:translateY(5px);transition:opacity .25s,transform .25s;pointer-events:none}
  .m3-say.on{opacity:1;transform:none}
  .m3-fb{position:absolute;left:10%;right:10%;top:8%;bottom:4%;background:url(mascots-art.webp) no-repeat;background-size:200% 200%;display:none;pointer-events:auto;cursor:pointer;
    -webkit-mask:radial-gradient(closest-side,#000 70%,transparent);mask:radial-gradient(closest-side,#000 70%,transparent)}
  .m3-note{position:absolute;bottom:0;left:0;right:0;text-align:center;font:11px/1.4 system-ui;color:#9a9aa8;display:none;pointer-events:none}
  #m3.m3-fallback .m3-fb,#m3.m3-fallback .m3-note{display:block}
  #m3.m3-fallback canvas{visibility:hidden}
  .m3-load{position:absolute;inset:auto 0 40% 0;text-align:center;font:12px system-ui;color:#777;display:none}
  #m3.m3-loading .m3-load{display:block}
  #m3.m3-mini{width:64px;height:64px}#m3.m3-mini .m3-say{display:none}
  .m3-bar button{width:24px;height:24px;font-size:11.5px}
  /* Docked in the sidebar on wide screens: a companion card that is part of the app */
  .m3-dock{margin-top:12px;border:1px solid var(--line,#26262e);border-radius:20px;background:rgba(127,127,140,.06);padding:4px 8px 10px;position:relative}
  .m3-dock .m3-dn{display:flex;flex-direction:column;align-items:center;gap:1px;text-align:center;padding:0 4px}
  .m3-dock .m3-dname{font-size:13px}
  .m3-dock .m3-dst{font-size:11.5px;color:var(--muted,#8a8a95);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.9em}
  body.m3-docked-on #side{position:relative;z-index:15}
  #m3.m3-docked{position:relative;left:auto !important;top:auto !important;bottom:auto !important;width:100%;height:150px;z-index:auto}
  #m3.m3-docked .m3-chat,#m3.m3-docked .m3-say{bottom:0;left:auto;right:auto;inset-inline-start:calc(100% + 22px)}
  #m3.m3-docked [data-a=move]{display:none}
  /* In the card the buttons sit at the bottom, under the feet, so they never cover the head */
  #m3.m3-docked .m3-bar{top:auto;bottom:2px;left:50%;transform:translateX(-50%)}
  #m3.m3-docked .m3-menu{top:auto;bottom:34px;left:50%;transform:translateX(-50%)}
  #m3.m3-docked.m3-mini{height:150px;width:100%}
  @media (max-width:700px){#m3{width:96px;height:114px;left:6px;bottom:6px}.m3-chat{width:calc(100vw - 16px)}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const box = document.createElement("div"); box.id = "m3";
  box.innerHTML = `<div class="m3-chat"><div class="m3-ch"><b class="m3-name"></b><div class="m3-tabs"><button data-t="chat" class="on">${T("دردشة", "Chat")}</button><button data-t="mood">${T("إحساسي", "Mood")}</button></div><button class="m3-x2" data-a="close">✕</button></div>
      <div class="m3-log"></div><div class="m3-sug"></div>
      <div class="m3-in"><input maxlength="300" placeholder="${T("سول على صفقاتك...", "Ask about your trades...")}"><button>${T("إرسال", "Send")}</button></div>
      <div class="m3-mood"><div>${T("كيفاش حاس دابا؟", "How do you feel right now?")}</div><div class="m3-feel"></div>
        <textarea placeholder="${T("شنو اللي فبالك؟ (اختياري)", "What's on your mind? (optional)")}"></textarea><button class="m3-save">${T("حفظ", "Save")}</button></div></div>
    <div class="m3-glow"></div><div class="m3-sym"></div><div class="m3-think"><i></i><i></i><i></i></div><div class="m3-say" id="m3Say"></div><canvas></canvas><div class="m3-fb"></div><div class="m3-note"></div><div class="m3-load">…</div>
    <div class="m3-bar"><button data-a="menu" title="${T("بدّل الشخصية", "Change character")}">☰</button><button data-a="reset" title="${T("رجّع الزاوية", "Reset view")}">⟲</button>
      <button data-a="chat" title="${T("المحلل الذكي", "AI Analyst")}">✦</button><button data-a="move" title="${T("حرّك", "Move")}">✥</button><button data-a="mini" title="${T("صغّر", "Minimise")}">–</button></div>
    <div class="m3-menu"></div>`;
  document.body.appendChild(box);
  const canvas = box.querySelector("canvas"), say = box.querySelector(".m3-say"), menu = box.querySelector(".m3-menu"), fb = box.querySelector(".m3-fb"), note = box.querySelector(".m3-note"), chatEl = box.querySelector(".m3-chat");
  let sayT, uiT;
  function speak(txt, ms = 4200){ say.innerHTML = txt; status(txt); positionPopups(); say.classList.add("on"); clearTimeout(sayT); sayT = setTimeout(() => say.classList.remove("on"), ms); }
  function showUi(){ box.classList.add("m3-ui"); clearTimeout(uiT); uiT = setTimeout(() => { if(!menu.classList.contains("on")) box.classList.remove("m3-ui"); }, 2500); }

  /* ---------- place: a card in the sidebar on wide screens, a small floating companion on phones ---------- */
  const dock = document.createElement("div"); dock.className = "m3-dock";
  dock.innerHTML = `<div class="m3-dn"><b class="m3-dname"></b><span class="m3-dst"></span></div>`;
  const wide = matchMedia("(min-width: 901px)");
  function status(html){ const el = dock.querySelector(".m3-dst"); if(el) el.textContent = String(html).replace(/<[^>]+>/g, ""); }
  function placeDock(){
    const side = document.getElementById("side");
    if(wide.matches && side){
      // Right under the main pages, before the account section, so it is visible without scrolling
      if(dock.parentNode !== side){ const secs = side.querySelectorAll(".sec"), at = secs[secs.length - 1] || side.querySelector(".spacer"); at ? side.insertBefore(dock, at) : side.appendChild(dock); }
      if(box.parentNode !== dock) dock.prepend(box);
      box.classList.add("m3-docked"); document.body.classList.add("m3-docked-on");
      // The sidebar scrolls inside itself, so the popups live outside it to avoid being cut off
      for(const el of [chatEl, say]){ if(el.parentNode !== document.body) document.body.appendChild(el); el.classList.add("m3-pop"); }
      positionPopups();
    } else {
      for(const el of [chatEl, say]){ if(el.parentNode !== box) box.prepend(el); el.classList.remove("m3-pop"); el.style.left = el.style.right = el.style.bottom = el.style.top = ""; }
      if(box.parentNode !== document.body) document.body.appendChild(box);
      dock.remove(); box.classList.remove("m3-docked"); document.body.classList.remove("m3-docked-on");
      // A position saved on a bigger screen may be off-screen here: go back to the corner
      const t = parseFloat(box.style.top), l = parseFloat(box.style.left);
      if(t > innerHeight - 120 || l > innerWidth - 100){ box.style.top = ""; box.style.left = ""; box.style.bottom = ""; }
    }
  }
  function positionPopups(){
    if(!box.classList.contains("m3-docked")) return;
    const r = dock.getBoundingClientRect(), right = r.left > innerWidth / 2;   // sidebar on the right (Arabic) or left (English)
    const upper = r.top + r.height / 2 < innerHeight / 2;   // card near the top: open downwards, else upwards
    for(const el of [chatEl, say]){
      if(upper){ el.style.top = Math.max(8, r.top) + "px"; el.style.bottom = "auto"; }
      else { el.style.bottom = Math.max(8, innerHeight - r.bottom) + "px"; el.style.top = "auto"; }
      if(right){ el.style.right = (innerWidth - r.left + 14) + "px"; el.style.left = "auto"; }
      else { el.style.left = (r.right + 14) + "px"; el.style.right = "auto"; }
    }
  }
  let lastScroll = 0;
  addEventListener("scroll", () => { lastScroll = performance.now(); positionPopups(); }, {passive: true, capture: true});
  addEventListener("resize", positionPopups, {passive: true});
  // The sidebar is re-rendered by the app (language, sign-in...), so the card is put back each time
  const sideEl = document.getElementById("side");
  if(sideEl) new MutationObserver(() => { if(wide.matches && dock.parentNode !== sideEl) placeDock(); }).observe(sideEl, {childList: true});
  wide.addEventListener("change", placeDock);
  placeDock();

  /* ---------- trade numbers from the journal ---------- */
  function stats(){
    try{
      const closed = trades.filter(t => pnl(t) !== null).sort(byTime), td = closed.filter(t => t.date === today());
      return {n: closed.length, today: td.reduce((s, t) => s + pnl(t), 0), todayN: td.length, wr: closed.length ? closed.filter(t => pnl(t) > 0).length / closed.length * 100 : 0, last: closed[closed.length - 1]};
    }catch(e){ return {n: 0, today: 0, todayN: 0, wr: 0}; }
  }
  function line(){
    const s = stats();
    if(!s.n) return T("سجّل أول صفقة ونبداو 🙂", "Log your first trade and we'll start 🙂");
    const a = [T(`نسبة الربح: <b>${s.wr.toFixed(0)}%</b> على ${s.n} صفقة.`, `Win rate: <b>${s.wr.toFixed(0)}%</b> over ${s.n} trades.`),
      s.todayN ? T(`اليوم: <b>${money(s.today)}</b> فـ${s.todayN} صفقة.`, `Today: <b>${money(s.today)}</b> over ${s.todayN} trades.`) : T("مازال ما سجّلتي حتى صفقة اليوم.", "No trades logged today yet."),
      T("بغيتي تحليل؟ كليكي على ✦", "Want an analysis? Click ✦")];
    return a[Math.floor(Math.random() * a.length)];
  }

  /* ---------- fallback (no WebGL or no model) ---------- */
  function fallback(c, why){
    box.classList.remove("m3-loading");
    box.classList.add("m3-fallback");
    if(c.art != null){ fb.style.backgroundPosition = `${(c.art % 2) * 100}% ${Math.floor(c.art / 2) * 100}%`; fb.style.display = ""; } else fb.style.display = "none";
    note.textContent = why === "webgl" ? T("المتصفح ما كيدعمش 3D", "3D is not supported here") : T(`صورة مؤقتة: الموديل 3D ديال ${c.name} ناقص`, `Placeholder: ${c.name}'s 3D model is missing`);
  }

  /* ---------- 3D ---------- */
  let pivot, snow, bones = null, _q, _e, lastActive = performance.now();
  for(const ev of ["pointermove", "keydown", "scroll", "touchstart"]) addEventListener(ev, () => {
    lastActive = performance.now();
    if(face && face.cur === "sleepy"){ drawExpr("neutral"); sym(""); }
  }, {passive: true, capture: true});
  // Rotate a bone relative to its rest pose (radians, local axes)
  function setBone(name, x, y, z){ const b = bones && bones[name]; if(!b) return; _e.set(x, y, z); _q.setFromEuler(_e); b.o.quaternion.copy(b.rest).multiply(_q); }
  const pickLine = arr => { const p = arr[Math.floor(Math.random() * arr.length)]; return T(p[0], p[1]); };
  let THREE, GLTFLoader, OrbitControls, DecalGeometry, loader, renderer, scene, cam, controls, mixer, model, actions = {}, current, cur, keyRim, home = null, idleBackT = 0, mood = "idle";
  const cache = {};
  const webgl = (() => { try{ const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }catch(e){ return false; } })();

  async function boot(){
    const saved = store.get("m3-char");
    cur = CHARS.find(c => c.id === saved) || CHARS[0];
    buildMenu();
    if(!webgl) return fallback(cur, "webgl");
    box.classList.add("m3-loading");
    try{
      // All modules download in parallel; the model file starts downloading at the same time
      const lib = p => import(`${CDN}/examples/jsm/${p}/+esm`);
      const first = CHARS.find(c => c.id === store.get("m3-char")) || CHARS[0];
      const prefetch = first && first.url ? fetch(first.url).catch(() => {}) : null;
      let MeshoptDecoder, RoomEnvironment;
      [THREE, {GLTFLoader}, {OrbitControls}, {DecalGeometry}, {MeshoptDecoder}, {RoomEnvironment}] = await Promise.all([
        import(`${CDN}/+esm`), lib("loaders/GLTFLoader.js"), lib("controls/OrbitControls.js"), lib("geometries/DecalGeometry.js"),
        lib("libs/meshopt_decoder.module.js"), lib("environments/RoomEnvironment.js")]);
      await prefetch;
      loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      renderer = new THREE.WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: "low-power"});
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));   // a small card does not need more pixels
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene = new THREE.Scene();
      scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x202028, .6));
      const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 4, 3); key.castShadow = true;
      key.shadow.mapSize.set(512, 512); Object.assign(key.shadow.camera, {left: -2, right: 2, top: 2, bottom: -2, near: .5, far: 12}); key.shadow.radius = 6; scene.add(key);
      keyRim = new THREE.PointLight(cur.glow, 3, 6, 2); keyRim.position.set(-1.2, 1.4, -1.4); scene.add(keyRim);
      const ground = new THREE.Mesh(new THREE.CircleGeometry(1.6, 40), new THREE.ShadowMaterial({opacity: .35}));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      // The model sits in a pivot at its feet so spins and tilts turn around the character itself
      pivot = new THREE.Group(); scene.add(pivot);
      _q = new THREE.Quaternion(); _e = new THREE.Euler();
      snow = makeParticles();
      cam = new THREE.PerspectiveCamera(28, 1, .05, 50);
      controls = new OrbitControls(cam, canvas);
      Object.assign(controls, {enablePan: false, enableDamping: true, dampingFactor: .08, rotateSpeed: .7, zoomSpeed: .6,
        minPolarAngle: Math.PI * .25, maxPolarAngle: Math.PI * .55});
      controls.addEventListener("start", () => { box.classList.add("m3-drag"); idleBackT = 0; });
      controls.addEventListener("end", () => { box.classList.remove("m3-drag"); idleBackT = 4; });
      new ResizeObserver(resize).observe(box); resize();
      hookPointer();
      await show(cur);
      requestAnimationFrame(loop);
    }catch(e){ console.warn("mascot", e); fallback(cur, "model"); }
  }
  function resize(){ if(!renderer) return; const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }

  function dispose(o){ o.traverse(n => { if(n.isMesh){ n.geometry.dispose(); [].concat(n.material).forEach(m => { for(const k in m){ if(m[k] && m[k].isTexture) m[k].dispose(); } m.dispose(); }); } }); }

  async function show(c){
    cur = c; store.set("m3-char", c.id); buildMenu();
    dock.querySelector(".m3-dname").textContent = c.name; if(typeof applyTheme === "function") applyTheme(); status(T("معاك فكل صفقة. كليكي عليّ باش نهضرو.", "With you on every trade. Click me to chat."));
    box.classList.remove("m3-fallback"); box.classList.add("m3-loading");
    let gltf;
    try{ gltf = cache[c.id] ||= await loader.loadAsync(c.url); }
    catch(e){ console.info("mascot: no model for", c.id, "-", c.url); delete cache[c.id]; if(model){ pivot.remove(model); model = null; mixer = null; } return fallback(c, "model"); }
    if(model){ pivot.remove(model); if(!cache[model.userData.id]) dispose(model); }
    model = gltf.scene; model.userData.id = c.id;
    model.traverse(n => { if(n.isMesh){ n.castShadow = true; n.frustumCulled = false; } });
    // Fit: 1.6 units tall, standing on the ground, centred
    model.scale.setScalar(1); model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(model), size = b.getSize(new THREE.Vector3()), s = 1.6 / Math.max(size.y, size.x * .8, .001);
    model.scale.setScalar(s); model.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(model), ctr = b2.getCenter(new THREE.Vector3());
    model.position.set(-ctr.x, -b2.min.y, -ctr.z);
    pivot.add(model); pivot.position.set(0, 0, 0); pivot.rotation.set(0, 0, 0); pivot.userData.act = null;
    // Camera framing and zoom limits
    const dist = 1.6 / 2 / Math.tan(cam.fov * Math.PI / 360) * 1.42;   // room for horns and ears at the top
    home = {pos: new THREE.Vector3(0, .95, dist), target: new THREE.Vector3(0, .78, 0)};
    cam.position.copy(home.pos); controls.target.copy(home.target);
    controls.minDistance = dist * .55; controls.maxDistance = dist * 1.6; controls.update();
    keyRim.color.set(MOOD[mood] ?? c.glow);
    box.style.setProperty("--m3c", "#" + keyRim.color.getHexString());
    // Animations
    mixer = new THREE.AnimationMixer(model); actions = {}; current = null;
    const find = key => { const want = (c.clips && c.clips[key]) || key; return gltf.animations.find(a => a.name === want) || gltf.animations.find(a => a.name.toLowerCase().includes(want.toLowerCase())); };
    for(const k of ["idle", "happy", "sad", "tap", "win2"]){ const clip = find(k); if(clip) actions[k] = mixer.clipAction(clip); }
    mixer.addEventListener("finished", () => play("idle"));
    // Rigged models without clips are animated bone by bone in code (Mixamo bone names)
    bones = {}; model.traverse(o => { if(o.isBone) bones[o.name.replace(/^mixamorig:?/, "")] = {o, rest: o.quaternion.clone()}; });
    if(!Object.keys(bones).length || gltf.animations.length) bones = null;    play("idle");
    // Small appear animation
    if(c.face) try{ face = model.userData.face ||= setupFace(model, c.face); } catch(e){ console.warn("mascot face", e); face = null; }
    else face = null;
    pivot.scale.setScalar(.01); pivot.userData.base = .01;
    snow.material.color.set(c.particle ?? c.glow);
    box.classList.remove("m3-loading");
    // On arrival: react to how the account is doing (or say hello when there are no trades yet)
    setTimeout(() => { if(accountMood()) moodCheck(true); else if(c.lines?.hi) speak(pickLine(c.lines.hi)); }, 900);
  }

  /* Facial expressions as small 3D decals stuck on each eye (the face texture is split into many
     UV islands, so painting the texture directly breaks up). Each decal has its own canvas drawn in
     eye-local units (x right, y up, 1 = eye radius) and is attached to the neck bone so it follows the head.
     Eye centres come from the character's settings ([x, y] on the fitted model, 1.6 units tall). */
  let face = null;
  function setupFace(root, cfg){
    let mesh; root.traverse(o => { if(o.isMesh && o.material && o.material.map && !mesh) mesh = o; });
    if(!mesh || !DecalGeometry) return null;
    const img = mesh.material.map.image, W = img.width, H = img.height;
    const tc = document.createElement("canvas"); tc.width = W; tc.height = H;
    const tctx = tc.getContext("2d", {willReadFrequently: true}); tctx.drawImage(img, 0, 0);
    pivot.scale.setScalar(1); pivot.rotation.set(0, 0, 0); pivot.position.set(0, 0, 0); pivot.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(), dir = new THREE.Vector3(0, 0, -1), o = new THREE.Vector3();
    const hitAt = (x, y) => { o.set(x, y, 5); ray.set(o, dir); return ray.intersectObject(mesh, false)[0] || null; };
    const colorAt = h => { if(!h || !h.uv) return null; const p = tctx.getImageData(Math.floor(h.uv.x * W), Math.floor(h.uv.y * H), 1, 1).data;
      return (p[0] + p[1] + p[2]) / 765 > .55 ? `rgb(${p[0]},${p[1]},${p[2]})` : null; };
    const holder = (bones && (bones.Head || bones.Neck)) ? (bones.Head || bones.Neck).o : root;
    const eyes = [], R = cfg.eyeR || .06, S = 128;
    for(const [ex, ey] of cfg.eyes){
      const side = ex < 0 ? -1 : 1, h = hitAt(ex, ey); if(!h) continue;
      const skin = cfg.skin || colorAt(hitAt(ex, ey + R * 1.6)) || colorAt(hitAt(ex - side * R * 1.9, ey)) || "rgb(232,228,253)";
      const n = h.face.normal.clone().transformDirection(mesh.matrixWorld).lerp(new THREE.Vector3(0, 0, 1), .5).normalize();
      const rot = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(), n, new THREE.Vector3(0, 1, 0)));
      const geo = new DecalGeometry(mesh, h.point, rot, new THREE.Vector3(R * 3.2, R * 3.2, R * 4));
      const cv = document.createElement("canvas"); cv.width = cv.height = S;
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const dm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, toneMapped: false}));
      dm.visible = false; dm.renderOrder = 2; scene.add(dm); holder.attach(dm);
      eyes.push({side, skin, cv, tex, dm});
    }
    return eyes.length ? {eyes, cur: "neutral", until: 0, blinkAt: 2} : null;
  }
  function drawExpr(kind){
    const f = face; if(!f || f.cur === kind) return;
    for(const e of f.eyes){
      const ctx = e.cv.getContext("2d"), S = e.cv.width;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
      e.dm.visible = kind !== "neutral";
      if(kind === "neutral") continue;
      ctx.save(); ctx.setTransform(-S / 3.2, 0, 0, -S / 3.2, S / 2, S / 2);   // eye-local units, y up (the decal mirrors x)
      const ink = (cur && cur.face && cur.face.ink) || "#1b1f4a", s = e.side;   // side of the face: outer corners droop, inner corners stay high
      ctx.fillStyle = e.skin; ctx.strokeStyle = ink; ctx.lineCap = "round"; ctx.lineWidth = .2;
      if(kind === "blink" || kind === "happy"){
        ctx.beginPath(); ctx.ellipse(0, 0, 1.3, 1.35, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();
        if(kind === "blink"){ ctx.moveTo(-.95, -.15); ctx.quadraticCurveTo(0, -.45, .95, -.15); }
        else { ctx.moveTo(-.9, -.35); ctx.quadraticCurveTo(0, .75, .9, -.35); }   // ^ ^
        ctx.stroke();
      } else if(kind === "sad"){
        // drooping upper lids: inner corner high, outer corner low
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 1.25, 1.3, 0, 0, Math.PI * 2); ctx.clip();   // keep the lid inside the eye
        ctx.beginPath(); ctx.moveTo(-1.5, 1.6); ctx.lineTo(1.5, 1.6); ctx.lineTo(1.5, s > 0 ? -.05 : .5); ctx.lineTo(-1.5, s > 0 ? .5 : -.05); ctx.closePath(); ctx.fill();
        ctx.lineWidth = .16; ctx.beginPath(); ctx.moveTo(-1.5, s > 0 ? .5 : -.05); ctx.lineTo(1.5, s > 0 ? -.05 : .5); ctx.stroke(); ctx.restore();
        ctx.lineWidth = .14; ctx.beginPath(); ctx.moveTo(-1, s > 0 ? 1.55 : 1.05); ctx.lineTo(1, s > 0 ? 1.05 : 1.55); ctx.stroke();   // worried brow
      } else if(kind === "surprised"){  // wide open eyes
        ctx.beginPath(); ctx.ellipse(0, 0, 1.35, 1.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(0, .05, 1.05, 1.3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(.3, .45, .22, 0, 7); ctx.fill();
      } else if(kind === "sleepy"){     // flat, almost closed eyes
        ctx.beginPath(); ctx.ellipse(0, 0, 1.3, 1.35, 0, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = .3; ctx.beginPath(); ctx.moveTo(-.85, -.2); ctx.lineTo(.85, -.2); ctx.stroke();
      } else if(kind === "focus"){      // narrowed, inner corners low: thinking hard
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 1.25, 1.3, 0, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.moveTo(-1.5, 1.6); ctx.lineTo(1.5, 1.6); ctx.lineTo(1.5, s > 0 ? .45 : -.1); ctx.lineTo(-1.5, s > 0 ? -.1 : .45); ctx.closePath(); ctx.fill();
        ctx.lineWidth = .16; ctx.beginPath(); ctx.moveTo(-1.5, s > 0 ? -.1 : .45); ctx.lineTo(1.5, s > 0 ? .45 : -.1); ctx.stroke(); ctx.restore();
      }
      ctx.restore(); e.tex.needsUpdate = true;
    }
    f.cur = kind;
  }
  // Little symbol above the head that goes with some expressions: "!!", "Zz", "?"
  const SYM = {surprised: "!!", sleepy: "Zz", focus: "?"};
  function sym(kind){ const el = box.querySelector(".m3-sym"); el.textContent = SYM[kind] || ""; el.classList.toggle("on", !!SYM[kind]); }
  function expr(kind, secs){ if(!face) return; drawExpr(kind); sym(kind); face.until = secs ? performance.now() / 1000 + secs : 0; }
  function stepFace(s){
    const f = face; if(!f) return;
    if(f.until && s > f.until){ f.until = 0; drawExpr(f.after || "neutral"); sym(f.after); f.after = null; }
    // Dozes off after 90 s without any activity, wakes up on the next move
    if(f.cur === "neutral" && !chat.busy && performance.now() - lastActive > 90e3){ drawExpr("sleepy"); sym("sleepy"); }
    if(f.cur === "neutral" && s > f.blinkAt){ drawExpr("blink"); f.until = s + .12; f.blinkAt = s + 2.5 + Math.random() * 3.5; }
  }

  /* Particles: a burst on a win, gentle falling ones on a loss (snow for Yuki) */
  function makeParticles(){
    const N = 70, g = new THREE.BufferGeometry(), pos = new Float32Array(N * 3).fill(-50);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const c = document.createElement("canvas"); c.width = c.height = 32; const x = c.getContext("2d");
    const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    const p = new THREE.Points(g, new THREE.PointsMaterial({size: .07, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
    p.frustumCulled = false; p.userData = {vel: new Float32Array(N * 3), life: new Float32Array(N), N, kind: ""}; scene.add(p); return p;
  }
  function emit(kind){
    const {vel, life, N} = snow.userData, pos = snow.geometry.attributes.position.array;
    for(let i = 0; i < N; i++){
      if(kind === "burst"){ const a = Math.random() * 6.283, s = .5 + Math.random() * .9; pos.set([0, .9, 0], i * 3); vel.set([Math.cos(a) * s, 1.2 + Math.random() * 1.3, Math.sin(a) * s], i * 3); life[i] = 1 + Math.random() * .7; }
      else { pos.set([(Math.random() - .5) * 1.8, 1.7 + Math.random() * 1.2, (Math.random() - .5) * 1.2], i * 3); vel.set([(Math.random() - .5) * .1, -(.22 + Math.random() * .2), 0], i * 3); life[i] = 3 + Math.random() * 3; }
    }
    snow.userData.kind = kind;
  }
  function stepParticles(dt){
    const {vel, life, N, kind} = snow.userData, pos = snow.geometry.attributes.position.array;
    for(let i = 0; i < N; i++){
      if(life[i] <= 0){ pos[i * 3 + 1] = -50; continue; }
      life[i] -= dt;
      if(kind === "burst") vel[i * 3 + 1] -= 2.4 * dt;
      else pos[i * 3] += Math.sin((life[i] + i) * 2) * .002;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
    }
    snow.geometry.attributes.position.needsUpdate = true;
  }
  // Reactions done in code, used when the model has no animation clip for them
  function act(kind, dur){ if(pivot) pivot.userData.act = {kind, t: 0, dur: dur || (bones ? {tap: 1.8, win: 2, loss: 3.2} : {tap: .9, win: 1.3, loss: 3.2})[kind] || 1}; }

  /* Bone poses for rigged models (axes found on Tripo's Mixamo rig):
     arms: z lowers/raises (right arm z- = up, left arm z+ = up), y brings them forward to the chest;
     spine and neck: z tilts back (+) or forward (-), y turns. */
  const look = {x: 0, y: 0};
  function bonePose(s, a, p){
    const env = a ? Math.sin(Math.min(1, p < .15 ? p / .15 : p > .85 ? (1 - p) / .15 : 1) * Math.PI / 2) : 0;
    const br = reduced ? 0 : Math.sin(s * 1.8);
    let rArm = [0, 0, .3 + br * .04], lArm = [0, 0, -.3 - br * .04], rFore = [0, 0, 0], lFore = [0, 0, 0];
    let spine = [0, 0, br * .025], neck = [0, look.x * .45, -look.y * .25];
    if(a && a.kind === "tap"){        // a small friendly nod (the hand wave was removed: it looked wrong on the rigs)
      neck = [.12 * env, neck[1], neck[2] - Math.sin(p * Math.PI * 2) * .18 * env];
    } else if(a && a.kind === "win"){ // claps in front of the chest
      const c = Math.abs(Math.sin(p * Math.PI * 9)) * .35;
      rArm = [0, (-1.15 + c) * env, .3 - .55 * env]; lArm = [0, (1.15 - c) * env, -.3 + .55 * env]; spine[2] += .08 * env;
    } else if(a && a.kind === "loss"){ // shoulders drop, head down
      rArm = [0, 0, .3 + .35 * env]; lArm = [0, 0, -.3 - .35 * env]; spine[2] -= .22 * env; neck = [0, neck[1] * (1 - env), -.4 * env];
    } else if(a && a.kind === "think"){ // hand to the chin while the AI thinks
      rArm = [0, -1.1 * env, .3 - .9 * env]; rFore = [0, -.6 * env, -.8 * env]; neck = [.2 * env, neck[1], neck[2] + .1 * env];
    }
    setBone("RightArm", ...rArm); setBone("LeftArm", ...lArm); setBone("RightForeArm", ...rFore); setBone("LeftForeArm", ...lFore);
    setBone("Spine1", ...spine); setBone("Neck", ...neck);
  }

  function play(name, once){
    const a = actions[name];
    if(!a){ if(name !== "idle") act({happy: "win", win2: "win", sad: "loss", tap: "tap"}[name] || name); return; }
    a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity); a.clampWhenFinished = !!once;
    if(current && current !== a) current.crossFadeTo(a, .35, false);
    a.play(); current = a;
  }
  function react(kind){
    mood = kind;
    if(keyRim){ keyRim.color.set(MOOD[kind] ?? cur.glow); box.style.setProperty("--m3c", "#" + keyRim.color.getHexString()); }
    const own = cur && cur.lines;
    // A trade much bigger than usual (win or loss) surprises it first: "!!"
    let big = false;
    try{ const c = trades.filter(t => pnl(t) !== null), avg = c.reduce((a, t) => a + Math.abs(pnl(t)), 0) / (c.length || 1), last = c.sort(byTime)[c.length - 1];
      big = c.length > 4 && last && Math.abs(pnl(last)) > avg * 2; }catch(e){}
    const feel = (k, secs) => { if(big && face){ expr("surprised", 1.6); face.after = k; setTimeout(() => expr(k, secs), 1600); } else expr(k, secs); };
    if(kind === "win"){ play(actions.happy ? "happy" : "win2", true); snow && emit("burst"); feel("happy", 3);
      speak(own?.win ? pickLine(own.win) : T("ربحة زوينة! 🎉 خليك على نفس الخطة.", "Nice win! 🎉 Stick to the plan.")); }
    else if(kind === "loss"){ play("sad", true); snow && emit("fall"); feel("sad", 4);
      speak(own?.loss ? pickLine(own.loss) : T("الخسارة جزء من اللعبة. واش احترمتي الستوب؟", "Losses are part of the game. Did you respect your stop?")); }
    else play("idle");
  }

  /* Pointer: the canvas only catches the mouse when it is over the model, so the terminal underneath stays clickable */
  function hookPointer(){
    const ray = new THREE.Raycaster(), v = new THREE.Vector2();
    document.addEventListener("pointermove", e => {
      if(!model || box.classList.contains("m3-drag")) return;
      const r = canvas.getBoundingClientRect();
      // The head follows the pointer
      look.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      look.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * .3)) / (innerHeight / 2)));
      if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){ box.classList.remove("m3-hot"); return; }
      v.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(v, cam);
      const hit = ray.intersectObject(model, true).length > 0;
      box.classList.toggle("m3-hot", hit); if(hit) showUi();
    }, {passive: true});
    let down = null;
    canvas.addEventListener("pointerdown", e => down = {x: e.clientX, y: e.clientY, t: performance.now()});
    canvas.addEventListener("pointerup", e => {
      if(down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 400){ play("tap", true); expr("happy", 1.6); openChat(!chatBox.classList.contains("on")); }
      down = null;
    });
    box.addEventListener("pointerenter", showUi);
  }

  let last = 0, acc = 0, visible = true;
  new IntersectionObserver(es => visible = es[0].isIntersecting).observe(box);
  function loop(now){
    requestAnimationFrame(loop);
    const dt = Math.min(.1, (now - last) / 1000 || 0); last = now; acc += dt;
    // 24 fps is plenty for gentle idle motion; while the page is scrolling the mascot pauses so scrolling stays smooth
    if(acc < 1 / 24 || document.hidden || !visible || performance.now() - lastScroll < 140 || box.classList.contains("m3-mini") || box.classList.contains("m3-fallback")) return;
    const step = acc; acc = 0;
    mixer && mixer.update(step);
    if(model){
      const s = now / 1000, ud = pivot.userData;
      ud.base += (1 - ud.base) * Math.min(1, step * 8);   // appear
      // Idle: breathing, floating for spirits, slowly looking around
      let y = reduced ? 0 : Math.sin(s * 1.8) * .008 + (cur.float ? .05 + Math.sin(s * 1.5) * .035 : 0);
      let rx = 0, ry = reduced ? 0 : Math.sin(s * .37) * .2, rz = 0, sy = 1 + (reduced ? 0 : Math.sin(s * 1.8) * .012);
      const a = ud.act;
      if(a && bones){ a.t += step; const p = Math.min(1, a.t / a.dur);
        bonePose(s, a, p);
        if(a.kind === "win") y += Math.abs(Math.sin(p * Math.PI * 3)) * .12 * (1 - p);
        if(p >= 1) ud.act = null; }
      else if(bones) bonePose(s, null, 0);
      else if(a){ a.t += step; const p = Math.min(1, a.t / a.dur);
        if(a.kind === "tap"){ rz = Math.sin(p * Math.PI * 4) * .16 * (1 - p); sy += Math.sin(p * Math.PI * 2) * .06 * (1 - p); y += Math.sin(p * Math.PI) * .08; }
        else if(a.kind === "win"){ y += Math.sin(p * Math.PI) * .38; ry += (1 - Math.pow(1 - p, 3)) * Math.PI * 2; sy += Math.sin(p * Math.PI * 2) * .07; }
        else if(a.kind === "loss"){ const k = p < .15 ? p / .15 : p > .85 ? (1 - p) / .15 : 1; rx = .24 * k; ry *= 1 - k; sy -= .08 * k; y -= .04 * k; }
        if(p >= 1) ud.act = null; }
      stepFace(s);
      pivot.position.y = y; pivot.rotation.set(rx, ry, rz);
      pivot.scale.set(ud.base / Math.sqrt(sy), ud.base * sy, ud.base / Math.sqrt(sy));
      stepParticles(step);
    }
    // Drift back to the front view a few seconds after the user lets go
    if(idleBackT > 0){ idleBackT -= step; if(idleBackT <= 0) idleBackT = -1; }
    if(idleBackT < 0 && home){ cam.position.lerp(home.pos, Math.min(1, step * 2)); controls.target.lerp(home.target, Math.min(1, step * 2)); if(cam.position.distanceTo(home.pos) < .01) idleBackT = 0; }
    controls.update();
    renderer.render(scene, cam);
  }

  /* ---------- toolbar ---------- */
  function buildMenu(){
    menu.innerHTML = CHARS.map(c => `<button data-c="${c.id}" class="${cur && c.id === cur.id ? "on" : ""}">${c.name}${c.test ? ` <small>${T("تجربة", "test")}</small>` : ""}</button>`).join("");
  }
  menu.addEventListener("click", e => { const b = e.target.closest("[data-c]"); if(!b) return; menu.classList.remove("on"); const c = CHARS.find(x => x.id === b.dataset.c);
    if(!renderer) return fallback(c, webgl ? "model" : "webgl"); show(c); });
  fb.addEventListener("click", () => { showUi(); speak(line()); });
  let mv = null;
  box.querySelector(".m3-bar").addEventListener("click", e => {
    const a = e.target.closest("button")?.dataset.a; showUi();
    if(a === "menu") menu.classList.toggle("on");
    if(a === "reset" && home){ cam.position.copy(home.pos); controls.target.copy(home.target); controls.update(); idleBackT = 0; }
    if(a === "chat") openChat(!chatBox.classList.contains("on"));
    if(a === "mini"){ box.classList.toggle("m3-mini"); }
  });
  // Move the whole companion with the ✥ handle (position remembered)
  box.querySelector("[data-a=move]").addEventListener("pointerdown", e => { e.preventDefault(); mv = {x: e.clientX, y: e.clientY, l: box.offsetLeft, t: box.offsetTop};
    const up = () => { mv = null; store.set("m3-pos", JSON.stringify([box.style.left, box.style.top])); removeEventListener("pointermove", mm); removeEventListener("pointerup", up); };
    const mm = ev => { if(!mv) return; box.style.left = Math.max(0, Math.min(innerWidth - box.offsetWidth, mv.l + ev.clientX - mv.x)) + "px";
      box.style.top = Math.max(0, Math.min(innerHeight - box.offsetHeight, mv.t + ev.clientY - mv.y)) + "px"; box.style.bottom = "auto"; };
    addEventListener("pointermove", mm); addEventListener("pointerup", up); });
  try{ const p = JSON.parse(store.get("m3-pos"));   // only a position that is still on screen
    if(p && p[1] && parseFloat(p[1]) < innerHeight - 120 && parseFloat(p[0]) < innerWidth - 100){ box.style.left = p[0]; box.style.top = p[1]; box.style.bottom = "auto"; } }catch(e){}

  /* ---------- chat with the AI analyst (Gemini, same setup as the AI Analyst page) and mood check-in ---------- */
  const chatBox = chatEl, log = chatEl.querySelector(".m3-log"), qIn = chatEl.querySelector(".m3-in input");
  const chat = {msgs: [], busy: false};
  const FEELS = [["😌", "هادئ", "Calm", "calm"], ["💪", "واثق", "Confident", "calm"], ["😰", "خايف", "Anxious", "bad"], ["🤑", "طمعان", "Greedy", "bad"], ["😤", "معصّب", "Frustrated", "bad"], ["😴", "عيّان", "Tired", "bad"]];
  let feel = null;
  const fmt = t => typeof fmtAi === "function" ? fmtAi(t) : String(t).replace(/[&<>]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"}[c]));
  function renderChat(){
    chatBox.querySelector(".m3-name").textContent = cur ? cur.name : "";
    log.innerHTML = chat.msgs.map(m => m.content ? `<div class="m3-m ${m.role}">${fmt(m.content)}${m.actions && m.actions.length ? `<div class="m3-acts">${m.actions.map(([d, t]) => `<button data-do="${d}">${t}</button>`).join("")}</div>` : ""}</div>`
      : `<div class="m3-m assistant m3-typing"><i></i><i></i><i></i></div>`).join("");
    log.scrollTop = log.scrollHeight;
    chatBox.querySelector(".m3-sug").innerHTML = chat.msgs.length > 2 ? "" : [T("علاش كنخسر؟", "Why am I losing?"), T("حلّل ليا اليوم", "Analyse my day"), T("شنو نبدّل هاد السيمانة؟", "What should I change this week?")]
      .map(q => `<button data-q="${q}">${q}</button>`).join("");
    chatBox.querySelector(".m3-feel").innerHTML = FEELS.map((f, i) => `<button data-f="${i}" class="${feel === i ? "on" : ""}">${f[0]} ${T(f[1], f[2])}</button>`).join("");
  }
  /* Character theme: IZUMI offers to recolour the app to match the character; the old look comes back any time */
  const themeStyle = document.createElement("style"); document.head.appendChild(themeStyle);
  const themeOn = () => store.get("m3-theme") === "on";
  function applyTheme(){
    window.cvReset && window.cvReset();   // the app caches theme colours
    const th = cur && cur.theme, on = themeOn() && th;
    document.documentElement.toggleAttribute("data-m3theme", !!on);
    if(!on){ themeStyle.textContent = ""; return; }
    const vars = p => `--bg:${p.bg};--panel:${p.panel};--solid:${p.solid};--soft:${p.soft};--line:${p.line};--muted:${p.muted}`;
    themeStyle.textContent = `:root[data-m3theme]{${vars(th.light)}}
      @media (prefers-color-scheme: dark){:root[data-m3theme]:not([data-theme="light"]){${vars(th.dark)}}}
      :root[data-m3theme][data-theme="dark"]{${vars(th.dark)}}`;
  }
  function setTheme(on){
    store.set("m3-theme", on ? "on" : "off"); applyTheme();
    chat.msgs.push({role: "assistant", content: on
      ? T("✨ تبدّل! دابا التطبيق بالألوان ديالي. إلا بغيتي ترجع، قولّي «رجّع الشكل القديم» ولا كليكي على الزر.", "✨ Done! The app now wears my colours. To go back, say «old look» or press the button.")
      : T("رجّعت ليك الشكل القديم ديال التطبيق 👌", "Back to the original look 👌"),
      actions: on ? [["theme-off", T("رجّع الشكل القديم", "Old look")]] : []});
    expr("happy", 1.5); act("tap"); renderChat();
  }
  function offerTheme(){
    if(!cur?.theme || store.get("m3-theme-asked")) return;
    store.set("m3-theme-asked", "1");
    chat.msgs.push({role: "assistant", content: T("IZUMI EDGE AI ✨ بغيتي نبدّل ألوان التطبيق باش تجي متناسقة مع " + cur.name + "؟ الأخضر والأحمر ديال الربح والخسارة كيبقاو كيف ما هوما، وتقدر ترجع للشكل القديم فأي وقت.",
      "IZUMI EDGE AI ✨ Want me to recolour the app to match " + cur.name + "? Profit and loss colours stay the same, and you can go back any time."),
      actions: [["theme-on", T("واخا، بدّل", "Yes, change it")], ["theme-no", T("لا، شكراً", "No, thanks")]]});
  }
  applyTheme();

  function openChat(on){
    chatBox.classList.toggle("on", on); document.body.classList.toggle("m3-chatting", on); positionPopups();
    if(on && !chat.msgs.length) chat.msgs.push({role: "assistant", content: cur?.lines?.hi ? pickLine(cur.lines.hi) + "\n" + line().replace(/<[^>]+>/g, "") : line().replace(/<[^>]+>/g, "")});
    if(on){ offerTheme(); renderChat(); setTimeout(() => qIn.focus(), 50); }
  }
  async function ask(q){
    if(chat.busy || !q) return;
    // Theme requests are handled here, no AI needed
    if(/رجع|رجّع|القديم|الأصلي|old look|original|reset/i.test(q) && themeOn()){ chat.msgs.push({role: "user", content: q}); return setTheme(false); }
    if(/ألوان|الالوان|لون|theme|colou?r/i.test(q) && cur?.theme && !themeOn()){ chat.msgs.push({role: "user", content: q}); return setTheme(true); }
    chat.msgs.push({role: "user", content: q}, {role: "assistant", content: ""}); chat.busy = true; renderChat();
    thinking(true);
    const F = typeof coachFacts === "function" ? coachFacts() : null;
    const facts = F ? F.map(f => "- " + f.txt.replace(/<[^>]+>/g, "")).join("\n") : T("- المتداول مازال ما عندوش صفقات كافية (أقل من 5).", "- Not enough closed trades yet (fewer than 5).");
    const md = typeof days === "object" && days[today()]?.mood;
    const sys = `${cur?.persona || ""}\n${T("هذه الحقائق محسوبة من صفقات المتداول:", "Facts computed from the trader's trades:")}\n${facts}\n${md ? T("إحساس المتداول اليوم: ", "Trader's mood today: ") + md.feel + (md.note ? " — " + md.note : "") : ""}\n` +
      T("القواعد: اكتب بالدارجة المغربية البسيطة وبجمل قصيرة (3 إلى 5 جمل). استعمل الأرقام المعطاة فقط. لا توصيات شراء أو بيع ولا توقعات أسعار. ركّز على السلوك والانضباط وإدارة المخاطر.",
        "Rules: reply in simple short sentences (3 to 5). Use only the given numbers. No buy/sell advice or price predictions. Focus on behaviour, discipline and risk.");
    const history = chat.msgs.slice(0, -2).slice(-6).map(m => ({role: m.role === "user" ? "user" : "model", parts: [{text: m.content}]}));
    while(history.length && history[0].role !== "user") history.shift();
    let out = ""; const show = () => {
      if(out) thinking(false);   // the answer has started: stop thinking
      chat.msgs[chat.msgs.length - 1].content = out; const last = log.lastElementChild;
      if(last){ last.classList.remove("m3-typing"); last.innerHTML = fmt(out); } log.scrollTop = log.scrollHeight; };
    try{
      if(typeof aiModel !== "function") throw new Error("AI unavailable");
      for(let idx = 0; idx < AI_MODELS.length; idx++){
        try{ const m = await aiModel(idx, sys); const res = await m.startChat({history}).sendMessageStream(q);
          for await (const ch of res.stream){ out += ch.text(); show(); } break; }
        catch(e){ if(out || idx === AI_MODELS.length - 1) throw e; }
      }
    }catch(e){ console.warn("mascot chat", e); out += (out ? "\n\n" : "") + (typeof aiErrText === "function" ? aiErrText(e) : T("الذكاء الاصطناعي ما متاحش دابا.", "The AI is not available right now.")); show(); }
    chat.busy = false; thinking(false); renderChat();
  }
  // While waiting for the AI: hand to the chin, eyes looking up, and a thought bubble with dots
  function thinking(on){
    const el = box.querySelector(".m3-think"), was = el.classList.contains("on");
    if(on === was) return;
    el.classList.toggle("on", on);
    if(on){ act("think", 120); look.y = -.6; look.x = .3; expr("focus"); }
    else { if(pivot && pivot.userData.act?.kind === "think") pivot.userData.act = null; act("tap"); expr("happy", 1.2); }
  }
  chatBox.querySelector(".m3-in button").onclick = () => { const q = qIn.value.trim(); qIn.value = ""; ask(q); };
  qIn.addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); chatBox.querySelector(".m3-in button").click(); } });
  chatBox.addEventListener("click", e => {
    const t = e.target.closest("button"); if(!t) return;
    if(t.dataset.q) ask(t.dataset.q);
    if(t.dataset.do){ t.closest(".m3-acts").remove(); chat.msgs.forEach(m => { if(m.actions) m.actions = []; });
      if(t.dataset.do === "theme-on") setTheme(true);
      else if(t.dataset.do === "theme-off") setTheme(false);
      else { chat.msgs.push({role: "assistant", content: T("ماشي مشكل! إلا بدّلتي رأيك، قولّي «بدّل الألوان».", "No problem! If you change your mind, just say «change colours».")}); renderChat(); } }
    if(t.dataset.a === "close") openChat(false);
    if(t.dataset.t){ chatBox.classList.toggle("mood", t.dataset.t === "mood"); chatBox.querySelectorAll(".m3-tabs button").forEach(b => b.classList.toggle("on", b === t)); }
    if(t.dataset.f != null){ feel = +t.dataset.f; renderChat(); }
    if(t.classList.contains("m3-save") && feel != null){
      const f = FEELS[feel], note = chatBox.querySelector(".m3-mood textarea").value.trim(), d = today();
      // Stored next to the day's notes; the journal keeps the rest of the day untouched
      days[d] = {...(days[d] || {}), mood: {feel: f[2], note, at: Date.now()}}; saveAll();
      chatBox.classList.remove("mood"); chatBox.querySelectorAll(".m3-tabs button").forEach((b, i) => b.classList.toggle("on", i === 0));
      const good = f[3] === "calm";
      chat.msgs.push({role: "assistant", content: good ? T("مزيان! خليك على هاد الحالة وتبّع الخطة ديالك 👌", "Great! Keep this state and follow your plan 👌")
        : T("شكراً على الصراحة. فهاد الحالة، الأحسن تنقّص الحجم ولا تاخد راحة قبل الصفقة الجاية.", "Thanks for being honest. In this state it's better to size down or take a break before the next trade.")});
      expr(good ? "happy" : "sad", 2.5); act(good ? "tap" : "loss"); chatBox.querySelector(".m3-mood textarea").value = ""; feel = null; renderChat();
    }
  });

  /* ---------- reactions to the journal ---------- */
  if(typeof saveAll === "function"){
    let count = stats().n; const orig = window.saveAll;
    window.saveAll = function(){ const r = orig.apply(this, arguments); const s = stats();
      if(s.n > count && s.last){ const p = pnl(s.last); react(p > 0 ? "win" : p < 0 ? "loss" : "idle"); } count = s.n; return r; };
  }
  /* Automatic mood from the account: today's result first, otherwise the last 5 closed trades */
  function accountMood(){
    let s; try{ s = stats(); }catch(e){ return null; }
    if(!s.n) return null;
    let v = s.todayN ? s.today : 0, why = "today";
    if(!s.todayN){ try{ const closed = trades.filter(t => pnl(t) !== null).sort(byTime).slice(-5); v = closed.reduce((a, t) => a + pnl(t), 0); why = "recent"; }catch(e){} }
    return {kind: v > 0 ? "win" : v < 0 ? "loss" : "idle", v, why, s};
  }
  function moodCheck(greet){
    const m = accountMood(); if(!m) return;
    mood = m.kind; if(keyRim){ keyRim.color.set(MOOD[mood] ?? cur.glow); box.style.setProperty("--m3c", "#" + keyRim.color.getHexString()); }
    if(!greet) return;
    const amt = typeof money === "function" ? money(m.v) : m.v.toFixed(2);
    if(m.kind === "win"){ expr("happy", 2.5); act("tap");
      speak(m.why === "today" ? T(`نهار زوين! ✨ <b>${amt}</b> اليوم. خليك منضبط.`, `Good day! ✨ <b>${amt}</b> today. Stay disciplined.`) : T(`آخر صفقاتك مزيانين (<b>${amt}</b>). كمّل بنفس الخطة.`, `Your last trades look good (<b>${amt}</b>). Same plan.`), 6000); }
    else if(m.kind === "loss"){ expr("sad", 3); act("loss");
      speak(m.why === "today" ? T(`اليوم صعيب شوية (<b>${amt}</b>). خود نفس، وما تحاولش ترجّعها بزربة.`, `Tough day (<b>${amt}</b>). Breathe, don't rush to win it back.`) : T(`آخر صفقاتك فالخسارة (<b>${amt}</b>). نقّص الحجم حتى ترجع الثقة.`, `Your last trades are red (<b>${amt}</b>). Size down until confidence is back.`), 6000); }
  }
  // Developer helper to find a new character's eyes: brightness of the texture at a point on the fitted model
  let probeCtx = null;
  function probe(x, y){
    let mesh; model.traverse(o => { if(o.isMesh && o.material && o.material.map && !mesh) mesh = o; });
    const img = mesh.material.map.image;
    if(!probeCtx){ const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; probeCtx = c.getContext("2d", {willReadFrequently: true}); probeCtx.drawImage(img, 0, 0); }
    pivot.scale.setScalar(1); pivot.rotation.set(0, 0, 0); pivot.position.set(0, 0, 0); pivot.updateMatrixWorld(true);
    const h = new THREE.Raycaster(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1)).intersectObject(mesh, false)[0];
    if(!h || !h.uv) return -1;
    const p = probeCtx.getImageData(Math.floor(h.uv.x * img.width), Math.floor(h.uv.y * img.height), 1, 1).data;
    return (p[0] + p[1] + p[2]) / 765;
  }
  window.itachiMascot = {react, moodCheck, probe: (x, y) => probe(x, y), act, thinking: on => thinking(on), expr: (k, s) => expr(k, s), face: () => face && {eyes: face.eyes.map(e => e.skin), cur: face.cur}, show: id => show(CHARS.find(c => c.id === id))};

  const start = () => (window.requestIdleCallback || (f => setTimeout(f, 600)))(boot, {timeout: 2500});
  document.readyState === "complete" ? start() : addEventListener("load", start);
})();
