(function () {
  const D = window.VAN_DATA;
  const $ = id => document.getElementById(id);
  const MONTHS = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
  const DOW = ['Ah','Is','Se','Ra','Kh','Ju','Sa'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const P = D.prices;

  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let start = null, days = 1, destId = '';

  // Tarikh yang telah ditempah (end termasuk)
  const busy = new Set();
  (window.VAN_BOOKINGS || D.bookings || []).forEach(b => {
    for (let d = parse(b.start); d <= parse(b.end || b.start); d = addDays(d, 1)) busy.add(iso(d));
  });

  function priceFor(dest, n) {
    if (n === 1) {
      const far = dest.km >= D.farFromKm;
      return { total: far ? P.far : P.near, note: far ? 'Sehari, jarak jauh (' + D.farFromKm + ' km ke atas)' : 'Sehari, jarak dekat' };
    }
    const extra = n - 2;
    return { total: P.two + extra * P.extra, note: n === 2 ? '2 hari' : '2 hari RM' + P.two + ' + ' + extra + ' hari tambahan × RM' + P.extra };
  }
  const dest = () => D.destinations.find(x => x.id === destId);
  const rangeFree = () => { for (let i = 0; i < days; i++) if (busy.has(iso(addDays(start, i)))) return false; return true; };
  const waNumber = () => { const n = D.phone.replace(/\D/g, ''); return n.startsWith('60') ? n : n.replace(/^0/, '60'); };

  // Header
  $('name').textContent = D.name;
  $('blurb').textContent = D.blurb;
  $('call').href = 'tel:' + D.phone;
  document.title = D.name;

  // Kadar sewa
  $('rates').innerHTML =
    '<tr><td>Sehari, bawah ' + D.farFromKm + ' km</td><td>RM ' + P.near + '</td></tr>' +
    '<tr><td>Sehari, ' + D.farFromKm + ' km ke atas</td><td>RM ' + P.far + '</td></tr>' +
    '<tr><td>2 hari</td><td>RM ' + P.two + '</td></tr>' +
    '<tr><td>Setiap hari tambahan selepas 2 hari</td><td>RM ' + P.extra + '</td></tr>';

  // Senarai destinasi
  function renderDest() {
    const q = $('search').value.trim().toLowerCase();
    const list = D.destinations.filter(x => !q || x.name.toLowerCase().includes(q) || x.state.toLowerCase().includes(q));
    if (!list.length) { $('destList').innerHTML = '<div class="empty">Tiada destinasi sepadan. Hubungi pemilik untuk destinasi lain.</div>'; return; }
    const states = [...new Set(list.map(x => x.state))];
    $('destList').innerHTML = states.map(s =>
      '<div class="dest-state">' + esc(s) + '</div>' +
      list.filter(x => x.state === s).sort((a, b) => a.km - b.km).map(x =>
        '<button class="dest' + (x.id === destId ? ' on' : '') + '" data-id="' + x.id + '"><span>' + esc(x.name) +
        '</span><small>' + x.km + ' km · RM' + priceFor(x, 1).total + '</small></button>').join('')
    ).join('');
  }

  // Kalendar
  function renderCal() {
    $('monthLabel').textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    let h = DOW.map(d => '<div class="dow">' + d + '</div>').join('');
    const first = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) h += '<div></div>';
    for (let d = 1; d <= n; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d), k = iso(date);
      let cls = 'day', dis = '';
      if (date < today) dis = 'disabled';
      else if (busy.has(k)) { cls += ' busy'; dis = 'disabled'; }
      if (start) {
        if (k === iso(start)) cls += ' start';
        else if (date > start && date < addDays(start, days)) cls += ' sel';
      }
      h += '<button class="' + cls + '" ' + dis + ' data-d="' + k + '">' + d + '</button>';
    }
    $('grid').innerHTML = h;
    $('prev').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
  }

  function renderSummary() {
    $('daysLabel').textContent = days + ' hari';
    const dd = dest();
    $('distInfo').textContent = dd ? 'Dipilih: ' + dd.name + ', ' + dd.state + ' (kira-kira ' + dd.km + ' km dari ' + D.origin + ')' : 'Bertolak dari ' + D.origin;
    const pr = dd ? priceFor(dd, days) : null;
    $('price').textContent = pr ? 'RM ' + pr.total : 'RM –';
    $('breakdown').textContent = pr ? pr.note : 'Pilih destinasi untuk lihat harga';

    const st = $('status');
    let free = true;
    if (start) {
      free = rangeFree();
      st.hidden = false;
      st.className = 'status ' + (free ? 'ok' : 'bad');
      const end = addDays(start, days - 1);
      st.textContent = free
        ? 'Tarikh kosong: ' + iso(start) + (days > 1 ? ' hingga ' + iso(end) : '')
        : 'Ada tarikh dalam tempoh ini yang telah ditempah. Cuba tarikh atau tempoh lain.';
    } else st.hidden = true;

    const name = $('fName').value.trim();
    const missing = [];
    if (!dd) missing.push('destinasi');
    if (!start) missing.push('tarikh');
    if (!name) missing.push('nama');
    const ready = !missing.length && free;
    const wa = $('wa');
    wa.classList.toggle('off', !ready);
    $('needs').textContent = missing.length ? 'Lengkapkan: ' + missing.join(', ') + '.' : '';
    if (ready) {
      const end = addDays(start, days - 1);
      const lines = [
        'Salam, saya nak tempah van.',
        'Nama: ' + name,
        $('fPhone').value.trim() && 'No. telefon: ' + $('fPhone').value.trim(),
        'Destinasi: ' + dd.name + ', ' + dd.state,
        'Tarikh: ' + iso(start) + (days > 1 ? ' hingga ' + iso(end) : '') + ' (' + days + ' hari)',
        $('fPax').value && 'Penumpang: ' + $('fPax').value,
        $('fPickup').value.trim() && 'Lokasi ambil: ' + $('fPickup').value.trim(),
        'Anggaran harga: RM' + pr.total,
        $('fNote').value.trim() && 'Catatan: ' + $('fNote').value.trim(),
        'Boleh sahkan? Terima kasih.'
      ].filter(Boolean);
      wa.href = 'https://wa.me/' + waNumber() + '?text=' + encodeURIComponent(lines.join('\n'));
    } else wa.removeAttribute('href');
  }

  function render() { renderDest(); renderCal(); renderSummary(); }

  $('destList').addEventListener('click', e => {
    const b = e.target.closest('.dest'); if (!b) return;
    destId = b.dataset.id; render();
  });
  $('search').addEventListener('input', renderDest);
  $('grid').addEventListener('click', e => {
    const b = e.target.closest('.day'); if (!b || b.disabled) return;
    start = parse(b.dataset.d); renderCal(); renderSummary();
  });
  $('prev').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); };
  $('next').onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); };
  $('minus').onclick = () => { if (days > 1) { days--; renderCal(); renderSummary(); } };
  $('plus').onclick = () => { if (days < 30) { days++; renderCal(); renderSummary(); } };
  ['fName', 'fPhone', 'fPax', 'fPickup', 'fNote'].forEach(id => $(id).addEventListener('input', renderSummary));
  render();
})();
