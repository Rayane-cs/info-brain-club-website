;(function () {
  'use strict';

  let allEvents = [];
  let calYear, calMonth;

  /* ── HELPERS ─────────────────────────── */
  function detailUrl(id) {
    return id ? `/pages/event-detail.html?id=${encodeURIComponent(id)}` : '/pages/events.html';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── RENDER EVENT CARD ───────────────── */
  function renderCard(ev) {
    const img   = ev.image_url || 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800';
    const taken = typeof ev.regis_user === 'number' ? ev.regis_user : 0;
    const cap   = typeof ev.capacity === 'number' ? ev.capacity : null;
    const pct   = cap ? Math.min(100, Math.round((taken / cap) * 100)) : 0;
    const url   = detailUrl(ev.id);

    const iconClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const iconPin   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

    return `
      <article class="event-card">
        <div class="event-image">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(ev.title || 'Event')}" loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&w=800'">
          <div class="event-image-overlay"></div>
          ${ev.event_date ? `<div class="date-badge">${escapeHtml(ev.event_date)}</div>` : ''}
          <span class="cat-tag">${escapeHtml(ev.category || 'Event')}</span>
        </div>
        <div class="event-content">
          <h3 class="event-title">${escapeHtml(ev.title || 'Event')}</h3>
          <div class="event-meta-row">
            ${ev.event_time   ? `<span class="event-meta-item">${iconClock}${escapeHtml(ev.event_time)}</span>` : ''}
            ${ev.location     ? `<span class="event-meta-item">${iconPin}${escapeHtml(ev.location)}</span>`    : ''}
          </div>
          ${cap ? `
          <div class="event-seats">
            <span>Seats</span>
            <span>${taken} / ${cap}</span>
          </div>
          <div class="event-seats-bar"><div class="event-seats-fill" style="width:${pct}%"></div></div>
          ` : ''}
          <div class="event-actions">
            <a href="${url}" class="event-link">Details</a>
            <a href="${url}" class="event-register-btn">Register →</a>
          </div>
        </div>
      </article>
    `;
  }

  /* ── SPOTLIGHT ───────────────────────── */
  function renderSpotlight(ev) {
    const section = document.getElementById('spotlightSection');
    if (!ev || !section) return;
    section.style.display = '';

    setText('spotCategory', ev.category || 'Upcoming');
    setText('spotTitle', ev.title || 'Next Event');
    setText('spotDate', ev.event_date || 'Date TBA');
    setText('spotTime', ev.event_time || 'Time TBA');
    setText('spotLocation', ev.location || 'Location TBA');

    const btn = document.getElementById('spotBtn');
    if (btn) btn.href = detailUrl(ev.id);

    const taken = typeof ev.regis_user === 'number' ? ev.regis_user : 0;
    const cap   = typeof ev.capacity  === 'number' ? ev.capacity  : 0;
    if (cap > 0) {
      document.getElementById('spotSeatsBar').style.display = '';
      setText('spotTaken', taken);
      setText('spotCap', cap);
      const pct = Math.min(100, Math.round((taken / cap) * 100));
      const fill = document.getElementById('spotFill');
      if (fill) fill.style.width = pct + '%';
    }

    const imgWrap = document.getElementById('spotImgWrap');
    if (imgWrap && ev.image_url) {
      imgWrap.innerHTML = `<img src="${escapeHtml(ev.image_url)}" alt="${escapeHtml(ev.title || '')}" loading="lazy">`;
    }
  }

  /* ── CALENDAR ────────────────────────── */
  function buildCalendar(events) {
    const now   = new Date();
    if (calYear === undefined)  calYear  = now.getFullYear();
    if (calMonth === undefined) calMonth = now.getMonth();

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const label  = document.getElementById('calMonthLabel');
    const grid   = document.getElementById('calDays');
    if (!label || !grid) return;

    label.textContent = `${MONTHS[calMonth]} ${calYear}`;

    // Map event dates → titles for this month
    const eventMap = {};
    events.forEach(ev => {
      if (!ev.event_date) return;
      const d = new Date(ev.event_date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const day = d.getDate();
        if (!eventMap[day]) eventMap[day] = [];
        eventMap[day].push(ev.title || 'Event');
      }
    });

    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const todayDate = (now.getFullYear() === calYear && now.getMonth() === calMonth) ? now.getDate() : -1;

    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const hasEv  = !!eventMap[d];
      const isToday = d === todayDate;
      const classes = ['cal-day', hasEv ? 'has-event' : '', isToday ? 'today' : ''].filter(Boolean).join(' ');
      const tooltip = hasEv ? `<span class="cal-tooltip">${eventMap[d].map(t => escapeHtml(t)).join('<br>')}</span>` : '';
      html += `<div class="${classes}">${d}${tooltip}</div>`;
    }
    grid.innerHTML = html;
  }

  function attachCalNav(events) {
    document.getElementById('calPrev')?.addEventListener('click', () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      buildCalendar(events);
    });
    document.getElementById('calNext')?.addEventListener('click', () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      buildCalendar(events);
    });
  }

  /* ── MAIN ────────────────────────────── */
  async function init() {
    const grid = document.getElementById('eventsGrid');
    if (!grid) return;

    try {
      const client = await getSupabaseClient();
      const today  = new Date().toISOString().split('T')[0];
      const { data, error } = await client
        .from('events')
        .select('id,title,description,location,event_date,event_time,category,image_url,capacity,regis_user')
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true });

      if (error) throw error;

      allEvents = data || [];
      const upcoming = allEvents.filter(e => !e.event_date || e.event_date >= today);

      if (!upcoming.length) {
        grid.innerHTML = '<p class="events-empty">No upcoming events at the moment. Check back soon!</p>';
      } else {
        renderSpotlight(upcoming[0]);
        grid.innerHTML = upcoming.map(renderCard).join('');
      }

      buildCalendar(allEvents);
      attachCalNav(allEvents);

    } catch (err) {
      console.error('Events load error:', err);
      grid.innerHTML = '<p class="events-empty">Could not load events. Please try again later.</p>';
      buildCalendar([]);
      attachCalNav([]);
    }
  }

  init();
})();
