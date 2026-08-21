import type { Db } from "mongodb";
import type { User } from "@/shared/types";

export class UserRepository {
  static async getAllUsers(db: Db) {
    return await db.collection("users").find({}).toArray();
  }

  static async getUserByUsernameOrEmail(db: Db, identifier: string) {
    return await db.collection("users").findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });
  }

  static async insertUser(db: Db, user: User) {
    await db.collection("users").insertOne(user);
  }
}
