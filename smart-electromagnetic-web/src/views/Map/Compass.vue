<!--
 * Created by wqy
 * Date 2023/3/30 14:17
 * Description
-->
<template>
	<div id="Compass" ref="compassref" class="compassanimation" :style="`right:${hasbanners ? '' : '48px'};`">
		<div>
			<!-- <div class="position-absolute autoflyButton" @click="autoflyclick">
				<img src="./assets/autofly.svg" class="autoflyImg" />
			</div> -->

			<!--<div class="position-absolute mapchangebutton" @click="changeMap">-->
			<!--<img src="./assets/earth.svg" class="svg-color earthimg" />-->
			<!--</div>-->

			<div class="position-absolute northinButton">
				<img src="./assets/compass.svg" class="position-absolute" style="right: 0px" />
				<img src="./assets/northin.svg" ref="northtin" class="northimg" @click="northClick" />
			</div>

			<div class="position-absolute zoomInButton">
				<img src="./assets/zoomIn.svg" @click="zoomIn" />
			</div>

			<div class="position-absolute zoomOutButton">
				<img src="./assets/zoomOut.svg" @click="zoomOut" />
			</div>

			<div class="position-absolute fullscreenButton">
				<img src="./assets/fullscreen.svg" @click="fullscreenClick" />
			</div>
		</div>
		<autofly v-show="ishowAutofly"></autofly>
	</div>
</template>

<script setup>
	import Bus from "@/common/eventBus";
	import { GlobalState } from "@/common/GlobalState";
	import { GetCamera, FlyToWithDuration } from "./buss/MapHandler";
	import coordinates from "./buss/Coordinates";
	import { getTdtImageLabel, getTdtImage, getTdtVector, getTdtVectorLabel } from "./buss/MapHandler";
	import { store } from "@/store/index.js";
	import autofly from "./AutoFly/autofly.vue";

	const hasbanners = computed(() => {
		return store.curindex == 0 || store.curindex == 1 || store.curindex == 2 || store.curindex == 3 || store.curindex == 4;
	});
	const compassref = ref(null);
	store.registercurindexchangehandler(function (oldval, newval) {
		if (compassref.value == null) return;
		compassref.value.className = "";
		setTimeout(function () {
			if (oldval == 4) compassref.value.className = "compassanimation2";
			else if (newval == 4) {
				compassref.value.className = "compassanimation3";
			} else {
				compassref.value.className = "compassanimation";
			}
		}, 0);
	});
	var currmap = ref("Image");
	const northtin = ref(null);
	const ishowAutofly = ref(false);

	function onsceneinited() {
		let viewer = GlobalState.getInstance().viewer;
		if (viewer == null) return;
		GlobalState.getInstance().viewer.scene.postRender.addEventListener(function () {
			if (northtin.value == undefined) return;
			let scenemode = GlobalState.getInstance().viewer.scene.mode;
			if (scenemode == 3 || scenemode == 1) {
				let headingdeg = Cesium.Math.toDegrees(GlobalState.getInstance().viewer.camera.heading);
				northtin.value.style.transform = "rotate(" + headingdeg + "deg)";
			}
		});
		// refreshMap();
	}

	defineExpose({
		ishowAutofly,
	});

	onMounted(() => {
		onsceneinited();
		Bus.VM.$on(Bus.SignalType.Scene_Init_Finish, function (cesiumviewer) {
			onsceneinited();
		});
	});

	function changeMap() {
		if (currmap.value == "Image") {
			currmap.value = "Vector";
		} else {
			currmap.value = "Image";
		}
		refreshMap();
	}

	function refreshMap() {
		// GlobalState.getInstance().viewer.imageryLayers.removeAll();
		if (currmap.value == "Image") {
			GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(getTdtImage());
			// GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(getTdtImageLabel());
		} else {
			GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(getTdtVector());
			// GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(getTdtVectorLabel());
		}
		//保证显示效果和性能，1s后移除第二层底图
		setTimeout(() => {
			GlobalState.getInstance().viewer.imageryLayers.remove(
				GlobalState.getInstance().viewer.imageryLayers.get(GlobalState.getInstance().viewer.imageryLayers.length - 2),
			);
		}, 3000);
	}

	//指北
	function northClick() {
		let camera = GetCamera();
		let wgs84poi = new coordinates.CoordinateWGS84(camera.longitude, camera.latitude, camera.height);
		let wgs84poinew = coordinates.GetPointOnSameCircle(wgs84poi, camera.heading, 0, camera.pitch);
		FlyToWithDuration(wgs84poinew.latitude, wgs84poinew.longitude, camera.height, 0, camera.pitch, camera.roll, -1);
	}

	//放大
	function zoomIn() {
		// window.Fyviewer.camera.zoomIn(5000);
		let Camera = GetCamera();
		if (Camera.height < 100000) {
			GlobalState.getInstance().viewer.camera.zoomIn(800);
		} else if (Camera.height > 100000 && Camera.height < 300000) {
			GlobalState.getInstance().viewer.camera.zoomIn(8000);
		} else {
			GlobalState.getInstance().viewer.camera.zoomIn(50000);
		}
	}

	//缩小
	function zoomOut() {
		GlobalState.getInstance().viewer.camera.zoomOut(50000);
	}

	//全屏
	function fullscreenClick() {
		if (
			!document.fullscreenElement &&
			!document.mozFullScreenElement &&
			!document.webkitFullscreenElement &&
			!document.msFullscreenElement
		) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
				document.documentElement.msRequestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
				document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
				document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		}
	}

	//漫游
	function autoflyclick() {
		ishowAutofly.value = !ishowAutofly.value;
	}
