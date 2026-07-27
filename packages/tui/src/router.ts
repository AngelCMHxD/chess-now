import { createMemoryHistory, createRouter } from "vue-router";
import DrawMatch from "./pages/DrawPage.vue";
import ForfeitMatch from "./pages/ForfeitPage.vue";
import Friends from "./pages/FriendsPage.vue";
import Loading from "./pages/LoadingPage.vue";
import Login from "./pages/LoginPage.vue";
import Matches from "./pages/MatchesPage.vue";
import NotificationsPage from "./pages/NotificationsPage.vue";
import PlayMatch from "./pages/PlayMatchPage.vue";

export const router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{ path: "/matches", component: Matches },
		{ path: "/login", component: Login },
		{ path: "/notifications", component: NotificationsPage },
		{ path: "/friends", component: Friends },
		{ path: "/loading", component: Loading },
		{ path: "/matches/:id", component: PlayMatch },
		{ path: "/matches/:id/draw", component: DrawMatch },
		{ path: "/matches/:id/draw", component: ForfeitMatch },
	],
});
