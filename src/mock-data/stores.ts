import { Store } from "@/server/data/types";

export const MOCK_STORES: Store[] = [];

export const CURRENT_USER = {
  id: "usr_owner_01",
  name: "Promises Bedi",
  email: "promisesbedi@gmail.com",
  avatar: "/avatars/promises.jpg",
  initials: "PB",
  defaultRole: "owner" as const,
};
