export const VALID_SCOPES = ["challenges", "matches", "friends"] as const;

export type Scope = (typeof VALID_SCOPES)[number];

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
