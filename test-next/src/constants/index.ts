export const APP_NAME = "test-next";
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const ROUTES = {
  home:      "/",
  dashboard: "/dashboard",
  signin:    "/signin",
  signup:    "/signup",
} as const;
