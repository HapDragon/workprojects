<script setup>
import popdialog from '@/components/Dialog/popdialog.vue';
import { querymodel, getquerymodel } from '@/views/modules/situationdraw.js';
import msgUtil from '@/utils/MessageUtil';
import emitradio from '@/api/emitradio.js';
import mousetip from '@/components/mousetip/index.vue';
import { GetPickedRayPositionWGS84, SetEntity, RemoveEntityById, GetLerpWGS84, GetWindowPosFromWGS84 } from '@/views/Map/buss/MapHandler.js';
import Bus from '@/common/eventBus';
import { GlobalState } from '@/common/GlobalState';

const { proxy } = getCurrentInstance();
const showradiopoint = ref(false);
const showmousetip = ref(false);
const dialogleft = ref();
const dialogtop = ref();
const electroEndPoint = ref({
	lon: '',
	lat: '',
	height: '',
});
const radioptinfo = ref({
	lon: '',
	lat: '',
	height: '',
	type: '',
});
// 查询电波射线场强和交互点信息
const queryRadioParam = ref({
	frequency: '', // 发射频率
	power: '', // 发射功率
	antennaHeight: '', // 天线高度
	antennaGain: '', // 天线增益
	x: 0, // 选取点的坐标x
	y: 0, // 选取点的坐标y
	model: '', // 计算模型
	weatherType: '', // 天气场景{晴天:1,雨天:2,雪天:3}
	unmannedVehicleX: 0, // 无人机/车的位置x
	unmannedVehicleY: 0, // 无人机/车的位置y
	unmannedVehicleFrequency: 0, // 无人车(机)的通信频率
	threshold: 0, // 最小通信场强
});
// 临时数据点，用于展示
const radiopoints = [
	[
		{ x: 118.8185666, y: 32.1456248, z: 1.6 },
		{ x: 118.8182964, y: 32.1456178, z: 1.5 },
	],
	[
		{ x: 118.8185666, y: 32.1456248, z: 1.6 },
		{ x: 118.8183842, y: 32.1458258, z: 16.5 },
		{ x: 118.8182964, y: 32.1456178, z: 1.5 },
	],
	[
		{ x: 118.8185666, y: 32.1456248, z: 1.6 },
		{ x: 118.8184976, y: 32.1454291, z: 16.5 },
		{ x: 118.8182964, y: 32.1456178, z: 1.5 },
	],
	[
		{ x: 118.8185666, y: 32.1456248, z: 1.6 },
		{ x: 118.8184267, y: 32.1454346, z: 16.5 },
		{ x: 118.8182964, y: 32.1456178, z: 1.5 },
	],
	[
		{ x: 118.8185666, y: 32.1456248, z: 1.6 },
		{ x: 118.8183495, y: 32.1457976, z: 16.5 },
		{ x: 118.8182964, y: 32.1456178, z: 1.5 },
	],
];
const radioColors = [new Cesium.Color(0.9922, 0.4745, 0.0157), new Cesium.Color(0, 0.8235, 1), new Cesium.Color(0.9686, 0.9686, 0.0745), new Cesium.Color(0.8392, 0.0157, 0.9882), new Cesium.Color(0.051, 1, 0.5451)];