</script>

<style lang="less" scoped>
	@keyframes compassani1 {
		0% {
			right: -3.2vh;
		}
	}

	@keyframes compassani2 {
		0% {
			right: 4.44vh;
		}
	}

	@keyframes compassani3 {
		0% {
			right: calc(24% + 4.44vh);
		}
	}
	.compassanimation {
		animation-name: compassani1;
		animation-duration: 1s;
		animation-timing-function: ease-out;
	}
	.compassanimation2 {
		animation-name: compassani2;
		animation-duration: 1s;
		animation-timing-function: ease-out;
	}
	.compassanimation3 {
		animation-name: compassani3;
		animation-duration: 1s;
		animation-timing-function: ease-out;
	}

	#Compass {
		position: absolute;
		left: 5vh;
		width: 3.7vh;
		bottom: 0vh;

		.autoflyButton,
		.mapchangebutton,
		.northinButton,
		.zoomInButton,
		.zoomOutButton,
		.fullscreenButton {
			// z-index: 999;
		}
	}
	.autoflyButton {
		width: 3.7vh;
		height: 3.7vh;
		cursor: pointer;
		background-color: #1c2129c2;
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: center;
		bottom: 26.82vh;
		.autoflyImg {
			text-align: center;
			width: 2.56vh;
			height: 2.56vh;
		}
	}
	.mapchangebutton {
		background-color: #1c2129c2;
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: center;
		bottom: 22.86vh;
		/*right: 1vw;*/
		/*right: 48px;*/
		/*top:176px;*/
		width: 3.7vh;
		height: 3.7vh;
		cursor: pointer;
	}
	.svg-color {
		filter: drop-shadow(#ffffff 0px 0px 0px);
		cursor: pointer;
	}
	.northinButton {
		bottom: 18.91vh;
		/*top:140px;*/
		/*right: 1vw;*/
		/*right: calc(24% + 48px);*/
		width: 3.7vh;
		height: 3.7vh;
		cursor: pointer;
	}

	.zoomInButton {
		bottom: 15.07vh;
		/*right: 1vw;*/
		/*right: calc(24% + 48px);*/
		/*top:176px;*/
		width: 3.7vh;
		height: 3.7vh;
		cursor: pointer;
	}

	.zoomOutButton {
		bottom: 11.2vh;
		/*right: 1vw;*/
		/*right: calc(24% + 48px);*/
		/*top:212px;*/
		width: 3.7vh;
		height: 3.7vh;
		cursor: pointer;
	}

	.fullscreenButton {
		bottom: 7.4vh;
		/*right: 1vw;*/
		/*right: calc(24% + 48px);*/
		/*top:248px;*/
		width: 3.7vh;
		height: 3.7vh;
		cursor: pointer;
	}
	.northimg {
		position: absolute;
		width: 3.7vh;
		height: 3.7vh;
		right: 0;
	}

	.earthimg {
		position: absolute;
		width: 2.56vh;
		height: 2.56vh;
	}
</style>
