<!--
 * Created by wqy
 * Date 2021/3/4 10:50
 * Description
 :src=(subcurTool&&subcurTool.name==item.name)?('/images/cesium/SpaceMeasure/'+item.imgfilename+'_select.svg'):('/images/cesium/SpaceMeasure/'+item.imgfilename+'.svg')
-->
<template>
	<div id="SpaceMeasure">
		<div class="SubMainFrame position-fixed" :style="store.curindex == 5 ? 'right:48px;' : ''">
			<img v-for="(item, index) in subtools" :src="subcurTool && subcurTool.name == item.name ? 'img/SpaceMeasure/' + item.imgfilename + '_select.svg' : 'img/SpaceMeasure/' + item.imgfilename + '.svg'" :title="item.label" @click="clicksubmenu(item)" />
			<div id="Interval"></div>
			<img src="/img/common/close.svg" @click="HiddenMenuWithAnamate" />
		</div>

		<div v-show="showheightdiv" class="lineheight-25px FontSize-16px bk-13213ccc color-white position-fixed" ref="HeightVerticalDiv">
			{{ measureheightverticalstr }}
		</div>
		<div v-show="showheightdiv" class="lineheight-25px FontSize-16px bk-13213ccc color-white position-fixed" ref="HeightHorizonDiv">
			{{ measureheighthorizonstr }}
		</div>
		<div v-show="showheightdiv" class="lineheight-25px FontSize-16px bk-13213ccc color-white position-fixed" ref="HeightDiv">
			{{ measureheightstr }}
		</div>
		<div class="lineheight-25px FontSize-16px bk-13213ccc color-white position-fixed" v-show="showdistancediv" ref="DistanceDiv">
			{{ measuredistancestr }}
		</div>
		<div id="SquareDiv" v-show="showsquarediv" class="lineheight-25px FontSize-16px bk-13213ccc color-white position-fixed" ref="SquareDiv">
			{{ measuresquarestr }}
		</div>
		<getlocation ref="getlocation"></getlocation>
	</div>
</template>

<script>
import Bus from '@/common/eventBus';

import { GlobalState } from '@/common/GlobalState';
import Coordinates from '@/views/Map/buss/Coordinates';
// import spaceMeasureHandle from '../buss/spaceMeasureHandle'
import getlocation from './GetLocation.vue';
import msgUtil from '@/utils/MessageUtil';
import { GetPickedRayPositionWGS84, SetEntity, RemoveEntityById, GetLerpWGS84, GetWindowPosFromWGS84 } from '@/views/Map/buss/MapHandler';
import $ from "jquery";
import { store } from '@/store/index.js';

const ENTITYPRE = 'SPACEMEASURE';

