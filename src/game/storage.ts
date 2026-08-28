const KEY = "skybound.v1";
const VERSION = 1;

type Save = {
  version: number;
  best: number;
  muted: boolean;
};

const defaults: Save = { version: VERSION, best: 0, muted: false };

function migrate(raw: Save): Save {
  const next = { ...defaults, ...raw, version: VERSION };
  next.best = Number.isFinite(next.best) && next.best >= 0 ? Math.floor(next.best) : 0;
  next.muted = Boolean(next.muted);
  return next;
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return migrate(JSON.parse(raw) as Save);
  } catch {
    return { ...defaults };
  }
}

export function writeSave(patch: Partial<Save>): Save {
  const current = loadSave();
  const next = migrate({ ...current, ...patch, version: VERSION });
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}
