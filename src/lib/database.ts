import { NodeCacheStore } from "@cacheable/node-cache";
import KeyvRedis from "@keyv/redis";
import { drizzle } from "drizzle-orm/node-postgres";
import Keyv from "keyv";
import * as schema from "@/db/schema/index";

export const schemas = schema;

// if a redis instance it not defined, it'll be stored on ram
const cache = new NodeCacheStore({
	store: process.env.REDIS_URI
		? new Keyv({ store: new KeyvRedis(process.env.REDIS_URI) })
		: undefined,
});

export const secondaryStorage = {
	get: async (key: string | number) => {
		return await cache.get(key);
	},
	set: async (key: string | number, value: unknown, ttlSeconds?: number) => {
		const ttlMs =
			ttlSeconds && ttlSeconds > 0 ? ttlSeconds * 1000 : undefined;

		await cache.set(key, value, ttlMs);
	},
	delete: async (key: string | number) => {
		await cache.del(key);
	},
};

export const db = drizzle({
	connection: process.env.DATABASE_URL as string,
	schema: schema,
});
