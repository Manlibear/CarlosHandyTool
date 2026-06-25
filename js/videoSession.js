// Keyframe shape: { t: seconds, x: 0-1, y: 0-1, present: boolean }
const VideoSession = (() => {
  function createId() {
    return 'session-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function createSession(fileName, duration) {
    return {
      id: createId(),
      fileName,
      duration,
      keyframes: { left: [], right: [] }
    };
  }

  function addKeyframe(session, hand, t, x, y, present) {
    const kfs = session.keyframes[hand];
    const newKf = { t, x, y, present };
    const existingIdx = kfs.findIndex(kf => kf.t === t);
    if (existingIdx !== -1) {
      kfs[existingIdx] = newKf;
      return;
    }
    let insertAt = kfs.findIndex(kf => kf.t > t);
    if (insertAt === -1) insertAt = kfs.length;
    kfs.splice(insertAt, 0, newKf);
  }

  // Returns the most recent keyframe at or before time t (step-function hold), or null.
  function getStateAtTime(session, hand, t) {
    const kfs = session.keyframes[hand];
    let result = null;
    for (const kf of kfs) {
      if (kf.t <= t) {
        result = kf;
      } else {
        break;
      }
    }
    if (!result) return null;
    return { x: result.x, y: result.y, present: result.present };
  }

  return { createSession, addKeyframe, getStateAtTime };
})();
