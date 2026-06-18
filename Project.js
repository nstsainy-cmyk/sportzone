// ═══════════════════════════════════════════════════════════════//
//  Project.js  —  SportZone Booking Lapangan
//  Berisi: data lapangan, logika booking, jadwal, riwayat
// ═══════════════════════════════════════════════════════════════
 
 
/* ─────────────────────────────────────────
   DATA: DAFTAR OLAHRAGA & LAPANGAN
   Tambah / ubah harga atau lapangan di sini
───────────────────────────────────────── */
const SPORTS = [
  {
    id:     'futsal',
    name:   'Futsal',
    icon:   '⚽',
    courts: ['Lapangan Futsal 1'],
    price:  50000          // Rp per jam
  },
  {
    id:     'basket',
    name:   'Basket',
    icon:   '🏀',
    courts: ['Lapangan Basket 1'],
    price:  75000
  },
  {
    id:     'badminton',
    name:   'Badminton',
    icon:   '🏸',
    courts: ['Lapangan Badminton 1', 'Lapangan Badminton 2'],
    price:  50000
  },
  {
    id:     'voli',
    name:   'Voli',
    icon:   '🏐',
    courts: ['Lapangan Voli 1'],
    price:  60000
  },
];
 
/* ─────────────────────────────────────────
   DATA: JAM OPERASIONAL (slot per 1 jam)
───────────────────────────────────────── */
const TIME_SLOTS = [
  '10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00'
];
 
/* ─────────────────────────────────────────
   STATE APLIKASI
───────────────────────────────────────── */
let bookings      = JSON.parse(localStorage.getItem('sz_bookings') || '[]');
let selectedSport = null;    // objek SPORTS yang dipilih
let selectedCourt = null;    // string nama lapangan
let selectedSlots = [];      // array jam yang dipilih, misal ['09:00','10:00']
let currentDate   = '';      // string YYYY-MM-DD
 
 
// ═══════════════════════════════════════════════════════════════
//  INIT — dipanggil saat halaman selesai dimuat
// ═══════════════════════════════════════════════════════════════
function init() {
  const today = new Date().toISOString().split('T')[0];
 
  // Batas tanggal minimum = hari ini
  document.getElementById('inp-date').min   = today;
  document.getElementById('inp-date').value = today;
  document.getElementById('filter-date').value = today;
 
  buildSportCards();
  buildFilterOptions();
  updateHistoryCount();
  renderHistory();
  renderJadwal();
 
  // Tutup modal jika klik di luar kotak modal
  document.getElementById('modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
  });
}
 
 
// ═══════════════════════════════════════════════════════════════
//  BUILD UI DINAMIS
// ═══════════════════════════════════════════════════════════════
 
/** Membuat kartu olahraga di halaman Booking */
function buildSportCards() {
  const grid = document.getElementById('sport-grid');
  SPORTS.forEach(sport => {
    const card = document.createElement('div');
    card.className = 'sport-card';
    card.id        = 'scard-' + sport.id;
    card.innerHTML = `
      <div class="sport-icon">${sport.icon}</div>
      <div class="sport-name">${sport.name}</div>
      <div class="sport-meta">${sport.courts.length} lapangan tersedia</div>
      <div class="sport-price">Rp ${sport.price.toLocaleString('id')} / jam</div>
    `;
    card.onclick = () => selectSport(sport);
    grid.appendChild(card);
  });
}
 
/** Mengisi dropdown filter olahraga di halaman Jadwal */
function buildFilterOptions() {
  const select = document.getElementById('filter-sport');
  SPORTS.forEach(sport => {
    const opt = document.createElement('option');
    opt.value       = sport.id;
    opt.textContent = sport.name;
    select.appendChild(opt);
  });
}
 
 
// ═══════════════════════════════════════════════════════════════
//  NAVIGASI HALAMAN
// ═══════════════════════════════════════════════════════════════
 
