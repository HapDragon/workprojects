<!--
 * Created by wqy
 * Date 2023/5/10 9:34
 * Description
-->
<template>
	<div id="SunLightSimulate">
		<Modal ref="sourceModal" class="sourceModal" title="日照模拟" @close="close" @sure="onsubmit" :closeifsure="false">
			<template v-slot:container>
				<div class="container">
					<el-form>
						<el-form-item label="日期选择">
							<el-date-picker v-model="datestr" type="date" placeholder="请选择模拟日期" :default-value="new Date()" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
						</el-form-item>

						<el-form-item label="开始时间">
							<el-time-select v-model="starttime" start="00:00" step="02:00" end="24:00" placeholder="请选择开始时间" />
						</el-form-item>
						<el-form-item label="结束时间">
							<el-time-select v-model="endtime" start="00:00" step="02:00" end="24:00" placeholder="请选择开始时间" />
							<!--<el-color-picker v-model="MoonLightSettings.UiColor" />-->
						</el-form-item>
						<el-form-item label="模拟时长">
							<el-slider v-model="simulatelong" :min="1" :max="20" />
							<!--<el-color-picker v-model="MoonLightSettings.UiColor" />-->
						</el-form-item>
					</el-form>
				</div>
			</template>
		</Modal>
	</div>
</template>

<script setup>
import Modal from '@/components/Modal/index.vue';
import { SetCurrentTime, SetIsSunSimulate, SetDayOrNight, setAllLayerBrightnes } from '@/views/Map/buss/MapHandler';
import { GlobalState } from '@/common/GlobalState';

const datestr = ref(new Date().Format('yyyy-MM-dd'));
const starttime = ref('06:00');
const endtime = ref('18:00');
const simulatelong = ref(10);

let stopsimulatefunc = null;
let nightImageLayer = null;

const sourceModal = ref(null);
defineExpose({
	sourceModal,
	show,
});

const emits = defineEmits(['close']);
// 关闭事件
function close() {
	if (stopsimulatefunc != null) {
		stopsimulatefunc();
	}
	init();
	emits('close');
}
//根据当前时间获取亮度因子(单位：h)
function getBrightnessFactor(currTime) {
	let factor = 0;
	if (currTime <= 12) {
		factor = currTime / 12;
	} else {
		factor = -currTime / 12 + 2;
	}
	return factor;
}

function onsubmit() {
	const ori_enablelight = GlobalState.getInstance().viewer.scene.globe.enableLighting;

	let ori_lastupdtime = null;
	let requestframehandler = -1;

	let ori_brightness = GlobalState.getInstance().viewer.imageryLayers.get(0).brightness;

	stopsimulatefunc = function () {
		GlobalState.getInstance().viewer.scene.globe.enableLighting = ori_enablelight;
		//恢复当前时间
		GlobalState.getInstance().viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
		//移除夜景静图
		if (nightImageLayer != undefined) {
			GlobalState.getInstance().viewer.imageryLayers.remove(nightImageLayer);
		}
		ori_lastupdtime = null;
		//nightImageLayer=null;
		if (requestframehandler != -1) {
			cancelAnimationFrame(requestframehandler);
			requestframehandler = -1;
		}
		SetIsSunSimulate(false);
		SetDayOrNight(ori_brightness === 1, GlobalState.getInstance().viewer);
	};

	stopsimulatefunc();
	const yearmonthday = datestr.value.split('-');
	const starthour = Number(starttime.value.split(':')[0]);
	const endhour = Number(endtime.value.split(':')[0]);
	let simulatelengtime = parseFloat(simulatelong.value);
	let totalsecs = (endhour - starthour) * 3600;
	//模拟时每秒移动场景中的多少秒
	let step = totalsecs / simulatelengtime;
	nightImageLayer = GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(
		new Cesium.SingleTileImageryProvider({
			url: 'img/SpecialEffects/BlackMarble.jpg',
		})
	);
	SetIsSunSimulate(true);
	setAllLayerBrightnes(1, GlobalState.getInstance().viewer);

	let addsecs = 0;

	const tick = function () {
		let curtime = new Date();
		let stopflag = false;
		if (ori_lastupdtime == undefined) {
			SetCurrentTime(GlobalState.getInstance().viewer, yearmonthday[0], yearmonthday[1], yearmonthday[2], starthour, 0, 0);
			addsecs = 0;
			ori_lastupdtime = curtime;
		}
		let difftime = curtime - ori_lastupdtime;
		if (difftime >= 50) {
			addsecs += (difftime * step) / 1000;
			let lastTime = starthour + addsecs / 3600;
			nightImageLayer.alpha = 1 - getBrightnessFactor(lastTime);
			if (addsecs > totalsecs) {
				addsecs = totalsecs;
				stopflag = true;
			}

			SetCurrentTime(GlobalState.getInstance().viewer, yearmonthday[0], yearmonthday[1], yearmonthday[2], starthour, 0, 0, addsecs);
			ori_lastupdtime = curtime;
		}
		if (stopflag == false) {
			requestframehandler = requestAnimationFrame(tick);
		} else {
			stopsimulatefunc();
		}
	};

	tick();

	// emits("close");
}

function show() {
	init();
	sourceModal.value.show();
}

function init() {
	datestr.value = new Date().Format('yyyy-MM-dd');
	starttime.value = '06:00';
	endtime.value = '18:00';
	simulatelong.value = 10;
}
</script>

<style lang="less">
#SunLightSimulate > div:first-child {
	pointer-events: none;

	/*.customDialog .el-input,.el-select{*/
	/*width:300px !important;*/
	/*}*/
}

.sourceModal {
	--el-dialog-margin-top: 14.8vh !important;
	--el-dialog-width: 38.89vh !important;
	.el-date-editor {
		--el-date-editor-width: 21.85vh !important;
	}
	pointer-events: auto;
	.container {
		width: 33.33vh;
		margin: 2vh auto;
		padding: 0;
		.el-form {
			width: 100%;
			box-sizing: border-box;
			.el-form-item {
				margin-right: 0px;
				width: 100%;
			}
		}
	}
}

.el-form-item__label {
	width: 12vh;
}
</style>