async function testRadidLines() {
	for (let i = 0; i < radiopoints.length; i++) {
		let linesarr = [];
		let positions = [];
		for (let j = 0; j < radiopoints[i].length; j++) {
			positions.push(Cesium.Cartographic.fromDegrees(radiopoints[i][j].x, radiopoints[i][j].y, radiopoints[i][j].z));
		}
		let updatedPts = null;
		// 计算每一个点的相对高程
		if (GlobalState.getInstance().viewer.terrainProvider.availability == undefined) {
			updatedPts = positions;
		} else {
			updatedPts = await Cesium.sampleTerrainMostDetailed(GlobalState.getInstance().viewer.terrainProvider, positions);
		}

		for (let k = 0; k < updatedPts.length; k++) {
			// updatedPosition.height就是每一个经纬度对应的高程
			// linesarr[i].z = res[i].height;
			let _lon = Cesium.Math.toDegrees(updatedPts[k].longitude);
			let _lat = Cesium.Math.toDegrees(updatedPts[k].latitude);
			// 有地形就计算高度
			let _height = GlobalState.getInstance().viewer.terrainProvider.availability == undefined ? updatedPts[k].height : updatedPts[k].height + radiopoints[i][k].z;
			linesarr.push(Cesium.Cartesian3.fromDegrees(_lon, _lat, _height));
		}
		// 电波射线
		SetEntity(
			new Cesium.Entity({
				id: 'electroRay_' + (i + 1),
				polyline: {
					positions: linesarr,
					material: radioColors[i],
					width: 2,
					// clampToGround: true,
					// depthFailMaterial:this.Color.ToCesiumColor()
				},
			}),
			GlobalState.getInstance().viewer
		);
		// 起点
		SetEntity(
			new Cesium.Entity({
				id: 'electroRayStartPt_' + (i + 1),
				position: linesarr[0],
				billboard: {
					image: '/img/MapTools/start.svg',
					width: 40,
					height: 40,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					sizeInMeters: false,
					//disableDepthTestDistance: 1000
				},
			}),
			GlobalState.getInstance().viewer
		);
		// 终点
		SetEntity(
			new Cesium.Entity({
				id: 'electroRayEndPt_' + (i + 1),
				position: linesarr[linesarr.length - 1],
				billboard: {
					image: '/img/MapTools/end.svg',
					width: 40,
					height: 40,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					sizeInMeters: false,
					//disableDepthTestDistance: 1000
				},
			}),
			GlobalState.getInstance().viewer
		);
	}
}
function _onLeftSelectPt(movement) {
	let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
	if (!pos) return;
	SetEntity(
		new Cesium.Entity({
			id: 'electroEndPoint',
			position: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height),
			billboard: {
				image: '/img/modules/electroendpoint.png',
				width: 26,
				height: 42,
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				sizeInMeters: false,
				//disableDepthTestDistance: 1000
			},
		}),
		GlobalState.getInstance().viewer
	);
	electroEndPoint.value.lon = pos.longitude;
	electroEndPoint.value.lat = pos.latitude;
	electroEndPoint.value.height = pos.height;
}
function _onRightConfirm(movement) {
	removeMouseEvent();
	querymindistance();
}
// 定义鼠标事件，在页面初始化的时候设置好。
function defineMouseEvent() {
	Bus.VM.$on('Scene_Mouse_Left_Click', _onLeftSelectPt, 3);
	Bus.VM.$on('Scene_Mouse_Right_Click', _onRightConfirm);
}
function removeMouseEvent() {
	Bus.VM.$off('Scene_Mouse_Left_Click', _onLeftSelectPt);
	Bus.VM.$off('Scene_Mouse_Right_Click', _onRightConfirm);
	showmousetip.value = false;
}
// 绘制电波射线
function querymindistance() {
	// 先检查一下有没有范围点的数据
	let radiowavepoints = getquerymodel();
	if (!radiowavepoints || !radiowavepoints.x || !radiowavepoints.y) {
		msgUtil.messagePrompt('warning', '当前无起始点数据，展示测试数据。');
		removeAllEntity();
		testRadidLines();
	} else {
        removeAllEntity();
		if (electroEndPoint.value.lon != '' && electroEndPoint.value.lat != '' && electroEndPoint.value.height != '') {
			queryRadioParam.value.antennaGain = radiowavepoints.antennaGain;
			queryRadioParam.value.antennaHeight = radiowavepoints.antennaHeight;
			queryRadioParam.value.frequency = radiowavepoints.frequency;
			queryRadioParam.value.power = radiowavepoints.power;
			queryRadioParam.value.model = radiowavepoints.model;
			queryRadioParam.value.weatherType = radiowavepoints.weatherType;
			queryRadioParam.value.unmannedVehicleX = radiowavepoints.x;
			queryRadioParam.value.unmannedVehicleY = radiowavepoints.y;
			queryRadioParam.value.x = electroEndPoint.value.lon;
			queryRadioParam.value.y = electroEndPoint.value.lat;
			proxy.$post(emitradio.queryradiowave, queryRadioParam.value).then(async (res) => {
				if (res.code == '0') {
					let paths_points = res.data.points; // 后台返回的最短距离点
					let _startpt = { x: parseFloat(radiowavepoints.x), y: parseFloat(radiowavepoints.y), z: parseFloat(querymodel.z) }; // 起始点（发射车的坐标位置点）
					for (let i = 0; i < paths_points.length; i++) {
						let resultpt = []; // 用于保存整个电波射线的点
						resultpt.push(_startpt);
						let ptlines = paths_points[i];
						for (let j = 0; j < ptlines.length; j++) {
							resultpt.push({ x: parseFloat(ptlines[j].x), y: parseFloat(ptlines[j].y), z: parseFloat(ptlines[j].z) });
						}
						let _endpt = { x: electroEndPoint.value.lon, y: electroEndPoint.value.lat, z: electroEndPoint.value.height };
						resultpt.push(_endpt);
						// 计算相对高度, 检查是否有地形存在
						// if (GlobalState.getInstance().viewer.terrainProvider.availability == undefined) {
						// 	msgUtil.messagePrompt('warning', '当前无地形。');
						// 	return;
						// }
						let updatedPts = null;
						if (GlobalState.getInstance().viewer.terrainProvider.availability == undefined) {
							updatedPts = resultpt;
						} else {
							updatedPts = await Cesium.sampleTerrainMostDetailed(GlobalState.getInstance().viewer.terrainProvider, resultpt);
						}
						let cartesian3Arr = [];
						for (let k = 0; k < updatedPts.length; k++) {
							cartesian3Arr.push(Cesium.Cartesian3.fromDegrees(updatedPts[k].x, updatedPts[k].y, updatedPts[k].z));
							// 出去整个射线的首尾点
							if (k > 0 && k < updatedPts.length - 1) {
								let idtext = 'electroMinPt_' + (i + 1) + '_' + (k + 1);
								SetEntity(
									new Cesium.Entity({
										id: idtext,
										position: cartesian3Arr[k],
										point: {
											color: new Cesium.Color(1, 0.48, 0, 1),
											pixelSize: 10,
											// disableDepthTestDistance: Number.POSITIVE_INFINITY,
											// disableDepthTestDistance: 0,
										},
										properties: {
											lon: updatedPts[k].x,
											lat: updatedPts[k].y,
											height: updatedPts[k].z,
											type: updatedPts[k].pointType,
										},
									}),
									GlobalState.getInstance().viewer
								);
							}
						}
						SetEntity(
							new Cesium.Entity({
								id: 'electroRay_' + (i + 1),
								polyline: {
									positions: cartesian3Arr,
									material: radioColors[i],
									width: 2,
									// clampToGround: true,
								},
							}),
							GlobalState.getInstance().viewer
						);
						Bus.VM.$on('Scene_Mouse_Left_Click', onclickInteractPt, 1);
					}
				}
			});
		}
	}
}
// 点击交互点的事件
function onclickInteractPt(movement) {
	removeInteractPtPopup();
	let feature = GlobalState.getInstance().viewer.scene.pick(movement.position);
	if (feature == null) return;
	if (feature.id == undefined) return;
	if (feature.id.id.indexOf('electroMinPt_') >= 0) {
		showradiopoint.value = true;
		radioptinfo.value.lon = parseFloat(feature.id.properties.lon).toFixed(6);
		radioptinfo.value.lat = parseFloat(feature.id.properties.lat).toFixed(6);
		radioptinfo.value.height = feature.id.properties.height;
		radioptinfo.value.type = feature.id.properties.type;

		let animateEvent = function (scene, time) {
			if (!feature || !feature.id || !feature.id.properties) return;
			let position = Cesium.Cartesian3.fromDegrees(parseFloat(feature.id.properties.lon), parseFloat(feature.id.properties.lat), parseFloat(feature.id.properties.height));
			let canvasPosition = GlobalState.getInstance().viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());
			let container = document.getElementById('emitradiowave').childNodes[0];
			if (Cesium.defined(canvasPosition)) {
				dialogtop.value = canvasPosition.y - container.clientHeight - 10 + 'px';
				dialogleft.value = canvasPosition.x - container.clientWidth / 2 + 'px';
			}
		};
		GlobalState.getInstance().viewer.scene.postUpdate.addEventListener(animateEvent);
		return animateEvent;
	}
}
// 清除交互点点击之后的弹框
function removeInteractPtPopup() {
	showradiopoint.value = false;
}

