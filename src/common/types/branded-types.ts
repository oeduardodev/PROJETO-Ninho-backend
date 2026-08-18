export type UUID = string & { readonly __brand: unique symbol };

export function uuid(v: string): UUID {
  return v as UUID;
}

export type Email = string & { readonly __brand: unique symbol };

export function email(v: string): Email {
  return v as Email;
}

export type PhoneNumber = string & { readonly __brand: unique symbol };

export function phoneNumber(v: string): PhoneNumber {
  return v as PhoneNumber;
}

export type Hash = string & { readonly __brand: unique symbol };

export function hash(v: string): Hash {
  return v as Hash;
}

export type PaginationCursor = string & { readonly __brand: unique symbol };

export function paginationCursor(v: string): PaginationCursor {
  return v as PaginationCursor;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total?: number;
    page?: number;
    limit?: number;
    nextCursor?: string;
    hasMore?: boolean;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;