export const APP_NAME = "test-react";
export const APP_URL  = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";
export const ROUTES = { home: "/", dashboard: "/dashboard", signin: "/signin", signup: "/signup" } as const;
