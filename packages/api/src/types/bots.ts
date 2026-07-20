// This is just a copy of the Better Auth ApiKey type
// so it can be shipped with the package without depending on the whole Better Auth package
export interface ApiKey {
	id: string;
	configId: string;
	name: string | null;
	start: string | null;
	prefix: string | null;
	key: string;
	referenceId: string;
	refillInterval: number | null;
	refillAmount: number | null;
	lastRefillAt: Date | null;
	enabled: boolean;
	rateLimitEnabled: boolean;
	rateLimitTimeWindow: number | null;
	rateLimitMax: number | null;
	requestCount: number;
	remaining: number | null;
	lastRequest: Date | null;
	expiresAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	// biome-ignore lint/suspicious/noExplicitAny: metadata field is not typed
	metadata: Record<string, any> | null;
	permissions?:
		| ({
				[key: string]: string[];
		  } | null)
		| undefined;
}
