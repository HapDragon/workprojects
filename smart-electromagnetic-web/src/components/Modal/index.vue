<script setup>
const dialogVisible = ref(false);
const props = defineProps({
	width: {
		type: String,
		default: '600px',
	},
	top: {
		type: String,
		default: '150px',
	},
	class: {
		type: String,
		default: '',
	},
	title: {
		type: String,
		default: '系统提示',
	},
	footer: {
		type: Boolean,
		default: true,
	},
	closeifsure: {
		type: Boolean,
		default: true,
	},
});
const emits = defineEmits(['close', 'sure', 'opened']);
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
	emits('close');
}
// 确认事件
function sure() {
	if (props.closeifsure === true) {
		dialogVisible.value = false;
	}
	emits('sure');
}
// 打开完毕事件
function opened() {
	emits('opened');
}
// 取消事件
function cancel() {
	dialogVisible.value = false;
}
defineExpose({
	show,
	hide,
	dialogVisible,
});
</script>
<template>
	<el-dialog v-model="dialogVisible" :width="width" :modal="false" draggable :top="top" :destroy-on-close="true" :class="'customDialog ' + props.class" :close-on-click-modal="false" @close="close" @opened="opened">
		<template #header="{ close, titleId, titleClass }">
			<div class="customHeader">
				<h4 :id="titleId" :class="titleClass">{{ title }}</h4>
			</div>
		</template>
		<slot name="container"></slot>

		<template #footer v-if="footer">
			<div class="dialog-footer">
				<el-button @click="cancel">取消</el-button>
				<el-button type="primary" @click="sure">确定</el-button>
			</div>
		</template>
	</el-dialog>
</template>
<style lang="less">
.customDialog {
	border-radius: 0.3vh;
	border: 1px solid #24b4b999;
	background: #02101299;
	color: white;
	font-family: puhui_thin_35;
	--el-text-color-regular: white;

	.el-dialog__header {
		padding: 0;
		margin: 0;
		border: 0;
		border-radius: 1.2vh 1.2vh 0 0;
		.customHeader {
			/*background-color: #3a75f6;*/
			line-height: 4vh;
			height: 4svh;
			width: 100%;

			border-bottom: 1px solid red;
			/*设置线性渐变*/
			border-image: linear-gradient(90deg, transparent 0%, #24b4b9, transparent 100%) 1 1 1 1;

			h4 {
				font-size: 2vh;
				line-height: 4vh;
				text-align: center;
				color: #fff;
				letter-spacing: 0.5vh;
			}
		}
	}
	.el-dialog__close {
		position: absolute;
		right: 0.6vh;
		top: 0.6vh;
		cursor: pointer;
	}
	.el-dialog__body {
		width: 100%;
		height: 100%;
		padding: 0;
		margin: 0;
		min-height: 100px;
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: center;
	}
	.el-dialog__headerbtn {
		pointer-events: none;
		.el-dialog__close {
			right: 1.2vh;
			pointer-events: auto;
			color: #fff;
		}
	}
	.el-dialog__footer {
		text-align: center;
		width: 75%;
		margin: auto;
		display: flex;
		flex-direction: row;
		.dialog-footer {
			display: flex;
			width: 100%;
		}
		.el-button {
			cursor: pointer;
			display: block;
			float: left;
		}
	}
	.el-button + .el-button {
		margin-left: auto;
	}

	.el-input {
		--el-border-color: #24b4b999;
		/*--el-border:1px solid #24b4b9;*/
		--el-input-bg-color: transparent;
	}
	.el-slider {
		--el-slider-runway-bg-color: #24b4b933;
		--el-slider-main-bg-color: #24b4b9;
		--el-slider-height: 2px;
		border-radius: 1px;
		--el-slider-button-size: 12px;
		--el-slider-button-wrapper-size: 32px;
	}
	.el-button {
		--el-button-bg-color: transparent;
		--el-button-border-color: #24b4b9;
		--el-button-text-color: #24b4b9;
		/*width:62px;*/
		/*height:26px;*/
		/*line-height: 26px;*/
	}
	.el-button--primary {
		--el-button-bg-color: #24b4b9;
		--el-button-text-color: #fff;
	}
}
</style>