/**
 * Menampilkan halaman yang dipilih dan menyembunyikan yang lain.
 * @param {string} name  - 'booking' | 'jadwal' | 'riwayat'
 * @param {HTMLElement} btn - tombol nav yang diklik
 */
function switchPage(name, btn) {
  // Sembunyikan semua halaman & nonaktifkan semua tombol nav
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
 
  // Aktifkan halaman & tombol yang dipilih
  document.getElementById('page-' + name).classList.add('active');
  btn.classList.add('active');
 
  // Re-render data terkini saat berpindah halaman
  if (name === 'riwayat') renderHistory();
  if (name === 'jadwal')  renderJadwal();
}
 
 
// ═══════════════════════════════════════════════════════════════
//  PEMILIHAN OLAHRAGA & LAPANGAN
// ═══════════════════════════════════════════════════════════════
 
/**
 * Handler ketika kartu olahraga diklik.
 * @param {Object} sport - item dari array SPORTS
 */
function selectSport(sport) {
  selectedSport = sport;
  selectedSlots = [];
 
  // Highlight kartu yang dipilih
  document.querySelectorAll('.sport-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('scard-' + sport.id).classList.add('selected');
 
  // Tampilkan form booking
  const formSection = document.getElementById('booking-form-section');
  formSection.style.display = 'block';
 
  // Hapus dropdown lapangan lama (jika ada) sebelum menambah yang baru
  const oldCourtGroup = document.getElementById('court-group');
  if (oldCourtGroup) oldCourtGroup.remove();
 
  if (sport.courts.length > 1) {
    // Buat dropdown pilih lapangan
    const group   = document.createElement('div');
    group.className = 'form-group';
    group.id        = 'court-group';
    group.innerHTML = `
      <label>Pilih Lapangan</label>
      <select id="inp-court" onchange="onCourtChange()">
        ${sport.courts.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    `;
    // Sisipkan setelah baris nama+tanggal
    const formRow = formSection.querySelector('.form-row');
    formRow.insertAdjacentElement('afterend', group);
 
    selectedCourt = sport.courts[0]; // default pilihan pertama
  } else {
    selectedCourt = sport.courts[0];
  }
 
  // Update slots setiap tanggal berubah
  document.getElementById('inp-date').onchange = () => refreshSlots();
 
  refreshSlots();
  document.getElementById('cost-section').style.display = 'none';
 
  // Scroll ke form
  formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
/** Handler ketika dropdown lapangan berubah */
function onCourtChange() {
  selectedCourt = document.getElementById('inp-court').value;
  selectedSlots = [];
  refreshSlots();
  updateCost();
}
 
 
// ═══════════════════════════════════════════════════════════════
//  SLOT WAKTU
// ═══════════════════════════════════════════════════════════════
 
/**
 * Mengembalikan array jam yang sudah dipesan untuk lapangan + tanggal tertentu.
 * @param {string} court - nama lapangan
 * @param {string} date  - YYYY-MM-DD
 * @returns {string[]}
 */
function getBookedSlots(court, date) {
  return bookings
    .filter(b => b.court === court && b.date === date)
    .flatMap(b => b.slots);
}
 
/**
 * Render ulang grid slot waktu berdasarkan lapangan & tanggal yang dipilih.
 * Reset selectedSlots ke kosong.
 */
function refreshSlots() {
  currentDate = document.getElementById('inp-date').value;
  if (!currentDate || !selectedCourt) return;
 
  selectedSlots = []; // reset pilihan
 
  const bookedSlots = getBookedSlots(selectedCourt, currentDate);
  const grid        = document.getElementById('slots-grid');
  grid.innerHTML    = '';
 
  TIME_SLOTS.forEach(time => {
    const isBooked = bookedSlots.includes(time);
 
    const slotEl = document.createElement('div');
    slotEl.className = 'slot ' + (isBooked ? 'booked' : 'available');
    slotEl.innerHTML = `
      ${time}
      <div class="slot-label">${isBooked ? '❌ Terisi' : '✓ Kosong'}</div>
    `;
 
    if (!isBooked) {
      slotEl.onclick = () => toggleSlot(time, slotEl);
    }
 
    grid.appendChild(slotEl);
  });
 
  updateCost();
}
 
/**
 * Toggle pilihan slot: tambah jika belum dipilih, hapus jika sudah.
 * @param {string} time   - jam, misal '09:00'
 * @param {HTMLElement} el - elemen DOM slot
 */
function toggleSlot(time, el) {
  const index = selectedSlots.indexOf(time);
 
  if (index === -1) {
    // Tambahkan ke pilihan
    selectedSlots.push(time);
    el.classList.remove('available');
    el.classList.add('selected-slot');
    el.innerHTML = `${time}<div class="slot-label">✓ Dipilih</div>`;
  } else {
    // Hapus dari pilihan
    selectedSlots.splice(index, 1);
    el.classList.remove('selected-slot');
    el.classList.add('available');
    el.innerHTML = `${time}<div class="slot-label">✓ Kosong</div>`;
  }
 
  updateCost();
}
 
 
// ═══════════════════════════════════════════════════════════════
//  PERHITUNGAN BIAYA
// ═══════════════════════════════════════════════════════════════
 
/** Update tampilan rincian biaya berdasarkan slot yang dipilih */
function updateCost() {
  const costSection = document.getElementById('cost-section');
 
  if (selectedSlots.length === 0) {
    costSection.style.display = 'none';
    return;
  }
 
  costSection.style.display = 'block';
 
  const durasi    = selectedSlots.length;
  const totalBiaya = durasi * selectedSport.price;
 
  document.getElementById('cost-field').textContent = `${selectedSport.name} — ${selectedCourt}`;
  document.getElementById('cost-dur').textContent   = `${durasi} jam`;
  document.getElementById('cost-rate').textContent  = `Rp ${selectedSport.price.toLocaleString('id')}`;
  document.getElementById('cost-total').textContent = `Rp ${totalBiaya.toLocaleString('id')}`;
}
 
 
// ═══════════════════════════════════════════════════════════════
//  KONFIRMASI & SUBMIT BOOKING
// ═══════════════════════════════════════════════════════════════
 
/** Validasi form dan buka modal konfirmasi */
function openConfirm() {
  const name = document.getElementById('inp-name').value.trim();
 
  // Validasi input
  if (!name)                    { toast('⚠️ Masukkan nama pemesan dulu!',    'error'); return; }
  if (!currentDate)             { toast('⚠️ Pilih tanggal main!',            'error'); return; }
  if (selectedSlots.length === 0){ toast('⚠️ Pilih minimal 1 slot waktu!',   'error'); return; }
 
  const sortedSlots = [...selectedSlots].sort();
  const totalBiaya  = selectedSlots.length * selectedSport.price;
 
  // Isi detail konfirmasi di dalam modal
  document.getElementById('confirm-detail').innerHTML = `
    <div class="row"><span>Pemesan</span>  <strong>${name}</strong></div>
    <div class="row"><span>Lapangan</span> <strong>${selectedCourt}</strong></div>
    <div class="row"><span>Tanggal</span>  <strong>${formatDate(currentDate)}</strong></div>
    <div class="row">
      <span>Waktu</span>
      <strong>${sortedSlots[0]} – ${getEndTime(sortedSlots[sortedSlots.length - 1])}</strong>
    </div>
    <div class="row"><span>Durasi</span>   <strong>${selectedSlots.length} jam</strong></div>
    <div class="row">
      <span>Total Bayar</span>
      <strong>Rp ${totalBiaya.toLocaleString('id')}</strong>
    </div>
  `;
 
  document.getElementById('modal').classList.add('open');
}
 
/** Tutup modal konfirmasi */
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
 
/** Simpan booking baru ke localStorage dan reset form */
function submitBooking() {
  const name        = document.getElementById('inp-name').value.trim();
  const sortedSlots = [...selectedSlots].sort();
  const totalBiaya  = selectedSlots.length * selectedSport.price;
 
  // Buat objek booking baru
  const newBooking = {
    id:        'SZ' + Date.now(),   // ID unik berbasis timestamp
    name,
    sport:     selectedSport.name,
    sportId:   selectedSport.id,
    icon:      selectedSport.icon,
    court:     selectedCourt,
    date:      currentDate,
    slots:     sortedSlots,
    price:     selectedSport.price, // harga satuan per jam
    total:     totalBiaya,
    createdAt: new Date().toISOString(),
  };
 
  // Simpan ke array dan localStorage
  bookings.unshift(newBooking); // unshift = tambah di awal (terbaru di atas)
  localStorage.setItem('sz_bookings', JSON.stringify(bookings));
 
  closeModal();
  toast(`✅ Booking berhasil! ID: ${newBooking.id}`, 'success');
  updateHistoryCount();
 
  // Reset form setelah booking berhasil
  selectedSlots = [];
  document.getElementById('inp-name').value = '';
  document.getElementById('cost-section').style.display = 'none';
  refreshSlots();
}
 
 
// ═══════════════════════════════════════════════════════════════
//  HALAMAN JADWAL
// ═══════════════════════════════════════════════════════════════
 
/**
 * Render tabel jadwal berdasarkan filter olahraga & tanggal.
 * Jika tanggal dipilih: tampilkan semua slot (tersedia & terisi).
 * Jika tanggal tidak dipilih: tampilkan hanya slot yang sudah dipesan.
 */
function renderJadwal() {
  const sportFilter = document.getElementById('filter-sport').value;
  const dateFilter  = document.getElementById('filter-date').value;
  const tbody       = document.getElementById('jadwal-body');
 
  let displayRows = [];
 
  if (dateFilter) {
    // Mode lengkap: tampilkan semua slot (tersedia & terisi) untuk tanggal dipilih
    const sportsToShow = sportFilter
      ? SPORTS.filter(s => s.id === sportFilter)
      : SPORTS;
 
    sportsToShow.forEach(sport => {
      sport.courts.forEach(court => {
        const bookedSlots = getBookedSlots(court, dateFilter);
        TIME_SLOTS.forEach(time => {
          const isBooked = bookedSlots.includes(time);
          // Cari nama pemesan jika slot terisi
          let pemesan = '—';
          if (isBooked) {
            const booking = bookings.find(
              b => b.court === court && b.date === dateFilter && b.slots.includes(time)
            );
            pemesan = booking ? booking.name : '—';
          }
          displayRows.push({
            icon:   sport.icon,
            court,
            date:   dateFilter,
            slot:   time,
            end:    getEndTime(time),
            name:   pemesan,
            booked: isBooked,
          });
        });
      });
    });
  } else {
    // Mode ringkas: hanya tampilkan slot yang sudah dipesan
    bookings.forEach(booking => {
      // Filter per olahraga jika dipilih
      if (sportFilter && booking.sportId !== sportFilter) return;
 
      booking.slots.forEach(time => {
        displayRows.push({
          icon:   booking.icon,
          court:  booking.court,
          date:   booking.date,
          slot:   time,
          end:    getEndTime(time),
          name:   booking.name,
          booked: true,
        });
      });
    });
  }
 
  // Urutkan: tanggal → jam
  displayRows.sort((a, b) =>
    a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot)
  );
 
  // Render baris tabel
  if (displayRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:32px;color:var(--text-dim)">
          Tidak ada data jadwal
        </td>
      </tr>`;
    return;
  }
 
  tbody.innerHTML = displayRows.map(row => `
    <tr>
      <td>${row.icon} ${row.court}</td>
      <td>${formatDate(row.date)}</td>
      <td>${row.slot} – ${row.end}</td>
      <td>${row.booked
            ? (row.name || '—')
            : `<span style="color:var(--text-dim)">—</span>`}
      </td>
      <td>
        ${row.booked
          ? `<span class="badge badge-red">Terisi</span>`
          : `<span class="badge badge-green">Tersedia</span>`}
      </td>
    </tr>
  `).join('');
}
 
 
// ═══════════════════════════════════════════════════════════════
//  HALAMAN RIWAYAT
// ═══════════════════════════════════════════════════════════════
 
/** Render daftar kartu riwayat booking */
function renderHistory() {
  const container = document.getElementById('history-list');
 
  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>Belum ada riwayat booking.<br>Booking lapangan sekarang!</p>
      </div>`;
    return;
  }
 
  container.innerHTML = bookings.map(b => {
    const sortedSlots = [...b.slots].sort();
    const jamMulai    = sortedSlots[0];
    const jamSelesai  = getEndTime(sortedSlots[sortedSlots.length - 1]);
 
    return `
    <div class="history-card">
      <div class="history-icon">${b.icon}</div>
      <div class="history-main">
        <div class="history-title">${b.court}</div>
        <div class="history-meta">
          👤 ${b.name} &nbsp;·&nbsp;
          📅 ${formatDate(b.date)} &nbsp;·&nbsp;
          ⏰ ${jamMulai} – ${jamSelesai} (${b.slots.length} jam)
        </div>
      </div>
      <div class="history-right">
        <div class="history-price">Rp ${b.total.toLocaleString('id')}</div>
        <div class="history-id"># ${b.id}</div>
        <button
          class="btn btn-danger btn-sm"
          style="margin-top:6px"
          onclick="deleteBooking('${b.id}')">
          Hapus
        </button>
      </div>
    </div>`;
  }).join('');
}
 
/**
 * Hapus satu booking berdasarkan ID.
 * @param {string} id
 */
function deleteBooking(id) {
  bookings = bookings.filter(b => b.id !== id);
  localStorage.setItem('sz_bookings', JSON.stringify(bookings));
  updateHistoryCount();
  renderHistory();
  toast('🗑 Booking dihapus', 'error');
}
 
/** Hapus semua riwayat booking */
function clearHistory() {
  if (bookings.length === 0) return;
  bookings = [];
  localStorage.setItem('sz_bookings', JSON.stringify(bookings));
  updateHistoryCount();
  renderHistory();
  toast('🗑 Semua riwayat dihapus', 'error');
}
 
/** Update angka badge di tombol nav Riwayat */
function updateHistoryCount() {
  const badge = document.getElementById('history-count');
  if (bookings.length > 0) {
    badge.textContent    = bookings.length;
    badge.style.display  = 'inline-block';
  } else {
    badge.style.display  = 'none';
  }
}
 
 
// ═══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════
 
/**
 * Menghitung jam akhir dari slot (+ 1 jam).
 * @param {string} slot - '09:00'
 * @returns {string}    - '10:00'
 */
function getEndTime(slot) {
  const hour = parseInt(slot) + 1;
  return String(hour).padStart(2, '0') + ':00';
}
 
/**
 * Format tanggal YYYY-MM-DD menjadi "Senin, 12 Jun 2026".
 * @param {string} d - YYYY-MM-DD
 * @returns {string}
 */
function formatDate(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  const MONTHS = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const dateObj = new Date(d);
  return `${DAYS[dateObj.getDay()]}, ${parseInt(day)} ${MONTHS[parseInt(m)]} ${y}`;
}
 
/**
 * Tampilkan notifikasi toast kecil di pojok kanan bawah.
 * @param {string} msg  - pesan yang ditampilkan
 * @param {string} type - 'success' | 'error'
 */
function toast(msg, type = 'success') {
  const wrap  = document.getElementById('toast-wrap');
  const el    = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3500); // hilang setelah 3.5 detik
}
 
 
// ═══════════════════════════════════════════════════════════════
//  JALANKAN INIT SAAT DOM SIAP
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', init);s