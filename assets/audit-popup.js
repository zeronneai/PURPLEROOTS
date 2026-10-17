/* Free audit popup: opens once per session on the home page, same form as /audit. */
(function () {
  var d = document, w = window, html = d.documentElement;
  var LANG = (d.currentScript && d.currentScript.getAttribute('data-lang')) || html.lang || 'en';
  var ES = LANG.indexOf('es') === 0;
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycby_FcqUjJIuyfwG6ZnxvOLqeETVAW6NBGGya7YUYJfKe0I3FifQwPO8vGfwm3Vlhiov5g/exec';
  var T = ES ? {
    eyebrow: 'Auditoría gratis', h: '¿Qué está frenando tu <em>marca</em>?',
    sub: 'Envíanos tu cuenta y en 36 horas te mandamos una auditoría personalizada de tus redes y tu marca, con los cambios exactos que haríamos. Sin costo y sin compromiso.',
    name: 'Tu nombre', name_ph: 'Nombre completo', acct: 'Tu red social principal (Instagram, TikTok, Facebook)', acct_ph: '@tumarca o link del perfil',
    email: 'Correo', email_ph: 'tu@empresa.com', phone: 'WhatsApp / teléfono', phone_ph: 'Número de teléfono',
    submit: 'Quiero mi auditoría gratis', sending: 'Enviando', later: 'Ahora no', close: 'Cerrar',
    privacy: 'Solo usamos tus datos para enviarte tu auditoría.', more: 'Ver qué incluye',
    err_fill: 'Completa tu nombre, red social, correo y teléfono.', err_send: 'Algo salió mal. Inténtalo de nuevo.',
    ok_e: 'Solicitud recibida', ok_h: 'Tu auditoría <em>va en camino</em>.', ok_p: 'La recibirás en menos de 36 horas. Revisa tu correo y tu WhatsApp.',
    prefix: 'SOLICITUD DE AUDITORÍA GRATIS (36h)', acct_k: 'Red social', badge: 'horas', page: '/es/audit'
  } : {
    eyebrow: 'Free audit', h: 'What’s holding your <em>brand</em> back?',
    sub: 'Send us your account and in 36 hours we’ll send you a personalized audit of your social media and brand, with the exact changes we would make. No cost. No commitment.',
    name: 'Your name', name_ph: 'Full name', acct: 'Main social account (Instagram, TikTok, Facebook)', acct_ph: '@yourbrand or profile link',
    email: 'Email', email_ph: 'you@company.com', phone: 'WhatsApp / phone', phone_ph: 'Phone number',
    submit: 'Get my free audit', sending: 'Sending', later: 'Not now', close: 'Close',
    privacy: 'We only use your info to send your audit.', more: 'See what’s included',
    err_fill: 'Please fill in your name, social account, email and phone.', err_send: 'Something went wrong. Please try again.',
    ok_e: 'Request received', ok_h: 'Your audit is <em>on its way</em>.', ok_p: 'You’ll get it within 36 hours. Keep an eye on your email and WhatsApp.',
    prefix: 'FREE AUDIT REQUEST (36h)', acct_k: 'Social', badge: 'hours', page: '/audit'
  };

  function store(kind, key, val) { try { var s = w[kind]; if (val === undefined) return s.getItem(key); s.setItem(key, val); } catch (e) { return null; } }
  if (store('localStorage', 'pr_audit_done') === '1' || store('sessionStorage', 'pr_audit_popup') === '1') return;

  var css = '' +
  '.ap{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;visibility:hidden;pointer-events:none}' +
  '.ap.open{visibility:visible;pointer-events:auto}' +
  '.ap__bg{position:absolute;inset:0;background:rgba(11,10,13,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .5s ease}' +
  '.ap.open .ap__bg{opacity:1}' +
  '.ap__card{position:relative;width:min(560px,100%);max-height:calc(100dvh - 40px);overflow:auto;-webkit-overflow-scrolling:touch;background:#131117;color:#F4F1EC;border:1px solid rgba(244,241,236,.12);border-radius:24px;padding:34px 30px 28px;box-shadow:0 50px 100px -30px rgba(0,0,0,.8);font-family:Inter,"Helvetica Neue",Arial,sans-serif;line-height:1.55;opacity:0;transform:translateY(28px) scale(.97);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}' +
  '.ap.open .ap__card{opacity:1;transform:none}' +
  '.ap__card::before{content:"";position:absolute;inset:-1px;border-radius:24px;padding:1px;background:linear-gradient(140deg,rgba(185,164,255,.7),rgba(185,164,255,0) 45%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}' +
  '.ap__x{position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:1px solid rgba(244,241,236,.16);background:none;color:#F4F1EC;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
  '.ap__x:hover{background:rgba(244,241,236,.08)}.ap__x svg{width:16px;height:16px}' +
  '.ap__e{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#0B0A0D;background:#B9A4FF;border-radius:999px;padding:7px 14px;margin:0 0 18px}' +
  '.ap__h{font-family:"Inter Tight","Helvetica Neue",Arial,sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:-.04em;line-height:.95;font-size:clamp(2rem,6vw,2.8rem);margin:0 0 14px;padding-right:36px}' +
  '.ap em{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400;text-transform:none;color:#B9A4FF;letter-spacing:0}' +
  '.ap__p{margin:0 0 20px;color:rgba(244,241,236,.72);font-size:.96rem}' +
  '.ap__badge{display:flex;align-items:baseline;gap:8px;margin:0 0 20px}.ap__badge b{font-family:"Inter Tight",Arial,sans-serif;font-size:2.4rem;font-weight:800;letter-spacing:-.04em;line-height:1}.ap__badge span{font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,241,236,.72)}' +
  '.ap form{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}.ap__f{display:flex;flex-direction:column;gap:6px}.ap__f--full{grid-column:1/-1}' +
  '.ap label{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,241,236,.72)}' +
  '.ap input{font:inherit;font-size:16px;color:#F4F1EC;background:#0B0A0D;border:1px solid rgba(244,241,236,.16);border-radius:12px;padding:13px 14px;outline:none;width:100%}' +
  '.ap input::placeholder{color:rgba(244,241,236,.4)}.ap input:focus{border-color:#B9A4FF;box-shadow:0 0 0 4px rgba(185,164,255,.18)}' +
  '.ap__go{grid-column:1/-1;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:999px;padding:17px 24px;background:#B9A4FF;color:#0B0A0D;font:600 15px Inter,Arial,sans-serif;cursor:pointer;transition:background .25s,transform .25s}' +
  '.ap__go:hover{background:#cbbcff;transform:translateY(-1px)}.ap__go[disabled]{opacity:.6;cursor:progress;transform:none}.ap__go svg{width:16px;height:16px}' +
  '.ap__foot{grid-column:1/-1;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px 16px;font-size:12px;color:rgba(244,241,236,.55)}' +
  '.ap__foot a,.ap__foot button{color:rgba(244,241,236,.72);background:none;border:0;padding:0;font:inherit;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
  '.ap__err{grid-column:1/-1;margin:0;color:#FF8A80;font-weight:600;font-size:13px}' +
  '@media (max-width:560px){.ap{align-items:flex-end;padding:0}.ap__card{border-radius:24px 24px 0 0;max-height:92dvh;padding:28px 20px 22px}.ap__card::before{border-radius:24px 24px 0 0}.ap form{grid-template-columns:1fr}}' +
  '@media (prefers-reduced-motion:reduce){.ap__bg,.ap__card{transition:none}}' +
  'html.cc-on .ap,html.cc-on .ap *{cursor:auto!important}html.cc-on .ap input{cursor:text!important}html.cc-on .ap button,html.cc-on .ap a,html.cc-on .ap [data-ap-close]{cursor:pointer!important}' +
  'html.ap-open .cursor{opacity:0!important;visibility:hidden!important}';

  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
  var x = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  var root, card, lastFocus;
  function build() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    root = d.createElement('div'); root.className = 'ap'; root.setAttribute('data-lenis-prevent', '');
    root.innerHTML = '<div class="ap__bg" data-ap-close></div>' +
      '<div class="ap__card" role="dialog" aria-modal="true" aria-labelledby="apTitle">' +
      '<button class="ap__x" type="button" aria-label="' + T.close + '" data-ap-close>' + x + '</button>' +
      '<p class="ap__e">' + T.eyebrow + '</p>' +
      '<h2 class="ap__h" id="apTitle">' + T.h + '</h2>' +
      '<p class="ap__p">' + T.sub + '</p>' +
      '<div class="ap__badge"><b>36</b><span>' + T.badge + '</span></div>' +
      '<form novalidate>' + '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" />' +
      '<div class="ap__f"><label for="ap-name">' + T.name + '</label><input id="ap-name" name="name" autocomplete="name" placeholder="' + T.name_ph + '"></div>' +
      '<div class="ap__f"><label for="ap-phone">' + T.phone + '</label><input id="ap-phone" name="phone" type="tel" autocomplete="tel" placeholder="' + T.phone_ph + '"></div>' +
      '<div class="ap__f ap__f--full"><label for="ap-acct">' + T.acct + '</label><input id="ap-acct" name="account" autocapitalize="off" autocomplete="off" placeholder="' + T.acct_ph + '"></div>' +
      '<div class="ap__f ap__f--full"><label for="ap-email">' + T.email + '</label><input id="ap-email" name="email" type="email" autocomplete="email" placeholder="' + T.email_ph + '"></div>' +
      '<button class="ap__go" type="submit"><span>' + T.submit + '</span>' + arrow + '</button>' +
      '<div class="ap__foot"><span>' + T.privacy + '</span><span><a href="' + T.page + '">' + T.more + '</a> · <button type="button" data-ap-close>' + T.later + '</button></span></div>' +
      '</form></div>';
    d.body.appendChild(root);
    card = root.querySelector('.ap__card');
    root.addEventListener('click', function (e) { if (e.target.closest('[data-ap-close]')) close(); });
    d.addEventListener('keydown', function (e) {
      if (!root.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = [].slice.call(card.querySelectorAll('button,a,input')).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
        if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    root.querySelector('form').addEventListener('submit', submit);
  }

  function open() {
    if (!root) build();
    lastFocus = d.activeElement;
    root.classList.add('open'); html.classList.add('ap-open'); w.__apOpenedAt = Date.now();
    if (w.__lenis) w.__lenis.stop();
    html.style.overflow = 'hidden';
    store('sessionStorage', 'pr_audit_popup', '1');
    setTimeout(function () { var i = root.querySelector('input'); if (i && matchMedia('(hover:hover)').matches) i.focus(); }, 450);
  }
  function close() {
    if (!root) return;
    root.classList.remove('open'); html.classList.remove('ap-open');
    if (w.__lenis) w.__lenis.start();
    html.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function submit(e) {
    e.preventDefault();
    var form = e.currentTarget, v = function (n) { return (form.elements[n].value || '').trim(); };
    var prev = form.querySelector('.ap__err'); if (prev) prev.remove();
    var empty = ['name', 'phone', 'account', 'email'].filter(function (n) { return !v(n); })[0];
    if (!empty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) empty = 'email';
    if (empty) {
      var err = d.createElement('p'); err.className = 'ap__err'; err.setAttribute('role', 'alert'); err.textContent = T.err_fill;
      form.querySelector('.ap__go').insertAdjacentElement('beforebegin', err); form.elements[empty].focus(); return;
    }
    var acct = v('account');
    var fd = new FormData();
    fd.append('k', 'pra26'); fd.append('t', String(Date.now() - (w.__apOpenedAt || 0))); fd.append('website', form.elements.website.value);
    fd.append('name', v('name'));
    fd.append('company', '- (' + acct + ')');
    fd.append('phone', v('phone'));
    fd.append('email', v('email'));
    fd.append('goal', T.prefix + ' | ' + T.acct_k + ': ' + acct + ' | Source: popup ' + location.pathname);
    var btn = form.querySelector('.ap__go'), lbl = btn.querySelector('span'), was = lbl.textContent;
    btn.disabled = true; lbl.textContent = T.sending;
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: fd }).then(function () {
      store('localStorage', 'pr_audit_done', '1');
      form.outerHTML = '<div role="status"><p class="ap__e">' + T.ok_e + '</p><h3 class="ap__h">' + T.ok_h + '</h3><p class="ap__p">' + T.ok_p + '</p>' +
        '<button class="ap__go" type="button" data-ap-close style="width:100%">' + T.close + '</button></div>';
      root.querySelector('.ap__h').remove(); root.querySelector('.ap__e').remove(); root.querySelector('.ap__p').remove(); root.querySelector('.ap__badge').remove();
    }).catch(function () {
      btn.disabled = false; lbl.textContent = was;
      var err = d.createElement('p'); err.className = 'ap__err'; err.setAttribute('role', 'alert'); err.textContent = T.err_send;
      btn.insertAdjacentElement('beforebegin', err);
    });
  }

  /* open once the preloader is gone, plus a short beat */
  function whenReady(cb) {
    var t0 = Date.now();
    (function check() {
      if (!html.classList.contains('is-loading') || Date.now() - t0 > 6000) setTimeout(cb, 1500);
      else setTimeout(check, 200);
    })();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { whenReady(open); });
  else whenReady(open);
})();
