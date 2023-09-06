/**
 * Created by wqy
 * Date 2023/8/8 15:52
 * Description
 */
import coordinates from "@/views/Map/buss/Coordinates";
import colormodel from "@/utils/ColorModel";
import { GlobalState } from "@/common/GlobalState";
import Bus from "@/common/eventBus";
import { addResourceWellPop, removePop } from "@/utils/cesium/addPopup";
import { zoomTo } from "@/utils/cesium/CameraTool";
import situationapi from "@/api/situation.js";
import emitradioapi from "@/api/emitradio.js";
import { post } from "@/request/index.js";
import { ElLoading } from "element-plus";
import msgUtil from "@/utils/MessageUtil";

import { GetPickedRayPositionWGS84, SetEntity, RemoveEntityById, GetLerpWGS84, GetWindowPosFromWGS84 } from "@/views/Map/buss/MapHandler";

const power = 1e-6;
// const power=1;
const colorranknum = 200;
let prim = null;
let carModel = null;
// let pointsprim = null;
let onleftclickhander = null;

let resourcePopEvents = [];

export let fielddata = null;

export const entitypre = "interferetype";

export const querymodel = reactive({
	frequency: 800,
	power: 60,
	antennaHeight: 30,
	antennaGain: 30,
	x: null,
	y: null,
	z: null,
	model: 0,
	scene: 0,
	weatherType: 1,
});

export function getquerymodel() {
	return {
		frequency: querymodel.frequency,
		power: querymodel.power,
		antennaHeight: querymodel.antennaHeight,
		antennaGain: querymodel.antennaGain,
		x: querymodel.x,
		y: querymodel.y,
		model: querymodel.model === 0 ? (querymodel.scene === 0 ? 6 : 8) : querymodel.model,
		weatherType: querymodel.weatherType,
		interfereModel: querymodel.model === 0 ? (querymodel.scene === 0 ? 0 : 2) : querymodel.model,
	};
}

export function queryAnddrawSituation(zoomto = true) {
	const loadingInstance = ElLoading.service({
		fullscreen: true,
		lock: true,
		text: "正在加载，请稍侯...",
		background: "rgba(0, 0, 0, 0.7)",
	});

	post(situationapi.queryElectrolInfo, getquerymodel(), {}).then(
		(res) => {
			if (res.code != "0") {
				msgUtil.messagePrompt("error", res.msg);
				loadingInstance.close();
			}
			drawSituation(res.data, zoomto);
			loadingInstance.close();
		},
		(err) => {
			msgUtil.messagePrompt("error", "数据错误");
			loadingInstance.close();
		},
	);
}

