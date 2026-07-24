export interface User {
	id: string;
	name: string;
	username: string;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
	botOwnerId?: string | null;
	rating: number;
	rd: number;
	vol: number;
}

export interface FriendRequest {
	id: number;
	createdAt: Date;
	fromId: string;
	toId: string;
	status: "pending" | "denied" | "accepted";
	from: User;
	to: User;
}

export interface Friendship {
	id: number;
	createdAt: Date;
	userAId: string;
	userBId: string;
	userA: User;
	userB: User;
}
