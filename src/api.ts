const API_BASE = "/api";

export function getStoredToken(): string | null {
  return localStorage.getItem("vote_token");
}

export function getStoredUser() {
  const userStr = localStorage.getItem("vote_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function setStoredAuth(token: string, user: any) {
  localStorage.setItem("vote_token", token);
  localStorage.setItem("vote_user", JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem("vote_token");
  localStorage.removeItem("vote_user");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  // Check if response is JSON
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return null as unknown as T;
}

// Auth APIs
export async function loginElector(registerNumber: string, password = "DSU") {
  const data = await apiFetch<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ registerNumber, password }),
  });
  setStoredAuth(data.token, data.user);
  return data;
}

export async function loginAdmin(username: string, password: string) {
  const data = await apiFetch<{ token: string; user: any }>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setStoredAuth(data.token, data.user);
  return data;
}

export async function checkMe() {
  return apiFetch<{ user: any }>("/auth/me");
}

// Election APIs
export async function getElections() {
  return apiFetch<any[]>("/elections");
}

export async function createElection(payload: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Active" | "Closed";
}) {
  return apiFetch<any>("/elections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateElection(
  id: string,
  payload: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: "Upcoming" | "Active" | "Closed";
  }
) {
  return apiFetch<any>(`/elections/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteElection(id: string) {
  return apiFetch<any>(`/elections/${id}`, {
    method: "DELETE",
  });
}

// Candidate APIs
export async function getCandidates(electionId: string) {
  return apiFetch<any[]>(`/elections/${electionId}/candidates`);
}

export async function createCandidate(payload: {
  name: string;
  registerNumber: string;
  electionId: string;
  photo?: string;
}) {
  return apiFetch<any>("/candidates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCandidate(
  id: string,
  payload: {
    name?: string;
    registerNumber?: string;
    photo?: string;
  }
) {
  return apiFetch<any>(`/candidates/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteCandidate(id: string) {
  return apiFetch<any>(`/candidates/${id}`, {
    method: "DELETE",
  });
}

// Elector APIs
export async function getElectors(page = 1, limit = 10, search = "") {
  return apiFetch<{ electors: any[]; total: number; page: number; pages: number }>(
    `/electors?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
  );
}

export async function createElector(payload: { name: string; registerNumber: string }) {
  return apiFetch<any>("/electors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function bulkUploadElectors(electors: Array<{ name: string; registerNumber: string }>) {
  return apiFetch<any>("/electors/bulk", {
    method: "POST",
    body: JSON.stringify({ electors }),
  });
}

export async function deleteElector(id: string) {
  return apiFetch<any>(`/electors/${id}`, {
    method: "DELETE",
  });
}

export async function deleteAllElectors() {
  return apiFetch<any>("/electors", {
    method: "DELETE",
  });
}

// Voting APIs
export async function castVote(electionId: string, candidateId: string) {
  return apiFetch<any>("/votes", {
    method: "POST",
    body: JSON.stringify({ electionId, candidateId }),
  });
}

export async function getElectorVoteHistory() {
  return apiFetch<any[]>("/electors/history");
}

// Stats & Results APIs
export async function getDashboardStats() {
  return apiFetch<any>("/stats");
}

export async function getElectionResults(electionId: string) {
  return apiFetch<any>(`/results/${electionId}`);
}

export async function getRemainingVotersReport(electionId: string) {
  return apiFetch<any>(`/reports/remaining-voters/${electionId}`);
}

// Export Trigger URL Helpers
export function getExportUrl(electionId: string): string {
  const token = getStoredToken();
  return `/api/results/${electionId}/export?authorization=${token}`; // will append auth manually on download
}

export function getRemainingVotersExportUrl(electionId: string): string {
  const token = getStoredToken();
  return `/api/reports/remaining-voters/${electionId}/export?authorization=${token}`;
}
