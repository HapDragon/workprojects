import "./FlowLineMaterialProperty.js";
import LineImg from "./assets/line4.png";
import * as turf from "@turf/turf";
/**
 * @Author: dongnan
 * @Description: 漫游轨迹
 * @Date: 2023-08-18 09:24:14
 * @param {Cesium.Viewer} viewer
 * @param {Array} list 轨迹点([[x,y,z],[x,y,z]])
 * @param {Boolean} showModel 是否显示模型(false)
 * @param {String} modelUrl 模型地址
 * @param {Number} modelScale 模型缩放大小(1)
 * @param {Number} speed 速度km/h(30)
 * @param {Boolean} isCalculatePitch 是否计算俯仰角pitch(false)
 * @param {String} view 视角模式(track)
 * @param {Number} distance 视角距离(100)
 * @param {Boolean} showLine 是否显示路线(false)
 * @param {String} lineColor 线颜色(#28599f)
 * @param {Boolean} clampToGround 是否贴地(false)
 * @param {Function} complete 漫游终点的回调
 * @param {Function} update 漫游中的回调
 */
export default class RoamTrail {
	constructor(option) {
		if (!option.list || !option.viewer) return;
		this.viewer = option.viewer;
		this.complete = option.complete;
		this.update = option.update;
		this.showModel = option.showModel ?? false;
		this.modelScale = option.modelScale ?? 1;
		this.modelUrl = option.modelUrl;
		// 运动事件
		this.animateEvent = null;
		// 运动停止时间
		this.stopTime = null;
		// 位置差值
		this.positionInterpolation = new Cesium.SampledPositionProperty();
		// 旋转差值
		this.rotateInterpolation = new Cesium.SampledPositionProperty();
		// 运动路径数据 [[cx,cy,cz]]
		this.list = option.list;
		// 速度 km/h
		this.speed = option.speed ? option.speed * (1000 / 3600) : 8; //默认30km/h 8m/s
		// 开始位置
		this.startPosition = null;
		// 停止位置
		this.endPosition = null;
		// 停止旋转参数
		this.endRotation = null;
		// 节点时间
		this.partTimeList = [];
		// 当前旋转参数
		this.currentRotation = new Cesium.Cartesian3(0, 0, 0);
		// 是否计算俯仰角
		this.isCalculatePitch = option.isCalculatePitch;
		// 视角模式
		this.view = option.view ?? "none";
		// 视角距离
		this.distance = option.distance ? option.distance : 100;
		this.pitch = option.pitch ? option.pitch : 30;
		if (this.distance == 0) this.distance = 1;
		if (this.pitch == 0) this.pitch = 1;
		// 显示线
		this.showLine = option.showLine ?? false;
		// 线颜色
		this.lineColor = option.lineColor ?? "#28599f";
		// 贴地漫游
		this.clampToGround = option.clampToGround ?? false;
		this.init();
	}
	// 更改漫游状态
	changeOptions(obj) {
		if (Cesium.defined(obj.view)) this.view = obj.view;
		if (Cesium.defined(obj.distance)) {
			if (obj.distance == 0) {
				this.distance = 1;
			} else {
				this.distance = obj.distance;
			}
		}
		if (Cesium.defined(obj.pitch)) {
			if (obj.pitch == 0) {
				this.pitch = 1;
			} else {
				this.pitch = obj.pitch;
			}
		}
		if (Cesium.defined(obj.showModel)) this.showModel = obj.showModel;
	}
	// 更新相机
	animateCamera(position) {
		let viewer = this.viewer;
		// 更改模型位置
		if (this.showModel) {
			if (this.model) {
				this.model.show = true;
				if (this.clampToGround) {
					// let newPosition = viewer.scene.clampToHeight(position);
					// let testLon = this.cartesianToLonlat(position);
					// let lonLat = this.cartesianToLonlat(newPosition);
					// console.log(testLon, lonLat);
					// console.log(lonLat);
					this.model.modelMatrix = this.updateMaxtrix({
						cx: position.x,
						cy: position.y,
						cz: position.z,
						rx: this.currentRotation.x,
						ry: this.currentRotation.y,
						rz: this.currentRotation.z,
						scale: this.modelScale,
						type: "cartesian",
					});
				} else {
					this.model.modelMatrix = this.updateMaxtrix({
						cx: position.x,
						cy: position.y,
						cz: position.z,
						rx: this.currentRotation.x,
						ry: this.currentRotation.y,
						rz: this.currentRotation.z,
						scale: this.modelScale,
						type: "cartesian",
					});
				}
			}
		} else {
			if (this.model) {
				this.model.show = false;
			}
		}
		if (this.view == "none") {
			// 默认不处理
		} else if (this.view == "track") {
			// 视角跟随
			let heading = Cesium.Math.toRadians(0);
			let pitch = Cesium.Math.toRadians(-this.pitch);
			let range = this.distance;
			viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(heading, pitch, range));
			viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
		} else if (this.view == "first") {
			// 调整角度为第一人称，注意调整的角度
			let range = this.distance;
			let heading = Cesium.Math.toRadians(90 - (this.currentRotation.z % 360));
			let pitch = Cesium.Math.toRadians(this.currentRotation.y - this.pitch);
			// 动态改变模型视角
			viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(heading, pitch, range));
			viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
		} else if (this.view == "god") {
			// 调整角度为第三人称，注意调整的角度
			let range = this.distance;
			let heading = Cesium.Math.toRadians(90 - (this.currentRotation.z % 360));
			let pitch = Cesium.Math.toRadians(this.currentRotation.y - 89);
			// 动态改变模型视角
			viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(heading, pitch, range));
			viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
		} else if (this.view == "fire") {
			// 火点模式 看着火点
			if (FyConfig.firePosition) {
				let curentLonlat = this.cartesianToLonlat(position);
				let fireLonLat = this.cartesianToLonlat(FyConfig.firePosition);
				let heading = this.courseHeadingAngle(curentLonlat[0], curentLonlat[1], fireLonLat[0], fireLonLat[1]);
				let pitch = this.coursePitchAngle(
					curentLonlat[0],
					curentLonlat[1],
					curentLonlat[2],
					fireLonLat[0],
					fireLonLat[1],
					fireLonLat[2],
				);
				let range = this.getLineDistance(position, FyConfig.firePosition) + 100;
				viewer.camera.lookAt(
					FyConfig.firePosition,
					new Cesium.HeadingPitchRange(Cesium.Math.toRadians(heading), Cesium.Math.toRadians(pitch), range),
				);
				viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
			}
		}
	}
	// 初始化配置
	init() {
		let data = this.calculateTime(this.list.concat([]), this.speed);
		this.data = data;
		let startTime = Cesium.JulianDate.fromDate(new Date());
		this.startTime = startTime;
		let timeSum = 0;
		this.startPosition = data.positions[0];
		data.positions.some((item, index) => {
			this.positionInterpolation.addSample(Cesium.JulianDate.addSeconds(startTime, timeSum, new Cesium.JulianDate()), item);
			this.rotateInterpolation.addSample(
				Cesium.JulianDate.addSeconds(startTime, timeSum, new Cesium.JulianDate()),
				data.rotations[index],
			);
			this.partTimeList.push(Cesium.JulianDate.addSeconds(startTime, timeSum, new Cesium.JulianDate()));
			if (index < data.positions.length - 1) {
				timeSum += data.timeList[index];
			} else {
				this.endPosition = item;
				this.endRotation = data.rotations[index];
			}
		});
		// 初始化第一次旋转参数
		this.currentRotation = this.rotateInterpolation.getValue(startTime);
		// 计算运动停止时间
		this.stopTime = Cesium.JulianDate.addSeconds(startTime, timeSum, new Cesium.JulianDate());
		this.animateEvent = (scene, time) => {
			if (Cesium.JulianDate.compare(this.stopTime, time) > 0 && Cesium.JulianDate.compare(this.stopTime, time) <= 0.1) {
				if (this.showModel && this.model) {
					this.model.modelMatrix = this.updateMaxtrix({
						cx: this.endPosition.x,
						cy: this.endPosition.y,
						cz: this.endPosition.z,
						rx: this.currentRotation.x,
						ry: this.currentRotation.y,
						rz: this.currentRotation.z,
						scale: this.modelScale,
						type: "cartesian",
					});
				}
				if (typeof this.update == "function") {
					let obj = {};
					let lonLat = this.cartesianToLonlat(this.endPosition);
					obj.lon = lonLat[0];
					obj.lat = lonLat[1];
					obj.height = lonLat[2];
					obj.totalTime = this.data.totalTime;
					obj.totalLength = this.data.totalLength;
					obj.currentTime = obj.totalTime; //秒
					obj.currentLength = obj.totalLength; //m
					obj.process = (obj.currentLength / obj.totalLength) * 100;
					this.update(obj);
				}
				if (typeof this.complete == "function") this.complete(this);
				return;
			} else {
				let position = this.positionInterpolation.getValue(time);

				if (typeof position == "undefined") {
					return;
				}
				this.animateCamera(position);
				this.partTimeList.some((item) => {
					if (Cesium.JulianDate.compare(item, time) > 0 && Cesium.JulianDate.compare(item, time) <= 0.1) {
						let rotation = this.rotateInterpolation.getValue(time);
						this.currentRotation.x = rotation.x;
						this.currentRotation.y = rotation.y;
						this.currentRotation.z = rotation.z;
						return true;
					}
				});
				// 更新
				if (typeof this.update == "function") {
					let obj = {};
					let lonLat = this.cartesianToLonlat(position);
					obj.lon = lonLat[0];
					obj.lat = lonLat[1];
					obj.height = lonLat[2];
					obj.totalTime = this.data.totalTime;
					obj.totalLength = this.data.totalLength;
					let startDate = Cesium.JulianDate.toDate(this.startTime);
					let currentDate = Cesium.JulianDate.toDate(time);
					let currentTime = (currentDate - startDate) / 1000;
					obj.currentTime = Math.round(currentTime); //秒
					obj.currentLength = currentTime * this.speed; //m
					obj.process = (obj.currentLength / obj.totalLength) * 100;
					// 提前一段时间
					let preTime = Cesium.JulianDate.addSeconds(time, 2.6 / this.speed, new Cesium.JulianDate());
					let prePosition = this.positionInterpolation.getValue(preTime);
					if (prePosition) {
						let preLonlat = this.cartesianToLonlat(prePosition);
						obj.preLonlat = preLonlat;
					}
					this.update(obj);
				}
			}
		};
	}
	/**
	 * @Author: dongnan
	 * @Description: 开始运动
	 * @Date: 2022-02-11 15:24:19
	 * @param {*}
	 */
	start() {
		// 判断是否有模型
		if (this.showModel) {
			if (!this.modelUrl) {
				console.log("参数不足");
				return;
			}
			if (!this.model) {
				//模型
				console.log(this.modelUrl);
				this.model = this.viewer.scene.primitives.add(
					Cesium.Model.fromGltf({
						url: this.modelUrl,
						minimumPixelSize: 256,
						maximumScale: 1,
					}),
				);
				// 加载动画
				Promise.resolve(this.model.readyPromise).then(() => {
					this.model.activeAnimations.addAll({
						loop: Cesium.ModelAnimationLoop.REPEAT,
					});
				});
			} else {
				this.model.show = true;
			}
		}
		// 判断是否显示线
		if (this.showLine) {
			if (!this.basePath) {
				// 添加底线
				let lineMaterial;
				if (Cesium.defined(Cesium.FlowLineMaterialProperty)) {
					lineMaterial = new Cesium.FlowLineMaterialProperty({
						color: Cesium.Color.fromCssColorString(this.lineColor),
						image: LineImg,
						light: 2.0,
						speed: 20,
						repeatX: this.data.totalLength / 1000,
						repeatY: 1,
					});
				} else {
					lineMaterial = Cesium.Color.fromCssColorString(this.lineColor);
				}
				// 线段分段 看起来更美观
				// let newList = this.interpolationList({
				// 	list: this.list.concat([]),
				// 	space: 100,
				// });
				this.basePath = this.viewer.entities.add({
					polyline: {
						// positions: Cesium.Cartesian3.fromDegreesArrayHeights(newList),
						positions: this.data.positions,
						width: 20,
						material: lineMaterial,
						clampToGround: this.clampToGround,
					},
				});
			} else {
				this.basePath.show = true;
			}
		}
		// 打开加载动画配置
		this.viewer.clock.shouldAnimate = true;
		// 初始化第一次旋转参数
		this.currentRotation = this.rotateInterpolation.getValue(this.startTime);
		this.viewer.scene.preUpdate.addEventListener(this.animateEvent);
		this.viewer.clock.currentTime = this.startTime;
	}
	// 暂停
	pause() {
		this.viewer.clock.shouldAnimate = false;
	}
	// 继续
	continue() {
		this.viewer.clock.shouldAnimate = true;
	}
	// 隐藏
	hide() {
		// 移除事件
		this.viewer.scene.preUpdate.removeEventListener(this.animateEvent);
		// 隐藏所加载的要素
		if (this.model) this.model.show = false;
		if (this.basePath) this.basePath.show = false;
	}
	/**
	 * @Author: dongnan
	 * @Description: 移除
	 * @Date: 2022-02-11 16:36:55
	 * @param {*}
	 */
	remove() {
		// 移除事件
		this.viewer.scene.preUpdate.removeEventListener(this.animateEvent);
		// 移除所加载的要素
		if (this.model) this.viewer.scene.primitives.remove(this.model);
		if (this.basePath) this.viewer.entities.remove(this.basePath);
	}
	// 循环
	reload() {
		this.viewer.clock.currentTime = this.startTime.clone();
		this.currentRotation = this.rotateInterpolation.getValue(this.startTime);
	}
	/**
	 * @Author: dongnan
	 * @Description: 更新矩阵
	 * @Date: 2022-02-11 14:08:14
	 * @param {Object} params
	 * @param {Float} cx 模型中心X轴坐标（经度 单位：度）
	 * @param {Float} cy 模型中心Y轴坐标（纬度 单位：度）
	 * @param {Float} cz 模型中心Z轴坐标（高程 单位：米）
	 * @param {Float} rx X轴（经度）方向旋转角度（单位：度） roll
	 * @param {Float} ry Y轴（经度）方向旋转角度（单位：度） pitch
	 * @param {Float} rz Z轴（高程）方向旋转角度（单位：度） heading
	 * @param {Float} scale 缩放比例
	 * @param {String} type 参数类型 cartesian  degrees(默认)
	 */
	updateMaxtrix(params) {
		if (!Cesium.defined(params) && !Cesium.defined(params.cx) && !Cesium.defined(params.cy)) return;
		let m = new Cesium.Matrix4();
		// 初始位置
		if (params.type == "cartesian") {
			let position = new Cesium.Cartesian3(params.cx, params.cy, Cesium.defaultValue(params.cz, 0));
			m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
		} else {
			let position = Cesium.Cartesian3.fromDegrees(params.cx, params.cy, Cesium.defaultValue(params.cz, 0));
			m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
		}
		//旋转
		if (Cesium.defined(params.rx) || Cesium.defined(params.ry) || Cesium.defined(params.rz)) {
			let rotationX = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(Cesium.defaultValue(params.rx, 0)));
			let rotationY = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(Cesium.defaultValue(params.ry, 0)));
			let rotationZ = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(Cesium.defaultValue(params.rz, 0)));
			Cesium.Matrix4.multiplyByMatrix3(m, rotationX, m);
			Cesium.Matrix4.multiplyByMatrix3(m, rotationY, m);
			Cesium.Matrix4.multiplyByMatrix3(m, rotationZ, m);
		}
		// 缩放
		if (Cesium.defined(params.scale)) {
			let scale = Cesium.Matrix4.fromUniformScale(params.scale || 1.0);
			Cesium.Matrix4.multiply(m, scale, m);
		}
		// 返回矩阵
		return m;
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算匀速情况下 每段路程的时间
	 * @Date: 2021-11-13 19:18:30
	 * @param {*} list [[cx,cy,cz]]
	 * @param {*} speed 速度 m/s
	 */
	calculateTime(list, speed) {
		let positions = [];
		let rotations = [];
		let lengthList = [];
		let timeList = [];
		let totalLength = 0;
		let totalTime = 0;
		list.some((item, index) => {
			this.maxheight = item[2] > this.maxheight ? item[2] : this.maxheight;
			let position = Cesium.Cartesian3.fromDegrees(parseFloat(item[0]), parseFloat(item[1]), Cesium.defaultValue(item[2], 0));
			positions.push(position);
			if (index < list.length - 1) {
				// 计算偏转角
				let heading = this.courseHeadingAngle(
					parseFloat(item[0]),
					parseFloat(item[1]),
					parseFloat(list[index + 1][0]),
					parseFloat(list[index + 1][1]),
				);
				// 计算俯仰角
				let pitch = 0;
				if (this.isCalculatePitch) {
					pitch = this.coursePitchAngle(
						parseFloat(item[0]),
						parseFloat(item[1]),
						isNaN(item[2]) ? 0 : parseFloat(item[2]),
						parseFloat(list[index + 1][0]),
						parseFloat(list[index + 1][1]),
						isNaN(list[index + 1][2]) ? 0 : parseFloat(list[index + 1][2]),
					);
				}
				let rotation = new Cesium.Cartesian3(0, pitch, heading);
				rotations.push(rotation);
				// 计算路程
				let endPosition = Cesium.Cartesian3.fromDegrees(
					parseFloat(list[index + 1][0]),
					parseFloat(list[index + 1][1]),
					isNaN(list[index + 1][2]) ? 0 : parseFloat(list[index + 1][2]),
				);
				let length = this.getLineDistance(position, endPosition);
				lengthList.push(length);
				totalLength += length;
			} else {
				rotations = rotations.concat([rotations[index - 1]]);
			}
		});
		totalTime = Math.round(totalLength / speed);
		lengthList.some((item) => {
			let newTime = item / speed;
			timeList.push(newTime);
		});

		return {
			positions: positions,
			rotations: rotations,
			timeList: timeList,
			totalLength: totalLength,
			totalTime: totalTime,
		};
	}
	/**
	 * @Author: dongnan
	 * @Description: 三维坐标点插值
	 * @Date: 2022-08-25 17:28:04
	 * @param {Object} options
	 * @param {Array} list [[x,y,z],[x,y,z]]
	 * @param {Number} space 插值间距 m
	 * @return {Array} [x,y,z,x,y,z]
	 */
	interpolationList(options) {
		let list = options.list;
		let space = options.space;
		let heightGap = [];
		let length = list.length;
		let lines = [];
		list.some((item, index) => {
			if (index < length - 1) {
				let nextItem = list[index + 1];
				let height = nextItem[2] - item[2];
				heightGap.push(height);
				lines.push([
					[item[0], item[1]],
					[nextItem[0], nextItem[1]],
				]);
			}
		});
		// turf 插值线段
		let pointList = turfInterpolation(lines, space);
		let result = [];
		pointList.some((item, index) => {
			let len = item.length - 1;
			let totalHeight = heightGap[index];
			let height = totalHeight / len;
			item.some((temp, tempIndex) => {
				let obj = {};
				obj.x = temp[0];
				obj.y = temp[1];
				obj.height = list[index][2] + height * tempIndex;
				result.push(obj.x, obj.y, obj.height);
			});
		});
		return result;
		/**
		 * @Author: dongnan
		 * @Description: turf 插值经纬度
		 * @Date: 2022-08-25 17:57:31
		 * @param {Array} lines 线集合 [[[x,y],[x,y]],[[x,y],[x,y]]]
		 * @param {Number} space 插值间距
		 */
		function turfInterpolation(lines, space) {
			let pointList = [];
			lines.some((lineList, index) => {
				let line = turf.lineString(lineList);
				let chunk = turf.lineChunk(line, space / 1000, { units: "kilometers" });
				let codes = [];
				if (chunk.features.length > 0) {
					chunk.features.map((item) => {
						item.geometry.coordinates.map((d) => {
							codes.push(d);
						});
					});
				}
				pointList.push(codes);
			});
			return pointList;
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算两点之间Z轴旋转角度(heading)
	 * @Date: 2021-05-05 21:59:35
	 * @param {*} lng_a A点经度
	 * @param {*} lat_a A点纬度
	 * @param {*} lng_b B点经度
	 * @param {*} lat_b B点纬度
	 */
	courseHeadingAngle(lng_a, lat_a, lng_b, lat_b) {
		let localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(new Cesium.Cartesian3.fromDegrees(lng_a, lat_a));
		//求世界坐标到局部坐标的变换矩阵
		let worldToLocal_Matrix = Cesium.Matrix4.inverse(localToWorld_Matrix, new Cesium.Matrix4());
		//a点在局部坐标的位置，其实就是局部坐标原点
		let localPosition_A = Cesium.Matrix4.multiplyByPoint(
			worldToLocal_Matrix,
			new Cesium.Cartesian3.fromDegrees(lng_a, lat_a),
			new Cesium.Cartesian3(),
		);
		//B点在以A点为原点的局部的坐标位置
		let localPosition_B = Cesium.Matrix4.multiplyByPoint(
			worldToLocal_Matrix,
			new Cesium.Cartesian3.fromDegrees(lng_b, lat_b),
			new Cesium.Cartesian3(),
		);
		//弧度
		let angle = Math.atan2(localPosition_B.y - localPosition_A.y, localPosition_B.x - localPosition_A.x);
		//角度
		let theta = angle * (180 / Math.PI);
		if (theta < 180) {
			theta = theta + 360;
		}
		return theta;
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算两点之间Y轴旋转角度(pitch)
	 * @Date: 2021-05-05 21:59:45
	 * @param {*} lng_a A点经度
	 * @param {*} lat_a A点纬度
	 * @param {*} alt_a A点高度
	 * @param {*} lng_b B点经度
	 * @param {*} lat_b B点纬度
	 * @param {*} alt_b B点高度
	 */
	coursePitchAngle(lng_a, lat_a, alt_a, lng_b, lat_b, alt_b) {
		//以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
		let localToWorld_Matrix = Cesium.Transforms.eastNorthUpToFixedFrame(new Cesium.Cartesian3.fromDegrees(lng_a, lat_a));
		//求世界坐标到局部坐标的变换矩阵
		let worldToLocal_Matrix = Cesium.Matrix4.inverse(localToWorld_Matrix, new Cesium.Matrix4());
		//a点在局部坐标的位置，其实就是局部坐标原点
		let localPosition_A = Cesium.Matrix4.multiplyByPoint(
			worldToLocal_Matrix,
			new Cesium.Cartesian3.fromDegrees(lng_a, lat_a),
			new Cesium.Cartesian3(),
		);
		//B点在以A点为原点的局部的坐标位置
		let localPosition_B = Cesium.Matrix4.multiplyByPoint(
			worldToLocal_Matrix,
			new Cesium.Cartesian3.fromDegrees(lng_b, lat_b),
			new Cesium.Cartesian3(),
		);
		let distance = Math.sqrt(Math.pow(localPosition_B.x - localPosition_A.x, 2) + Math.pow(localPosition_B.y - localPosition_A.y, 2));
		let dz = alt_b - alt_a;
		let angle = 0;
		if (distance != 0) {
			angle = Math.tanh(dz / distance);
		}
		let theta = angle * (180 / Math.PI);
		return theta;
	}
	/**
	 * @Author: dongnan
	 * @Description: 获取俩点的距离 m
	 * @Date: 2021-01-14 11:35:27
	 * @param {*} startPoint
	 * @param {*} endPoint
	 */
	getLineDistance(startPoint, endPoint) {
		let startCartographic = Cesium.Cartographic.fromCartesian(startPoint);
		let endCartographic = Cesium.Cartographic.fromCartesian(endPoint);
		let geodesic = new Cesium.EllipsoidGeodesic();
		geodesic.setEndPoints(startCartographic, endCartographic);
		let surfaceDistance = geodesic.surfaceDistance;
		let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2));
		return lengthInMeters;
	}
	// 世界坐标转经纬度坐标
	cartesianToLonlat(cartesian) {
		let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
		let lon = Cesium.Math.toDegrees(cartographic.longitude);
		let lat = Cesium.Math.toDegrees(cartographic.latitude);
		let height = cartographic.height < 0 ? 0 : cartographic.height;
		return [lon, lat, height];
	}
}
