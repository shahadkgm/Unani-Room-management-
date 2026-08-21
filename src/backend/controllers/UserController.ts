import { createServerFn } from "@tanstack/react-start";
import { UserService } from "../services/UserService";
import type { User } from "@/shared/types";

export const getUsersServer = createServerFn({ method: "GET" }).handler(async () => {
  return await UserService.getAllUsers();
});

export const registerUserServer = createServerFn({ method: "POST" })
  .validator((user: User) => user)
  .handler(async ({ data: user }) => {
    return await UserService.registerUser(user);
  });

export const authenticateUserServer = createServerFn({ method: "POST" })
  .validator((data: { usernameOrEmail: string; password?: string }) => data)
  .handler(async ({ data }) => {
    return await UserService.authenticateUser(data.usernameOrEmail, data.password);
  });
