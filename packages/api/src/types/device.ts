export const Scope = {
	Challenges: "challenges",
	Matches: "matches",
	Friends: "friends",
} as const;

export const SCOPES = [Scope.Challenges, Scope.Matches, Scope.Friends] as const;

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
	scope: string[];
}
