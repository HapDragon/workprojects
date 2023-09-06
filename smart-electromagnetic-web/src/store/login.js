import { defineStore } from "pinia";
import { ref, reactive, toRefs } from "vue";
import LoginApi from "@/api/login";
import { setSession, removeSession } from "@/utils/tools/sessionStorage";
import { post } from "@/request/index.js";
/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
function handleTree(data, id, parentId, children) {
	let config = {
		id: id || "id",
		parentId: parentId || "parentId",
		childrenList: children || "children",
	};

	var childrenListMap = {};
	var nodeIds = {};
	var tree = [];
	for (let d of data) {
		let parentId = d[config.parentId];
		if (!Array.isArray(childrenListMap[parentId])) {
			childrenListMap[parentId] = [];
		}
		nodeIds[d[config.id]] = d;
		childrenListMap[parentId].push(d);
	}

	for (let d of data) {
		let parentId = d[config.parentId];
		if (nodeIds[parentId] == null) {
			tree.push(d);
		}
	}

	for (let t of tree) {
		adaptToChildrenList(t);
	}

	function adaptToChildrenList(o) {
		if (childrenListMap[o[config.id]] !== null) {
			o[config.childrenList] = childrenListMap[o[config.id]];
		}
		if (o[config.childrenList]) {
			for (let c of o[config.childrenList]) {
				adaptToChildrenList(c);
			}
		}
	}
	return tree;
}
export default defineStore("login", () => {
	const state = reactive({
		SmartElecUserDetail: "",
		SmartElecRouteList: "",
		SmartElecAccessAdmin: "",
	});
	// 登录
	function Login(data) {
		const username = data.username.trim();
		const userpwd = data.userpwd;
		return new Promise((resolve, reject) => {
			post(
				LoginApi.login,
				{
					userName: username,
					password: userpwd,
				},
				{},
			)
				.then((res) => {
					if (res.code == 0) {
						let data = res.data;
						let user = data.user;
						user.password = userpwd;
						setSession("SmartElecAccessToken", data.token, true);
						setSession("SmartElecRefreshToken", data.refreshToken, true);
						setSession("SmartElecUserDetail", JSON.stringify(user), true);

						if (data.menuInfo && data.menuInfo.length > 0) {
							setSession("SmartElecAccessAdmin", "true");
							state.SmartElecAccessAdmin = "true";
						} else {
							setSession("SmartElecAccessAdmin", "false");
							state.SmartElecAccessAdmin = "false";
						}
						state.SmartElecUserDetail = JSON.stringify(user);
						resolve("登录成功");
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}
	// 注册
	function Register(data) {
		const username = data.username;
		const userpwd = data.userpwd;
		const email = data.email;
		return new Promise((resolve, reject) => {
			post(LoginApi.register, {
				username: username,
				userpwd: userpwd,
				email: email,
			}).then((res) => {
				if (res.code == 200) {
					// 存储用户状态
					state.UserName = username;
					state.UserPwd = userpwd;
					resolve("注册成功");
				} else if (res.code == 202) {
					reject("用户名已存在");
				} else if (res.code == 404) {
					reject("注册失败,请联系管理员");
				}
			});
		});
	}
	// 退出系统
	function Logout() {
		return new Promise((resolve, reject) => {
			// 移除token
			removeSession("SmartElecAccessToken");
			// 移除用户名
			removeSession("SmartElecUserDetail");
			removeSession("SmartElecAccessAdmin");
			// 路由置空
			state.SmartElecUserDetail = "";
			state.SmartElecAccessAdmin = "";
			resolve("已退出!");
		});
	}
	return {
		...toRefs(state),
		Login,
		Logout,
		Register,
	};
});
