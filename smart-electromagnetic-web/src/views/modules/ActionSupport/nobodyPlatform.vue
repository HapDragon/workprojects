<script setup>
	import { GlobalState } from "@/common/GlobalState";
	import { Plus } from "@element-plus/icons-vue";
	import Modal from "./Modal/index.vue";
	import DrawTool from "./utils/DrawTool";
	import RoamTrail from "./utils/RoamTrail";
	import { downloadText } from "./utils/download";
	import { querymodel, fielddata, queryAnddrawSituation, getquerymodel } from "./situationdraw_control.js";
	import {
		querymodel as querymodel2,
		fielddata as fielddata2,
		queryAnddrawSituation as queryAnddrawSituation2,
		getquerymodel as getquerymodel2,
	} from "./situationdraw_interfere.js";
	import { SetEntity, RemoveEntityById } from "@/views/Map/buss/MapHandler.js";
	import ControlStation from "./ControlStation.vue";
	import InterfereStation from "./InterfereStation.vue";
	import Bus from "@/common/eventBus";
	const { proxy } = getCurrentInstance();
	const platFormModal = ref(null);
	const routeModal = ref(null);
	const travelModal = ref(null);
	const updateModal = ref(null);
	const routeForm = reactive({});
	const routeFormRules = reactive({
		name: [{ required: true, message: "路线名称不能为空", trigger: "blur" }],
		model: [{ required: true, message: "模型不能为空", trigger: "blur" }],
		view: [{ required: true, message: "视角不能为空", trigger: "blur" }],
	});
	const travelForm = reactive({});
	const updateForm = reactive({});
	const modelDict = ref([
		{
			name: "无人机",
			configValue: 1,
		},
		{
			name: "车辆",
			configValue: 2,
		},
	]);
	const viewDict = ref([
		{
			name: "自由视角",
			configValue: "none",
		},
		{
			name: "跟随视角",
			configValue: "track",
		},
		{
			name: "驾驶舱视角",
			configValue: "first",
		},
	]);
	const routeList = ref([]);
	const fileList = ref([]);
	const controlVisible = ref(false);
	const interfereVisible = ref(false);
	let trail;
	let drawTool;
	let detectionInterval;
	let carModel;
	// 添加干扰站
	function showIntereModal() {
		interfereVisible.value = true;
	}
	// 关闭控制站
	function hideInterfereModal() {
		interfereVisible.value = false;
	}
	// 添加控制站
	function showControlModal() {
		controlVisible.value = true;
	}
	// 关闭控制站
	function hideControlModal() {
		controlVisible.value = false;
	}
	// 判断
	function checkInterfere() {
		if (travelForm.lon) {
			interferePromise(travelForm.lon, travelForm.lat, travelForm.rate, travelForm.range)
				.then((res) => {
					if (res.flag == false) {
						clearInterval(detectionInterval);
						trail.pause();
						updateForm.rate = travelForm.rate;
						updateForm.name = travelForm.name;
						updateModal.value.show();
					} else if (res.flag == true) {
						trail.continue();
						if (travelForm.preLonlat) {
							removeAllEntity();
							shootLine(
								travelForm.preLonlat[0],
								travelForm.preLonlat[1],
								travelForm.preLonlat[2],
								querymodel,
								res.controlData,
								"control",
							);
							shootLine(
								travelForm.preLonlat[0],
								travelForm.preLonlat[1],
								travelForm.preLonlat[2],
								querymodel2,
								res.interfereData,
								"interfere",
							);
						} else {
							removeAllEntity();
						}
					}
				})
				.catch((res) => {
					proxy.$modal.msgError(res);
				});
		}
	}
	// 开启循环
	function startInerval() {
		detectionInterval = setInterval(() => {
			checkInterfere();
		}, 5000);
	}
	// 确认更新频率
	function sureUpdate() {
		travelForm.rate = updateForm.rate;
		querymodel.frequency = updateForm.rate;
		queryAnddrawSituation();
		updateModal.value.hide();
		proxy.$modal.msgSuccess("正在更新...");
		checkInterfere();
		startInerval();
	}
	// 取消更新频率
	function cancelUpdate() {
		if (trail) {
			trail.continue();
		}
		checkInterfere();
		startInerval();
	}
	// 判断是否干扰
	function interferePromise(x, y, rate, range) {
		return new Promise((resolve, reject) => {
			let query1 = getquerymodel();
			let query2 = getquerymodel2();
			let p1 = proxy.$post(config.baseserverUrl + "/electro/queryInterferenceInfo", {
				frequency: query1.frequency,
				power: query1.power,
				antennaHeight: query1.antennaHeight,
				antennaGain: query1.antennaGain,
				x: query1.x,
				y: query1.y,
				model: query1.interfereModel,
				weatherType: query1.weatherType,
				unmannedVehicleX: x,
				unmannedVehicleY: y,
				unmannedVehicleFrequency: rate,
				threshold: range,
			});
			let p2 = proxy.$post(config.baseserverUrl + "/electro/queryInterferenceInfo", {
				frequency: query2.frequency,
				power: query2.power,
				antennaHeight: query2.antennaHeight,
				antennaGain: query2.antennaGain,
				x: query2.x,
				y: query2.y,
				model: query2.interfereModel,
				weatherType: query2.weatherType,
				unmannedVehicleX: x,
				unmannedVehicleY: y,
				unmannedVehicleFrequency: rate,
				threshold: range,
			});
			Promise.all([p1, p2]).then((res) => {
				let obj1 = res[0];
				let obj2 = res[1];
				if (obj1 && obj2 && obj1.data && obj2.data) {
					let obj = {};
					if (obj2.data.isSameFrequency == "0") {
						obj.flag = false;
						resolve(obj);
					}
					if (obj2.data.isSameFrequency == "1") {
						if (!obj1.data.interferenceIntensity) {
							reject("控制机的干扰强度为null");
						}
						if (!obj2.data.interferenceIntensity) {
							reject("干扰机的干扰强度为null");
						}
						if (parseFloat(obj1.data.interferenceIntensity) - parseFloat(obj2.data.interferenceIntensity) > 8) {
							obj.flag = false;
							resolve(obj);
						} else {
							obj.flag = true;
							obj.controlData = obj1.data;
							obj.interfereData = obj2.data;
							resolve(obj);
						}
					}
					reject("干扰机的是否同频参数为null");
				}
			});
		});
	}
	// 发射电波射线
	async function shootLine(lon, lat, height, stationPoint, dataSource, type) {
		const radioColors = [
			new Cesium.Color(0.9922, 0.4745, 0.0157),
			new Cesium.Color(0, 0.8235, 1),
			new Cesium.Color(0.9686, 0.9686, 0.0745),
			new Cesium.Color(0.8392, 0.0157, 0.9882),
			new Cesium.Color(0.051, 1, 0.5451),
		];
		let paths_points = dataSource.points; // 后台返回的最短距离点
		let _startpt = { x: parseFloat(stationPoint.x), y: parseFloat(stationPoint.y), z: parseFloat(stationPoint.z) };
		for (let i = 0; i < paths_points.length; i++) {
			let resultpt = []; // 用于保存整个电波射线的点
			resultpt.push(_startpt);
			let ptlines = paths_points[i];
			for (let j = 0; j < ptlines.length; j++) {
				resultpt.push({ x: parseFloat(ptlines[j].x), y: parseFloat(ptlines[j].y), z: parseFloat(ptlines[j].z) });
			}
			let _endpt = { x: lon, y: lat, z: height };
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
					let idtext = "electroMinPt_" + type + (i + 1) + "_" + (k + 1);
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
						GlobalState.getInstance().viewer,
					);
				}
			}
			SetEntity(
				new Cesium.Entity({
					id: "electroRay_" + type + (i + 1),
					polyline: {
						positions: cartesian3Arr,
						material: radioColors[i],
						width: 2,
						// clampToGround: true,
					},
				}),
				GlobalState.getInstance().viewer,
			);
		}
	}
	// 开始检测
	function beginDetection() {
		if (!fielddata || !fielddata.points) {
			removeAllEntity();
			proxy.$modal
				.confirm("当前无控制站数据,是否继续飞行？")
				.then(function () {
					if (trail) {
						trail.start();
						travelModal.value.show();
						routeModal.value.hide();
					}
				})
				.catch(() => {
					routeModal.value.hide();
				});
			return;
		}
		if (!fielddata2 || !fielddata2.points) {
			removeAllEntity();
			proxy.$modal
				.confirm("当前干扰站数据,是否继续飞行？")
				.then(function () {
					if (trail) {
						trail.start();
						travelModal.value.show();
						routeModal.value.hide();
					}
				})
				.catch(() => {
					routeModal.value.hide();
				});
			return;
		}
		// 有发射机 开始检测
		if (trail) {
			trail.start();
			travelModal.value.show();
			routeModal.value.hide();
		}
		setTimeout(() => {
			checkInterfere();
		}, 500);
		startInerval();
	}
	// 关闭监测
	function endDetection() {
		if (detectionInterval) {
			clearInterval(detectionInterval);
			detectionInterval = null;
			removeAllEntity();
		}
	}
	// 添加路线
	function addRoute() {
		let viewer = GlobalState.getInstance().viewer;
		if (!drawTool) {
			drawTool = new DrawTool({
				viewer: viewer,
			});
		} else {
			drawTool.clear();
		}
		drawTool.drawLine((data) => {
			routeForm.list = data;
			// 填充默认参数
			routeForm.mode = "add";
			routeForm.name = "路线" + new Date().getTime();
			routeForm.model = 1;
			routeForm.view = "track";
			routeForm.distance = 100;
			routeForm.speed = 50;
			routeForm.clampGround = false;
			routeForm.showLine = true;
			routeForm.height = 1;
			routeForm.pitch = 30;
			routeForm.loop = true;
			routeForm.rate = 802;
			// routeForm.range = 202366;
			routeForm.range = 666666;
			routeModal.value.show();
		});
	}
	// 编辑路线
	function editTravel(route) {
		routeForm.mode = "edit";
		routeForm.id = route.id;
		routeForm.name = route.name;
		routeForm.model = route.model;
		routeForm.view = route.view;
		routeForm.distance = route.distance;
		routeForm.speed = route.speed;
		routeForm.clampGround = route.clampGround;
		routeForm.showLine = route.showLine;
		routeForm.heightMode = route.heightMode;
		routeForm.height = route.height;
		routeForm.list = route.list;
		routeForm.pitch = route.pitch;
		routeForm.loop = route.loop;
		routeForm.rate = route.rate;
		routeForm.range = route.range;
		routeModal.value.show();
	}
	// 开始漫游
	function startTravel(route) {
		if (route) {
			let list = [];
			// 不贴地
			if (!route.clampGround) {
				if (route.heightMode) {
					// 绝对高度
					let height = route.height;
					route.list.some((item) => {
						list.push([item[0], item[1], height]);
					});
				} else {
					// 相对高度
					let height = route.height;
					route.list.some((item) => {
						list.push([item[0], item[1], item[2] + height]);
					});
				}
			} else {
				list = route.list.concat([]);
			}
			if (trail) trail.remove();
			let modelScale = 10;
			let modelUrl = new URL("./assets/plane.glb", import.meta.url).href;
			if (route.model == 1) {
				modelUrl = new URL("./assets/plane.glb", import.meta.url).href;
				modelScale = 10;
			} else if (route.model == 2) {
				modelUrl = new URL("./assets/car.glb", import.meta.url).href;
				modelScale = 6;
			}
			let viewer = GlobalState.getInstance().viewer;
			trail = new RoamTrail({
				viewer: viewer,
				list: list,
				showModel: true,
				modelUrl: modelUrl,
				modelScale: modelScale,
				showLine: route.showLine,
				clampToGround: route.clampGround,
				view: route.view,
				speed: route.speed,
				distance: route.distance,
				pitch: route.pitch,
				complete: () => {
					if (route.loop) {
						trail.reload();
						travelForm.process = 0;
					}
				},
				update: (obj) => {
					travelForm.lon = obj.lon.toFixed(6);
					travelForm.lat = obj.lat.toFixed(6);
					travelForm.height = obj.height.toFixed(2);
					travelForm.totalLength = obj.totalLength.toFixed(2);
					travelForm.currentLength = obj.currentLength.toFixed(2);
					travelForm.totalTime = obj.totalTime;
					travelForm.currentTime = obj.currentTime;
					travelForm.process = Math.floor(obj.process);
					travelForm.preLonlat = obj.preLonlat;
				},
			});
			travelForm.name = route.name;
			travelForm.view = route.view;
			travelForm.distance = route.distance;
			travelForm.pitch = route.pitch;
			travelForm.speed = route.speed;
			travelForm.rate = route.rate;
			travelForm.range = route.range;
			beginDetection();
		} else {
			saveRoute().then(() => {
				let list = [];
				// 不贴地
				if (!routeForm.clampGround) {
					if (routeForm.heightMode) {
						// 绝对高度
						let height = routeForm.height;
						routeForm.list.some((item) => {
							list.push([item[0], item[1], height]);
						});
					} else {
						// 相对高度
						let height = routeForm.height;
						routeForm.list.some((item) => {
							list.push([item[0], item[1], item[2] + height]);
						});
					}
				} else {
					list = routeForm.list.concat([]);
				}
				if (trail) trail.remove();
				let modelScale = 10;
				let modelUrl = new URL("./assets/plane.glb", import.meta.url).href;
				if (routeForm.model == 1) {
					modelUrl = new URL("./assets/plane.glb", import.meta.url).href;
					modelScale = 10;
				} else if (routeForm.model == 2) {
					modelUrl = new URL("./assets/car.glb", import.meta.url).href;
					modelScale = 6;
				}
				let viewer = GlobalState.getInstance().viewer;
				trail = new RoamTrail({
					viewer: viewer,
					list: list,
					showModel: true,
					modelUrl: modelUrl,
					modelScale: modelScale,
					showLine: routeForm.showLine,
					clampToGround: routeForm.clampGround,
					view: routeForm.view,
					speed: routeForm.speed,
					distance: routeForm.distance,
					complete: () => {
						if (routeForm.loop) {
							trail.reload();
						}
					},
					update: (obj) => {
						travelForm.lon = obj.lon.toFixed(6);
						travelForm.lat = obj.lat.toFixed(6);
						travelForm.height = obj.height.toFixed(2);
						travelForm.totalLength = obj.totalLength.toFixed(2);
						travelForm.currentLength = obj.currentLength.toFixed(2);
						travelForm.totalTime = obj.totalTime;
						travelForm.currentTime = obj.currentTime;
						travelForm.process = Math.floor(obj.process);
						travelForm.preLonlat = obj.preLonlat;
					},
				});
				travelForm.name = routeForm.name;
				travelForm.view = routeForm.view;
				travelForm.distance = routeForm.distance;
				travelForm.pitch = routeForm.pitch;
				travelForm.speed = routeForm.speed;
				travelForm.rate = routeForm.rate;
				travelForm.range = routeForm.range;
				beginDetection();
			});
		}
	}
	// 停止漫游
	function stopTravel() {
		travelModal.value.hide();
	}
	// 改变漫游状态
	function changeTravel(val, type) {
		if (trail) {
			if (type == "hideModel") {
				trail.changeOptions({
					showModel: !val,
				});
			} else {
				let obj = {};
				obj[type] = val;
				trail.changeOptions(obj);
			}
		}
	}
	// 导入
	function importRoute(file, files) {
		let reg = /.json$/;
		let res = reg.test(file.name);
		if (res) {
			var reader = new FileReader();
			reader.onload = function () {
				if (reader.result) {
					let jsonObj = JSON.parse(reader.result);
					if (jsonObj.type && jsonObj.type == "RouteTravel") {
						routeList.value = [];
						routeList.value = routeList.value.concat(jsonObj.list);
						proxy.$modal.msgSuccess("导入成功!");
					} else {
						proxy.$modal.msgWarning("请上传指定格式的json文件!");
					}
				}
			};
			reader.readAsText(file.raw, "UTF-8");
		} else {
			proxy.$modal.msgWarning("请上传指定格式的json文件!");
		}
		// 文件置空
		fileList.value = [];
	}
	// 导出
	function exportRoute() {
		if (routeList.value.length > 0) {
			let obj = {
				list: [],
				type: "RouteTravel",
			};
			obj.list = routeList.value;
			downloadText("routes.json", JSON.stringify(obj));
		} else {
			proxy.$modal.msgWarning("暂无数据可导出!");
		}
	}
	// 更新路线
	function updateRoute() {
		proxy.$refs.routeFormRef.validate((valid) => {
			if (valid) {
				routeList.value.some((obj) => {
					if (obj.id == routeForm.id) {
						obj.name = routeForm.name;
						obj.model = routeForm.model;
						obj.view = routeForm.view;
						obj.distance = routeForm.distance;
						obj.speed = routeForm.speed;
						obj.clampGround = routeForm.clampGround;
						obj.showLine = routeForm.showLine;
						obj.heightMode = routeForm.heightMode;
						obj.height = routeForm.height;
						obj.list = routeForm.list;
						obj.pitch = routeForm.pitch;
						obj.loop = routeForm.loop;
					}
				});
				proxy.$modal.msgSuccess("路线更新成功!");
				routeModal.value.hide();
			}
		});
	}
	// 保存路线
	function saveRoute() {
		return new Promise((resolve) => {
			proxy.$refs.routeFormRef.validate((valid) => {
				if (valid) {
					let obj = {};
					obj.id = randomString(32);
					obj.name = routeForm.name;
					obj.model = routeForm.model;
					obj.view = routeForm.view;
					obj.distance = routeForm.distance;
					obj.speed = routeForm.speed;
					obj.clampGround = routeForm.clampGround;
					obj.showLine = routeForm.showLine;
					obj.heightMode = routeForm.heightMode;
					obj.height = routeForm.height;
					obj.list = routeForm.list;
					obj.pitch = routeForm.pitch;
					obj.loop = routeForm.loop;
					obj.rate = routeForm.rate;
					obj.range = routeForm.range;
					routeList.value.push(obj);
					resolve(obj);
					// proxy.$modal.msgSuccess("路线保存成功!");
				}
			});
		});
	}
	// 删除路线
	function deleteRoute(route) {
		proxy.$modal
			.confirm('是否确认删除名称为"' + route.name + '"的路线?')
			.then(function () {
				let del = [];
				routeList.value.some((item) => {
					if (item.id == route.id) {
						del.push(item);
						return true;
					}
				});
				for (let temp of del) {
					let i = routeList.value.indexOf(temp);
					routeList.value.splice(i, 1);
				}
				proxy.$modal.msgSuccess("删除成功!");
			})
			.catch(() => {});
	}
	// 取消新增路线
	function cancelRoute() {
		routeModal.value.hide();
	}
	// 无人平台关闭
	function platClose() {
		routeModal.value.hide();
		travelModal.value.hide();
		// Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, noneLeftClick);
		controlVisible.value = false;
		interfereVisible.value = false;
		if (drawTool) {
			drawTool.clear();
			drawTool = null;
		}
		// removeExtraData();
	}
	// 无人平台开启
	function platOpen() {
		// Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, noneLeftClick, 8);
		// addExtraData();
	}
	function addExtraData() {
		// 添加车
		let viewer = GlobalState.getInstance().viewer;
		const position = Cesium.Cartesian3.fromDegrees(118.8169493, 32.145198, 0);
		let modelPosition = viewer.scene.clampToHeight(position);
		// let pointLonlat = cartesianToLonlat(modelPosition);
		// let pointPos = Cesium.Cartesian3.fromDegrees(pointLonlat[0], pointLonlat[1], pointLonlat[2] + 5);
		const orientation = Cesium.Transforms.headingPitchRollQuaternion(
			modelPosition,
			new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-45), 0, 0),
		);
		carModel = viewer.entities.add({
			position: modelPosition,
			orientation: orientation,
			model: {
				uri: "/models/car.glb",
				minimumPixelSize: 128,
				maximumScale: 2,
				scale: 2,
				// lightColor: new Cesium.Cartesian3(10, 10, 10),
			},
		});
		// 添加射线
		const radioColors = [
			new Cesium.Color(0.9922, 0.4745, 0.0157),
			new Cesium.Color(0, 0.8235, 1),
			new Cesium.Color(0.9686, 0.9686, 0.0745),
			new Cesium.Color(0.8392, 0.0157, 0.9882),
			new Cesium.Color(0.051, 1, 0.5451),
		];
		// 射线1：118.816947 32.1446538 2, 118.8163715,32.144901 1.5
		// 射线2：118.816947 32.1446538 2, 118.8169457 32.1451737 1, 118.8163715,32.144901 1.5
		// 射线3：118.816947 32.1446538 2, 118.8169269 32.1451827 1, 118.8163715,32.144901 1.5
		// 射线4：118.816947 32.1446538 2, 118.8174838 32.1453968 3.95, 118.8163715,32.144901 1.5
		// 射线5：118.816947 32.1446538 2, 118.8174051 32.1454418 3.95, 118.8163715,32.144901 1.5
		let startHeight = 9.5;
		let midHeight = 14;
		let endHeight = 9.5;
		addLine(
			viewer,
			Cesium.Cartesian3.fromDegrees(118.816947, 32.1446538, 2 + startHeight),
			null,
			Cesium.Cartesian3.fromDegrees(118.8163715, 32.144901, 1.5 + endHeight),
			0,
			radioColors[0],
		);
		addLine(
			viewer,
			Cesium.Cartesian3.fromDegrees(118.816947, 32.1446538, 2 + startHeight),
			Cesium.Cartesian3.fromDegrees(118.8169457, 32.1451737, 1 + midHeight),
			Cesium.Cartesian3.fromDegrees(118.8163715, 32.144901, 1.5 + endHeight),
			1,
			radioColors[1],
		);
		addLine(
			viewer,
			Cesium.Cartesian3.fromDegrees(118.816947, 32.1446538, 2 + startHeight),
			Cesium.Cartesian3.fromDegrees(118.8169269, 32.1451827, 1 + midHeight),
			Cesium.Cartesian3.fromDegrees(118.8163715, 32.144901, 1.5 + endHeight),
			2,
			radioColors[2],
		);
		addLine(
			viewer,
			Cesium.Cartesian3.fromDegrees(118.816947, 32.1446538, 2 + startHeight),
			Cesium.Cartesian3.fromDegrees(118.8174838, 32.1453968, 3.95 + midHeight),
			Cesium.Cartesian3.fromDegrees(118.8163715, 32.144901, 1.5 + endHeight),
			3,
			radioColors[3],
		);
		addLine(
			viewer,
			Cesium.Cartesian3.fromDegrees(118.816947, 32.1446538, 2 + startHeight),
			Cesium.Cartesian3.fromDegrees(118.8174051, 32.1454418, 3.95 + midHeight),
			Cesium.Cartesian3.fromDegrees(118.8163715, 32.144901, 1.5 + endHeight),
			4,
			radioColors[4],
		);
	}
	function removeExtraData() {
		// 移除车
		if (carModel) {
			let viewer = GlobalState.getInstance().viewer;
			viewer.entities.remove(carModel);
			carModel = null;
		}
		// 移除射线
		removeLine();
	}
	function makeChange() {
		RemoveEntityById(GlobalState.getInstance().viewer, "controltype");
	}
	function addLine(viewer, start, mid, end, index, color) {
		if (mid) {
			// 添加转折点
			SetEntity(
				new Cesium.Entity({
					id: "platForm_point" + index,
					position: mid,
					point: {
						color: new Cesium.Color(1, 0.48, 0, 1),
						pixelSize: 10,
						// disableDepthTestDistance: Number.POSITIVE_INFINITY,
						// disableDepthTestDistance: 0,
					},
				}),
				viewer,
			);
			SetEntity(
				new Cesium.Entity({
					id: "platForm_line1" + index,
					polyline: {
						positions: [start, mid],
						material: color,
						width: 2,
						// clampToGround: true,
					},
				}),
				viewer,
			);
			SetEntity(
				new Cesium.Entity({
					id: "platForm_line2" + index,
					polyline: {
						positions: [end, mid],
						material: color,
						width: 2,
						// clampToGround: true,
					},
				}),
				viewer,
			);
		} else {
			SetEntity(
				new Cesium.Entity({
					id: "platForm_linetotal" + index,
					polyline: {
						positions: [start, end],
						material: color,
						width: 2,
						// clampToGround: true,
					},
				}),
				viewer,
			);
			SetEntity(
				new Cesium.Entity({
					id: "platForm_start" + index,
					position: start,
					billboard: {
						image: new URL("./assets/start.svg", import.meta.url).href,
						scale: 0.3,
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
						horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					},
				}),
				viewer,
			);
			SetEntity(
				new Cesium.Entity({
					id: "platForm_end" + index,
					position: end,
					billboard: {
						image: new URL("./assets/end.svg", import.meta.url).href,
						scale: 0.3,
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
						horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					},
				}),
				viewer,
			);
			// const position = Cesium.Cartesian3.fromDegrees(118.8169493, 32.145198, 0);
			// let modelPosition = viewer.scene.clampToHeight(position);
			const orientation = Cesium.Transforms.headingPitchRollQuaternion(
				start,
				new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(-45), 0, 0),
			);
			SetEntity(
				new Cesium.Entity({
					id: "platForm_model",
					position: start,
					orientation: orientation,
					model: {
						uri: "/models/vehicle.glb",
						minimumPixelSize: 128,
						maximumScale: 2,
						scale: 2,
						// lightColor: new Cesium.Cartesian3(10, 10, 10),
					},
				}),
				viewer,
			);
		}
	}
	function removeLine() {
		let electroEntityIds = [];
		let electroRays = ["platForm_"];
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
	}
	// 路径编辑关闭
	function routeClose() {
		if (drawTool) {
			drawTool.clear();
			drawTool = null;
		}
	}
	// 漫游路径关闭
	function travelClose() {
		if (trail) {
			trail.remove();
			trail = null;
		}
		endDetection();
		updateModal.value.hide();
	}
	// 路径编辑开启
	function routeOpen() {
		// 重置表单
		if (proxy.$refs.routeFormRef) proxy.$refs.routeFormRef.resetFields();
	}
	// 漫游路径
	function travelOpen() {
		// 重置表单
		if (proxy.$refs.travelFormRef) proxy.$refs.travelFormRef.resetFields();
	}
	// 更新频率开启
	function updateOpen() {
		// 重置表单
		if (proxy.$refs.updateFormRef) proxy.$refs.updateFormRef.resetFields();
	}
	/**
	 * @Author: dongnan
	 * @Description: 随机生成id
	 * @Date: 2020-12-24 20:31:51
	 * @param {Int} len id长度
	 */
	function randomString(len) {
		len = len || 12;
		let $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
		let maxPos = $chars.length;
		let pwd = "";
		for (let i = 0; i < len; i++) {
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return pwd;
	}
	// 无意义的点击
	function noneLeftClick(movement) {}
	// 初始化
	function init() {
		platFormModal.value.show();
	}
	// 离开
	function leave() {
		platFormModal.value.hide();
	}
	// 笛卡尔转经纬度
	function cartesianToLonlat(cartesian) {
		let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
		let lon = Cesium.Math.toDegrees(cartographic.longitude);
		let lat = Cesium.Math.toDegrees(cartographic.latitude);
		let height = cartographic.height < 0 ? 0 : cartographic.height;
		return [lon, lat, height];
	}
	defineExpose({
		init,
		leave,
	});
</script>
<script>
	import { GetEntitysByContainId } from "@/views/Map/buss/MapHandler.js";
	// 删除所有的绘制图形
	export function removeAllEntity() {
		let electroEntityIds = ["electroEndPoint"];
		let electroRays = ["electroRay_", "electroMinPt_"];
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
	}
</script>
<template>
	<div class="NobodyPlatform">
		<!-- 无人平台 -->
		<modal
			ref="platFormModal"
			class="platFormModal"
			:draggable="true"
			title="无人平台干扰判断"
			width="36vh"
			left="1vh"
			top="12vh"
			:footer="false"
			@close="platClose"
			@open="platOpen"
		>
			<template v-slot:container>
				<div class="tool">
					<el-button type="primary" @click="showControlModal">添加控制站</el-button>
					<el-button type="primary" @click="showIntereModal">添加干扰站</el-button>
					<el-button type="primary" @click="addRoute">新增路线</el-button>
					<!-- <el-button type="primary" @click="makeChange">测试</el-button> -->
					<el-upload
						ref="uploadRef"
						action=""
						:limit="1"
						class="uploadDemo"
						:auto-upload="false"
						:show-file-list="false"
						:file-list="fileList"
						:on-change="importRoute"
						accept=".json"
					>
						<template #trigger>
							<img src="./assets/import.svg" alt="" title="导入" />
							<!-- <el-button type="primary">导入</el-button> -->
						</template>
					</el-upload>
					<!-- <el-button type="primary" @click="exportRoute">导出</el-button> -->
					<img src="./assets/export.svg" @click="exportRoute" alt="" title="导出" />
				</div>
				<ul>
					<li><span class="name">名称</span><span class="action">操作</span></li>
					<li v-for="item in routeList" :key="item.id">
						<span class="name">{{ item.name }}</span>
						<span class="action">
							<img src="./assets/travel.svg" alt="漫游" title="漫游" @click="startTravel(item)" />
							<img src="./assets/edit.svg" alt="编辑" title="编辑" @click="editTravel(item)" />
							<img src="./assets/delete.svg" alt="删除" title="删除" @click="deleteRoute(item)" />
						</span>
					</li>
				</ul>
			</template>
		</modal>
		<!-- 路劲编辑 -->
		<modal
			ref="routeModal"
			class="routeModal"
			:draggable="true"
			title="路径编辑"
			left="41vh"
			top="12vh"
			width="35vh"
			:footer="true"
			@close="routeClose"
			@open="routeOpen"
		>
			<template v-slot:container>
				<div class="container">
					<el-form :model="routeForm" ref="routeFormRef" :inline="true" label-width="100px" :rules="routeFormRules">
						<el-form-item label="名称:" prop="name">
							<el-input v-model="routeForm.name" placeholder="请输入路线名称" />
						</el-form-item>
						<el-form-item label="模型:" prop="model">
							<el-select
								v-model="routeForm.model"
								placeholder="请选择漫游模型"
								clearable
								popper-class="SelectListSelectPopper"
							>
								<el-option v-for="dict in modelDict" :key="dict.name" :label="dict.name" :value="dict.configValue" />
							</el-select>
						</el-form-item>
						<el-form-item label="视角:" prop="view">
							<el-select
								v-model="routeForm.view"
								placeholder="请选择漫游视角"
								clearable
								popper-class="SelectListSelectPopper"
							>
								<el-option v-for="dict in viewDict" :key="dict.name" :label="dict.name" :value="dict.configValue" />
							</el-select>
						</el-form-item>
						<el-form-item label="俯仰角:" prop="pitch" v-if="routeForm.view && routeForm.view != 'none'">
							<el-slider
								v-model="routeForm.pitch"
								show-input
								:show-input-controls="false"
								:min="0"
								:max="90"
								:debounce="100"
								size="small"
							/>
						</el-form-item>
						<el-form-item label="视角距离:" prop="distance" v-if="routeForm.view && routeForm.view != 'none'">
							<el-input-number v-model="routeForm.distance" controls-position="right" size="small" /> &nbsp;m
						</el-form-item>
						<el-form-item label="速度:" prop="speed">
							<el-input-number v-model="routeForm.speed" controls-position="right" size="small" :min="0" /> &nbsp;km/h
						</el-form-item>
						<el-form-item label="通信频率:" prop="rate">
							<el-input-number v-model="routeForm.rate" controls-position="right" size="small" :min="0" /> &nbsp;MHz
						</el-form-item>
						<el-form-item label="干扰阈值:" prop="range">
							<el-input-number v-model="routeForm.range" controls-position="right" size="small" :min="0" /> &nbsp;vu/m
						</el-form-item>

						<el-form-item label="显示路线:" prop="showLine">
							<el-switch v-model="routeForm.showLine" style="--el-switch-on-color: #0785bb" />
						</el-form-item>
						<el-form-item label="是否循环:" prop="loop">
							<el-switch v-model="routeForm.loop" style="--el-switch-on-color: #0785bb" />
						</el-form-item>
						<el-form-item label="是否贴地:" prop="clampGround">
							<el-switch v-model="routeForm.clampGround" style="--el-switch-on-color: #0785bb" />
						</el-form-item>
						<el-form-item label="高度选择:" prop="heightMode" v-if="!routeForm.clampGround">
							<el-switch
								v-model="routeForm.heightMode"
								active-text="绝对"
								inactive-text="相对"
								style="--el-switch-on-color: #0785bb"
							/>
						</el-form-item>
						<el-form-item label="绝对高度:" prop="height" v-if="routeForm.heightMode && !routeForm.clampGround">
							<el-input-number v-model="routeForm.height" :min="0" controls-position="right" size="small" /> &nbsp;m
						</el-form-item>
						<el-form-item label="相对高度:" prop="height" v-if="!routeForm.heightMode && !routeForm.clampGround">
							<el-input-number v-model="routeForm.height" :min="0" controls-position="right" size="small" />&nbsp;m
						</el-form-item>
					</el-form>
				</div>
			</template>
			<template v-slot:footer>
				<el-button type="primary" @click="(val) => startTravel()" v-if="routeForm.mode == 'add'">开始漫游</el-button>
				<el-button type="primary" @click="(val) => updateRoute()" v-if="routeForm.mode == 'edit'">保存更改</el-button>
				<el-button type="primary" @click="cancelRoute">取消</el-button>
			</template>
		</modal>
		<!-- 漫游路线 -->
		<modal
			ref="travelModal"
			class="travelModal"
			:draggable="true"
			title="漫游路线"
			left="41vh"
			top="12vh"
			width="38vh"
			:footer="false"
			@close="travelClose"
			@open="travelOpen"
		>
			<template v-slot:container>
				<div class="container">
					<el-form :model="travelForm" ref="travelFormRef" :inline="true" label-width="100px">
						<el-form-item>
							<el-button type="primary" @click="stopTravel">停止漫游</el-button>
						</el-form-item>
						<el-form-item label="名称:" prop="name">
							<span>{{ travelForm.name }}</span>
						</el-form-item>
						<el-form-item label="是否隐藏模型:" prop="hideModel">
							<el-switch
								v-model="travelForm.hideModel"
								@change="(val) => changeTravel(val, 'hideModel')"
								style="--el-switch-on-color: #0785bb"
							/>
						</el-form-item>
						<el-form-item label="视角:" prop="view">
							<el-select
								v-model="travelForm.view"
								placeholder="请选择漫游视角"
								clearable
								popper-class="SelectListSelectPopper"
								@change="(val) => changeTravel(val, 'view')"
							>
								<el-option v-for="dict in viewDict" :key="dict.name" :label="dict.name" :value="dict.configValue" />
							</el-select>
						</el-form-item>
						<el-form-item label="俯仰角:" prop="pitch" v-if="travelForm.view && travelForm.view != 'none'">
							<el-slider
								v-model="travelForm.pitch"
								show-input
								:show-input-controls="false"
								:min="0"
								:max="90"
								:debounce="100"
								size="small"
								@input="(val) => changeTravel(val, 'pitch')"
							/>
						</el-form-item>
						<el-form-item label="视角距离:" prop="distance" v-if="travelForm.view && travelForm.view != 'none'">
							<el-input-number
								v-model="travelForm.distance"
								controls-position="right"
								@change="(val) => changeTravel(val, 'distance')"
								size="small"
							/>
							&nbsp;m
						</el-form-item>
						<el-form-item label="总长度:" prop="totalLength">
							<span>{{ travelForm.totalLength }} &nbsp;m</span>
						</el-form-item>
						<el-form-item label="已漫游长度:" prop="currentLength">
							<span>{{ travelForm.currentLength }} &nbsp;m</span>
						</el-form-item>
						<el-form-item label="总时长:" prop="totalTime">
							<span>{{ travelForm.totalTime }} &nbsp;秒</span>
						</el-form-item>
						<el-form-item label="已漫游时长:" prop="currentTime">
							<span>{{ travelForm.currentTime }} &nbsp;秒</span>
						</el-form-item>
						<el-form-item label="速度:" prop="speed">
							<span>{{ travelForm.speed }} &nbspkm/h</span>
						</el-form-item>
						<el-form-item label="经度:" prop="lon">
							<span>{{ travelForm.lon }}</span>
						</el-form-item>
						<el-form-item label="纬度:" prop="lat">
							<span>{{ travelForm.lat }}</span>
						</el-form-item>
						<el-form-item label="高度:" prop="height">
							<span>{{ travelForm.height }}&nbsp;m</span>
						</el-form-item>
						<!-- 进度条 -->
						<el-progress :percentage="travelForm.process" :stroke-width="8" />
					</el-form>
				</div>
			</template>
		</modal>
		<!-- 更新频率 -->
		<modal
			ref="updateModal"
			class="updateModal"
			:draggable="true"
			title="更新频率"
			top="12vh"
			width="38vh"
			@open="updateOpen"
			@sure="sureUpdate"
			@cancel="cancelUpdate"
			:footer="true"
		>
			<template v-slot:container>
				<div class="container">
					<el-form :model="updateForm" ref="updateFormRef" :inline="true" label-width="100px">
						<el-form-item label="名称:" prop="name">
							{{ updateForm.name }}
						</el-form-item>
						<!-- <el-form-item label="干扰强度:" prop="power">
							{{ updateForm.power }}
						</el-form-item> -->
						<el-form-item label="通信频率:" prop="rate">
							<el-input-number v-model="updateForm.rate" controls-position="right" size="small" :min="0" /> &nbsp;MHz
						</el-form-item>
					</el-form>
				</div>
			</template>
		</modal>
		<!-- 添加控制站 -->
		<ControlStation v-if="controlVisible" @close="hideControlModal" title="添加控制站" left="1vh" top="36vh"></ControlStation>
		<!-- 添加干扰站 -->
		<InterfereStation v-if="interfereVisible" @close="hideInterfereModal" title="添加干扰站" left="1vh" top="36vh"></InterfereStation>
	</div>
</template>
<style lang="less">
	.platFormModal {
		.tool {
			margin-top: 1vh;
			text-align: center;
			.el-button {
				cursor: pointer;
				background: #0785bb;
				border: none;
				border-radius: 0.3vh;
				padding: 1vh 1.5vh;
				& + .el-button {
					// margin-left: 5vh;
				}
				&:hover {
					background: #3ea6ff;
				}
			}
			img {
				width: 2vh;
				top: 0.9vh;
				position: relative;
				cursor: pointer;
				margin-left: 0.5vh;
			}
			.uploadDemo {
				display: inline-block;
				.el-upload {
					display: inline-block;
					margin: 0px 1vh;
					padding: 0px;
				}
			}
		}
		ul {
			list-style: none;
			padding: 0 3vh;
			margin: 0;
			li {
				padding-top: 1vh;
				border-bottom: 1px solid #ddd;
				.name {
					width: 60%;
					display: inline-block;
					text-align: left;
				}
				.action {
					width: 40%;
					display: inline-block;
					text-align: right;
					img {
						width: 2vh;
						margin: 0.3vh;
						cursor: pointer;
					}
				}
				&:first-child {
					span {
						text-align: center;
					}
					border-bottom: none;
				}
			}
		}
	}
	.routeModal,
	.travelModal,
	.updateModal {
		.container {
			.el-form {
				.el-form-item {
					color: #fff;
					margin-right: 0px;
					width: 100%;
					margin-bottom: 1vh;
					font-family: puhui_Regular_55;
					.el-form-item__label {
						color: #fff;
					}
					.el-form-item__content {
						.el-input__inner {
							color: #fff;
							background: transparent;
							box-shadow: 0 0 0 1px #fff inset;
						}
						.el-switch__label {
							color: #fff;
							&.is-active {
								color: var(--el-color-primary);
							}
						}
						.el-input-number__increase,
						.el-input-number__decrease {
							background: transparent;
							i {
								color: #fff;
							}
						}
						.el-slider__input {
							width: 5vh;
						}
						.el-slider__runway.show-input {
							margin-right: 1vh;
						}
						.el-slider__bar {
							background: #0785bb;
						}
						.el-slider__button {
							width: 1.5vh;
							height: 1.5vh;
							border-color: #0785bb;
						}
					}
				}
				.noBorder {
					.el-input__inner {
						box-shadow: none !important;
					}
				}
			}
		}
	}
	.routeModal {
		.container {
			width: 28vh;
			margin: 10px auto 0 auto;
		}
	}
	.travelModal {
		.container {
			width: 30vh;
			margin: 10px auto 0 auto;
			.el-form-item {
				margin-bottom: 0.7vh !important;
			}
			.el-button {
				cursor: pointer;
				background: #0785bb;
				border: none;
				border-radius: 0.3vh;
				padding: 1vh 2vh;
				& + .el-button {
					// margin-left: 5vh;
				}
				&:hover {
					background: #3ea6ff;
				}
			}
			.el-progress__text {
				color: #fff;
			}
		}
	}
	.SelectListSelectPopper {
		background: #19678a;
		.el-select-dropdown__item {
			background: transparent;
			color: #fff;
			&.selected {
				color: #35dae0;
			}
			&.hover {
				color: #35dae06f;
			}
		}
	}
</style>
<style lang="less" scoped>
	.NobodyPlatform {
	}
</style>
