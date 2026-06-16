import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/db/schema/index";

export const db = drizzle({
	connection: process.env.DATABASE_URL as string,
	schema: schema,
});
