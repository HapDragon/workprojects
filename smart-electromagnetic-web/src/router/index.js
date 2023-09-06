import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
	// 登录
	{
		path: "/login",
		name: "login",
		meta: {
			requireAuth: true,
			title: "登录",
		},
		component: () => import("@/views/Login/index.vue"),
	},
	{
		path: "/",
		redirect: "/home",
	},
	{
		path: "/home",
		name: "Home",
		component: () => import("../views/Home/home.vue"),
		children: [
			// {
			// 	path: "/mainview",
			// 	name: "一张图",
			// 	component: () => import("@/views/Map/OneMap.vue"),
			// },
		],
	},
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