defineExpose({
	showmousetip,
	defineMouseEvent,
	testRadidLines,
});

onMounted(() => {});
</script>
<script>
import { GetEntitysByContainId } from '@/views/Map/buss/MapHandler.js';
// 删除所有的绘制图形
export function removeAllEntity() {
	let _counts = GlobalState.getInstance().viewer.scene.postUpdate._listeners.length;
	for (let i = 0; i < _counts; i++) {
		GlobalState.getInstance().viewer.scene.postUpdate.removeEventListener(GlobalState.getInstance().viewer.scene.postUpdate._listeners[i]);
	}
	let electroEntityIds = ['electroEndPoint'];
	let electroRays = ['electroRay_', 'electroMinPt_', 'electroRayStartPt_', 'electroRayEndPt_'];
	for (let i = 0; i < electroRays.length; i++) {
		let _temp = GetEntitysByContainId(electroRays[i], GlobalState.getInstance().viewer);
		if (_temp) {
			for (let j = 0; j < _temp.length; j++) {
				electroEntityIds.push(_temp[j].id);
			}
		}
	}
	for (let i = 0; i < electroEntityIds.length; i++) {
		RemoveEntityById(GlobalState.getInstance().viewer, electroEntityIds[i]);
	}
	document.getElementById('emitradiowave').querySelector('.popdialog').style.display = 'none';
}
</script>

<template>
	<div id="emitradiowave">
		<popdialog :title="'交互点信息'" :isshowdialog="showradiopoint" :width="'24vh'" :height="'22vh'" :left="dialogleft" :top="dialogtop" @close="showradiopoint = false">
			<template v-slot:container>
				<div class="radioptinfo">
					<div class="rowitem">
						<span class="coltitle">经度:</span><span class="colvalue">{{ radioptinfo.lon }}</span>
					</div>
					<div class="rowitem">
						<span class="coltitle">纬度:</span><span class="colvalue">{{ radioptinfo.lat }}</span>
					</div>
					<div class="rowitem">
						<span class="coltitle">高度:</span><span class="colvalue">{{ radioptinfo.height }}</span>
					</div>
					<div class="rowitem">
						<span class="coltitle">类型:</span><span class="colvalue">{{ radioptinfo.type }}</span>
					</div>
				</div>
			</template>
		</popdialog>

		<mousetip v-show="showmousetip">
			<span class="mousetipspan">请用鼠标左键单击场景获取终点坐标，右键确定。</span>
		</mousetip>
	</div>
</template>

<style lang="less" scoped>
.mousetipspan {
	background-color: #00000066;
}
.radioptinfo {
	.rowitem {
		margin-left: 3vh;
		.colvalue {
			margin-left: 1vh;
		}
	}
}
</style>
