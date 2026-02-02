type BalanceUpdateListener = () => void;

class BalanceEventEmitter {
  private listeners: Set<BalanceUpdateListener> = new Set();

  subscribe(listener: BalanceUpdateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const balanceEvents = new BalanceEventEmitter();
