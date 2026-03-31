'use strict';

/* ============================================================
   WEDDING INVITATION – Charlotte & James
   main.js – Countdown · FAQ · Copy · Music · RSVP · Animations
   ============================================================ */

const CONFIG = {
  weddingDate: new Date('2026-04-11T17:00:00+02:00'),
  calendar: {
    start: '20260411T150000Z', // 17:00 CEST = 15:00 UTC
    end: '20260412T000000Z',
    title: 'Sinh Nhật 9 Tuổi Đội Truyền Thông',
    location: 'Khách sạn Duy Tân, TP Vinh',
    details: ''
  },

  /*
    Nếu muốn gửi RSVP thật:
    - Formspree: điền endpoint Formspree vào đây
    - Google Apps Script Web App: điền URL deploy vào đây
    - Firebase Function / API riêng: điền endpoint vào đây
  */
  rsvpEndpoint: ''
};

/* ===== DOM ===== */
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMinutes = document.getElementById('cd-minutes');
const cdSeconds = document.getElementById('cd-seconds');

const music = document.getElementById('bg-music');
const audioBtn = document.getElementById('audio-btn');
const toast = document.getElementById('toast');
const messageInput = document.getElementById('rsvp-message');
const messageCounter = document.getElementById('message-counter');
const rsvpForm = document.getElementById('rsvp-form');
const submitBtn = document.getElementById('rsvp-submit-btn');

let musicPlaying = false;
let toastTimer = null;
let prevSeconds = -1;

/* ===== HELPERS ===== */
function pad(n, len = 2) {
  return String(n).padStart(len, '0');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function flashTick(el) {
  if (!el) return;
  el.classList.add('tick');
  setTimeout(() => el.classList.remove('tick'), 150);
}

function showToast(message, duration = 2800) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('show');
  void toast.offsetWidth;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function setSubmitLoading(isLoading) {
  if (!submitBtn) return;

  submitBtn.classList.toggle('is-loading', isLoading);
  submitBtn.disabled = isLoading;

  const label = submitBtn.querySelector('span');
  if (label) {
    label.textContent = isLoading ? 'Đang gửi...' : 'Gửi xác nhận';
  }
}

/* ===== COUNTDOWN ===== */
function updateCountdown() {
  if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

  const now = new Date();
  const diff = CONFIG.weddingDate - now;

  if (diff <= 0) {
    cdDays.textContent = '000';
    cdHours.textContent = '00';
    cdMinutes.textContent = '00';
    cdSeconds.textContent = '00';
    return;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

cdDays.textContent = String(days);
cdHours.textContent = String(hours);
cdMinutes.textContent = String(minutes);
cdSeconds.textContent = String(seconds);

  if (seconds !== prevSeconds) {
    cdSeconds.textContent = pad(seconds);
    flashTick(cdSeconds);
    prevSeconds = seconds;
  }
}

/* ===== FAQ ===== */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    const question = el.querySelector('.faq-question');
    if (question) question.setAttribute('aria-expanded', 'false');
  });

  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

/* ===== COPY IBAN ===== */
function fallbackCopy(text, callback) {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.cssText = 'position:fixed;opacity:0;top:-9999px';
  document.body.appendChild(el);
  el.select();

  try {
    document.execCommand('copy');
    callback();
  } catch (error) {
    showToast('Không thể sao chép. Vui lòng sao chép thủ công.');
  }

  document.body.removeChild(el);
}

function copyIban() {
  const ibanEl = document.getElementById('iban-text');
  const btn = document.getElementById('copy-btn');
  if (!ibanEl || !btn) return;

  const ibanText = ibanEl.textContent.trim();

  const doSuccess = () => {
    btn.classList.add('copied');
    btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Đã sao chép!';
    showToast('✓ Đã sao chép số tài khoản!');

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i> Sao chép số tài khoản';
    }, 3000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(ibanText)
      .then(doSuccess)
      .catch(() => fallbackCopy(ibanText, doSuccess));
  } else {
    fallbackCopy(ibanText, doSuccess);
  }
}

