/**
 * Shared client-side progress store.
 *
 * Quiz results live only in this browser's localStorage (there is no
 * account system yet), under keys shared by quiz.js, dashboard.js and
 * progress.js so all three pages agree on the same data.
 */
(function (global) {
  const KEYS = {
    history: "quizHistory",
    subjectStats: "subjectStats", // { [subject]: { total, count, best, last } }
  };

  const MAX_HISTORY = 50;
  const WEAK_THRESHOLD = 60;

  function safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Storage can be unavailable (private mode, quota) - fail silently.
    }
  }

  function getHistory() {
    return safeGet(KEYS.history, []);
  }

  function getSubjectStats() {
    return safeGet(KEYS.subjectStats, {});
  }

  /**
   * Record a finished quiz attempt and update the rolling per-subject stats.
   * @param {{subject: string, grade: number|string, score: number, total: number}} attempt
   */
  function recordQuizResult(attempt) {
    const total = Number(attempt.total) || 0;
    const score = Math.max(0, Math.min(Number(attempt.score) || 0, total));
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;

    const history = getHistory();
    history.unshift({
      subject: attempt.subject,
      grade: Number(attempt.grade) || null,
      score,
      total,
      percent,
      date: new Date().toISOString(),
    });
    safeSet(KEYS.history, history.slice(0, MAX_HISTORY));

    const stats = getSubjectStats();
    const current = stats[attempt.subject] || { total: 0, count: 0, best: 0 };
    stats[attempt.subject] = {
      total: current.total + percent,
      count: current.count + 1,
      best: Math.max(current.best, percent),
      last: percent,
    };
    safeSet(KEYS.subjectStats, stats);

    return percent;
  }

  /** Average percent across every quiz ever taken (0 when none taken). */
  function overallAverage() {
    const history = getHistory();
    if (!history.length) return 0;
    const sum = history.reduce((acc, h) => acc + h.percent, 0);
    return Math.round(sum / history.length);
  }

  /** Average percent per subject, e.g. { math: 72, science: 40 }. */
  function subjectAverages() {
    const stats = getSubjectStats();
    const averages = {};
    Object.keys(stats).forEach((subject) => {
      const s = stats[subject];
      averages[subject] = s.count ? Math.round(s.total / s.count) : 0;
    });
    return averages;
  }

  /** Subjects below the "needs practice" threshold, weakest first. */
  function weakSubjects(limit = 5) {
    const averages = subjectAverages();
    return Object.keys(averages)
      .filter((subject) => averages[subject] < WEAK_THRESHOLD)
      .sort((a, b) => averages[a] - averages[b])
      .slice(0, limit)
      .map((subject) => ({ subject, percent: averages[subject] }));
  }

  /** Consecutive days (including today) with at least one quiz taken. */
  function learningStreak() {
    const history = getHistory();
    if (!history.length) return 0;

    const days = new Set(
      history.map((h) => new Date(h.date).toDateString()),
    );

    let streak = 0;
    const cursor = new Date();
    while (days.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function clearAll() {
    try {
      localStorage.removeItem(KEYS.history);
      localStorage.removeItem(KEYS.subjectStats);
    } catch (_) {}
  }

  global.NachoProgress = {
    recordQuizResult,
    getHistory,
    subjectAverages,
    overallAverage,
    weakSubjects,
    learningStreak,
    clearAll,
  };
})(window);
