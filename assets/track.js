/* Purple Roots tracking: Meta Pixel base code + first-touch lead attribution.
   Loaded in the <head> of every page. Forms call PRTrack.append(fd) before sending and PRTrack.lead(name) after.
   Each lead goes to Meta twice with the same event_id: from the browser (pixel) and from the server (/api/meta-capi),
   so Meta counts it once even when the browser blocks the pixel. */
(function (w, d) {
  var PIXEL_ID = '1699397478369874';

  /* ---- Meta Pixel base code ---- */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(w, d, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  w.fbq('init', PIXEL_ID);
  w.fbq('track', 'PageView');

  /* ---- first-touch attribution (saved once, on the first visit) ---- */
  var KEY = 'pr_first_touch', KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
  function now() {
    var q = {}, out = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { q[k.toLowerCase()] = v; }); } catch (e) {}
    KEYS.forEach(function (k) { out[k] = (q[k] || '').slice(0, 200); });
    var ref = d.referrer || '';
    try { if (ref && new URL(ref).hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, '')) ref = ''; } catch (e) {}
    out.referrer = ref.slice(0, 300);
    out.landing_page = (location.pathname + location.search).slice(0, 300);
    out.first_seen = new Date().toISOString();
    return out;
  }
  function get() {
    var a = null;
    try { a = JSON.parse(w.localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!a || typeof a !== 'object') { a = now(); try { w.localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
    return a;
  }
  function host(u) { try { return new URL(u).hostname.replace(/^(www|m|l|lm)\./, ''); } catch (e) { return ''; } }
  /* one readable label: where the lead came from */
  function source(a) {
    if (a.utm_source) return a.utm_source + (a.utm_medium ? ' / ' + a.utm_medium : '');
    if (a.fbclid) return 'facebook / paid or social click (fbclid)';
    if (a.gclid) return 'google / ads (gclid)';
    var h = host(a.referrer);
    if (!h) return 'direct';
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(h)) return h.split('.')[0] + ' / organic search';
    if (/facebook\.|instagram\.|tiktok\.|linkedin\.|youtube\.|t\.co$|twitter\.|x\.com$/.test(h)) return h.split('.')[0] + ' / social';
    return h + ' / referral';
  }
  /* the Apps Script rejects links in the message, so nothing here may look like a URL */
  function safe(s) {
    return String(s || '').replace(/https?:|www\.|[<>]/gi, '').replace(/\/\/+/g, '/').replace(/\./g, '(.)').replace(/[|\r\n]+/g, ' ').trim().slice(0, 160);
  }
  function summary(a) {
    var p = ['Lead source: ' + safe(source(a))];
    if (a.utm_campaign) p.push('Campaign: ' + safe(a.utm_campaign));
    if (a.fbclid) p.push('fbclid: yes');
    if (a.gclid) p.push('gclid: yes');
    p.push('Landing: ' + safe(a.landing_page.split('?')[0] || '/'));
    if (a.referrer) p.push('Referrer: ' + safe(host(a.referrer)));
    return p.join(' | ');
  }
  get(); // record the first touch as soon as any page loads

  var last = {};
  function cookie(n) { var m = d.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; }

  w.PRTrack = {
    get: get,
    summary: function () { return summary(get()); },
    /* adds hidden attribution fields to the FormData and a readable line to the field the lead email shows */
    append: function (fd) {
      try {
        var a = get();
        KEYS.concat(['referrer', 'landing_page', 'first_seen']).forEach(function (k) { fd.append(k, a[k] || ''); });
        fd.append('lead_source', source(a));
        var line = summary(a), g = fd.get('goal');
        if (typeof g === 'string') fd.set('goal', g + ' | ' + line);
        var pick = function (k) { var x = fd.get(k); return typeof x === 'string' ? x : ''; };
        last = { name: pick('name'), email: pick('email'), phone: pick('phone') };
      } catch (e) {}
    },
    lead: function (name) {
      var id = 'lead_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10), cn = name || 'form';
      try { w.fbq('track', 'Lead', { content_name: cn }, { eventID: id }); } catch (e) {}
      try {
        var a = get(), fbc = cookie('_fbc');
        if (!fbc && a.fbclid) fbc = 'fb.1.' + (Date.parse(a.first_seen) || Date.now()) + '.' + a.fbclid;
        var body = { event_id: id, content_name: cn, url: location.href.split('#')[0], fbp: cookie('_fbp'), fbc: fbc,
          name: last.name, email: last.email, phone: last.phone };
        fetch('/api/meta-capi', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(function () {});
      } catch (e) {}
      last = {};
    }
  };
})(window, document);
