SEWA VAN PERSENDIRIAN - laman tempahan (boleh diurus dari telefon)

FAIL
  index.html    Laman pelanggan
  admin.html    Halaman anda untuk urus tempahan (buka: alamat-anda/admin.html)
  bookings.js   Senarai TARIKH ditempah sahaja (fail ini yang selalu dikemas kini)
  data.js       Harga, destinasi, nombor telefon
  data.json     Salinan data.js (simpanan)
  app.js, admin.js, style.css   Kod dan gaya

PRIVASI
  Nama dan telefon pelanggan TIDAK pernah dimasukkan ke dalam bookings.js atau data.js.
  Ia hanya disimpan dalam pelayar telefon anda (di halaman admin.html).
  Muat turun sandaran di halaman admin sekali-sekala.

LETAK DI NETLIFY MELALUI GITHUB (semua boleh dibuat dari telefon)
  1. Buat akaun di github.com. Buat repositori baharu (New repository), cth "sewa-van".
  2. Muat naik semua fail dalam zip ini ke repositori (Add file > Upload files).
  3. Buat akaun di netlify.com. Pilih Add new site > Import an existing project > GitHub,
     pilih repositori tadi, kemudian Deploy. Biarkan tetapan lain kosong.
  4. Netlify beri alamat cth nama.netlify.app. Tukar nama di Site configuration.
  5. Laman pelanggan: nama.netlify.app    Halaman anda: nama.netlify.app/admin.html

KEMAS KINI TARIKH TEMPAHAN (dari telefon)
  1. Buka nama.netlify.app/admin.html dan tambah tempahan.
  2. Tekan "Salin bookings.js".
  3. Buka GitHub > repositori anda > fail bookings.js > ikon pensel (Edit).
     Padam semua isi, tampal teks tadi, tekan Commit changes.
  4. Dalam seminit, Netlify kemas kini laman dan tarikh jadi merah.
  Gunakan telefon dan pelayar yang sama setiap kali untuk halaman admin.

UBAH HARGA / DESTINASI
  Ubah di admin.html, tekan "Salin data.js", kemudian gantikan isi fail data.js di GitHub
  dengan cara yang sama.

HARGA
  Sehari: "dekat" bagi bawah 350 km, "jauh" bagi 350 km ke atas
  2 hari: harga 2 hari
  Lebih 2 hari: harga 2 hari + harga tambahan bagi setiap hari lebih

TEMPAHAN PELANGGAN
  Pelanggan tidak menghantar tempahan ke sistem. Mereka hantar mesej WhatsApp kepada anda.
  Selepas anda sahkan, masukkan tarikhnya di admin.html.
