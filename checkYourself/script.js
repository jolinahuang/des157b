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

  // map date number to memory
  const momentMap = {};
  moments.forEach(function (m) {
    momentMap[m.date] = m;
  });

  // empty cells before may 1
  for (let i = 0; i < MAY_START_DAY; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    grid.appendChild(empty);
  }

  // day cells
  var totalCells = MAY_START_DAY + MAY_TOTAL_DAYS;
  var rows = Math.ceil(totalCells / 7);
  var rowHeight = window.innerWidth >= 701 ? '88px' : '60px';
  grid.style.gridTemplateRows = 'repeat(' + rows + ', ' + rowHeight + ')';
  window.addEventListener('resize', function () {
    var rh = window.innerWidth >= 701 ? '88px' : '60px';
    grid.style.gridTemplateRows = 'repeat(' + rows + ', ' + rh + ')';
  });

  for (let d = 1; d <= MAY_TOTAL_DAYS; d++) {
    const cell = document.createElement('div');
    const moment = momentMap[d];

    if (moment) {
      cell.className = 'day-cell has-moment';
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', 'May ' + d + ' — ' + moment.title);

      const num = document.createElement('p');
      num.className = 'day-number';
      num.textContent = d;
      cell.appendChild(num);

      const img = document.createElement('img');
      img.className = 'moment-thumb';
      img.src = moment.image;
      img.alt = moment.title;
      cell.appendChild(img);

      cell.addEventListener('click', function () {
        openLightbox(moment);
      });

      cell.addEventListener('keydown', function (e) {
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

function openLightbox(moment) {
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const day = document.getElementById('lightbox-day');
  const title = document.getElementById('lightbox-title');
  const desc = document.getElementById('lightbox-desc');

  img.src = moment.image;
  img.alt = moment.title;
  day.textContent = moment.day + ', May ' + moment.date;
  title.textContent = moment.title;
  desc.textContent = moment.description;

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('lightbox-close').focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('lightbox-backdrop').addEventListener('click', closeLightbox);
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});

loadMoments().then(function (moments) {
  buildCalendar(moments);
});