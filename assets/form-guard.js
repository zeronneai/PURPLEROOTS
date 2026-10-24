/* Purple Roots form guard: shared checks for every lead form + Cloudflare Turnstile.
   The same rules run again in the Apps Script, so a bot that skips this file is still blocked. */
(function (w, d) {
  // Paste the Turnstile SITE key here (Cloudflare dashboard). Empty = Turnstile off.
  var SITEKEY = '0x4AAAAAAFeHuEyS1KdRkce-';

  var TEMP = ['fextemp.com', 'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz',
    'guerrillamail.de', 'guerrillamail.info', 'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me', '10minutemail.com',
    '10minutemail.net', 'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempmail.plus',
    'tempail.com', 'yopmail.com', 'yopmail.net', 'yopmail.fr', 'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.de',
    'dispostable.com', 'maildrop.cc', 'mohmal.com', 'emailondeck.com', 'throwawaymail.com', 'fakeinbox.com', 'mailnesia.com',
    'mintemail.com', 'moakt.com', 'tmail.ws', 'tmpmail.org', 'tmpmail.net', 'burnermail.io', 'emailfake.com', 'fakemail.net',
    'mail.tm', 'mail.gw', 'inboxkitten.com', 'mytemp.email', 'tempr.email', 'discard.email', 'spambox.us', 'getairmail.com',
    'mailcatch.com', 'trbvm.com', 'cuvox.de', 'armyspy.com', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com',
    'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us', 'emltmp.com', 'linshiyou.com', 'mailpoof.com', 'mvrht.com'];
  var TEMP_RX = /(^|\.)(temp|tmp|trash|throwaway|disposable|10minute|fake)[a-z0-9-]*mail|mailinator|guerrilla|yopmail/i;
  var URL_RX = /(https?:|www\.|\/\/|[a-z0-9-]+\.(com|net|org|ru|cn|xyz|top|info|io|co|biz|online|site|link|click|live|shop|app|me|us|mx)\b|\.php|<|>)/i;
  var SOCIAL_URL_RX = /^(https?:\/\/)?(www\.|m\.)?(instagram\.com|tiktok\.com|facebook\.com|fb\.com)\/[A-Za-z0-9._@\/?=&-]+$/i;
  var HANDLE_RX = /^@?[A-Za-z0-9._]{2,30}$/;

  var MSG = {
    en: { link: 'Please remove links from your name, business name and message.', email: 'Please use a real business email.',
      phone: 'Please enter a valid phone number: 10 digits, or include your country code (for example +52).',
      social: 'Please enter your @handle or the link to your Instagram, TikTok or Facebook profile.',
      check: 'Please complete the quick security check and try again.' },
    es: { link: 'Quita los links de tu nombre, del nombre del negocio y del mensaje.', email: 'Usa un correo real de tu negocio.',
      phone: 'Escribe un teléfono válido: 10 dígitos, o incluye la lada de tu país (por ejemplo +52).',
      social: 'Escribe tu @usuario o el link de tu perfil de Instagram, TikTok o Facebook.',
      check: 'Completa la verificación de seguridad e inténtalo de nuevo.' }
  };

  function tempEmail(email) {
    var dom = (email.split('@')[1] || '').toLowerCase().trim();
    if (!dom) return true;
    for (var i = 0; i < TEMP.length; i++) if (dom === TEMP[i] || dom.slice(-(TEMP[i].length + 1)) === '.' + TEMP[i]) return true;
    return TEMP_RX.test(dom);
  }
  function phoneOk(raw) {
    var s = String(raw || ''), digits = s.replace(/\D/g, ''), plus = /^\s*\+/.test(s);
    if (digits.length < 10 || digits.length > 15) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    var last10 = digits.slice(-10);
    if ('01234567890123'.indexOf(last10) >= 0 || '98765432109876'.indexOf(last10) >= 0) return false;
    if (plus) return digits[0] !== '0';
    if (digits.length === 10) return !/^[01]/.test(digits);
    if (digits.length === 11) return digits[0] === '1' && !/^[01]/.test(digits.slice(1));
    if (digits.length === 12) return digits.slice(0, 2) === '52';
    if (digits.length === 13) return digits.slice(0, 3) === '521';
    return false;
  }
  function socialOk(v) { v = String(v || '').trim(); return HANDLE_RX.test(v) || SOCIAL_URL_RX.test(v); }

  /* f: {name, biz, email, phone, social?, msg?}  returns '' or an error message */
  function check(f, lang) {
    var m = MSG[lang] || MSG.en;
    if (URL_RX.test(f.name || '') || URL_RX.test(f.biz || '') || URL_RX.test(f.msg || '')) return m.link;
    if (tempEmail(f.email || '')) return m.email;
    if (!phoneOk(f.phone)) return m.phone;
    if (f.social !== undefined && !socialOk(f.social)) return m.social;
    return '';
  }

  /* ---- Turnstile ---- */
  var loading = null;
  function load() {
    if (!SITEKEY) return Promise.resolve(null);
    if (w.turnstile) return Promise.resolve(w.turnstile);
    if (loading) return loading;
    loading = new Promise(function (res) {
      var s = d.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = function () { res(w.turnstile || null); }; s.onerror = function () { res(null); };
      d.head.appendChild(s);
    });
    return loading;
  }
  /* mount a widget inside `box`; returns a handle with .token() -> Promise<string> */
  function mount(box, lang) {
    var st = { token: '', id: null, waiters: [] };
    function done(t) { st.token = t || ''; st.waiters.splice(0).forEach(function (f) { f(st.token); }); }
    if (SITEKEY && box) {
      load().then(function (ts) {
        if (!ts) return;
        st.id = ts.render(box, { sitekey: SITEKEY, appearance: 'interaction-only', language: lang === 'es' ? 'es' : 'en',
          callback: done, 'expired-callback': function () { st.token = ''; }, 'error-callback': function () { done(''); } });
      });
    }
    return {
      enabled: !!SITEKEY,
      token: function () {
        if (!SITEKEY) return Promise.resolve('');
        if (st.token) return Promise.resolve(st.token);
        return new Promise(function (res) { st.waiters.push(res); setTimeout(function () { res(st.token); }, 8000); });
      },
      reset: function () { st.token = ''; if (w.turnstile && st.id !== null) try { w.turnstile.reset(st.id); } catch (e) {} },
      msg: (MSG[lang] || MSG.en).check
    };
  }


  /* ---- SMS consent checkbox (TCPA / A2P 10DLC). Optional, never pre-checked. ---- */
  var CONSENT_V = '2026-10-23';
  var CONSENT = {
    en: { label: 'Text me about my request.',
      text: 'By checking this box, I agree to receive text messages from Purple Roots Agency at the phone number I provided about my request, including follow-up questions and scheduling. Up to 4 messages per request. Consent is not a condition of any purchase. Message and data rates may apply. Reply STOP to opt out or HELP for help.',
      links: '<a href="/sms-terms" target="_blank" rel="noopener">SMS Terms</a> · <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>' },
    es: { label: 'Envíenme mensajes de texto sobre mi solicitud.',
      text: 'Al marcar esta casilla, acepto recibir mensajes de texto de Purple Roots Agency al número que proporcioné sobre mi solicitud, incluyendo preguntas de seguimiento y agenda. Hasta 4 mensajes por solicitud. El consentimiento no es condición para ninguna compra. Pueden aplicar tarifas de mensajes y datos. Responde STOP para darte de baja o HELP para ayuda.',
      links: '<a href="/es/terminos-sms" target="_blank" rel="noopener">Términos de SMS</a> · <a href="/es/privacidad" target="_blank" rel="noopener">Política de privacidad</a>' }
  };
  var consentCss = false;
  function consent(box, lang) {
    var c = CONSENT[lang] || CONSENT.en, input = null;
    if (box) {
      if (!consentCss) {
        consentCss = true;
        var st = d.createElement('style');
        st.textContent = '.pr-sms{display:flex;gap:12px;align-items:flex-start;text-align:left;font-size:12px;line-height:1.5;opacity:.85;cursor:pointer;margin:2px 0}' +
          '.pr-sms input{flex:none;width:18px!important;height:18px;margin:2px 0 0!important;padding:0!important;accent-color:#D1FF13;cursor:pointer}' +
          '.pr-sms b{display:block;font-size:13px;font-weight:600;opacity:1;margin-bottom:2px}.pr-sms a{color:inherit;text-decoration:underline;text-underline-offset:2px}';
        d.head.appendChild(st);
      }
      box.innerHTML = '<label class="pr-sms"><input type="checkbox" value="yes" /><span><b>' + c.label + '</b>' + c.text + ' ' + c.links + '</span></label>';
      input = box.querySelector('input');
    }
    return {
      checked: function () { return !!(input && input.checked); },
      /* adds the consent record to the FormData sent to the Apps Script */
      append: function (fd) {
        var yes = !!(input && input.checked);
        fd.append('sms_consent', yes ? 'yes' : 'no');
        if (yes) { fd.append('sms_consent_text', c.label + ' ' + c.text); fd.append('sms_consent_v', CONSENT_V); fd.append('sms_consent_page', location.href); }
      }
    };
  }

  w.PRGuard = { check: check, mount: mount, consent: consent, phoneOk: phoneOk, tempEmail: tempEmail, socialOk: socialOk, URL_RX: URL_RX };
})(window, document);
