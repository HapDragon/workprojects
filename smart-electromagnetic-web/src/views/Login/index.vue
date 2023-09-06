<script setup>
import { setItem, getItem, removeItem } from '@/utils/tools/localstorage';
import useLoginStore from '@/store/login';
// 使用绑定的全局方法
const { proxy } = getCurrentInstance();
// 登录框
const loginFormRef = ref(null);
// 路由
const router = useRouter();
// 状态
const store = useLoginStore();

// 数据
const loginParams = reactive({
	username: undefined,
	userpwd: undefined,
});
// 记住账号
const remeberAccount = ref(false);
const isRemeber = computed(() => {
	let name = getItem('FyInvestUser', true);
	loginParams.username = name;
	return Boolean(name);
});
const validateName = (rule, value, callback) => {
	if (loginParams.username === '') {
		callback(new Error('用户名不能为空!'));
	} else {
		callback();
	}
};
// 验证密码
const validatePass = (rule, value, callback) => {
	if (loginParams.userpwd === '') {
		callback(new Error('密码不能为空!'));
	} else {
		callback();
	}
};
// 提交表单
const submitForm = (formEl) => {
	if (!formEl) return;
	formEl.validate((valid) => {
		if (valid) {
			store
				.Login(loginParams)
				.then((res) => {
					// 是否记住账号
					if (remeberAccount.value) {
						setItem('SmartElecInvestUser', loginParams.username, true);
					} else {
						removeItem('SmartElecInvestUser');
					}
					proxy.$modal.msgSuccess(res);
					router.push({ path: '/' });
				})
				.catch((error) => {
					proxy.$modal.msgError(error);
				});
		} else {
			proxy.$modal.msgError('提交错误!');
			return false;
		}
	});
};
// 去注册
function toRegister() {
	router.push({ path: '/register' });
}
// 表单规则
const rules = reactive({
	name: [{ validator: validateName, trigger: 'change' }],
	pass: [{ validator: validatePass, trigger: 'change' }],
});
// 初始化
onMounted(() => {
	// 记住账号
	remeberAccount.value = isRemeber.value;
});
</script>

<template>
	<el-container id="login">
		<!-- <div class="loginMask1"></div>
		<div class="loginMask2"></div>
		<div class="loginMask3"></div> -->
		<div class="footerBar" style="display: none">Powered by SmartElec Remote Sensing © 2003-2023飞燕航空遥感技术有限公司</div>
		<el-form ref="loginFormRef" :model="loginParams" status-icon :rules="rules" class="loginForm">
			<div class="chamfer chamfer_topleft"></div>
			<div class="chamfer chamfer_topright"></div>
			<div class="chamfer chamfer_bottomleft"></div>
			<div class="chamfer chamfer_bottomright"></div>
			<label class="title">智慧电磁可视化平台</label>
			<label class="subtitle">Intelligent Electromagnetic Visualization Platform</label>
			<el-form-item prop="name" class="userInput">
				<el-input v-model="loginParams.username" placeholder="请输入账号">
					<template #prefix>
						<img src="./assets/user.svg" alt="" />
					</template>
				</el-input>
			</el-form-item>
			<el-form-item prop="pass" class="passwordInput">
				<el-input v-model="loginParams.userpwd" type="password" autocomplete="off" placeholder="请输入密码" @keyup.enter.native="submitForm(loginFormRef)">
					<template #prefix>
						<img src="./assets/password.svg" alt="" />
					</template>
				</el-input>
			</el-form-item>
			<el-row class="tool">
				<div class="remember">
					<el-checkbox v-model="remeberAccount" label="记住账号" />
				</div>
			</el-row>
			<el-row class="loginButton">
				<el-button type="primary" @click="submitForm(loginFormRef)">登录</el-button>
			</el-row>
		</el-form>
	</el-container>
</template>

<style scoped lang="less">
@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

