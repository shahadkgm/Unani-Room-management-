import { connectToDatabase } from "@/backend/db";
import { UserRepository } from "../repositories/UserRepository";
import type { User } from "@/shared/types";

export class UserService {
  static async getAllUsers() {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline", users: [] };
    try {
      const users = await UserRepository.getAllUsers(db);
      const cleanUsers = users.map(({ _id, password, ...rest }) => rest) as User[];
      return { ok: true, users: cleanUsers };
    } catch (err) {
      return { ok: false, error: (err as Error).message, users: [] };
    }
  }

  static async registerUser(user: User) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline" };
    try {
      const existing = await UserRepository.getUserByUsernameOrEmail(db, user.username) || 
                       await UserRepository.getUserByUsernameOrEmail(db, user.email);
      if (existing) {
        return { ok: false, error: "Username or Email already registered" };
      }
      await UserRepository.insertUser(db, user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  static async authenticateUser(usernameOrEmail: string, password?: string) {
    const { db, isConnected } = await connectToDatabase();
    if (!isConnected || !db) return { ok: false, error: "Database offline", user: null };
    try {
      const user = await UserRepository.getUserByUsernameOrEmail(db, usernameOrEmail);
      if (!user || user["password"] !== password) {
        return { ok: false, error: "Invalid username/email or password", user: null };
      }
      const { _id, password: _, ...cleanUser } = user;
      return { ok: true, user: cleanUser as User };
    } catch (err) {
      return { ok: false, error: (err as Error).message, user: null };
    }
  }
}
