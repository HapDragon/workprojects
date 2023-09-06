<script setup>
import layercontrol from '@/views/Map/LayerControl/index.vue';
import { store } from '@/store/index.js';
import { GlobalState } from '@/common/GlobalState';
import popdialog from '@/components/Dialog/popdialog.vue';
import { CurrentHeightDistance, CurrentHeightVerticalDistance, CurrentHeightHorizonDistance, CurrentDistance, CurrentSquare, subcurTool, HeightPois, 
    DistancePois, SquarePois, CesiumPostRenderLister, maesureMouseFunc, pickpointsMouseFunction, removeMeasureMouseEvent, removepickpointsMouseEvent, 
    MeasureClear, wgs84poi, showmousetip, MeasureLocationEntityId } from '@/views/Map/spatialAnalysis/buss/toolshandler.js';
import { SetRainVisible, SetSnowVisible, SetSunnyVisible, SetEntity } from '@/views/Map/buss/MapHandler.js';
// import mousetip from '@/components/mousetip/index.vue';
import { removeSituation } from '@/views/modules/situationdraw.js';
import { removeAllEntity } from '@/views/modules/EmitRadio/EmitRadio.vue';
import mousetip from '@/components/mousetip/index.vue';
import { RemoveAll } from '../../modules/AddPeople/AddPeople';

const showLayerControl = ref(false); // 是否显示图层选择
const showToolsControl = ref(false); // 是否显示工具
const showmeasure = ref(false);
const showpickpt = ref(false);
const showweather = ref(false);
const mouseInLayerCtrl = ref(false);
const mouseInToolsCtrl = ref(false);

const maptools = ref([
	{ img: '/img/MapTools/spacemeasure.svg', text: '空间量算', selected: showmeasure.value },
	{ img: '/img/MapTools/location.svg', text: '坐标拾取', selected: showpickpt.value },
	{ img: '/img/MapTools/weather.svg', text: '天气特效', selected: showweather.value },
]);
const measuretools = ref([
	{ img: '/img/MapTools/distanceMeasure.png', name: 'distance', text: '距离量算', selected: false },
	{ img: '/img/MapTools/elevationMeasure.png', name: 'area', text: '面积量算', selected: false },
	{ img: '/img/MapTools/heightMeasure.png', name: 'elevation', text: '高度量算', selected: false },
]);
// 天气特效种类
const weathers = ref([
	{ img: '/img/MapTools/snowy.png', text: '降雨', show: false },
	{ img: '/img/MapTools/rainy.png', text: '降雪', show: false },
	{ img: '/img/MapTools/sunny.png', text: '晴天', show: true },
]);

