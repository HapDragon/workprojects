import router from "../router";
import { ElMessage } from "element-plus";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { getSession } from "@/utils/tools/sessionStorage";
import useLoginStore from "@/store/login";

NProgress.configure({ showSpinner: false });

// 白名单 免登录
const whiteList = ["/login", "/register", "/admin"];

// 全局前置守卫，路由跳转前触发
router.beforeEach((to, from, next) => {
	NProgress.start();
	let token = getSession("SmartElecAccessToken");
	// 登录成功 有token
	if (token) {
		// 登录成功 则不跳转登录界面
		if (to.path === "/login") {
			next({ path: "/" });
			NProgress.done();
		} else {
			const loginStore = useLoginStore();
			if (loginStore.SmartElecUserDetail == "") {
				loginStore.$patch({
					SmartElecUserDetail: getSession("SmartElecUserDetail", true),
				});
			}
			// const businessStore = useBusinessStore();
			// let activeIndex = getCookie("AirPortMenuActiveIndex");
			// if (activeIndex) businessStore.AirPortMenuActiveIndex = activeIndex;
			// 放行
			next();

		}
	} else {
		// 登录失败 没有token
		if (whiteList.indexOf(to.path) !== -1) {
			// 在免登录白名单，直接进入
			next();
		} else {
			next(`/login?redirect=${to.path}`); // 否则全部重定向到登录页
		}
	}
});

// 全局后置守卫，路由跳转完成后触发
router.afterEach(() => {
	NProgress.done();
});
