declare global {
  interface Window {
    __privyGetAccessToken?: () => Promise<string | null>;
  }
}

export {};
