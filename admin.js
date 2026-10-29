(function () {
  const KEY = 'van_admin_draft_v3';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const todayIso = (() => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })();

  function fromPublic() {
    const W = JSON.parse(JSON.stringify(window.VAN_DATA));
    W.bookings = (window.VAN_BOOKINGS || W.bookings || []).map(b => ({ start: b.start, end: b.end || b.start, name: b.name || '', phone: b.phone || '', note: b.note || '' }));
    return W;
  }
  let W;
  try { W = JSON.parse(localStorage.getItem(KEY)); } catch (e) { W = null; }
  if (!W || !W.destinations) W = fromPublic();
  W.bookings = W.bookings || [];

  function save() { try { localStorage.setItem(KEY, JSON.stringify(W)); } catch (e) {} renderOut(); }
  function msg(t) { const m = $('bMsg'); m.hidden = !t; m.textContent = t || ''; }

  // Teks yang akan dimasukkan ke fail awam. Hanya tarikh, tanpa nama atau telefon.
  function bookingsJs() {
    const pub = W.bookings.filter(b => (b.end || b.start) >= todayIso).map(b => ({ start: b.start, end: b.end || b.start }))
      .sort((a, b) => a.start.localeCompare(b.start));
    return 'window.VAN_BOOKINGS = ' + JSON.stringify(pub) + ';\n';
  }
  function dataJs() {
    const o = Object.assign({}, W, { bookings: [] });
    return 'window.VAN_DATA = ' + JSON.stringify(o, null, 2) + ';\n';
  }
  function renderOut() { $('outBookings').value = bookingsJs(); $('outData').value = dataJs(); }

  // ---- Tempahan ----
  const overlaps = (a, b) => a.start <= (b.end || b.start) && b.start <= (a.end || a.start);
  function renderBookings() {
    W.bookings.sort((a, b) => a.start.localeCompare(b.start));
    $('bCount').textContent = W.bookings.length;
    if (!W.bookings.length) { $('bTable').innerHTML = '<tr><td class="empty">Belum ada tempahan.</td></tr>'; return; }
    $('bTable').innerHTML = '<tr><th>Tarikh</th><th>Nama</th><th>Telefon</th><th>Catatan</th><th></th></tr>' +
      W.bookings.map((b, i) =>
        '<tr class="' + ((b.end || b.start) < todayIso ? 'past' : '') + '"><td>' + esc(b.start) + (b.end && b.end !== b.start ? ' → ' + esc(b.end) : '') +
        '</td><td>' + esc(b.name) + '</td><td>' + esc(b.phone) + '</td><td>' + esc(b.note) +
        '</td><td><button class="btn danger" data-del="' + i + '">Padam</button></td></tr>').join('');
  }
  $('bAdd').onclick = () => {
    const start = $('bStart').value, end = $('bEnd').value || start;
    if (!start) { msg('Pilih tarikh mula.'); return; }
    if (end < start) { msg('Tarikh akhir mesti sama atau selepas tarikh mula.'); return; }
    const nb = { start, end, name: $('bName').value.trim(), phone: $('bPhone').value.trim(), note: $('bNote').value.trim() };
    const clash = W.bookings.find(b => overlaps(nb, b));
    if (clash && !confirm('Tarikh ini bertindih dengan tempahan ' + (clash.name || clash.start) + '. Tambah juga?')) return;
    W.bookings.push(nb); save(); msg('');
    ['bStart', 'bEnd', 'bName', 'bPhone', 'bNote'].forEach(id => $(id).value = '');
    renderBookings(); dirty();
  };
  $('bTable').addEventListener('click', e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const bk = W.bookings[+b.dataset.del];
    if (confirm('Padam tempahan ' + bk.start + (bk.name ? ' (' + bk.name + ')' : '') + '?')) { W.bookings.splice(+b.dataset.del, 1); save(); renderBookings(); dirty(); }
  });
  function dirty() { $('bDirty').textContent = 'belum diterbitkan'; }

  // ---- Tetapan ----
  const fields = {
    sName: ['name'], sPhone: ['phone'], sOrigin: ['origin'], sBlurb: ['blurb'],
    sFar: ['farFromKm', true], pNear: ['prices', 'near', true], pFar: ['prices', 'far', true],
    pTwo: ['prices', 'two', true], pExtra: ['prices', 'extra', true]
  };
  function fillFields() {
    Object.entries(fields).forEach(([id, path]) => {
      const keys = path.filter(k => k !== true);
      $(id).value = keys.length === 1 ? W[keys[0]] : W[keys[0]][keys[1]];
    });
  }
  Object.entries(fields).forEach(([id, path]) => {
    const num = path[path.length - 1] === true, keys = path.filter(k => k !== true);
    $(id).addEventListener('input', () => {
      const v = num ? ($(id).value === '' ? 0 : Number($(id).value)) : $(id).value;
      if (keys.length === 1) W[keys[0]] = v; else W[keys[0]][keys[1]] = v;
      save();
    });
  });

  // ---- Destinasi ----
  function renderDest() {
    $('dCount').textContent = W.destinations.length;
    $('stateList').innerHTML = [...new Set(W.destinations.map(d => d.state))].map(s => '<option value="' + esc(s) + '">').join('');
    $('dTable').innerHTML = '<tr><th>Destinasi</th><th>Negeri</th><th>Km</th><th></th></tr>' +
      W.destinations.map((d, i) =>
        '<tr><td>' + esc(d.name) + '</td><td>' + esc(d.state) + '</td><td style="width:90px"><input type="number" min="0" value="' + esc(d.km) + '" data-km="' + i +
        '"></td><td><button class="btn danger" data-ddel="' + i + '">Padam</button></td></tr>').join('');
  }
  $('dAdd').onclick = () => {
    const name = $('dName').value.trim(), state = $('dState').value.trim(), km = Number($('dKm').value);
    if (!name || !state || !$('dKm').value) { alert('Isi nama, negeri dan jarak.'); return; }
    const max = W.destinations.reduce((m, d) => Math.max(m, parseInt(String(d.id).replace(/\D/g, ''), 10) || 0), 0);
    W.destinations.push({ id: 'd' + (max + 1), name, state, km });
    save(); ['dName', 'dState', 'dKm'].forEach(id => $(id).value = ''); renderDest();
  };
  $('dTable').addEventListener('click', e => {
    const b = e.target.closest('[data-ddel]'); if (!b) return;
    const d = W.destinations[+b.dataset.ddel];
    if (confirm('Padam destinasi ' + d.name + '?')) { W.destinations.splice(+b.dataset.ddel, 1); save(); renderDest(); }
  });
  $('dTable').addEventListener('input', e => {
    const i = e.target.dataset.km; if (i === undefined) return;
    W.destinations[+i].km = Number(e.target.value) || 0; save();
  });

  // ---- Salin / muat turun ----
  function flash(t) { const m = $('cpMsg'); m.hidden = false; m.textContent = t; clearTimeout(flash.t); flash.t = setTimeout(() => m.hidden = true, 3500); }
  async function copy(id, label) {
    const ta = $(id);
    try { await navigator.clipboard.writeText(ta.value); flash(label + ' disalin. Tampal ke dalam fail di GitHub.'); $('bDirty').textContent = ''; return; } catch (e) {}
    ta.removeAttribute('readonly'); ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    ta.setAttribute('readonly', ''); flash(ok ? label + ' disalin.' : 'Tidak dapat salin automatik. Tekan lama pada teks dan pilih Salin.');
    if (ok) $('bDirty').textContent = '';
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  $('cpBookings').onclick = () => copy('outBookings', 'bookings.js');
  $('cpData').onclick = () => copy('outData', 'data.js');
  $('dlBookings').onclick = () => download('bookings.js', bookingsJs(), 'text/javascript');
  $('dlData').onclick = () => download('data.js', dataJs(), 'text/javascript');
  $('dlBackup').onclick = () => download('sandaran-tempahan.json', JSON.stringify(W, null, 2) + '\n', 'application/json');
  $('restore').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (!j || !Array.isArray(j.destinations) || !Array.isArray(j.bookings) || !j.prices) throw new Error('x');
        if (!confirm('Gantikan draf semasa dengan fail sandaran ini?')) return;
        W = j; save(); fillFields(); renderBookings(); renderDest(); flash('Sandaran dipulihkan.');
      } catch (err) { alert('Fail sandaran tidak sah.'); }
    };
    r.readAsText(f); e.target.value = '';
  };
  $('reset').onclick = () => {
    if (confirm('Buang draf dan kembali kepada data semasa di laman? Nama dan telefon pelanggan dalam draf akan hilang.')) { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }
  };

  fillFields(); renderBookings(); renderDest(); renderOut();
})();
