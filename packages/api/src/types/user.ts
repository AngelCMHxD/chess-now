export interface User {
	id: string;
	name: string;
	username: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
	botOwnerId?: string | null;
}

export type PublicUser = Omit<User, "email" | "emailVerified">;

export interface FriendRequest {
	id: number;
	createdAt: Date;
	fromId: string;
	toId: string;
	status: "pending" | "denied" | "accepted";
	from: PublicUser;
	to: PublicUser;
}

export interface Friendship {
	id: number;
	createdAt: Date;
	userAId: string;
	userBId: string;
	userA: PublicUser;
	userB: PublicUser;
}
