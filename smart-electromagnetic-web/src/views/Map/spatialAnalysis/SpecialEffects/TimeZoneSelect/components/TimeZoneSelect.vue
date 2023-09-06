<!--
 * Created by wqy
 * Date 2023/5/9 19:24
 * Description
-->
<template>
	<div id="TimeZoneSelect" v-show="isShow">
		<el-dialog v-model="isShow" :width="width" :modal="isShow" draggable :top="top" :destroy-on-close="true" :class="'customDialog'" :close-on-click-modal="false" @close="close">
			<template #header="{ close, titleId, titleClass }">
				<div class="customHeader">
					<h4 :id="titleId" :class="titleClass">时区选择</h4>
				</div>
			</template>
			<slot name="container">
				<div id="selectcontainer">
					<div id="selectoption">请选择时区：</div>
					<div id="selectpart">
						<el-select v-model="value" placeholder="东八区（UTC+8）" @change="getUTC($event)">
							<el-option v-for="item in UTC_GMT" :key="item.value" :label="item.value" :value="item.label">
								<span style="float: left">{{ item.value }}</span>
								<span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ item.label }}</span>
							</el-option>
						</el-select>
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
	name: 'TimeZoneSelect',
	data() {
		return {
			isShow: false,
			value: '',
			label: '',
			offset: -99,
			currUTC: 8,
			beforeUTC: 8,
			width: fontSize_VH(50) + 'px',
			top: fontSize_VH(18.5) + 'px',

			UTC_GMT: [
				{
					value: '世界时间',
					label: 'UTC',
				},
				{
					value: '东一区',
					label: 'UTC+1',
				},
				{
					value: '东二区',
					label: 'UTC+2',
				},
				{
					value: '东三区',
					label: 'UTC+3',
				},
				{
					value: '东四区',
					label: 'UTC+4',
				},
				{
					value: '东五区',
					label: 'UTC+5',
				},
				{
					value: '东六区',
					label: 'UTC+6',
				},
				{
					value: '东七区',
					label: 'UTC+7',
				},
				{
					value: '东八区 ',
					label: 'UTC+8',
				},
				{
					value: '东九区',
					label: 'UTC+9',
				},
				{
					value: '东十区',
					label: 'UTC+10',
				},
				{
					value: '东十一区',
					label: 'UTC+11',
				},
				{
					value: '东十二区',
					label: 'UTC+12',
				},
				{
					value: '西一区',
					label: 'UTC-1',
				},
				{
					value: '西二区',
					label: 'UTC-2',
				},
				{
					value: '西三区',
					label: 'UTC-3',
				},
				{
					value: '西四区',
					label: 'UTC-4',
				},
				{
					value: '西五区',
					label: 'UTC-5',
				},
				{
					value: '西六区',
					label: 'UTC-6',
				},
				{
					value: '西七区',
					label: 'UTC-7',
				},
				{
					value: '西八区 ',
					label: 'UTC-8',
				},
				{
					value: '西九区',
					label: 'UTC-9',
				},
				{
					value: '西十区',
					label: 'UTC-10',
				},
				{
					value: '西十一区',
					label: 'UTC-11',
				},
				{
					value: '西十二区',
					label: 'UTC-12',
				},
			],
		};
	},
	computed: {},
	mounted() {},
	methods: {
		sure() {
			this.isShow = false;
			if (this.offset != -99) {
				//防止用户未选择时区直接确认
				this.changeLayer(this.offset);
			}
			GlobalState.getInstance().viewer.clock.currentTime = Cesium.JulianDate.addHours(GlobalState.getInstance().viewer.clock.currentTime, this.currUTC - this.beforeUTC, new Cesium.JulianDate());
		},
		changeLayer(offset) {
			let jsDate = new Date(GlobalState.getInstance().viewer.clock.currentTime.toString());
			let date = timeFormatConvert(jsDate);
			let currHours = parseInt(date.H) + parseInt(offset);
			console.log(this.offset);
			console.log(currHours);
			let viewer = GlobalState.getInstance().viewer;
			// let dayalpha = 1;
			let brightness = 0.4;
			// viewer.clock.currentTime = Cesium.JulianDate.now(new Date());
			//设置12点亮度为1，到早上4点或晚上20点，每小时减去0.05，其他时间为0.4
			if (4 < currHours && currHours <= 12) {
				brightness = brightness + 0.05 * (currHours - 4);
			} else if ((12 < currHours && currHours <= 20) || (16 < currHours && currHours <= 18)) {
				brightness = 1 - 0.05 * (currHours - 12);
			} else if ((20 < currHours && currHours <= 24) || (0 < currHours && currHours <= 4)) {
				brightness = 0.4;
			}
			viewer.scene.globe.enableLighting = true;
			viewer.clock.shouldAnimate = true;
			viewer.clock.multiplier = 0;
			setAllLayerBrightnes(brightness, viewer);
		},
		getUTC(UTC) {
			var reg = new RegExp('UTC');
			var shifting = UTC.replace(reg, '');
			if (shifting == '') {
				shifting = 0;
			}
			this.beforeUTC = this.currUTC;
			this.currUTC = parseInt(shifting);
			this.offset = this.currUTC - this.beforeUTC;
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
#TimeZoneSelect {
	position: fixed;
	top: 18.5vh;
	left: calc(50% - 10vh);
	width: 46vh;
	height: 27.78vh;
}
#selectcontainer {
	width: 80%;
	height: 50%;
	display: flex;
	flex-direction: row;
	align-items: center;
	#selectoption {
		width: 50%;
		height: 100%;
	}
	#selectpart {
		width: 50%;
		height: 100%;
		display: flex;
		justify-content: space-around;
	}
}
.customDialog {
	border-radius: 3px;
	border: 1px solid #24b4b999;
	background: #02101299;
	color: white;
	font-family: puhui_thin_35;
	--el-text-color-regular: white;

	.el-dialog__header {
		padding: 0;
		margin: 0;
		border: 0;
		border-radius: 12px 12px 0 0;
		.customHeader {
			/*background-color: #3a75f6;*/
			line-height: 4vh;
			height: 4vh;
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
		min-height: 10vh;
		display: flex;
		flex-direction: row;
		align-items: center;
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
	}

	.el-button--primary {
		--el-button-bg-color: #24b4b9;
		--el-button-text-color: #fff;
	}
}
</style>

<style lang="less">
.dialog-footer {
	.el-button {
		margin-left: 2vh;
	}
}
</style>