function drawSituation(resdata, zoomto = true) {
	removeSituation();
	carModel = SetEntity(
		{
			id: entitypre,
			position: Cesium.Cartesian3.fromDegrees(querymodel.x, querymodel.y, querymodel.z),
			model: {
				uri: "/models/ganrao.glb",
				scale: 4,
			},
			point: {
				pixelSize: 10,
				color: Cesium.Color.YELLOW,
				// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
				disableDepthTestDistance: 0,
			},
		},
		GlobalState.getInstance().viewer,
	);
	carModel.show = situaltionshow;
	//从添加小车模型开始就加入左键单击是否选中的监听
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, onsceneleftclick);
	Bus.VM.$on(Bus.SignalType.AppMouseRightClick, onrightclick);

	fielddata = resdata;
	const viewer = GlobalState.getInstance().viewer;
	const columns = resdata.columns;
	const lines = resdata.lines;
	const minvalue = resdata.minFieldStrength * power;
	const maxvalue = resdata.maxFieldStrength * power;
	const dvalue = maxvalue - minvalue;
	const colormodels = colormodel.ColorModel.GetRGBRanks_FromBlueToRed(colorranknum);
	const colorpervalueadd = dvalue / colorranknum;
	const colorvaluesettigns = [];
	// const scope = this;
	// let lastselectedpointidx = -1;
	for (let i = colormodels.length - 1; i >= 0; i--) {
		colorvaluesettigns.push({
			red: colormodels[i].Red,
			green: colormodels[i].Green,
			blue: colormodels[i].Blue,
			value: minvalue + i * colorpervalueadd,
		});
	}
	let cartographiclist = resdata.points.map((item, index) => {
		return Cesium.Cartographic.fromDegrees(Number(item.x), Number(item.y));
	});

	const height = querymodel.scene === 1 && querymodel.model === 0 ? 0.1 + Number(querymodel.antennaHeight) : 0.1;

	function ongetterrainheight(updatedPositions) {
		let cartesianlist = resdata.points.map((item, index) => {
			// return  viewer.scene.clampToHeight(Cesium.Cartesian3.fromDegrees(Number(item.x),
			// 	Number(item.y)));

			return Cesium.Cartesian3.fromDegrees(
				Number(item.x),
				Number(item.y),
				// updatedPositions==null?height:height+updatedPositions[index].height  //考虑地形
				updatedPositions == null ? height : height, //不考虑地形
				// updatedPositions==null?Number(item.z):1.5+updatedPositions[index].height
				// Number(item.z) + Number(resdata.paths[index].fieldStrength || 0) * power + updatedPositions[index].height
				// 0
				// Number(item.z) + (resdata.paths[index].fieldStrength||0) * power + updatedPositions[index].height
			);
		});
		const positionarray = [];
		const colorarray = [];
		cartesianlist.forEach((item, index) => {
			positionarray.push(item.x);
			positionarray.push(item.y);
			positionarray.push(item.z);
			let findcolor = colorvaluesettigns.find((item) => item.value < Number(resdata.paths[index].fieldStrength || "0") * power);
			if (findcolor == null) {
				findcolor = colorvaluesettigns[colorvaluesettigns.length - 1];
			}
			colorarray.push(findcolor.red / 255);
			colorarray.push(findcolor.green / 255);
			colorarray.push(findcolor.blue / 255);
			// colorarray.push(alpha);
		});
		const positions = new Float64Array(positionarray);
		const colors = new Float32Array(colorarray);
		const indexarray = [];

		//按照列读取 从下往上 从左往右
		for (let i = lines - 1; i > 0; i--) {
			for (let j = 0; j < columns - 1; j++) {
				//上面一个三角形
				indexarray.push(j * lines + i);
				indexarray.push(j * lines + i - 1);
				indexarray.push((j + 1) * lines + i);
				//下面一个三角形
				indexarray.push((j + 1) * lines + i);
				indexarray.push(j * lines + i - 1);
				indexarray.push((j + 1) * lines + i - 1);
			}
		}

		const indexs = new Uint16Array(indexarray);
		const boundingsphere = Cesium.BoundingSphere.fromVertices(positions);
		var geometry = new Cesium.Geometry({
			attributes: {
				position: new Cesium.GeometryAttribute({
					componentDatatype: Cesium.ComponentDatatype.DOUBLE,
					componentsPerAttribute: 3,
					values: positions,
				}),
				color: new Cesium.GeometryAttribute({
					componentDatatype: Cesium.ComponentDatatype.FLOAT,
					// componentsPerAttribute: 4,//带透明度
					componentsPerAttribute: 3, //不带透明度
					values: colors,
				}),
			},
			indices: indexs,
			primitiveType: Cesium.PrimitiveType.TRIANGLES,
			// primitiveType: Cesium.PrimitiveType.LINES,
			boundingSphere: boundingsphere,
		});
		prim = viewer.scene.primitives.add(
			new Cesium.Primitive({
				geometryInstances: new Cesium.GeometryInstance({
					geometry: geometry,
				}),
				appearance: new Cesium.PerInstanceColorAppearance({
					flat: true,
					translucent: false,
				}),
				asynchronous: false,
				// allowPicking: false,
			}),
		);
		if (zoomto === true) {
			viewer.scene.camera.flyToBoundingSphere(boundingsphere);
		}
		prim.show = situaltionshow;

		onleftclickhander = function (movement) {
			removefieldpopup();
			let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
			if (!pos) return;
			let feature = viewer.scene.pick(movement.position);
			if (feature && feature.id && feature.id._id && feature.id._id.indexOf("electroMinPt_") >= 0) return; //交互点优先级高
			SetEntity(
				{
					id: entitypre + "propertypoi",
					position: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height),
					// billboard: {
					// 	// image: require("@/assets/images/cesium/point.png"),
					// 	image: '/img/common/point.png',
					// 	horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					// 	verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					// },
					point: {
						pixelSize: 10,
						color: Cesium.Color.YELLOW,
						// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
						disableDepthTestDistance: 0,
					},
				},
				viewer,
			);
			post(emitradioapi.queryradiowave, {
				start: { x: pos.longitude, y: pos.latitude },
				points: resdata.points,
			}).then((radiores) => {
				if (radiores.code == "0" && radiores.data != null && radiores.data.length > 0) {
					let index = radiores.data[0];
					//添加弹框
					resourcePopEvents.push(
						addResourceWellPop({
							contenthtml: `
<div style="width:80%;height:calc(100% - 1vh);margin:auto;margin-bottom:1vh;display: flex;flex-direction: column;
    justify-content: space-evenly;">
                <div class="rowitem"><span class="col">经度:</span><span class="col">${pos.longitude.toFixed(6)}</span></div>
				<div class="rowitem"><span class="col">纬度:</span><span class="col">${pos.latitude.toFixed(6)}</span></div>
				<div class="rowitem"><span class="col">场强:</span><span class="col">${
					resdata.paths[index].fieldStrength ? (Number(resdata.paths[index].fieldStrength) * power).toFixed(2) + " uV/m" : "空值"
				}</span></div>
				<div class="rowitem"><span class="col">时延:</span><span class="col">${
					resdata.paths[index].delay ? Number(resdata.paths[index].delay).toFixed(2) + " ns" : "空值"
				}</span></div>
</div>				
`,
							style: "width:24vh;height:24vh;",
							position: [pos.longitude, pos.latitude, pos.height],
							offset: [0, -10],
							title: "场强信息",
							onclosecallback: function () {
								RemoveEntityById(viewer, entitypre + "propertypoi");
							},
						}),
					);
					zoomTo(viewer, {
						center: [pos.longitude, pos.latitude],
						range: 500,
						padding: [50, 0, 0, 0],
						duration: 1,
					});
				}
			});
		};
		// Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, onleftclickhander);
		// debugger
		// const labels=viewer.scene.primitives.add(new Cesium.LabelCollection());
		// cartesianlist.forEach((item, index) => {
		// 	labels.add({
		// 		position : item,
		// 		text : index.toString()
		// 		// text : "dddd"
		// 	});
		// 	// points.add({
		// 	// 	outlineColor: Cesium.Color.TRANSPARENT,
		// 	// 	position: item,
		// 	// 	outlineWidth: 0.0,
		// 	// 	color: Cesium.Color.fromAlpha(Cesium.Color.WHITE, 0.01),
		// 	// });
		// });
	}

	if (viewer.terrainProvider.availability != null) {
		Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, cartographiclist).then(ongetterrainheight);
	} else {
		ongetterrainheight();
	}
}

