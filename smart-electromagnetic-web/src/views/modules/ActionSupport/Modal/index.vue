<script setup>
	import { nextTick, onBeforeMount, onMounted } from "vue";

	const dialogVisible = ref(false);
	const props = defineProps({
		width: {
			type: String,
			default: "40vh",
		},
		top: {
			type: String,
			default: "15vh",
		},
		left: {
			type: String,
			default: undefined,
		},
		class: {
			type: String,
			default: "",
		},
		title: {
			type: String,
			default: "系统提示",
		},
		footer: {
			type: Boolean,
			default: true,
		},
		draggable: {
			type: Boolean,
			default: false,
		},
	});
	const emits = defineEmits(["close", "sure", "opened", "open", "cancel"]);
	const customDialog = ref(null);
	const randomClass = ref(null);
	// 显示弹框
	function show() {
		dialogVisible.value = true;
	}
	// 隐藏弹框
	function hide() {
		dialogVisible.value = false;
	}
	// 关闭事件
	function close() {
		emits("close");
	}
	// 确认事件
	function sure() {
		emits("sure");
	}
	// 取消事件
	function cancel() {
		dialogVisible.value = false;
		emits("cancel");
	}
	// 模态框挂载
	function open() {
		nextTick(() => {
			let firstProp = document.body.querySelector(".customDialog" + "." + randomClass.value);
			if (props.draggable) {
				firstProp.parentNode.parentNode.style.pointerEvents = "none";
			}
			if (props.left && props.top) {
				firstProp.style.setProperty("--leftMargin", props.left);
				firstProp.style.setProperty("--topMargin", props.top);
			}
			emits("open");
		});
	}
	// 打开完毕事件
	function opened() {
		emits("opened");
	}
	onBeforeMount(() => {
		randomClass.value = "customDialog-" + new Date().getTime() + Math.ceil(Math.random() * 10000);
	});
	defineExpose({
		show,
		hide,
	});
</script>
<template>
	<el-dialog
		v-model="dialogVisible"
		:width="width"
		:custom-class="'customDialog ' + randomClass + ' ' + props.class"
		:close-on-click-modal="false"
		@close="close"
		@opened="opened"
		@open="open"
		:draggable="draggable"
		:modal="!draggable"
		:append-to-body="true"
		ref="customDialog"
	>
		<template #title="{ close, titleId, titleClass }">
			<div class="customHeader">
				<h4 :id="titleId" :class="titleClass">{{ title }}</h4>
			</div>
		</template>
		<slot name="container" v-if="dialogVisible"></slot>
		<div class="containerDiv" v-if="!footer"></div>
		<!-- 底部按钮 -->
		<div class="footerDiv" v-if="footer"></div>
		<div class="el-dialog__footer" v-if="footer">
			<span class="dialog-footer">
				<slot name="footer">
					<el-button type="primary" @click="sure">确定</el-button>
					<el-button type="primary" @click="cancel">取消</el-button>
				</slot>
			</span>
		</div>
	</el-dialog>
</template>
<style lang="less">
	.customDialog {
		pointer-events: auto;
		border-radius: 12px 12px 10px 10px;
		border: 0;
		--topMargin: 10vh;
		background: transparent;
		&.el-dialog {
			margin: var(--topMargin, 15vh) var(--leftMargin, auto) 0;
		}
		.el-dialog__header {
			padding: 0;
			margin: 0;
			border: 0;
			.customHeader {
				height: 5vh;
				line-height: 5vh;
				width: 100%;
				background: url("./assets/titlebk-left.png") left top no-repeat, url("./assets/titlebk-right.png") right top no-repeat,
					url("./assets/titlebk.png") center top repeat-x;
				background-size: auto 100%, auto 100%, auto 100%;
				h4 {
					font-weight: 100;
					font-size: 1.8vh;
					text-align: left;
					color: #fff;
					letter-spacing: 0.3vh;
					padding-left: 3vh;
					font-family: puhui_thin_45;
					display: inline-block;
				}
			}
		}
		.el-dialog__headerbtn {
			pointer-events: none;
			.el-dialog__close {
				position: absolute;
				top: 0.5vh;
				right: 1vh;
				pointer-events: auto;
				color: #fff;
			}
		}
		.mainBody {
			background: url("./assets/roundborderleft.png") left bottom no-repeat,
				url("./assets/roundborderright.png") right bottom no-repeat, linear-gradient(to bottom, #1288bbcc, #15415fcc, #18252ecc);
			background-size: 12px 12px, 12px 12px, 100% 100%;
		}
		.el-dialog__body {
			display: inline-block;
			width: 100%;
			height: 100%;
			padding: 0;
			margin: 0;
			min-height: 15vh;
			background: url("./assets/roundborderleft.png") left bottom no-repeat,
				url("./assets/roundborderright.png") right bottom no-repeat, linear-gradient(to bottom, #1288bbcc, #15415fcc, #18252ecc);
			background-size: 12px 12px, 12px 12px, 100% 100%;
			color: #fff;
			font-family: puhui_thin_45;
			.el-dialog__footer {
				position: absolute;
				bottom: 0;
				width: 100%;
				text-align: center;
				padding: 2vh 0;
				font-size: 1.4vh;
				.el-button {
					cursor: pointer;
					background: #0785bb;
					border: none;
					border-radius: 0.3vh;
					padding: 1vh 2vh;
					& + .el-button {
						// margin-left: 5vh;
					}
					&:hover {
						background: #3ea6ff;
					}
				}
			}
			.footerDiv {
				// 占位
				height: 7.4vh;
				pointer-events: none;
			}
			.containerDiv {
				// 占位
				height: 2vh;
				pointer-events: none;
			}
		}
	}
</style>
