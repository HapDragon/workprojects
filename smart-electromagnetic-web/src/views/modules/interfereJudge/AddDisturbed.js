/**
 * Created by wqy
 * Date 2023/8/22 11:19
 * Description
 */
import {GlobalState} from "@/common/GlobalState";
import Bus from '@/common/eventBus';
import {addResourceWellPop, removePop} from "@/utils/cesium/addPopup";
import {querymodel} from './situationdraw.js';
import msgUtil from '@/utils/MessageUtil';
import {
	GetPickedRayPositionWGS84,
	SetEntity,
	RemoveEntityById,
	GetEntitysByContainId,
	RemoveEntitysByContainId,
	GetLerpWGS84,
	GetWindowPosFromWGS84
} from '@/views/Map/buss/MapHandler.js';
import situationapi from '@/api/situation.js'
import emitradio from '@/api/emitradio.js';
import {post} from "@/request/index.js";
import coordinates from '@/views/Map/buss/Coordinates'
import { ElLoading } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

const entitypre = "adddisturbedentitypre";
let updated=false;

export function inoutmodule(inorout) {
	//alert(inorout);
	//进还是出
	if (inorout === true) {
		if(querymodel.x==null||querymodel.y==null){
			msgUtil.messagePrompt('warning','请先添加干扰机');
			return;
		}
		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, {visible: true, text: '请在场景中左键单击设置受扰机位置，右击结束'});
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onsceneleftclick);
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onscenerightclick);

		Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, onsceneleftclick, 2);
		Bus.VM.$on(Bus.SignalType.Scene_Mouse_Right_Click, onscenerightclick);
	}
	else {
		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, {visible: false});
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onsceneleftclick);
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onscenerightclick);
	}
}


function onsceneleftclick(movement) {
	let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
	if (!pos) return;

	SetEntity(
		new Cesium.Entity({
			id: entitypre,
			position: pos.ToCartesian(),
			model: {
				uri: '/models/shourao.glb',
				scale: 0.4,
				color: Cesium.Color.WHITE
			},
		}),
		GlobalState.getInstance().viewer
	);
	updated=true;



	// msgUtil.messageBoxConfirm('是否手持定位设备？', '询问', '是', '否', function () {
	//
	// }, function () {
	// 	isdingwei = false;
	// 	onconfirm();
	// });
}

const radioColors = [new Cesium.Color(0.9922, 0.4745, 0.0157), new Cesium.Color(0, 0.8235, 1), new Cesium.Color(0.9686, 0.9686, 0.0745), new Cesium.Color(0.8392, 0.0157, 0.9882), new Cesium.Color(0.051, 1, 0.5451)];

