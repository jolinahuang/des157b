const MAY_START_DAY = 5;
const MAY_TOTAL_DAYS = 31;

async function loadMoments() {
  const response = await fetch('data.json');
  const data = await response.json();
  return data.moments;
}

function buildCalendar(moments) {
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // map date number → moment
  const momentMap = {};
  moments.forEach(m => { momentMap[m.date] = m; });

  // empty cells before may 1
  for (let i = 0; i < MAY_START_DAY; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    grid.appendChild(empty);
  }

  // day cells
  for (let d = 1; d <= MAY_TOTAL_DAYS; d++) {
    const cell = document.createElement('div');
    const moment = momentMap[d];

    if (moment) {
      cell.className = 'day-cell has-moment';
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', `May ${d} — ${moment.title}`);

      const num = document.createElement('p');
      num.className = 'day-number';
      num.textContent = d;
      cell.appendChild(num);

      const img = document.createElement('img');
      img.className = 'moment-thumb';
      img.src = moment.image;
      img.alt = moment.title;

      // fallback placeholder if image missing
      img.onerror = () => {
        img.replaceWith(makePlaceholder());
      };

      cell.appendChild(img);

      // click and keyboard open lightbox
      cell.addEventListener('click', () => openLightbox(moment));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(moment);
        }
      });

    } else {
      cell.className = 'day-cell';
      const num = document.createElement('p');
      num.className = 'day-number';
      num.textContent = d;
      cell.appendChild(num);
    }

    grid.appendChild(cell);
  }
}

function makePlaceholder() {
  const div = document.createElement('div');
  div.className = 'moment-placeholder';
  div.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7a5c44" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>`;
  return div;
}

function openLightbox(moment) {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const badge = document.getElementById('lightbox-date-badge');
  const day = document.getElementById('lightbox-day');
  const title = document.getElementById('lightbox-title');
  const desc = document.getElementById('lightbox-desc');

  img.src = moment.image;
  img.alt = moment.title;
  badge.textContent = moment.date;
  day.textContent = `${moment.day}, May ${moment.date}`;
  title.textContent = moment.title;
  desc.textContent = moment.description;

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';

  // focus the close button for accessibility
  document.getElementById('lightbox-close').focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

loadMoments().then(moments => buildCalendar(moments));