function renderDateStrip() {
  const todayMid = startOfDay(Date.now());
  if (!state.homeDateInitialized) {
    state.homeDate = todayMid;
    state.homeDateInitialized = true;
  }
  if (state.homeDate === null) state.homeDate = todayMid;

  // Full current month, 1st → last day. That way the strip overflows
  // and scrolling actually works, from the 1st to the 30/31st.
  const now = new Date(todayMid);
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstMid = startOfDay(new Date(year, month, 1).getTime());
  const lastMid = startOfDay(new Date(year, month + 1, 0).getTime());

  let html = '';
  for (let ts = firstMid; ts <= lastMid; ts += DAY) {
    const isSelected = ts === state.homeDate;
    const classes = 'date-chip' + (isSelected ? ' is-selected' : '');
    html += (
      '<button type="button" class="' + classes + '" data-day="' + ts + '" ' +
              'role="tab" aria-selected="' + (isSelected ? 'true' : 'false') + '">' +
        '<span class="date-chip-day">' + escapeHtml(shortWeekday(ts)) + '</span>' +
        '<span class="date-chip-num">' + new Date(ts).getDate() + '</span>' +
      '</button>'
    );
  }
  el.homeDateStrip.innerHTML = html;

  // Center the selected chip in the strip.
  requestAnimationFrame(() => {
    const target = el.homeDateStrip.querySelector('.date-chip.is-selected');
    if (!target) return;
    const strip = el.homeDateStrip;
    const targetCenter = target.offsetLeft + target.offsetWidth / 2;
    const stripHalf = strip.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, targetCenter - stripHalf), behavior: 'auto' });
  });
}
