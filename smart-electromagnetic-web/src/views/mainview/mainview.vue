<!--
 * Created by wqy
 * Date 2023/8/4 14:04
 * Description
-->
<template>
	<div id="mainview">
		<div id="title">智慧电磁可视化平台</div>
		<div id="buttonscontainer">
			<li v-for="(item, index) in btns" @click="onclickitem(item, $event)">
				<div class="menulabelwithicon">
					<div :style="getbtnstyle(item)">
						{{ item.label }}
					</div>
				</div>
				<ul v-if="item.children.length > 0">
					<li v-for="(subitem, subindex) in item.children" @click="onclickitem(subitem, $event)">
						<div class="menulabelwithicon">
							<div :style="getbtnstyle(subitem)">
								{{ subitem.label }}
							</div>
						</div>
						<ul v-if="subitem.children.length > 0">
							<li v-for="(subsubitem, subsubindex) in subitem.children" @click="onclickitem(subsubitem, $event)">
								<div class="menulabelwithicon">
									<div :style="getbtnstyle(subsubitem)">
										{{ subsubitem.label }}
									</div>
								</div>
								<!--{{subsubitem.label}}-->
							</li>
						</ul>
					</li>
				</ul>
			</li>
		</div>

		<!--时间信息-->
		<div id="timecontainer">
			<span ref="dateref"></span>
			<span>/</span>
			<span ref="weekref"></span>
			<span>/</span>
			<span ref="timeref"></span>
		</div>

		<!-- 用户信息 -->
		<div id="userDetail">
			<img src="./assets/personCenter.svg" />
			<el-dropdown placement="top-end">
				<div class="el-dropdown-link">
					<span>{{ SmartElecUserDetail == "" ? "" : JSON.parse(SmartElecUserDetail).nickName }}</span>
					<el-icon class="el-icon--right">
						<arrow-down />
					</el-icon>
				</div>
				<template #dropdown>
					<el-dropdown-menu>
						<el-dropdown-item @click="logOut">退出登录</el-dropdown-item>
					</el-dropdown-menu>
				</template>
			</el-dropdown>
		</div>
		<transmiterplace
			v-if="currentrole == 1 "
			@close="onsubclose"
			:title="transmitertitle"
		></transmiterplace>

		<emitradiowave ref="emitradio"></emitradiowave>
		<!-- 添加无人机平台 -->
		<nobody-platform v-show="currentrole == 10" ref="nobodyplatform"></nobody-platform>
        <connectjudge v-if="currentrole==4" @close="onsubclose"></connectjudge>
        <interferejudge v-if="currentrole==5" @close="onsubclose"></interferejudge>
	</div>
</template>

