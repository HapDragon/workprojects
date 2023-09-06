<!--
 * Created by wqy
 * Date 2023/5/9 18:54
 * Description
-->
<template>
	<div id="DateTimeSelect" v-show="isShow">
		<el-dialog v-model="isShow" :width="width" :modal="isShow" draggable :top="top" :destroy-on-close="true" :class="'customDialog'" :close-on-click-modal="false" @close="close">
			<template #header="{ close, titleId, titleClass }">
				<div class="customHeader">
					<h4 :id="titleId" :class="titleClass">时间选择</h4>
				</div>
			</template>
			<slot name="container">
				<div id="selectcontainer">
					<div id="selectoption">请选择时间：</div>
					<div id="selectpart">
						<el-date-picker v-model="timevalue" type="datetime" placeholder="Select date and time" @change="getDate($event)" :default-time="defaultTime()" format="YYYY/MM/DD HH:mm:ss" value-format="x" />
					</div>
				</div>
			</slot>
			<template #footer>
				<div class="dialog-footer">
					<el-button @click="cancel">取消</el-button>
					<el-button type="primary" @click="sure">确定</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>

<script>
import { GlobalState } from '@/common/GlobalState';
import { timeFormatConvert, setAllLayerBrightnes } from '@/views/Map/buss/MapHandler.js';
import { fontSize_VH, fontSize_VW } from '@/utils/charts/chartSize.js';

export default {
	name: 'DateTimeSelect',
	data() {
		return {
			isShow: false,
			timevalue: '',
			offset: -99,
			width: fontSize_VH(50) + 'px',
			top: fontSize_VH(18.5) + 'px',
			Hours: -99,
		};
	},
	computed: {},
	mounted() {},
	methods: {
		sure() {
			this.isShow = false;
			if (this.Hours != -99) {
				GlobalState.getInstance().viewer.clock.currentTime = Cesium.JulianDate.addHours(GlobalState.getInstance().viewer.clock.currentTime, this.offset, new Cesium.JulianDate());
				let Hours = this.Hours;
				let viewer = GlobalState.getInstance().viewer;
				// let dayalpha = 1;
				let brightness = 0.4;
				// viewer.clock.currentTime = Cesium.JulianDate.now(new Date());
				//设置12点亮度为1，到早上四点或晚上八点，每小时减去0.05，其他时间为0.2
				if (4 < Hours && Hours <= 12) {
					brightness = brightness + 0.05 * (Hours - 4);
				} else if ((12 < Hours && Hours <= 20) || (16 < Hours && Hours <= 18)) {
					brightness = 1 - 0.05 * (Hours - 12);
				} else if ((20 < Hours && Hours <= 24) || (0 < Hours && Hours <= 4)) {
					brightness = 0.4;
				}
				viewer.scene.globe.enableLighting = true;
				viewer.clock.shouldAnimate = true;
				viewer.clock.multiplier = 0;
				setAllLayerBrightnes(brightness, viewer);
			}
		},
		getDate(timestamp) {
			const date = new Date(timestamp);
			const Hours = date.getHours(); // 小时
			this.changeMap(Hours);
		},
		defaultTime() {
			return new Date(2000, 1, 1, 12, 0, 0);
		},
		changeMap(Hours) {
			let jsDate = new Date(GlobalState.getInstance().viewer.clock.currentTime.toString());
			let date = timeFormatConvert(jsDate);
			this.offset = parseInt(Hours) - parseInt(date.H);
			this.Hours = parseInt(Hours);
		},
		close() {
			this.$emit('close');
		},
		cancel() {
			this.isShow = false;
			this.$emit('close');
		},
	},
	watch: {},
};
</script>

<style lang="less" scoped>
#DateTimeSelect {
	position: fixed;
	top: 18.5vh;
	left: calc(50% - 10vh);
}

#selectcontainer {
	width: 90%;
	height: 50%;
	display: flex;
	flex-direction: row;
	align-items: center;

	#selectoption {
		width: 50%;
		height: 100%;
	}

	#selectpart {
		width: 68%;
		height: 100%;
		display: flex;
		justify-content: space-around;
	}
}
</style>