function onscenerightclick() {
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onsceneleftclick);
	RemoveEntitysByContainId(entitypre + "jiaohubala", GlobalState.getInstance().viewer);
	if(updated===false) return;

	const entity=GlobalState.getInstance().viewer.entities.getById(entitypre);

	if(entity==null) return;

	let endpos=coordinates.CoordinateWGS84.fromCatesian(entity.position._value);


	ElMessageBox.prompt('请输入通讯灵敏度', '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
	})
		.then(({ value }) => {
			const propertyquery={
				frequency: querymodel.frequency,
				power: querymodel.power,
				antennaHeight: querymodel.antennaHeight,
				antennaGain: querymodel.antennaGain,
				unmannedVehicleX: querymodel.x,
				unmannedVehicleY: querymodel.y,
				x:endpos.longitude,
				y:endpos.latitude,
				model:0,//在行动支持模块里面，干扰站-无人车
				threshold:value,
				weatherType: querymodel.weatherType
			};


			const loadingInstance = ElLoading.service({ fullscreen: true,lock: true,
				text: '正在查询，请稍侯...',
				background: "rgba(0, 0, 0, 0.7)", })
			post(
				situationapi.queryInterferenceInfo,
				propertyquery,
			).then(async (res) => {
				loadingInstance.close();
				if (res.code == '0'&&res.data&&res.data.points&&res.data.points.length>0) {
					if(res.data.vehiclePeopleConnection=="1"){
						msgUtil.messagePrompt('success','联通');
					}
					else{
						msgUtil.messagePrompt('success','此处信号较弱已断开连接');
					}
					updated=false;
					let paths_points = res.data.points; // 后台返回的最短距离点
					let _startpt = { x: parseFloat(propertyquery.x), y: parseFloat(propertyquery.y), z: parseFloat(querymodel.z) }; // 起始点（发射车的坐标位置点）
					for (let i = 0; i < paths_points.length; i++) {
						let resultpt = []; // 用于保存整个电波射线的点
						resultpt.push(_startpt);
						let ptlines = paths_points[i];
						for (let j = 0; j < ptlines.length; j++) {
							resultpt.push({ x: parseFloat(ptlines[j].x), y: parseFloat(ptlines[j].y), z: parseFloat(ptlines[j].z) });
						}
						let _endpt = { x: endpos.longitude, y: endpos.latitude, z: endpos.height };
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

								SetEntity(
									new Cesium.Entity({
										id: entitypre + "jiaohubala" + Cesium.createGuid(),
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
								id: entitypre + "jiaohubala" + Cesium.createGuid(),
								polyline: {
									positions: cartesian3Arr,
									material: radioColors[i],
									width: 2,
									// clampToGround: true,
								},
							}),
							GlobalState.getInstance().viewer
						);

					}
				}
				else{
					msgUtil.messagePrompt('warning','无法获取数据');
				}
			}).catch(err=>{
				loadingInstance.close();
				msgUtil.messagePrompt('error','无法获取数据')
			}).catch(error=>{
				loadingInstance.close();
				msgUtil.messagePrompt('error','无法获取数据')
			});
		})
		.catch(() => {
			ElMessage({
				type: '提示',
				message: '未输入通讯灵敏度，查询取消',
			})
		})









	// post(emitradio.queryradiowave, {
	// 	start: {x: endpos.longitude, y: endpos.latitude},
	// 	points: fielddata.points,
	// }).then(async (res) => {
	// 	if (res.code == '0') {
	// 		let paths_points = fielddata.paths[res.data[0]].points; // 后台返回的最短距离点
	// 		let _startpt = {x: parseFloat(querymodel.x), y: parseFloat(querymodel.y), z: parseFloat(querymodel.z)}; // 起始点（发射车的坐标位置点）
	// 		for (let i = 0; i < paths_points.length; i++) {
	// 			let resultpt = []; // 用于保存整个电波射线的点
	// 			resultpt.push(_startpt);
	// 			let ptlines = paths_points[i];
	// 			for (let j = 0; j < ptlines.length; j++) {
	// 				resultpt.push({
	// 					x: parseFloat(ptlines[j].x),
	// 					y: parseFloat(ptlines[j].y),
	// 					z: parseFloat(ptlines[j].z)
	// 				});
	// 			}
	// 			let _endpt = {x: endpos.longitude, y: endpos.latitude, z: endpos.height};
	// 			resultpt.push(_endpt);
	// 			let updatedPts = null;
	// 			if (GlobalState.getInstance().viewer.terrainProvider.availability == undefined) {
	// 				updatedPts = resultpt;
	// 			} else {
	// 				updatedPts = await Cesium.sampleTerrainMostDetailed(GlobalState.getInstance().viewer.terrainProvider, resultpt);
	// 			}
	// 			let cartesian3Arr = [];
	// 			for (let k = 0; k < updatedPts.length; k++) {
	// 				cartesian3Arr.push(Cesium.Cartesian3.fromDegrees(updatedPts[k].x, updatedPts[k].y, updatedPts[k].z));
	// 				// 出去整个射线的首尾点
	// 				if (k > 0 && k < updatedPts.length - 1) {
	// 					SetEntity(
	// 						new Cesium.Entity({
	// 							id: entitypre + "jiaohubala" + Cesium.createGuid(),
	// 							position: cartesian3Arr[k],
	// 							point: {
	// 								color: new Cesium.Color(1, 0.48, 0, 1),
	// 								pixelSize: 10,
	// 								// disableDepthTestDistance: Number.POSITIVE_INFINITY,
	// 								// disableDepthTestDistance: 0,
	// 							},
	// 							properties: {
	// 								lon: updatedPts[k].x,
	// 								lat: updatedPts[k].y,
	// 								height: updatedPts[k].z,
	// 								type: updatedPts[k].pointType,
	// 							},
	// 						}),
	// 						GlobalState.getInstance().viewer
	// 					);
	// 				}
	// 			}
	// 			SetEntity(
	// 				new Cesium.Entity({
	// 					id: entitypre + "jiaohubala" + Cesium.createGuid(),
	// 					polyline: {
	// 						positions: cartesian3Arr,
	// 						material: radioColors[i],
	// 						width: 2,
	// 						// clampToGround: true,
	// 					},
	// 				}),
	// 				GlobalState.getInstance().viewer
	// 			);
	// 		}
	// 	}
	// });
}

export function RemoveAll() {
	Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, {visible: false});
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onsceneleftclick);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onscenerightclick);

	RemoveEntitysByContainId(entitypre, GlobalState.getInstance().viewer);


	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click,onrightclick);
	enableclickmodel=1;
	selectedpeoentity=null;
}

//系统一直有这个响应,不取消订阅
var enableclickmodel=1;//第一次点击是准备开始移动第二次点击才是移动新点
var selectedpeoentity=null;
Bus.VM.$on(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, onsceneleftdoubleclick);
function onsceneleftdoubleclick(movement) {
	const viewer = GlobalState.getInstance().viewer;
	let feature = viewer.scene.pick(movement.position);
	if(enableclickmodel==1) {
		if (feature == null) return;

		if(feature.id==null||feature.id.id==null||
			(feature.id.id.indexOf(entitypre)<0)
		) return;


		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP,{visible:true,text:'请在场景中左键双击设置新的受扰机位置,右击结束'});
		Bus.VM.$on(Bus.SignalType.Scene_Mouse_Right_Click,onrightclick);

		selectedpeoentity=feature.id;
		feature.id.model.color=Cesium.Color.ORANGE;
		feature.id.model.scale=1;
		enableclickmodel=2;
		return;
	}
	if(enableclickmodel==2){
		let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
		if (!pos) return;

		selectedpeoentity.position= pos.ToCartesian();
		selectedpeoentity.model.color=Cesium.Color.WHITE;
		selectedpeoentity.model.scale=0.4;
		updated=true;
	}

}

function onrightclick() {
	Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP,{visible:false});
	enableclickmodel=1;
	selectedpeoentity=null;
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click,onrightclick);
}