export default {
	name: 'SpaceMeasure',

	components: { getlocation },

	props: ['winWidth'],

	data() {
		return {
			isShow: false,
			store,

			subcurTool: null,
			subtools: [
				{ name: 'distance', label: '距离量算', imgfilename: 'distanceMeasure', method: 'MeasureDistance', auth: true },
				{ name: 'area', label: '面积量算', imgfilename: 'areaMeasure', method: 'MeasureSquare', auth: true },
				{ name: 'elevation', label: '高度量算', imgfilename: 'elevationMeasure', method: 'MeasureHeight', auth: true },
				{ name: 'pick_geo_location', label: '拾取地理位置', imgfilename: 'location', method: '', auth: false },
			],
			MeasureHeightEntityId: 'measureheightentity', //高度量算entityid
			MeasureDistanceEntityId: 'measuredistanceentity', //距离量算entityid
			MeasureSquareEntityId: 'measuresquareentity', //面积量算entityid
			MeasureLocationEntityId: 'measurelocationentity', //位置量算entity
			// CurrentMeasureType: logicmodel.MeasureType.NONE,//当前量算类型
			CurrentHeightDistance: 0, //当前高度空间距离 单位m
			CurrentHeightVerticalDistance: 0, //当前高度垂直距离 单位m
			CurrentHeightHorizonDistance: 0, //当前高度水平距离 单位m
			CurrentDistance: 0, //当前距离量算距离数值 单位m
			CurrentSquare: 0, //当前面积量算数值 单位平方米
			HeightPois: [], //高度量算所需点
			DistancePois: [], //距离量算所需点
			SquarePois: [], //面积量算所需点
			LocationPoi: null, //位置量算所需点
			SquareLeftClicked: false,
			SquarePolygon: null, //面积量算所需面
			DistanceStartMeasure: false, //开始距离量算，结束设置为false
			HeightStartMeasure: false, //开始高度量算，结束设置为false
			SquareStartMeasure: false, //开始面积量算，结束设置为false
			CesiumPostRenderLister: null, //CesiumPostRender监听事件,

			MeasureType: {
				HEIGHT_MEASURE: 'elevation',
				DISTANCE_MEASURE: 'distance',
				SQUARE_MEASURE: 'area',
			},
		};
	},
	computed: {
		DistancePoisCartesian: function () {
			var result = [];
			this.DistancePois.forEach((poi) => {
				result.push(poi.ToCartesian());
			});
			return result;
		},
		SquarePoisCartesian: function () {
			var result = [];
			this.SquarePois.forEach((poi) => {
				result.push(poi.ToCartesian());
			});
			return result;
		},
		CurrentFixedDistance: function () {
			//由已经在地表点击点组成的线段的总距离
			var dis = 0;
			for (var i = 1; i < this.DistancePois.length; i++) {
				dis += Coordinates.CoordinateWGS84.GetDistance(this.DistancePois[i - 1], this.DistancePois[i]);
			}
			return dis;
		},
		showheightdiv: function () {
			return this.HeightPois.length > 0;
		},
		showdistancediv: function () {
			return this.DistancePois.length > 0;
		},
		showsquarediv: function () {
			return this.SquarePois.length > 0;
		},
		measureheightstr: function () {
			return '空间距离:' + this.CurrentHeightDistance + '米';
		},
		measureheightverticalstr: function () {
			return '垂直距离:' + this.CurrentHeightVerticalDistance + '米';
		},
		measureheighthorizonstr: function () {
			return '水平距离:' + this.CurrentHeightHorizonDistance + '米';
		},
		measuredistancestr: function () {
			return this.CurrentDistance + '米';
		},
		measuresquarestr: function () {
			return this.CurrentSquare + '平方米';
		},
	},
	created() {
		// 检查权限
		let that = this;
		// authControllerHandle.check('pick_geo_location',null,function(res){
		//    if(res){
		that.subtools.find((subtool) => subtool.name === 'pick_geo_location').auth = true;
		//    }
		// });
	},
	mounted() {
		// 拾取地理位置
		let that = this;
		Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, function (movement) {
			if (that.subcurTool && that.subcurTool.name === 'pick_geo_location') {
				let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
				if (!pos) return;

				that.$refs.getlocation.setresult(pos);
				that.$refs.getlocation.isShow = true;
				//画点
				SetEntity(
					new Cesium.Entity({
						id: that.MeasureLocationEntityId + 'poi',
						position: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height),
						billboard: {
							image: '/img/SpaceMeasure/getlocationmap.png',
							width: 25,
							height: 25,
							horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
							verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
							sizeInMeters: false,
							//disableDepthTestDistance: 1000
						},
					}),
					GlobalState.getInstance().viewer
				);
			}
		});

		// 距离、面积、高度量测
		Bus.VM.$on('Scene_Mouse_Left_Click', function (movement) {
			if (!that.subcurTool) return;
			var pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
			if (!pos) return;

			if (that.subcurTool.name === that.MeasureType.HEIGHT_MEASURE) {
				if (that.HeightPois.length > 0) {
					that.HeightStartMeasure = false;
					return;
				}
				that.HandleHeightLeftClick(pos);
				that.HeightStartMeasure = true;
			} else if (that.subcurTool.name === that.MeasureType.DISTANCE_MEASURE) {
				if (that.DistancePois.length === 0) {
					that.DistanceStartMeasure = true;
				}
				if (!that.DistanceStartMeasure) return;
				that.HandleDistanceLeftClick(pos);
			} else if (that.subcurTool.name === that.MeasureType.SQUARE_MEASURE) {
				if (that.SquarePois.length === 0) {
					that.SquareStartMeasure = true;
				}
				if (!that.SquareStartMeasure) return;
				that.HandleSquareLeftClick(pos);
			} else if (that.subcurTool.name == that.MeasureType.LOCATION_MEASURE) {
				that.HandleLocationLeftClick(pos);
			}
		});
		Bus.VM.$on('Scene_Mouse_Right_Click', function (movement) {
			if (!that.subcurTool) return;
			var pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
			if (!pos) return;

			if (that.subcurTool.name === that.MeasureType.HEIGHT_MEASURE) {
				that.HeightStartMeasure = false;
			} else if (that.subcurTool.name === that.MeasureType.DISTANCE_MEASURE) {
				if (!that.DistanceStartMeasure) return;
				that.HandleDistanceLeftClick(pos);
				that.DistanceStartMeasure = false;
			} else if (that.subcurTool.name === that.MeasureType.SQUARE_MEASURE) {
				that.SquareStartMeasure = false;
			}
		});
		Bus.VM.$on('Scene_Mouse_Move', function (movement) {
			if (!that.subcurTool) return;
			var pos = GetPickedRayPositionWGS84(movement.endPosition, GlobalState.getInstance().viewer);
			if (pos == null) return;
			if (that.subcurTool.name === that.MeasureType.HEIGHT_MEASURE) {
				//高度量算
				if (that.HeightPois.length === 0) return;
				if (that.HeightStartMeasure === false) return;
				that.HandleHeightMouseMove(pos);
			} else if (that.subcurTool.name === that.MeasureType.DISTANCE_MEASURE) {
				//距离量算
				if (that.DistancePois.length === 0) return;
				if (that.DistanceStartMeasure === false) return;
				that.HandleDistanceMouseMove(pos);
			} else if (that.subcurTool.name === that.MeasureType.SQUARE_MEASURE) {
				//面积量算
				if (that.SquarePois.length === 0) return;
				if (that.SquareStartMeasure === false) return;
				that.HandleSquareMouseMove(pos);
			}
		});
		this.CesiumPostRenderLister = function () {
			if (!that.subcurTool) return;
			if (that.HeightPois.length > 0) that.HandleHeightSceneCameraMove();
			if (that.DistancePois.length > 0) that.HandleDistanceSceneCameraMove();
			if (that.SquarePois.length > 0) that.HandleSquareSceneCameraMove();
		};
	},
	methods: {
		ShowMenu() {
			// $("#SpaceMeasure .SubMainFrame").css('display', 'block');
			// $("#SpaceMeasure .SubMainFrame").animate({height: '192'});
			$('#SpaceMeasure .SubMainFrame').removeClass('showanimation');
			$('#SpaceMeasure .SubMainFrame').removeClass('closeanimation');
			$('#SpaceMeasure .SubMainFrame').addClass('showanimation');
			GlobalState.getInstance().viewer.scene.postRender.addEventListener(this.CesiumPostRenderLister);
		},
		HiddenMenuWithAnamate() {
			// $("#SpaceMeasure .SubMainFrame").animate({height: '0px'}, '400', function () {
			//     $("#SpaceMeasure .SubMainFrame").css('display', 'none');
			// });
			$('#SpaceMeasure .SubMainFrame').removeClass('showanimation');
			$('#SpaceMeasure .SubMainFrame').removeClass('closeanimation');
			$('#SpaceMeasure .SubMainFrame').addClass('closeanimation');
			this.clearanasubmenus();
			this.$emit('close');
		},
		HiddenMenu() {
			$('#SpaceMeasure .SubMainFrame').removeClass('showanimation');
			$('#SpaceMeasure .SubMainFrame').removeClass('closeanimation');
			// $("#SpaceMeasure .SubMainFrame").css('display', 'none');
			// $("#SpaceMeasure .SubMainFrame").css('height', '0px');
			this.clearanasubmenus();
		},

		MeasureClear: function () {
			this.MeasureDistanceClear();
			this.MeasureHeightClear();
			this.MeasureSquareClear();
			this.MeasureLocationClear();
			this.subcurTool = null;
		},

		MeasureHeight: function () {
			this.MeasureHeightClear();
			// this.CurrentMeasureType = logicmodel.MeasureType.HEIGHT_MEASURE;
		},
		MeasureDistance: function () {
			this.MeasureDistanceClear();
			// this.CurrentMeasureType = logicmodel.MeasureType.DISTANCE_MEASURE;
		},
		MeasureSquare: function () {
			this.MeasureSquareClear();
			// this.CurrentMeasureType = logicmodel.MeasureType.SQUARE_MEASURE;
		},

		MeasureHeightClear: function () {
			for (var i = 0; i < 3; i++) {
				RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureHeightEntityId + 'poi' + i.toString());
			}
			RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureHeightEntityId + 'polyline0');
			this.HeightPois = [];
		},
		MeasureDistanceClear: function () {
			for (var i = 0; i < this.DistancePois.length; i++) {
				RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureDistanceEntityId + 'poi' + (i + 1).toString());
			}
			RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureDistanceEntityId + 'polyline0');
			//既然不使用billboard entity方式显示标签，则不需要在这里删除label entity
			this.DistancePois = [];
			this.DistanceStartMeasure = false;
		},
		MeasureSquareClear: function () {
			for (var i = 0; i < this.SquarePois.length; i++) {
				RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureSquareEntityId + 'poi' + (i + 1).toString());
			}
			RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureSquareEntityId + 'polyline0');
			RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureSquareEntityId + 'polygon');
			this.SquarePois = [];
			this.SquareStartMeasure = false;
		},
		MeasureLocationClear() {
			RemoveEntityById(GlobalState.getInstance().viewer, this.MeasureLocationEntityId + 'poi');
			this.LocationPoi = null;
			this.$refs.getlocation.isShow = false;
		},
		HandleHeightLeftClick: function (pos) {
			this.HeightPois.push(pos);
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureHeightEntityId + 'poi0',
					position: pos.ToCartesian(),
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				}),
				GlobalState.getInstance().viewer
			);
		},
		HandleHeightMouseMove: function (pos) {
			//根据当前位置获取新点，经纬度是当前pos，高度是上一个点的pos
			var newpos = new Coordinates.CoordinateWGS84(pos.longitude, pos.latitude, this.HeightPois[0].height);
			if (this.HeightPois.length > 1) {
				this.HeightPois[1] = pos;
				this.HeightPois[2] = newpos;
			} else {
				this.HeightPois.push(pos);
				this.HeightPois.push(newpos);
			}

			//画点
			// console.log("经度:"+pos.longitude+",纬度:"+pos.latitude+",高度:"+pos.height+"米");
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureHeightEntityId + 'poi1',
					position: pos.ToCartesian(),
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				}),
				GlobalState.getInstance().viewer
			);
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureHeightEntityId + 'poi2',
					position: newpos.ToCartesian(),
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				}),
				GlobalState.getInstance().viewer
			);
			//画线
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureHeightEntityId + 'polyline0',
					polyline: {
						positions: [this.HeightPois[0].ToCartesian(), pos.ToCartesian(), newpos.ToCartesian(), this.HeightPois[0].ToCartesian()],
						material: new Cesium.Color(0, 1, 0, 0.6),
						width: 2,
						// depthFailMaterial:this.Color.ToCesiumColor()
					},
				}),
				GlobalState.getInstance().viewer
			);
			//获取标签位置
			var labelpos0, labelpos1, labelpos2;
			labelpos0 = GetLerpWGS84(this.HeightPois[0], pos, 0.5, GlobalState.getInstance().viewer);
			labelpos1 = GetLerpWGS84(this.HeightPois[0], newpos, 0.5, GlobalState.getInstance().viewer);
			labelpos2 = GetLerpWGS84(pos, newpos, 0.5, GlobalState.getInstance().viewer);

			//设置标签位置
			var posscreen0 = GetWindowPosFromWGS84(labelpos0, GlobalState.getInstance().viewer);
			var posscreen1 = GetWindowPosFromWGS84(labelpos1, GlobalState.getInstance().viewer);
			var posscreen2 = GetWindowPosFromWGS84(labelpos2, GlobalState.getInstance().viewer);
			this.$refs.HeightVerticalDiv.style.left = (posscreen2.x + 6).toString() + 'px';
			this.$refs.HeightVerticalDiv.style.top = (posscreen2.y + 6).toString() + 'px';
			this.$refs.HeightHorizonDiv.style.left = (posscreen1.x + 6).toString() + 'px';
			this.$refs.HeightHorizonDiv.style.top = (posscreen1.y + 6).toString() + 'px';
			this.$refs.HeightDiv.style.left = (posscreen0.x + 6).toString() + 'px';
			this.$refs.HeightDiv.style.top = (posscreen0.y + 6).toString() + 'px';

			//计算距离
			this.CurrentHeightDistance = Coordinates.CoordinateWGS84.GetDistance(this.HeightPois[0], pos).toFixed(2);
			//this.CurrentHeightHorizonDistance=(Coordinates.CoordinateWGS84.GetDistancePlane(this.HeightPois[0],pos)).toFixed(2);
			this.CurrentHeightHorizonDistance = Coordinates.CoordinateWGS84.GetDistancePlaneWithLocal(this.HeightPois[0], pos).toFixed(2);
			this.CurrentHeightVerticalDistance = (pos.height - newpos.height).toFixed(2);
		},
		HandleDistanceLeftClick: function (pos) {
			this.DistancePois.push(pos);
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureDistanceEntityId + 'poi' + this.DistancePois.length.toString(),
					position: pos.ToCartesian(),
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				}),
				GlobalState.getInstance().viewer
			);
		},
		HandleDistanceMouseMove: function (pos) {
			//计算距离
			this.CurrentDistance = (this.CurrentFixedDistance + Coordinates.CoordinateWGS84.GetDistance(this.DistancePois[this.DistancePois.length - 1], pos)).toFixed(2);
			//设置label位置
			var posscreen = GetWindowPosFromWGS84(pos, GlobalState.getInstance().viewer);
			this.$refs.DistanceDiv.style.left = (posscreen.x + 6).toString() + 'px';
			this.$refs.DistanceDiv.style.top = (posscreen.y + 6).toString() + 'px';

			//画线
			var cartesians = this.DistancePoisCartesian.slice();
			cartesians.push(pos.ToCartesian());
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureDistanceEntityId + 'polyline0',
					polyline: {
						positions: cartesians,
						material: new Cesium.Color(0, 1, 0, 0.6),
						width: 2,
						// depthFailMaterial:this.Color.ToCesiumColor()
					},
				}),
				GlobalState.getInstance().viewer
			);
		},
		HandleSquareLeftClick: function (pos) {
			//this.SquarePois.push(pos);
			if (this.SquarePois.length > 0) {
				this.SquarePois[this.SquarePois.length - 1] = pos;
			} else {
				this.SquarePois.push(pos);
			}

			SetEntity(
				new Cesium.Entity({
					id: this.MeasureSquareEntityId + 'poi' + this.SquarePois.length.toString(),
					position: pos.ToCartesian(),
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				}),
				GlobalState.getInstance().viewer
			);
			this.SquareLeftClicked = true;
		},
		HandleSquareMouseMove: function (pos) {
			//设置点
			if (this.SquareLeftClicked) {
				this.SquarePois.push(pos);
				this.SquareLeftClicked = false;
			} else {
				this.SquarePois[this.SquarePois.length - 1] = pos;
			}
			//画点
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureSquareEntityId + 'poi' + this.SquarePois.length.toString(),
					position: pos.ToCartesian(),
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				}),
				GlobalState.getInstance().viewer
			);
			//画线
			var cartesians = this.SquarePoisCartesian.slice();
			cartesians.push(pos.ToCartesian());
			cartesians.push(this.SquarePois[0].ToCartesian());
			SetEntity(
				new Cesium.Entity({
					id: this.MeasureSquareEntityId + 'polyline0',
					polyline: {
						positions: cartesians,
						material: new Cesium.Color(0, 1, 0, 0.6),
						width: 2,
						// depthFailMaterial:this.Color.ToCesiumColor()
					},
				}),
				GlobalState.getInstance().viewer
			);

			if (this.SquarePois < 2) return; //三点才能组成面
			//设置polygon
			cartesians.splice(cartesians.length - 1, 1);
			SetEntity(
				{
					id: this.MeasureSquareEntityId + 'polygon',
					polygon: {
						hierarchy: new Cesium.PolygonHierarchy(cartesians),
						material: new Cesium.Color(1, 1, 0, 0.6),
						perPositionHeight: true, //该属性代表使用每个点的高程，如果不设置则会贴地
						// height:0,
						//heightReference:Cesium.HeightReference.RELATIVE_TO_GROUND
					},
				},
				GlobalState.getInstance().viewer
			);
			//计算面积
			//this.CurrentSquare=Coordinates.CoordinateWGS84.GetSquareFromPois(this.SquarePois).toFixed(2);
			this.CurrentSquare = Coordinates.CoordinateWGS84.GetSquareFromPois(this.SquarePois).toFixed(2);
			var posscreen = GetWindowPosFromWGS84(pos, GlobalState.getInstance().viewer);
			this.$refs.SquareDiv.style.left = (posscreen.x + 6).toString() + 'px';
			this.$refs.SquareDiv.style.top = (posscreen.y + 6).toString() + 'px';
		},

		HandleHeightSceneCameraMove: function () {
			if (this.HeightStartMeasure) return;

			//获取标签位置
			var labelpos0, labelpos1, labelpos2;
			labelpos0 = GetLerpWGS84(this.HeightPois[0], this.HeightPois[1], 0.5, GlobalState.getInstance().viewer);
			labelpos1 = GetLerpWGS84(this.HeightPois[0], this.HeightPois[2], 0.5, GlobalState.getInstance().viewer);
			labelpos2 = GetLerpWGS84(this.HeightPois[1], this.HeightPois[2], 0.5, GlobalState.getInstance().viewer);

			//设置标签位置
			var posscreen0 = GetWindowPosFromWGS84(labelpos0, GlobalState.getInstance().viewer);
			var posscreen1 = GetWindowPosFromWGS84(labelpos1, GlobalState.getInstance().viewer);
			var posscreen2 = GetWindowPosFromWGS84(labelpos2, GlobalState.getInstance().viewer);
			if (!posscreen0 || !posscreen1 || !posscreen2) return;
			this.$refs.HeightVerticalDiv.style.left = (posscreen2.x + 6).toString() + 'px';
			this.$refs.HeightVerticalDiv.style.top = (posscreen2.y + 6).toString() + 'px';
			this.$refs.HeightHorizonDiv.style.left = (posscreen1.x + 6).toString() + 'px';
			this.$refs.HeightHorizonDiv.style.top = (posscreen1.y + 6).toString() + 'px';
			this.$refs.HeightDiv.style.left = (posscreen0.x + 6).toString() + 'px';
			this.$refs.HeightDiv.style.top = (posscreen0.y + 6).toString() + 'px';
		},
		HandleDistanceSceneCameraMove: function () {
			if (this.DistanceStartMeasure) return;
			var posscreen = GetWindowPosFromWGS84(this.DistancePois[this.DistancePois.length - 1], GlobalState.getInstance().viewer);
			if (!posscreen) return;
			this.$refs.DistanceDiv.style.left = (posscreen.x + 6).toString() + 'px';
			this.$refs.DistanceDiv.style.top = (posscreen.y + 6).toString() + 'px';
		},
		HandleSquareSceneCameraMove: function () {
			if (this.SquareStartMeasure) return;
			var pos = this.SquarePois[this.SquarePois.length - 1];
			var posscreen = GetWindowPosFromWGS84(pos, GlobalState.getInstance().viewer);
			if (!posscreen) return;
			this.$refs.SquareDiv.style.left = (posscreen.x + 6).toString() + 'px';
			this.$refs.SquareDiv.style.top = (posscreen.y + 6).toString() + 'px';
		},

		clicksubmenu(subitem) {
			if (!subitem.auth) {
				msgUtil.messagePrompt('warning', '此功能只对VIP用户开放');
				return;
			}

			if (subitem.name === 'pick_geo_location') {
				if (this.subcurTool && this.subcurTool.name === subitem.name) {
					this.subcurTool = null;
				} else {
					this.subcurTool = subitem;
				}
				return;
			}

			this.subcurTool = subitem;
			if (typeof this[subitem.method] === 'function') {
				this[subitem.method]();
			}
		},
		clearanasubmenus() {
			GlobalState.getInstance().viewer.scene.postRender.removeEventListener(this.CesiumPostRenderLister);
			this.MeasureClear();
			this.subcurTool = null;
		},
	},
	watch: {},
};
</script>

<style scoped>
#SpaceMeasure .SubMainFrame {
	background: #122134cc;
	width: 3.4vh;
	height: 0;
	top: 11vh;
	right: 48.5vh;
	overflow: hidden;
}

#SpaceMeasure .SubMainFrame img {
	width: 2vh;
	height: 2vh;
	margin: 0.9vh 0.7vh;
	box-sizing: border-box;
	vertical-align: top;
}
#SpaceMeasure .SubMainFrame img:last-child {
	width: 1.2vh;
	height: 1.2vh;
	margin: 0.9vh 1.1vh;
}

#SpaceMeasure .showanimation {
	animation: showani 400ms linear;
	animation-fill-mode: forwards;
}
#SpaceMeasure .closeanimation {
	animation: closeani 400ms linear;
	animation-fill-mode: forwards;
}
@keyframes showani {
	0% {
		height: 0;
	}
	100% {
		height: 19vh;
	}
}
@keyframes closeani {
	0% {
		height: 19vh;
	}
	100% {
		height: 0;
	}
}
</style>
