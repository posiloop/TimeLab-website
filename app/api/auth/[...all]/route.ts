import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/app/server/auth";

export const { GET, POST } = toNextJsHandler(auth);
