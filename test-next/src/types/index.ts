// ─── Global TypeScript types ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T | null;
  error:   string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items:    T[];
  total:    number;
  page:     number;
  pageSize: number;
  hasMore:  boolean;
}

export interface BaseDocument {
  id:        string;
  createdAt: Date;
  updatedAt: Date;
}
