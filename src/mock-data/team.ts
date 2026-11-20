import { TeamMember } from "@/server/data/types";
import { getOwnerEmail } from "@/config/owner";

export const MOCK_TEAM: TeamMember[] = [
  {
    id: "tm_owner",
    name: "Promises Bedi (Propriétaire)",
    email: getOwnerEmail(),
    phone: "+22897794424",
    role: "owner",
    country: "TG",
    active: true,
    joinedAt: "01/01/2026",
  },
];
