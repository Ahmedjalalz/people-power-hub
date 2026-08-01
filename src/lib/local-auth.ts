export const TEST_USER = {
  email: "admin@peoplelens.test",
  password: "PeopleLens123!",
};

const STORAGE_KEY = "peoplelens-test-session";

export function isSignedIn(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "active";
}

export function signIn(email: string, password: string): string | null {
  if (email.trim().toLowerCase() !== TEST_USER.email || password !== TEST_USER.password) {
    return "Use the test credentials shown below.";
  }
  window.localStorage.setItem(STORAGE_KEY, "active");
  return null;
}

export function signOut(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