<script setup>
	import transmiterplace from "../modules/transmiterplace.vue";
	import emitradiowave from "@/views/modules/EmitRadio/EmitRadio.vue";
	import NobodyPlatform from "@/views/modules/ActionSupport/nobodyPlatform.vue";
	import connectjudge from '@/views/modules/ConnectJudge/ConnectJudge.vue';
	import interferejudge from '@/views/modules/interfereJudge/interfereJudge.vue'
	import { GlobalState } from "@/common/GlobalState";
	import { dianziweilan } from "../Map/MapFeatures/dianziweilan";
	import { fielddata } from "../modules/situationdraw";
	import $ from "jquery";
	import useLoginStore from "@/store/login";


	const { proxy } = getCurrentInstance();
	const btns = ref([
		{
			label: "首页",
			image: new URL("./assets/首页.svg", import.meta.url).href,
			role: 6,
			children: [],
		},
		{
			label: "态势呈现",
			role: 7,
			image: new URL("./assets/态势呈现.svg", import.meta.url).href,
			children: [
				{
					label: "发射机放置",
					image: new URL("./assets/发射机放置.svg", import.meta.url).href,
					role: 1,
					children: [],
				},
				{
					label: "电波射线",
					image: new URL("./assets/电波射线.svg", import.meta.url).href,
					role: 2,
					children: [],
				},
				// {
				// 	label: '测试',
				// 	image: new URL('./assets/首页.svg', import.meta.url).href,
				// 	role: 200,
				// 	children: [],
				// },
			],
		},
		{
			label: "行动支持",
			role: 8,
			image: new URL("./assets/行动支持.svg", import.meta.url).href,
			children: [
				{
					label: "无人平台干扰判断",
					image: new URL("./assets/无人平台干扰判断.svg", import.meta.url).href,
					role: 10,
					children: [
						// {
						// 	label: "添加控制站",
						// 	image: new URL("./assets/添加发射机.svg", import.meta.url).href,
						// 	role: 9,
						// 	children: [],
						// },
						// {
						// 	label: "添加无人机平台",
						// 	image: new URL("./assets/添加无人机平台.svg", import.meta.url).href,
						// 	role: 10,
						// 	children: [],
						// },
					],
				},
				{
					label: "车辆人员联通判断",
					image: new URL("./assets/车辆人员联通判断.svg", import.meta.url).href,
					role: 4,
					children: [
						// {
						// 	label: "添加车辆",
						// 	image: new URL("./assets/添加车辆.svg", import.meta.url).href,
						// 	role: 11,
						// 	children: [],
						// },
						// {
						// 	label: "添加人员",
						// 	image: new URL("./assets/添加人员.svg", import.meta.url).href,
						// 	role: 12,
						// 	children: [],
						// },
					],
				},
				{
					label: "干扰机干扰判断",
					image: new URL("./assets/干扰机干扰判断.svg", import.meta.url).href,
					role: 5,
					children: [],
				},
			],
		},
	]);
	// const currentsubitems = ref([]);
	const currentrole = ref(-1);
	const loginStore = useLoginStore();
	const { SmartElecUserDetail, SmartElecAccessAdmin } = storeToRefs(loginStore);
	const router = useRouter();
	const dateref = ref(null);
	const weekref = ref(null);
	const timeref = ref(null);
	let timerreqani = -1;

	let transmitertitle = computed(() => {
		let result = "";
		switch (currentrole.value) {
			case 1:
				result = "发射机放置";
				break;
			// case 11:
			// 	result = "添加车辆";
			// 	break;
			case 9:
				result = "添加控制站";
				break;
			default:
				break;
		}
		return result;
	});

	onMounted(() => {
		let curexpandul = null;

		function onchange(scope) {
			curexpandul = $(scope).children("ul");
			curexpandul.stop(true, true).animate({ height: "toggle", opacity: 1 }, 200);
			$(scope).children("div").addClass("active");
		}

		$("#buttonscontainer >li").hover(
			function () {
				onchange(this);
			},
			function () {
				if (curexpandul) {
					curexpandul.stop(true, true).animate({ height: "toggle", opacity: "toggle" }, 200);
				}
				$(this).children("div").removeClass("active");
			},
		);
		let curexpandulsub = null;

		function onchangesub(scope) {
			curexpandulsub = $(scope).children("ul");
			curexpandulsub.stop(true, true).animate({ height: "toggle", opacity: "toggle" }, 200);
			$(scope).children("div").addClass("active");
		}

		$("#buttonscontainer >li >ul >li").hover(
			function () {
				onchangesub(this);
			},
			function () {
				if (curexpandulsub) {
					curexpandulsub.stop(false, true).animate({ height: "toggle", opacity: "toggle" }, 200);
				}
				$(this).children("div").removeClass("active");
			},
		);
		updatetimer();
		if (fielddata == null) {
			dianziweilan.setvisible(true);
		}
		GlobalState.getInstance().viewer.camera.setView({
			destination: Cesium.Cartesian3.fromDegrees(118.81602974710775, 32.1404495782302, 377.3106901908607),
			orientation: {
				heading: 0.44088091374101435,
				pitch: -0.5405112119162183,
				roll: 0.0,
			},
		});
	});
	onBeforeUnmount(() => {
		if (timerreqani != -1) {
			cancelAnimationFrame(timerreqani);
			timerreqani = -1;
		}
	});
	let lastupdatetime = -1;
	const weekdaystr = ["一", "二", "三", "四", "五", "六", "日"];

	function updatetimer() {
		let cur = new Date();
		let timespan = cur - lastupdatetime;
		if (timespan > 1000) {
			dateref.value.innerText = `${cur.getFullYear()}年${cur.getMonth() + 1}月${cur.getDate()}日`;
			weekref.value.innerText = `星期${weekdaystr[cur.getDay() - 1]}`;
			timeref.value.innerText = `${cur.getHours().toPadLeftString(2, "0")}:${cur.getMinutes().toPadLeftString(2, "0")}:${cur
				.getSeconds()
				.toPadLeftString(2, "0")}`;
			lastupdatetime = cur;
		}
		timerreqani = requestAnimationFrame(updatetimer);
	}

	function onsubclose() {
		currentrole.value = -1;
	}

	function getbtnstyle(item) {
		return `background-image:url(${item.image})`;
	}

	// 登出
	function logOut() {
		loginStore.Logout().then((res) => {
			proxy.$modal.msgSuccess(res);
			router.push("/login");
		});
	}

	function onclickitem(item, event) {
		// 移除上一级
		switch (currentrole.value) {
			case 10:
				proxy.$refs.nobodyplatform.leave();
				break;
		}
		// currentrole.value = item.role;
		//点击的同时有关闭的作用，如果当前页面已打开则关闭
		currentrole.value = currentrole.value == item.role && item.role != 6 ? -1 : item.role;
		event.stopPropagation();

		// 初始化下一级
		switch (item.role) {
			case 2:
				proxy.$refs.emitradio.showmousetip = true;
				proxy.$refs.emitradio.defineMouseEvent();
				break;
			case 10:
				proxy.$refs.nobodyplatform.init();
				break;
		}
		onchangerole(currentrole.value);
	}

	function onchangerole(newval) {
		if (newval == 6) {
			//如果是首页则需要定位
			GlobalState.getInstance().viewer.camera.flyTo({
				destination: Cesium.Cartesian3.fromDegrees(118.81602974710775, 32.1404495782302, 377.3106901908607),
				orientation: {
					heading: 0.44088091374101435,
					pitch: -0.5405112119162183,
					roll: 0.0,
				},
			});
			if (fielddata == null) {
				dianziweilan.setvisible(true);
			}
		} else if (newval == 1 || newval == 2 || newval == 3 || newval == 11 || newval == 12 || newval == 9) {
			//先设置这些菜单打开时，电子围栏隐藏，后面可能会加入更多
			dianziweilan.setvisible(false);
		}
	}
