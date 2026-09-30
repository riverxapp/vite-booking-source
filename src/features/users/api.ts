import { db } from "@/db/client";
import { users } from "@/db/schema";

export type Agent = { id: number; name: string; avatar: string | null; role: string };

/** Everyone who can be assigned a ticket (admins and agents). */
export async function listAgents(): Promise<Agent[]> {
  return db.select({ id: users.id, name: users.name, avatar: users.avatar, role: users.role }).from(users).orderBy(users.name);
}
