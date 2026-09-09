export interface WindStackAdvance {
  next: number;
  firesTornado: boolean;
}

export function advanceWindStacks(current: number): WindStackAdvance {
  return current + 1 === 3
    ? { next: 0, firesTornado: true }
    : { next: current + 1, firesTornado: false };
}
