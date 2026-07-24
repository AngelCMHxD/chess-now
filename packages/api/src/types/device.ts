export const Scope = {
	Account: "account",
	Challenges: "challenges",
	Matches: "matches",
	Friends: "friends",
	Bots: "bots",
} as const;

export const SCOPES = Object.values(Scope);

export type ScopeType = (typeof SCOPES)[number];

export interface DeviceAuthInitResponse {
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	verificationUriComplete: string;
	expiresIn: number;
	interval: number;
}

export interface DeviceTokenResponse {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	scope: ScopeType[];
}

export interface DeviceInfoResponse {
	userCode: string;
	expiresAt: Date;
	scopes: ScopeType[];
	clientId: string;
}