#login {
	z-index: 1000;
	top: 0px;
	position: absolute;
	width: 100%;
	height: 100%;
	background: url('./assets/bg.png') no-repeat;
	background-size: 100% 100%;
	.footerBar {
		background-color: rgba(100, 115, 148, 0.2);
		text-align: center;
		position: absolute;
		bottom: 0px;
		height: 48px;
		line-height: 48px;
		font-size: 15px;
		color: rgba(255, 255, 255, 0.4);
		width: 100%;
	}
	.loginForm {
		width: 45vh;
		height: 40vh;
		position: absolute;
		left: calc((100% - 45vh) / 2);
		top: calc((100% - 40vh) / 2);
		background-color: #00000080;
	}
	.chamfer {
		background-image: url('./assets/chamfer.png');
		background-size: 100% 100%;
		width: 3vh;
		height: 3vh;
		position: absolute;
		user-select: none;
	}
	.chamfer_topleft {
		top: 0;
		left: 0;
		transform: rotate(90deg);
	}
	.chamfer_topright {
		top: 0;
		right: 0;
		transform: rotate(180deg);
	}
	.chamfer_bottomleft {
		bottom: 0;
		left: 0;
	}
	.chamfer_bottomright {
		bottom: 0;
		right: 0;
		transform: rotate(270deg);
	}
	.loginMask1 {
		width: 120vh;
		height: 96vh;
		position: absolute;
		left: calc((100% - 120vh) / 2);
		top: calc((100% - 96vh) / 2);
		background: url('./assets/bg_circle_bg.png') no-repeat;
		background-size: 100% 100%;
		z-index: 5;
	}
	.loginMask2 {
		width: 59vh;
		height: 59vh;
		position: absolute;
		left: calc((100% - 59vh) / 2);
		top: calc((100% - 59vh) / 2);
		background: #0000007f;
		background-size: 100% 100%;
		z-index: 6;
		border-radius: 50%;
	}
	.loginMask3 {
		width: 67vh;
		height: 67vh;
		position: absolute;
		left: calc((100% - 67vh) / 2);
		top: calc((100% - 67vh) / 2);
		background: url('./assets/bg_circle.png') no-repeat;
		background-size: 100% 100%;
		animation: rotate 10s linear infinite;
		z-index: 7;
	}
	.loginForm {
		z-index: 8;
		.title {
			display: block;
			font-size: 3vh;
			color: #fff;
			text-align: center;
			letter-spacing: 0.5vh;
			font-family: 'puhui_Heavy_105';
			margin-top: 3vh;
		}
		.subtitle {
			display: block;
			color: #fff;
			font-family: 'puhui_ExtraBold_75';
			font-size: 1.2vh;
			text-align: center;
			margin-bottom: 4vh;
		}
		:deep(.el-form-item__error) {
			left: 4vh;
			font-size: 1.6vh;
			&:before {
				content: '';
				background: url('./assets/error.svg') no-repeat;
				background-size: 100% 100%;
				width: 1.6vh;
				height: 1.6vh;
				display: inline-block;
				vertical-align: top;
				padding-right: 0.5vh;
			}
		}
		:deep(.el-input) {
			line-height: 42px;
			width: 100%;
			.el-input__wrapper {
				background-color: transparent !important;
				box-shadow: none !important;
			}
			.el-input__inner {
				padding-left: 4vh;
				height: 4vh;
				line-height: 4px;
				color: #fff;
				font-size: 1.6vh;
				background-color: transparent !important;
				border-radius: 0;
				border: none;
				box-shadow: none;
				border-bottom: 1px solid #365654;
			}
			img {
				width: 2.2vh;
				height: 2.2vh;
				position: absolute;
				bottom: 0.8vh;
			}
			.el-input__suffix {
				display: none;
			}
		}
		.userInput {
			margin-bottom: 4vh;
			position: relative;
			width: 70%;
			left: 15%;
		}
		.passwordInput {
			margin-bottom: 2vh;
			position: relative;
			width: 70%;
			left: 15%;
		}

		.tool {
			height: 2vh;
			margin-bottom: 2vh;
			.remember {
				margin-left: 7vh;
				text-align: left;
				:deep(.el-checkbox) {
					color: #fff;
					.el-checkbox__input {
						&.is-checked + .el-checkbox__label {
							color: #fff;
						}
						.el-checkbox__inner {
							background-color: transparent;
							border-color: #fff;
							width: 1.4vh;
							height: 1.4vh;
							&::after {
								border-color: #fff;
							}
						}
					}
					.el-checkbox__label {
						font-size: 1.4vh !important;
						padding-left: 1vh;
					}
				}
			}
		}
		.loginButton {
			:deep(.el-button) {
				width: 30vh;
				height: 5vh;
				position: relative;
				left: 7vh;
				font-size: 2.5vh;
				border-radius: 5vh;
				border: none;
				color: #fff;
				letter-spacing: 1vh;
				background: linear-gradient(to right, #1271b8, #5dc6de);
			}
		}
	}
}
</style>