onMounted(() => {
	const scope = this;
	store.registercurindexchangehandler(function (oldval, newval) {
		scope.$refs.spacetoolmainframeref.className = '';
		scope.$refs.spacemeasuretool.HiddenMenuWithAnamate();
		scope.$refs.specialeffectstool.HiddenMenuWithAnamate();
		setTimeout(function () {
			if (oldval == 5) scope.$refs.spacetoolmainframeref.className = 'spatialtoolanimation2';
			else if (newval == 5) {
				scope.$refs.spacetoolmainframeref.className = 'spatialtoolanimation3';
			} else {
				scope.$refs.spacetoolmainframeref.className = 'spatialtoolanimation';
			}
		}, 0);
	});
});
// 选择图层和工具按钮
function menuselected(text) {
	if (text == '图层') {
		showLayerControl.value = !showLayerControl.value;
		showToolsControl.value = false;
	} else if (text == '工具') {
		showLayerControl.value = false;
		showToolsControl.value = !showToolsControl.value;
	} else if (text == '清除') {
		// removeSituation();
		removeAllEntity();
		RemoveAll();
	}
}
// 选择工具栏中的内容
function toolsselected(text) {
	MeasureClear();
	switch (text) {
		case '空间量算':
			showmeasure.value = !showmeasure.value;
			showpickpt.value = false;
			showweather.value = false;
			maptools.value[0].selected = showmeasure.value;
			maptools.value[1].selected = false;
			maptools.value[2].selected = false;
			for (let i = 0; i < measuretools.value.length; i++) {
				measuretools.value[i].selected = false;
			}
            if(showmeasure.value) {
                maesureMouseFunc();
            } else {
                removeMeasureMouseEvent(); 
            }
            
			break;
		case '坐标拾取':
			showmeasure.value = false;
			showpickpt.value = !showpickpt.value;
			showweather.value = false;
			maptools.value[0].selected = false;
			maptools.value[1].selected = showpickpt.value;
			maptools.value[2].selected = false;
			wgs84poi.value = {
				lon: '',
				lat: '',
				height: '',
			};
            if(showpickpt.value) {
                pickpointsMouseFunction();
            } else {
                removepickpointsMouseEvent();
            }
            

            
			break;
		case '天气特效':
			showmeasure.value = false;
			showpickpt.value = false;
			showweather.value = !showweather.value;
			maptools.value[0].selected = false;
			maptools.value[1].selected = false;
			maptools.value[2].selected = showweather.value;
			break;
	}
}
// 选择天气特效
function changeweather(item) {
	// 控制选项的控制按钮样式
	for (let i = 0; i < weathers.value.length; i++) {
		if (weathers.value[i].text != item.text && weathers.value[i].text == '晴天' && !item.show) {
			weathers.value[i].show = true;
		} else if (weathers.value[i].text == item.text && item.show) {
			weathers.value[i].show = true;
		} else {
			weathers.value[i].show = false;
		}
	}
	// 地图场景中的天气特效控制
	switch (item.text) {
		case '降雪':
			SetSnowVisible(item.show, GlobalState.getInstance().viewer);
			SetRainVisible(false, GlobalState.getInstance().viewer);
			SetSunnyVisible(!item.show, GlobalState.getInstance().viewer);
			break;
		case '降雨':
			SetSnowVisible(false, GlobalState.getInstance().viewer);
			SetRainVisible(item.show, GlobalState.getInstance().viewer);
			SetSunnyVisible(!item.show, GlobalState.getInstance().viewer);
			break;
		case '晴天':
			SetSnowVisible(false, GlobalState.getInstance().viewer);
			SetRainVisible(false, GlobalState.getInstance().viewer);
			SetSunnyVisible(item.show, GlobalState.getInstance().viewer);
			break;
	}
}
// 选择测算工具里面的测量类型
function selectmeasure(item) {
	subcurTool.value = item;
	for (let i = 0; i < measuretools.value.length; i++) {
		measuretools.value[i].selected = false;
		if (measuretools.value[i].name == item.name) {
			measuretools.value[i].selected = true;
			showmousetip.value = true;
		}
	}
}
// 是否现实高度或距离或面积大小的div
let showheightdiv = computed(() => {
	return HeightPois.value.length > 0;
});
let showdistancediv = computed(() => {
	return DistancePois.value.length > 0;
});
let showsquarediv = computed(() => {
	return SquarePois.value.length > 0;
});
// 现实空间距离、水平距离、高度、面积等值
let measureheightstr = computed(() => {
	return '垂直距离:' + CurrentHeightVerticalDistance.value + '米';
});
let measureheightverticalstr = computed(() => {
	return '空间距离:' + CurrentHeightDistance.value + '米';
});
let measureheighthorizonstr = computed(() => {
	return '水平距离:' + CurrentHeightHorizonDistance.value + '米';
});
let measuredistancestr = computed(() => {
	return CurrentDistance.value + '米';
});
let measuresquarestr = computed(() => {
	return CurrentSquare.value + '平方米';
});
// 清除所有绘制的测量范围点
function clearanasubmenus() {
	GlobalState.getInstance().viewer.scene.postRender.removeEventListener(CesiumPostRenderLister.value);
	MeasureClear();
	for (let i = 0; i < measuretools.value.length; i++) {
		measuretools.value[i].selected = false;
	}
}
// 拾取地图点
function pickuppoints() {
	let temp = { name: 'pick_geo_location', text: '地图采点' };
	selectmeasure(temp);
}
// 地图拾取点，定位到地图
function locatemap() {
	if (wgs84poi.value.lon == '' || wgs84poi.value.lat == '') return;
	let entitypt = SetEntity(
		new Cesium.Entity({
			id: MeasureLocationEntityId.value + 'poi',
			position: Cesium.Cartesian3.fromDegrees(wgs84poi.value.lon, wgs84poi.value.lat, wgs84poi.value.height),
			billboard: {
				image: '/img/SpaceMeasure/getlocationmap.png',
				width: 25,
				height: 25,
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				sizeInMeters: false,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		}),
		GlobalState.getInstance().viewer
	);

	// let _heading = GlobalState.getInstance().viewer.camera.heading;
	// GlobalState.getInstance().viewer.camera.flyTo({
	// 	destination: Cesium.Cartesian3.fromDegrees(wgs84poi.value.lon, wgs84poi.value.lat, wgs84poi.value.height + 500),
	// 	orientation: {
	// 		heading: Cesium.Math.toRadians(_heading),
	// 		pitch: Cesium.Math.toRadians(-90),
	// 		roll: Cesium.Math.toRadians(0),
	// 	},
	// });
	GlobalState.getInstance().viewer.flyTo(entitypt);
}
// 清除所有天气特效
function clearWeatherEffects() {
	for (let i = 0; i < weathers.value.length; i++) {
		weathers.value[i].show = false;
	}
	SetSnowVisible(false, GlobalState.getInstance().viewer);
	SetRainVisible(false, GlobalState.getInstance().viewer);
	SetSunnyVisible(false, GlobalState.getInstance().viewer);
}
// 工具栏图层鼠标进入的效果
function layerCtrlMouseEnter() {
    console.log('layer-enter');
	showLayerControl.value = true;
	showToolsControl.value = false;
}
// 工具栏图层鼠标离开的效果
function layerCtrlMouseLeave(event) {
    console.log('layer-leave');
	setTimeout(() => {
		if (!mouseInLayerCtrl.value) {
			showLayerControl.value = false;
			showToolsControl.value = false;
		} else {
			showToolsControl.value = false;
		}
	}, 500);
}
// 工具栏工具鼠标进入的效果
function toolsCtrlMouseEnter() {
	console.log('tools-enter');
	showLayerControl.value = false;
	showToolsControl.value = true;
}
// 工具栏工具鼠标离开的效果
function toolsCtrlMouseLeave(event) {
	console.log('tools-leave');
	setTimeout(() => {
		if (!mouseInToolsCtrl.value) {
			showLayerControl.value = false;
			showToolsControl.value = false;
		} else {
			showLayerControl.value = false;
		}
	}, 500);
}
// 工具栏清除鼠标进入的效果
function clearCtrlMouseEnter() {
	showLayerControl.value = false;
	showToolsControl.value = false;
}
// 工具组件框鼠标进入
function toolsContainMouseEnter() {
	mouseInToolsCtrl.value = true;
	showToolsControl.value = true;
}
// 工具组件框鼠标离开
function toolsContainMouseLeave() {
	mouseInToolsCtrl.value = false;
	showToolsControl.value = false;
}
// 图层组件框鼠标进入
function layerContainMouseEnter() {
	mouseInLayerCtrl.value = true;
	showLayerControl.value = true;
}
// 图层组件框鼠标离开
function layerContainMouseLeave() {
	mouseInLayerCtrl.value = false;
	showLayerControl.value = false;
}
</script>

<template>
	<div id="MapTools">
		<div id="MainFrame" ref="spacetoolmainframeref" class="spatialtoolanimation" :style="store.curindex != 5 ? '' : 'right:48px;'" v-show="store.curindex != 1">
			<div :class="showLayerControl ? 'funcbt select' : 'funcbt'" @click="menuselected('图层')" @mouseenter="layerCtrlMouseEnter" @mouseleave="layerCtrlMouseLeave">
				<img class="curTool_img" src="/img/MapTools/layer.svg" alt="" />
				<span class="curTool_text">图层</span>
				<el-icon v-show="!showLayerControl"><ArrowRight /></el-icon>
				<el-icon v-show="showLayerControl"><ArrowDown /></el-icon>
			</div>
			<div>|</div>
			<div :class="showToolsControl ? 'funcbt select' : 'funcbt'" @click="menuselected('工具')" @mouseenter="toolsCtrlMouseEnter" @mouseleave="toolsCtrlMouseLeave">
				<img class="curTool_img" src="/img/MapTools/tools.svg" alt="" />
				<span class="curTool_text">工具</span>
				<el-icon v-show="!showToolsControl"><ArrowRight /></el-icon>
				<el-icon v-show="showToolsControl"><ArrowDown /></el-icon>
			</div>
			<div>|</div>
			<div class="funcbt" @click="menuselected('清除')" @mouseenter="clearCtrlMouseEnter">
				<img class="curTool_img" src="/img/MapTools/clear.svg" alt="" />
				<span class="curTool_text">清除</span>
			</div>
		</div>
		<layercontrol v-show="showLayerControl" @mouseenter="layerContainMouseEnter" @mouseleave="layerContainMouseLeave"></layercontrol>
		<div class="toolscontainer" v-show="showToolsControl" @mouseenter="toolsContainMouseEnter" @mouseleave="toolsContainMouseLeave">
			<div class="measuretool" :class="item.selected ? 'selected' : ''" v-for="item in maptools" @click="toolsselected(item.text)">
				<img class="measuretool_img" :src="item.img" alt="" />
				<span class="measuretool_text">{{ item.text }}</span>
			</div>
		</div>
		<popdialog :title="'空间量算'" :isshowdialog="showmeasure" :width="'30vh'" :height="'26vh'" :top="'17vh'" :left="'calc(100% - 36vh)'" @close="toolsselected('空间量算')">
			<template v-slot:container>
				<div class="dialogcontent">
					<div class="toolsDiv">
						<div class="toolsitem" v-for="item in measuretools">
							<div class="itemimgdiv" @click="selectmeasure(item)" :class="item.selected ? 'selected' : ''">
								<img class="toolsitem_img" :src="item.img" alt="" />
							</div>
							<span class="toolsitem_text">{{ item.text }}</span>
						</div>
					</div>
					<el-button type="primary" class="clearmearsuer_btn" @click="clearanasubmenus">清空测量数据</el-button>
				</div>
			</template>
		</popdialog>
		<popdialog :title="'坐标拾取'" :isshowdialog="showpickpt" :width="'30vh'" :height="'26vh'" :top="'17vh'" :left="'calc(100% - 36vh)'" @close="toolsselected('坐标拾取')">
			<template v-slot:container>
				<div class="dialogcontent">
					<div class="ptsDiv">
						<div class="ptitem">
							<span class="ptitem_title">经度：</span>
							<el-input class="ptitem_input" v-model="wgs84poi.lon"></el-input>
						</div>
						<div class="ptitem">
							<span class="ptitem_title">纬度：</span>
							<el-input class="ptitem_input" v-model="wgs84poi.lat"></el-input>
						</div>
						<div class="ptitem">
							<span class="ptitem_title">高度：</span>
							<el-input class="ptitem_input" v-model="wgs84poi.height"></el-input>
						</div>
					</div>
					<el-button type="primary" class="ptpick_btn" @click="pickuppoints">图上拾取</el-button>
					<el-button type="primary" class="ptpick_btn" @click="locatemap">坐标定位</el-button>
				</div>
			</template>
		</popdialog>
		<popdialog :title="'天气特效'" :isshowdialog="showweather" :width="'30vh'" :height="'26vh'" :top="'17vh'" :left="'calc(100% - 36vh)'" @close="toolsselected('天气特效')">
			<template v-slot:container>
				<div class="dialogcontent">
					<div class="weathersDiv">
						<div class="weatheritem" v-for="item in weathers">
							<img :src="item.img" alt="" class="weathers_img" />
							<span class="weathers_text">{{ item.text }}</span>
							<el-switch class="weathers_switch" v-model="item.show" @change="changeweather(item)"></el-switch>
						</div>
					</div>
					<el-button type="primary" class="clearweather_btn" @click="clearWeatherEffects">清除天气特效</el-button>
				</div>
			</template>
		</popdialog>

		<div v-show="showheightdiv" class="showtooltip" ref="HeightVerticalDiv" id="heightverticaldiv">{{ measureheightverticalstr }}</div>
		<div v-show="showheightdiv" class="showtooltip" ref="HeightHorizonDiv" id="heighthorizondiv">{{ measureheighthorizonstr }}</div>
		<div v-show="showheightdiv" class="showtooltip" ref="HeightDiv" id="heightdiv">{{ measureheightstr }}</div>
		<div v-show="showdistancediv" class="showtooltip" ref="DistanceDiv" id="distancediv">{{ measuredistancestr }}</div>
		<div v-show="showsquarediv" class="showtooltip" ref="SquareDiv" id="squarediv">{{ measuresquarestr }}</div>
		<mousetip v-if="showmousetip">
			<span id="mousetipspan">请用鼠标左键单击场景获取坐标，右击结束</span>
		</mousetip>
	</div>
</template>

<style lang="less">
@import url('./assets/maptoolstyle.less');
</style>
