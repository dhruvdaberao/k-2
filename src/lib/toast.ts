let listeners: ((message: string) => void)[] = [];

export const showToast = (message: string) => {
  listeners.forEach((fn) => fn(message));
};

export const subscribeToast = (fn: (message: string) => void) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};