export function removeSituation() {
	const viewer = GlobalState.getInstance().viewer;
	if (prim != undefined) {
		viewer.scene.primitives.remove(prim); //删除
		prim = undefined;
	}
	if (carModel) {
		viewer.entities.remove(carModel);
		carModel = null;
	}
	// if (pointsprim != null) {
	// 	viewer.scene.primitives.remove(pointsprim); //删除
	// 	pointsprim = undefined;
	// }
	if (onleftclickhander) {
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onleftclickhander);
		removefieldpopup();
	}
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, onsceneleftclick);

	RemoveEntityById(GlobalState.getInstance().viewer, entitypre);
	RemoveEntityById(GlobalState.getInstance().viewer, entitypre + "propertypoi");
	fielddata = null;
}
export function removefieldpopup() {
	removePop(resourcePopEvents);
	resourcePopEvents = [];
	RemoveEntityById(GlobalState.getInstance().viewer, entitypre + "propertypoi");
}

var situaltionshow = true;
export function setsituationmapshow(visible) {
	situaltionshow = visible;
	if (prim) {
		prim.show = visible;
	}
	if (carModel) {
		carModel.show = visible;
	}
}

//关于发射点小车模型的左键双击事件统一处理
//如果弹框打开，就将该事件暂时忽略，直到弹框关闭为止
let enableclickmodel = 1; //第一次点击是准备开始移动第二次点击才是移动新点，为-1时为不允许

function onsceneleftclick(movement) {
	const viewer = GlobalState.getInstance().viewer;
	let modelentity = viewer.entities.getById(entitypre);
	if (enableclickmodel == 1) {
		// originclickmodel=1;
		let feature = viewer.scene.pick(movement.position);
		if (feature == null) return;

		if (feature.id == null || feature.id.id != entitypre) return;

		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, { visible: true, text: "请在场景中左键双击设置新的发射点，右击结束" });

		modelentity.model.color = Cesium.Color.YELLOW;
		modelentity.model.scale = 4;
		enableclickmodel = 2;
		return;
	}
	if (enableclickmodel == 2) {
		let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
		if (!pos) return;
		querymodel.x = pos.longitude.toFixed(6);
		querymodel.y = pos.latitude.toFixed(6);
		querymodel.z = pos.height;
		modelentity.position = pos.ToCartesian();
		queryAnddrawSituation(false);
	}
}

function onrightclick() {
	const viewer = GlobalState.getInstance().viewer;
	let modelentity = viewer.entities.getById(entitypre);
	modelentity.model.color = Cesium.Color.WHITE;
	modelentity.model.scale = 2;
	Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, { visible: false, text: "" });
	enableclickmodel = 1;
	// Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onsceneleftclick);
	// RemoveEntityById(GlobalState.getInstance().viewer, entitypre);
}