/* ===== GOOGLE CALENDAR ===== */
function addToCalendar() {
  const start = CONFIG.calendar.start;
  const end = CONFIG.calendar.end;
  const title = encodeURIComponent(CONFIG.calendar.title);
  const loc = encodeURIComponent(CONFIG.calendar.location);
  const details = encodeURIComponent(CONFIG.calendar.details);

  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}&details=${details}`;
  window.open(url, '_blank', 'noopener');
}

/* ===== MUSIC ===== */
function toggleMusic() {
  if (!music || !audioBtn) return;

  if (musicPlaying) {
    music.pause();
    audioBtn.innerHTML = '<i class="fas fa-volume-mute" aria-hidden="true"></i>';
    audioBtn.title = 'Bật/tắt nhạc nền';
    audioBtn.setAttribute('aria-label', 'Bật nhạc nền');
    audioBtn.setAttribute('aria-pressed', 'false');
    musicPlaying = false;
    showToast('🔇 Đã tắt nhạc nền');
    return;
  }

  music.play()
    .then(() => {
      audioBtn.innerHTML = '<i class="fas fa-volume-up" aria-hidden="true"></i>';
      audioBtn.title = 'Bật/tắt nhạc nền';
      audioBtn.setAttribute('aria-label', 'Tắt nhạc nền');
      audioBtn.setAttribute('aria-pressed', 'true');
      musicPlaying = true;
      showToast('🎵 Đang phát nhạc nền');
    })
    .catch(() => {
      showToast('Không thể phát nhạc. Vui lòng thử lại.');
    });
}

/* ===== RSVP ===== */
function getFormData(form) {
  const name = form.querySelector('#rsvp-name')?.value.trim() || '';
  const email = form.querySelector('#rsvp-email')?.value.trim() || '';
  const attendance = form.querySelector('input[name="attendance"]:checked');
  const guests = form.querySelector('#rsvp-guests')?.value || '1';
  const message = form.querySelector('#rsvp-message')?.value.trim() || '';

  return {
    name,
    email,
    attendance: attendance ? attendance.value : '',
    guests,
    message
  };
}

function validateRsvpForm(formData) {
  if (!formData.name) {
    showToast('⚠️ Vui lòng nhập họ và tên!');
    document.getElementById('rsvp-name')?.focus();
    return false;
  }

  if (!formData.attendance) {
    showToast('⚠️ Vui lòng chọn câu trả lời tham dự!');
    return false;
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    showToast('⚠️ Email chưa đúng định dạng!');
    document.getElementById('rsvp-email')?.focus();
    return false;
  }

  return true;
}

function renderRsvpSuccess({ name, attendance, message }) {
  const attending = attendance === 'yes';
  const wrap = document.querySelector('.rsvp-form-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="rsvp-success">
      <div class="rsvp-success-icon">
        <i class="fas fa-${attending ? 'heart' : 'envelope-open-text'}" aria-hidden="true"></i>
      </div>
      <p class="rsvp-success-msg">
        ${attending
          ? `🎉 Cảm ơn <em>${escapeHtml(name)}</em>!<br>Chúng tôi rất vui khi được gặp bạn trong ngày đặc biệt này. Hẹn gặp bạn tại Mallorca! 🌿`
          : `💐 Cảm ơn <em>${escapeHtml(name)}</em>!<br>Rất tiếc bạn không thể tham dự. Chúng tôi sẽ nhớ bạn và gửi tình yêu thương đến bạn trong ngày đó!`
        }
      </p>
      ${message ? `<p class="rsvp-success-note">"${escapeHtml(message)}"</p>` : ''}
    </div>
  `;
}

async function sendRsvpToEndpoint(formData) {
  if (!CONFIG.rsvpEndpoint) return { ok: true, mocked: true };

  const response = await fetch(CONFIG.rsvpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...formData,
      submittedAt: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error('RSVP_SUBMIT_FAILED');
  }

  return { ok: true, mocked: false };
}

async function submitRsvp(event) {
  event.preventDefault();

  const form = event.target;
  const formData = getFormData(form);

  if (!validateRsvpForm(formData)) return;

  setSubmitLoading(true);

  try {
    await sendRsvpToEndpoint(formData);
    renderRsvpSuccess(formData);

    if (formData.attendance === 'yes') {
      showToast('🎉 Xác nhận tham dự thành công!', 3500);
    } else {
      showToast('💐 Đã ghi nhận phản hồi!', 3500);
    }
  } catch (error) {
    showToast('Có lỗi khi gửi RSVP. Vui lòng thử lại.');
    setSubmitLoading(false);
  }
}

/* ===== INTERSECTION OBSERVER ===== */
function initScrollAnimations() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.fade-in, .timeline-item, .hotel-card').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const ioOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, ioOptions);

  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
  document.querySelectorAll('.timeline-item').forEach(el => io.observe(el));
  document.querySelectorAll('.hotel-card').forEach(el => io.observe(el));
}

/* ===== RSVP UI HELPERS ===== */
function initRadioState() {
  document.querySelectorAll('.rsvp-radio input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.rsvp-radio').forEach(label => {
        label.classList.remove('selected');
      });

      if (radio.checked) {
        radio.closest('.rsvp-radio')?.classList.add('selected');
      }
    });
  });
}

function initGuestInput() {
  const guestInput = document.getElementById('rsvp-guests');
  if (!guestInput) return;

  guestInput.addEventListener('input', () => {
    const raw = guestInput.value.trim();

    if (raw === '') return;

    const value = parseInt(raw, 10);

    if (Number.isNaN(value) || value < 1) {
      guestInput.value = '';
      return;
    }

    if (value > 5) {
      guestInput.value = '5';
    }
  });
}

function initMessageCounter() {
  if (!messageInput || !messageCounter) return;

  const updateCounter = () => {
    const current = messageInput.value.length;
    messageCounter.textContent = `${current}/300`;
  };

  updateCounter();
  messageInput.addEventListener('input', updateCounter);
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  updateCountdown();
  setInterval(updateCountdown, 1000);

  initScrollAnimations();
  initRadioState();
  initGuestInput();
  initMessageCounter();

  if (music && audioBtn) {
    music.play()
      .then(() => {
        audioBtn.innerHTML = '<i class="fas fa-volume-up" aria-hidden="true"></i>';
        audioBtn.title = 'Toggle background music';
        audioBtn.setAttribute('aria-label', 'Turn off background music');
        audioBtn.setAttribute('aria-pressed', 'true');
        musicPlaying = true;
      })
      .catch(() => {
        musicPlaying = false;
      });
  }
});

/* ===== EXPOSE GLOBALS FOR INLINE HTML HANDLERS ===== */
window.toggleFaq = toggleFaq;
window.copyIban = copyIban;
window.addToCalendar = addToCalendar;
window.toggleMusic = toggleMusic;
window.submitRsvp = submitRsvp;