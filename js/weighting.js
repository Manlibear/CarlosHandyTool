const Weighting = (() => {
  // One segment per "present" keyframe, lasting until the next keyframe (or video end).
  function computeSegments(session, hand) {
    const kfs = session.keyframes[hand];
    const segments = [];
    for (let i = 0; i < kfs.length; i++) {
      if (!kfs[i].present) continue;
      const start = kfs[i].t;
      const end = i + 1 < kfs.length ? kfs[i + 1].t : session.duration;
      const durationSeconds = Math.max(0, end - start);
      segments.push({ x: kfs[i].x, y: kfs[i].y, durationSeconds });
    }
    return segments;
  }

  // alpha blends time-held weighting (1) against equal-per-segment count weighting (0).
  function computeWeightsForSession(session, hand, alpha) {
    const segments = computeSegments(session, hand);
    if (segments.length === 0) return [];
    const countWeight = 1 / segments.length;
    return segments.map(seg => {
      const durationWeight = session.duration > 0 ? seg.durationSeconds / session.duration : 0;
      const finalWeight = alpha * durationWeight + (1 - alpha) * countWeight;
      return { x: seg.x, y: seg.y, value: finalWeight };
    });
  }

  function buildHeatmapPoints(sessions, alpha, displayWidth, displayHeight) {
    const points = [];
    for (const session of sessions) {
      if (!session.duration || !isFinite(session.duration) || session.duration <= 0) continue;
      for (const hand of ['left', 'right']) {
        for (const w of computeWeightsForSession(session, hand, alpha)) {
          points.push({
            x: Math.round(w.x * displayWidth),
            y: Math.round(w.y * displayHeight),
            value: w.value
          });
        }
      }
    }
    return points;
  }

  return { computeSegments, computeWeightsForSession, buildHeatmapPoints };
})();
