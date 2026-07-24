// WordMemo v11.1 — audit fixes: local dates, review priority, copy correction
(function(){
'use strict';

for (const w of WORDS) {
  if (w.en.toLowerCase() === 'into') w.ru = 'внутрь — движение снаружи внутрь';
}

function wmLocalDayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Reviews that are already due are pedagogically more important than introducing
// another new item. New cards are still selected randomly (with a mild frequency
// bias) and are interleaved so the session does not feel monotonous.
buildSession = function () {
  const now = Date.now();
  const h = historyToday();
  const pool = selectedWords();
  const recent = new Set((state.recentIds || []).slice(-80));

  let due = pool.filter(w => {
    const c = state.cards[w.id];
    return c && c.status !== 'new' && c.due <= now;
  });

  due = due
    .map(w => ({
      w,
      score: (now - (cardState(w.id).due || 0)) / DAY + Math.random() * 0.12,
    }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.w);

  const allowed = Math.max(0, (state.settings.newPerDay || 10) - (h.new || 0));
  const unseen = pool.filter(w => !state.cards[w.id] || state.cards[w.id].status === 'new');
  const preferred = unseen.filter(w => !recent.has(w.id));
  const fallback = unseen.filter(w => recent.has(w.id));

  const weightedRandom = list => list
    .map(w => ({
      w,
      // Rank still matters slightly, but order is not deterministic.
      key: Math.random() / (1 + Math.max(0, w.rank - 1) / 450),
    }))
    .sort((a, b) => b.key - a.key)
    .map(x => x.w);

  const fresh = weightedRandom(preferred)
    .concat(weightedRandom(fallback))
    .slice(0, allowed);

  const result = [];
  const reviews = [...due];
  const newCards = [...fresh];

  if ((state.settings.mode || 'random') === 'mixed') {
    // Two due reviews, then one new card.
    while (reviews.length || newCards.length) {
      if (reviews.length) result.push(reviews.shift());
      if (reviews.length) result.push(reviews.shift());
      if (newCards.length) result.push(newCards.shift());
    }
  } else {
    // Random-feeling session while keeping a clear review priority.
    while (reviews.length || newCards.length) {
      if (reviews.length && (!newCards.length || Math.random() < 0.72)) {
        result.push(reviews.shift());
      } else if (newCards.length) {
        result.push(newCards.shift());
      } else if (reviews.length) {
        result.push(reviews.shift());
      }
    }
  }
  return result;
};

renderStats = function () {
  const c = counts();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const k = wmLocalDayKey(d);
    const v = state.history[k]?.reviews || 0;
    days.push({
      k,
      v,
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    });
  }

  const max = Math.max(1, ...days.map(x => x.v));
  const total = Object.values(state.history).reduce((a, h) => a + (h.reviews || 0), 0);
  const ctxOk = Object.values(state.history).reduce((a, h) => a + (h.contextCorrect || 0), 0);
  const ctxBad = Object.values(state.history).reduce((a, h) => a + (h.contextWrong || 0), 0);
  const ctxTotal = ctxOk + ctxBad;
  const recOk = Object.values(state.history).reduce((a, h) => a + (h.recallCorrect || 0), 0);
  const recBad = Object.values(state.history).reduce((a, h) => a + (h.recallWrong || 0), 0);
  const recTotal = recOk + recBad;

  document.getElementById('page-stats').innerHTML = pageHeader(
    'Статистика',
    'Прогресс считается по локальному времени устройства и по способности вспомнить и употребить слово.'
  ) + `
    <div class="grid">
      <div class="stat"><div class="n">${total}</div><div class="l">всего повторений</div></div>
      <div class="stat"><div class="n">${recTotal ? Math.round(recOk / recTotal * 100) : 0}%</div><div class="l">активное вспоминание</div></div>
      <div class="stat"><div class="n">${ctxTotal ? Math.round(ctxOk / ctxTotal * 100) : 0}%</div><div class="l">точность в контексте</div></div>
      <div class="stat"><div class="n">${c.m}</div><div class="l">устойчиво освоено</div></div>
    </div>
    <div class="panel">
      <h2>Последние 14 дней</h2>
      <div class="chart">${days.map(x => `<div class="bar" title="${x.v} повторений" style="height:${Math.max(3, Math.round(x.v / max * 120))}px"><span>${x.label}</span></div>`).join('')}</div>
    </div>
    <div class="panel">
      <h2>Что означает «освоено»</h2>
      <div class="sub">Минимум 5 повторений · интервал ≥ 21 дня · активное воспроизведение слова ≥ 2 раз · правильное употребление в контексте ≥ 2 раз. Узнавание перевода само по себе недостаточно.</div>
    </div>
    <div class="panel">
      <h2>Распределение слов</h2>
      <div class="sub">Новые ${c.n} · В изучении ${c.l} · Освоено ${c.m}</div>
      <div class="progress" style="margin-top:14px"><i style="width:${Math.round(c.m / 10)}%"></i></div>
    </div>`;
};

if (typeof render === 'function' && typeof currentPage !== 'undefined') render(currentPage);
})();
