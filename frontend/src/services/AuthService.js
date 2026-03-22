const API = "http://localhost:8080";

const AuthService = {

  getAccessToken() {
    return localStorage.getItem("accessToken");
  },

  getRefreshToken() {
    return localStorage.getItem("refreshToken");
  },

  getAccountId() {
    return localStorage.getItem("accountId");
  },

  getAccountType() {
    return localStorage.getItem("accountType");
  },

  isLoggedIn() {
    return !!localStorage.getItem("accessToken");
  },

  saveSession(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("accountType", data.accountType);
    localStorage.setItem("accountId", data.accountId);
  },

  clearSession() {
    ["accessToken","refreshToken","accountType","accountId"]
      .forEach(k => localStorage.removeItem(k));
  }

};

export default AuthService;

login: async (phoneNumber, password) => {

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ phoneNumber, password })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Login failed");
  }

  AuthService.saveSession(data);

  return data;
};

refreshToken: async () => {

  const refreshToken = AuthService.getRefreshToken();

  if (!refreshToken) return false;

  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!res.ok) {
    AuthService.clearSession();
    return false;
  }

  const data = await res.json();

  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);

  return true;
};

logout: async () => {

  const refreshToken = AuthService.getRefreshToken();
  const accessToken = AuthService.getAccessToken();

  try {

    if (refreshToken) {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refreshToken })
      });
    }

  } catch {}

  AuthService.clearSession();
};
authFetch: async (url, options = {}) => {

  let token = AuthService.getAccessToken();

  let res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  if (res.status === 401) {

    const refreshed = await AuthService.refreshToken();

    if (!refreshed) throw new Error("Session expired");

    token = AuthService.getAccessToken();

    res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

  }

  return res;
}