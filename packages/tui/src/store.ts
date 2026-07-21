import type {
	Challenge,
	FriendRequest,
	Friendship,
	Match,
	User,
} from "@chess-now/api";
import { reactive } from "vue";

export const state = reactive({
	user: undefined as User | undefined,
	matches: [] as Match[],
	challenges: [] as Challenge[],
	friends: [] as Friendship[],
	friendRequests: [] as FriendRequest[],
});
