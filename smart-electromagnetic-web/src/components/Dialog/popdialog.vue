<script setup>
	const props = defineProps({
		width: {
			type: String,
			default: "40vh",
		},
		height: {
			type: String,
			default: "30vh",
		},
		top: {
			type: String,
			default: "20vh",
		},
		left: {
			type: String,
			default: "50vh",
		},
		class: {
			type: String,
			default: "",
		},
		title: {
			type: String,
			default: "信息",
		},
		classname: {
			type: String,
			default: "",
		},
		isshowdialog: {
			type: Boolean,
			default: false,
		},
	});
	const dragcontainerclassname = ref("titleDiv");
	const emits = defineEmits(["close"]);

	function close() {
		emits("close");
	}
</script>

<template>
	<div
		:class="props.classname ? props.classname + ' popdialog' : 'popdialog'"
		v-drag:[dragcontainerclassname]
		v-show="props.isshowdialog"
		:style="
			'width:' +
			props.width +
			';height:' +
			props.height +
			';left:' +
			props.left +
			';top:' +
			props.top +
			';bottom:' +
			props.bottom +
			';right:' +
			props.right +
			';'
		"
	>
		<div class="titleDiv">
			<span class="titletext">{{ props.title }}</span>
			<el-icon class="elcloseicon" @click="close">
				<Close />
			</el-icon>
		</div>
		<div class="contetnDiv">
			<slot name="container"></slot>
		</div>
	</div>
</template>

<style lang="less" scoped>
	.popdialog {
		position: absolute;
		z-index: 9;
		.titleDiv {
			user-select: none;
			width: 100%;
			height: 5vh;
			line-height: 5vh;
			text-align: left;
			padding-left: 20px;
			letter-spacing: 2px;
			font-size: 1.2rem;
			box-sizing: border-box;
			color: #ffffff;
			/*background-color: #0a4e7e;*/

			background: url("./assets/titlebk-left.png") left top no-repeat, url("./assets/titlebk-right.png") right top no-repeat,
				url("./assets/titlebk.png") center top repeat-x;

			background-size: auto 100%, auto 100%, auto 100%;
		}
		.contetnDiv {
			background: url("./assets/roundborderleft.png") left bottom no-repeat,
				url("./assets/roundborderright.png") right bottom no-repeat, linear-gradient(to bottom, #1288bbcc, #15415fcc, #18252ecc);
			background-size: 12px 12px, 12px 12px, 100% 100%;

			/*background-color: #0a4e7e66;*/
			width: 100%;
			height: calc(100% - 5vh);
		}
	}
</style>
<style lang="less">
	.popdialog .elcloseicon {
		color: #ffffff;
		position: absolute;
		z-index: 99;
		cursor: pointer;
		/*top: 0.5vh;*/
		right: 1vh;
		/*width: 3vh;*/
		height: 5vh;
		/*line-height: 5vh;*/
		/*font-size: 2vh;*/
	}
</style>
