import axios from "axios";
import { getSession, setSession, removeSession } from "@/utils/tools/sessionStorage";
import { ElMessage } from "element-plus";
import router from "@/router/index.js";
import useLoginStore from "@/store/login";
import useBusinessStore from "@/store/business";
// axios 使用文档https://www.kancloud.cn/yunye/axios/234845
// 配置默认请求头
axios.defaults.headers["Content-Type"] = "application/json;charset=utf-8";
axios.defaults.headers["Access-Control-Allow-Origin"] = "*";
axios.defaults.withCredentials = true;
// 配置默认请求超时
axios.defaults.timeout = 60000;
// axios.defaults.timeout = 10000;
// http request 请求拦截器
let _401Number = 0;
axios.interceptors.request.use(
	(config) => {
		// 在发送请求之前携带token
		let token = getSession("SmartElecAccessToken", true);
		if (token) config.headers.authorization = `Bearer ${token}`;
		return config;
	},
	(error) => {
		// 请求错误
		return Promise.reject(error);
	},
);
// http response 响应拦截器
axios.interceptors.response.use(
	(response) => {
		let token = response.headers?.authorization ?? undefined;
		let refreshToken = response.headers["refresh-token"] ?? undefined;
		if (token && refreshToken) {
			setSession("SmartElecAccessToken", token, true);
			setSession("SmartElecRefreshToken", refreshToken, true);
			_401Number = 0;
		}
		return response;
	},
	(error) => {
		if (error.response) {
			switch (error.response.status) {
				// 返回401，清除token信息并跳转到登录页面
				case 401:
					// 3次返回登陆(防止无限制调用)
					_401Number += 1;
					if (_401Number > 3) {
						return backLogin();
					}
					// refresh token过期后需重新登录
					if (error.response.data.msg == "refresh_token_expire") {
						return backLogin();
					}
					let token = getSession("SmartElecAccessToken", true);
					let refreshToken = getSession("SmartElecRefreshToken", true);
					error.config.headers.authorization = `Bearer ${token}`;
					error.config.headers["refresh-token"] = `Bearer ${refreshToken}`;
					return axios(error.config);
				// 返回500
				// case 500:
				// 	console.log("接口500错误.");
				// case 304:
				// 	ElMessage.error("接口请求超时!");
				default:
					ElMessage.error(error.response.data.message);
			}
		}
		if (error.message.includes("timeout") || error.message.includes("Network Error")) {
			// 判断请求异常信息中是否含有超时timeout字符串
			ElMessage.error("接口请求超时!");
			return error;
		}
	},
);

// 返回登录页
function backLogin() {
	// 移除token
	removeSession("SmartElecAccessToken");
	removeSession("SmartElecRefreshToken");
	// 移除用户名
	removeSession("SmartElecUserDetail");
	removeSession("SmartElecAccessAdmin");
	// vue状态置空
	const loginStore = useLoginStore();
	loginStore.$patch({
		SmartElecUserDetail: "",
	});
	loginStore.$patch({
		SmartElecAccessAdmin: "",
	});
	// 跳转login
	router.push({ path: "/login" });
	// 防止无限制调用
	_401Number = 0;
}
/**
 * @Author: dongnan
 * @Description: axios post请求
 * @Date: 2022-05-12 10:49:10
 * @param {String} url "http://192.168.1.34:8000/userinfo"
 * @param {Object} data Body Data 参数{username:"dongnan"}
 * @param {Object} params Query Params 参数{username:"dongnan"}
 */
export function post(url, data, params) {
	return new Promise((resolve, reject) => {
		axios
			.post(url, data, { params: params })
			.then(
				(response) => {
					// 逻辑书写
					if (response) resolve(response.data);
				},
				(err) => {
					// 接口错误
					reject(err);
				},
			)
			.catch((error) => {
				// 逻辑错误
				reject(error);
			});
	});
}
/**
 * @Author: dongnan
 * @Description: axios get请求
 * @Date: 2022-05-12 11:50:42
 * @param {*} url "http://192.168.1.34:8000/userinfo"
 * @param {*} params Query Params 参数{username:"dongnan"}
 */
export function get(url, params) {
	return new Promise((resolve, reject) => {
		axios
			.get(url, { params: params })
			.then(
				(response) => {
					// 逻辑书写
					if (response) resolve(response.data);
				},
				(err) => {
					// 接口错误
					reject(err);
				},
			)
			.catch((error) => {
				// 逻辑错误
				reject(error);
			});
	});
}