</script>

<style scoped lang="less">
	#mainview {
		position: absolute;
		top: 0;
		height: 12vh;
		width: 100%;
		background-image: url("./assets/logo.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		color: white;

		#title {
			line-height: 8vh;
			width: 20%;

			text-align: center;
			font-size: 1.8rem;
			font-family: puhui_Regular_85;
			letter-spacing: 4px;
			float: left;
		}
		#buttonscontainer {
			margin-left: 23.1%;
			width: 32.57576%;
			height: 9vh;
			float: left;
			cursor: pointer;
			user-select: none;
			font-size: 1.2rem;
			.menulabelwithicon {
				display: flex;
				justify-content: center;
				width: 100%;
				height: 100%;
				> div {
					display: inline-block;
					line-height: 10vh;
					margin: auto;
					background-position: left center;
					background-size: 30px 30px;
					background-repeat: no-repeat;
					padding-left: 42px;
				}
			}
			> li {
				width: 43.55%;
				height: 100%;
				margin-left: -14.5%;
				float: left;
				margin-right: 2px;
				padding-left: 8px;
				box-sizing: border-box;

				> div:hover,
				> div.active {
					background-image: url("./assets/selected.png");
					background-size: 100% 100%;
					background-repeat: no-repeat;
				}
				ul {
					/*border:1px solid white;*/
					/*background: #18252ecc;*/
					display: none;
					width: 68%;
					margin-left: 30%;
					margin-top: -1.5%;
					font-size: 0.9rem;
					font-family: "puhui_thin_35";

					background: url("../../components/Dialog/assets/roundborderleft.png") left bottom no-repeat,
						url("../../components/Dialog/assets/roundborderright.png") right bottom no-repeat, #18252ecc;
					background-size: 8px 8px, 8px 8px, 100% 100%;

					li {
						position: relative;
						height: 44px;
						line-height: 44px;
						div.menulabelwithicon {
							display: block;
							padding-left: 12px;
							div {
								line-height: 44px;
								background-size: 20px 20px;
								padding-left: 32px;
							}
						}
						ul {
							display: none;
							margin-left: 2px;
							left: 100%;
							width: 100%;
							margin-top: 0;
							top: 0;
							position: absolute;
						}
					}
					li:hover {
						background: #009adc7f;
					}
				}
			}
		}
		#timecontainer {
			display: flex;
			flex-direction: row;
			position: absolute;
			right: 140px;
			top: 2vh;
			height: 30px;
			line-height: 30px;
			letter-spacing: 2px;
			span {
				margin-right: 4px;
			}
		}
		#userDetail {
			display: flex;
			flex-direction: row;
			position: absolute;
			right: 40px;
			top: 2vh;
			img {
				width: 16px;
				height: 16px;
				margin-right: 12px;
				margin-top: 8px;
			}
			.el-dropdown {
				color: white;

				.el-dropdown-link {
					line-height: 30px;
					display: inline-block;
					span {
						margin-right: 4px;
					}

					.el-icon {
						line-height: 30px;
						height: 30px;
						position: absolute;
					}
				}
			}
			.el-select {
				width: 100px;
				--el-fill-color-blank: transparent;
				--el-border-color: transparent;
				--el-select-input-focus-border-color: transparent;
				--el-border-color-hover: transparent;
			}
		}
	}
</style>
<style lang="less">
	.el-popper__arrow {
		display: none;
	}

	.el-dropdown__popper.el-popper[role="tooltip"] {
		background: #18252ecc;
		border: none;
		margin: -10px -300px 0px 0px !important;
	}

	.el-dropdown-menu {
		background-color: transparent;
		padding: 0;
		.el-dropdown-menu__item {
			color: white;
			padding: 8px 12px;
		}
		.el-dropdown-menu__item:not(.is-disabled):focus {
			color: white;
			background-color: transparent;
		}
	}
</style>
