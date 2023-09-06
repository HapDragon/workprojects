import lineImg from "/img/mainview/Patrol/line1.png";
// import lineImg from "/img/mainview/Patrol/arrow.png";
import { bbox as turfBBox, lineString as turfLineString } from "@turf/turf";
export default class PatrolLine {
	constructor(viewer, data, lineSpeed) {
		addMaterials();
		this.viewer = viewer;
		this.data = {
			marks: [
				// height:相机高度(单位米) flytime:相机两个标注点飞行时间(单位秒)
				{ lng: 116.80129268415902, lat: 28.191738885233345, height: 1000, flytime: 5 },
				{ lng: 116.85409005113507, lat: 28.34318618998801, height: 1000, flytime: 5 },
				{ lng: 116.99011141295814, lat: 28.282437250312654, height: 1000, flytime: 5 },
				{ lng: 117.02319849678719, lat: 28.14030187130724, height: 1000, flytime: 5 },
				{ lng: 116.85740120910812, lat: 28.076993748058094, height: 1000, flytime: 5 },
			],
			marksIndex: 1,
			pitchValue: -20,
			changeCameraTime: 5,
			flytime: 5,
			Exection: {},
			isRight: true, //顺时针
		};
		if (data) {
			this.data.marks = data;
		}
		this.lineSpeed = lineSpeed ?? 3;
	}
	// 添加线
	addLine() {
		let list = [];
		let list2 = [];
		let totalLength = 0;
		this.data.marks.some((item, index) => {
			list.push(item.lng, item.lat, 0);
			list2.push([item.lng, item.lat]);
			if (index < this.data.marks.length - 1) {
				let nextPoint = this.data.marks[index + 1];
				let distance = getLineDistance(
					Cesium.Cartesian3.fromDegrees(item.lng, item.lat, item.height),
					Cesium.Cartesian3.fromDegrees(nextPoint.lng, nextPoint.lat, nextPoint.height),
				);
				totalLength += distance;
			}
		});
		this.linePrimitive = this.viewer.scene.primitives.add(
			new Cesium.GroundPolylinePrimitive({
				geometryInstances: new Cesium.GeometryInstance({
					geometry: new Cesium.GroundPolylineGeometry({
						positions: Cesium.Cartesian3.fromDegreesArrayHeights(list),
						width: 14,
					}),
				}),
				// appearance: new Cesium.PolylineMaterialAppearance({
				// 	material: Cesium.Material.fromType("PatrolLine2", {
				// 		image: lineImg,
				// 		color: Cesium.Color.fromCssColorString("#859b0b"),
				// 		gapColor: Cesium.Color.TRANSPARENT,
				// 		speed: 20,
				// 		dashPattern: 255.0,
				// 		dashLength: 16.0,
				// 		light: 3.0,
				// 	}),
				// }),
				appearance: new Cesium.PolylineMaterialAppearance({
					material: Cesium.Material.fromType("PatrolLine", {
						color: Cesium.Color.fromCssColorString("#859b0b"),
						image: lineImg,
						light: 6.0,
						speed: this.lineSpeed,
						repeatX: totalLength / 1000,
						repeatY: 1,
					}),
				}),
			}),
		);
		zoomToList(this.viewer, list2);
	}
	// 移除线
	removeLine() {
		if (this.linePrimitive) {
			this.viewer.scene.primitives.remove(this.linePrimitive);
		}
	}
	// 开始飞行
	start() {
		if (this.data.marks.length < 2) {
			let obj = this.data.marks[0];
			this.zoomTo(this.viewer, {
				center: [obj.lng, obj.lat],
				range: obj.height,
				duration: obj.flytime,
			});
			return;
		}
		this.addLine();
		this.viewer.clock.shouldAnimate = true;
		if (Object.keys(this.data.Exection).length > 0) {
			this.exit();
		}
		this.flyExtent();
	}
	// 退出飞行
	exit() {
		const { pitchValue, marks } = this.data;
		// props.viewer.clock.shouldAnimate = true;
		this.viewer.clock.onTick.removeEventListener(this.data.Exection);
		// 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
		const pitch = Cesium.Math.toRadians(pitchValue);
		const marksIndex = 1;
		let preIndex = marksIndex - 1;
		//计算俯仰角
		let heading = this.bearing(marks[preIndex].lat, marks[preIndex].lng, marks[marksIndex].lat, marks[marksIndex].lng);
		heading = Cesium.Math.toRadians(heading);
		const endPosition = Cesium.Cartesian3.fromDegrees(marks[0].lng, marks[0].lat, marks[0].height);
		this.viewer.scene.camera.setView({
			destination: endPosition,
			orientation: {
				heading: heading,
				pitch: pitch,
			},
		});
		if (this.linePrimitive) {
			this.viewer.scene.primitives.remove(this.linePrimitive);
		}
	}
	flyExtent() {
		const { marks, marksIndex, pitchValue } = this.data;
		const viewer = this.viewer;
		// 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
		const pitch = Cesium.Math.toRadians(pitchValue);
		this.setExtentTime(marks[marksIndex].flytime);
		let self = this;
		self.data.Exection = function TimeExecution() {
			let preIndex = marksIndex - 1;
			if (marksIndex == 0) {
				preIndex = marks.length - 1;
			}
			//计算俯仰角
			let heading = self.bearing(marks[preIndex].lat, marks[preIndex].lng, marks[marksIndex].lat, marks[marksIndex].lng);
			heading = Cesium.Math.toRadians(heading);
			// 当前已经过去的时间，单位s
			const delTime = Cesium.JulianDate.secondsDifference(viewer.clock.currentTime, viewer.clock.startTime);
			const originLat = marksIndex == 0 ? marks[marks.length - 1].lat : marks[marksIndex - 1].lat;
			const originLng = marksIndex == 0 ? marks[marks.length - 1].lng : marks[marksIndex - 1].lng;
			const endPosition = Cesium.Cartesian3.fromDegrees(
				originLng + ((marks[marksIndex].lng - originLng) / marks[marksIndex].flytime) * delTime,
				originLat + ((marks[marksIndex].lat - originLat) / marks[marksIndex].flytime) * delTime,
				marks[marksIndex].height,
			);
			viewer.scene.camera.setView({
				destination: endPosition,
				orientation: {
					heading: heading,
					pitch: pitch,
				},
			});
			if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
				viewer.clock.onTick.removeEventListener(self.data.Exection);
				if (marksIndex == self.data.marks.length - 1) {
					if (self.linePrimitive) {
						viewer.scene.primitives.remove(self.linePrimitive);
					}
				} else {
					//有个转向的功能
					self.changeCameraHeading();
				}
			}
		};
		viewer.clock.onTick.addEventListener(self.data.Exection);
	}
	bearing(startLat, startLng, destLat, destLng) {
		startLat = this.toRadians(startLat);
		startLng = this.toRadians(startLng);
		destLat = this.toRadians(destLat);
		destLng = this.toRadians(destLng);

		let y = Math.sin(destLng - startLng) * Math.cos(destLat);
		let x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
		let brng = Math.atan2(y, x);
		let brngDgr = this.toDegrees(brng);
		return (brngDgr + 360) % 360;
	}
	toRadians(degrees) {
		return (degrees * Math.PI) / 180;
	}
	toDegrees(radians) {
		return (radians * 180) / Math.PI;
	}
	toLonlat(cartesian) {
		let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
		let lon = Cesium.Math.toDegrees(cartographic.longitude);
		let lat = Cesium.Math.toDegrees(cartographic.latitude);
		return [lon, lat];
	}
	// 相机原地定点转向
	changeCameraHeading() {
		const { marks, pitchValue, changeCameraTime } = this.data;
		const viewer = this.viewer;
		let { marksIndex } = this.data;

		let nextIndex = marksIndex + 1;
		if (marksIndex == marks.length - 1) {
			nextIndex = 0;
		}
		// 计算两点之间的方向
		const heading = this.bearing(marks[marksIndex].lat, marks[marksIndex].lng, marks[nextIndex].lat, marks[nextIndex].lng);
		// 相机看点的角度，如果大于0那么则是从地底往上看，所以要为负值
		const pitch = Cesium.Math.toRadians(pitchValue);
		// 给定飞行一周所需时间，比如10s, 那么每秒转动度数
		let cameraHeading = Cesium.Math.toDegrees(viewer.camera.heading);
		let headingGap = heading - cameraHeading;
		// console.log("cameraHeading:" + cameraHeading + ",heading:" + heading);
		// console.log(headingGap);
		// 320度到40度 (特殊处理)
		if (cameraHeading > 180 && heading < 180) {
			headingGap = heading - cameraHeading + 360;
		}
		// 当角度差大于180度时 逆时针旋转
		if (headingGap > 180) {
			headingGap -= 360;
			this.data.isRight = false;
		} else {
			if (headingGap < -90) {
			}
			this.data.isRight = true;
		}
		const angle = headingGap / changeCameraTime;
		// 时间间隔2秒钟
		this.setExtentTime(changeCameraTime);
		// 相机的当前heading
		const initialHeading = viewer.camera.heading;
		let self = this;
		this.data.Exection = function TimeExecution() {
			// 当前已经过去的时间，单位s
			const delTime = Cesium.JulianDate.secondsDifference(viewer.clock.currentTime, viewer.clock.startTime);
			let currentHeading = Cesium.Math.toRadians(delTime * angle) + initialHeading;
			if (!self.data.isRight && initialHeading <= 0) {
				currentHeading = Math.PI * 2 - Cesium.Math.toRadians(delTime * angle);
			}
			viewer.scene.camera.setView({
				orientation: {
					heading: currentHeading,
					pitch: pitch,
				},
			});
			if (Cesium.JulianDate.compare(viewer.clock.currentTime, viewer.clock.stopTime) >= 0) {
				viewer.clock.onTick.removeEventListener(self.data.Exection);
				self.data.marksIndex = ++self.data.marksIndex >= marks.length ? 0 : self.data.marksIndex;
				if (self.data.marksIndex != 0) {
					self.flyExtent();
				} else {
					viewer.clock.onTick.removeEventListener(self.data.Exection);
				}
			}
		};
		viewer.clock.onTick.addEventListener(self.data.Exection);
	}
	setExtentTime(time) {
		const viewer = this.viewer;
		const startTime = Cesium.JulianDate.fromDate(new Date());
		const stopTime = Cesium.JulianDate.addSeconds(startTime, time, new Cesium.JulianDate());
		viewer.clock.startTime = startTime.clone(); // 开始时间
		viewer.clock.stopTime = stopTime.clone(); // 结速时间
		viewer.clock.currentTime = startTime.clone(); // 当前时间
		viewer.clock.clockRange = Cesium.ClockRange.CLAMPED; // 行为方式-达到终止时间后停止
		viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK; // 时钟设置为当前系统时间; 忽略所有其他设置。
	}
	zoomTo(viewer, options) {
		if (!Cesium.defined(options.center)) return;
		let center = options.center;
		let duration = Cesium.defaultValue(options.duration, 0);
		let heading = Cesium.defaultValue(options.heading, 0);
		let pitch = Cesium.defaultValue(options.pitch, -45);
		let range = Cesium.defaultValue(options.range, 1000);
		if (Cesium.defined(options.padding)) {
			let topOffset = Cesium.defaultValue(meterToDegree(options.padding[0]), 0);
			let rightOffset = Cesium.defaultValue(meterToDegree(options.padding[1]), 0);
			let bottomOffset = Cesium.defaultValue(meterToDegree(options.padding[2]), 0);
			let leftOffset = Cesium.defaultValue(meterToDegree(options.padding[3]), 0);
			center[0] = center[0] + rightOffset;
			center[0] = center[0] - leftOffset;
			center[1] = center[1] + topOffset;
			center[1] = center[1] - bottomOffset;
		}
		viewer.camera.flyToBoundingSphere(
			new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(parseFloat(center[0]), parseFloat(center[1])), 0),
			{
				duration: duration,
				offset: new Cesium.HeadingPitchRange(Cesium.Math.toRadians(heading), Cesium.Math.toRadians(pitch), range),
				complete: options.callback,
			},
		);
	}
}
function addMaterials() {
	let source = `
	uniform sampler2D image;
	uniform vec4 color;
	uniform float speed;
	uniform float repeatX;
	uniform float repeatY;
	uniform float light;
	czm_material czm_getMaterial(czm_materialInput materialInput){
		czm_material material = czm_getDefaultMaterial(materialInput);
		float t = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
		vec2 st = materialInput.st;
		st.s = st.s*repeatX;
		st.t = st.t*repeatY;
		st = fract(st);
		vec4 colorImage = texture2D(image, vec2(fract(st.s - t), st.t));
		material.alpha = colorImage.a * color.a;
		material.diffuse = color.rgb*light;
		return material;
	}`;
	Cesium.Material._materialCache.addMaterial("PatrolLine", {
		fabric: {
			type: "PatrolLine",
			uniforms: {
				color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
				image: new URL("./assets/FlowLine.png", import.meta.url).href,
				speed: 20,
				repeatX: 1,
				repeatY: 1,
				light: 1.0,
			},
			source: source,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source2 = `
	uniform vec4 color;
	uniform vec4 gapColor;
	uniform float dashLength;
	uniform float dashPattern;
	varying float v_polylineAngle;

	const float maskLength = 16.0;

	mat2 rotate(float rad) {
		float c = cos(rad);
		float s = sin(rad);
		return mat2(
			c, s,
			-s, c
		);
	}
	uniform sampler2D image;
	uniform float speed;
	uniform float light;
	czm_material czm_getMaterial(czm_materialInput materialInput){
		czm_material material = czm_getDefaultMaterial(materialInput);
		vec2 st = materialInput.st;
		float t = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
		// vec4 colorImage = texture2D(image, vec2(fract(st.s - t), st.t));
		// colorImage.a
		vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;
		// Get the relative position within the dash from 0 to 1
		float dashPosition = fract(pos.x / (dashLength * czm_pixelRatio));
		// Figure out the mask index.
		float maskIndex = floor(dashPosition * maskLength);
		// Test the bit mask.
		float maskTest = floor(dashPattern / pow(2.0, maskIndex));
		vec4 fragColor = (mod(maskTest, 2.0) < 1.0) ? gapColor : color;
		if (fragColor.a < 0.005) {   // matches 0/255 and 1/255
			discard;
		}
		fragColor = czm_gammaCorrect(fragColor);
		material.emission = fragColor.rgb;
		material.alpha = fragColor.a;
		material.diffuse = fragColor.rgb * light;
		return material;
	}`;
	Cesium.Material._materialCache.addMaterial("PatrolLine2", {
		fabric: {
			type: "PatrolLine2",
			uniforms: {
				color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
				image: new URL("./assets/FlowLine.png", import.meta.url).href,
				gapColor: Cesium.Color.TRANSPARENT,
				speed: 20,
				dashPattern: 255.0,
				dashLength: 16.0,
				light: 1.0,
			},
			source: source2,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
}
/**
 * @Author: dongnan
 * @Description: 获取俩点的距离，返回m
 * @Date: 2021-01-14 11:35:27
 * @param {*} startPoint
 * @param {*} endPoint
 */
function getLineDistance(startPoint, endPoint) {
	let startCartographic = Cesium.Cartographic.fromCartesian(startPoint);
	let endCartographic = Cesium.Cartographic.fromCartesian(endPoint);
	let geodesic = new Cesium.EllipsoidGeodesic();
	geodesic.setEndPoints(startCartographic, endCartographic);
	let surfaceDistance = geodesic.surfaceDistance;
	let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2));
	return parseFloat(lengthInMeters);
}
/**
 * @Author: dongnan
 * @Description: 缩放至范围(视角调整)
 * @Date: 2021-09-12 13:20:30
 * @param {Viewer} viewer
 * @param {*} options 选项
 * @param {Array} extent 边界范围
 * @param {Float} heading 默认 0
 * @param {Float} pitch 默认 -45
 * @param {Float} radius 默认 3 球半径
 * @param {Array} padding 偏移范围 [上,右,下,左] 实际偏移距离米
 * @param {Function} callback 视角切换完的回调
 */
function zoomToExtent(viewer, options) {
	if (!Cesium.defined(options.extent)) return;
	let extent = options.extent;
	let duration = Cesium.defaultValue(options.duration, 0.5);
	let heading = Cesium.defaultValue(options.heading, 0);
	let pitch = Cesium.defaultValue(options.pitch, -45);
	let radius = Cesium.defaultValue(options.radius, 3);
	let boundingSphere = Cesium.BoundingSphere.fromRectangle3D(
		Cesium.Rectangle.fromDegrees(parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])),
	);
	if (Cesium.defined(options.padding)) {
		let currentExtent = extent;
		let topOffset = Cesium.defaultValue(meterToDegree(options.padding[0]), 0);
		let rightOffset = Cesium.defaultValue(meterToDegree(options.padding[1]), 0);
		let bottomOffset = Cesium.defaultValue(meterToDegree(options.padding[2]), 0);
		let leftOffset = Cesium.defaultValue(meterToDegree(options.padding[3]), 0);
		let bound = [
			currentExtent[0] - leftOffset,
			currentExtent[1] - bottomOffset,
			currentExtent[2] + rightOffset,
			currentExtent[3] + topOffset,
		];
		let newSphere = Cesium.BoundingSphere.fromRectangle3D(
			Cesium.Rectangle.fromDegrees(parseFloat(bound[0]), parseFloat(bound[1]), parseFloat(bound[2]), parseFloat(bound[3])),
		);
		viewer.camera.flyToBoundingSphere(newSphere, {
			duration: duration,
			offset: new Cesium.HeadingPitchRange(
				Cesium.Math.toRadians(heading),
				Cesium.Math.toRadians(pitch),
				(boundingSphere.radius * radius) / 2,
			),
			complete: options.callback,
		});
	} else {
		viewer.camera.flyToBoundingSphere(boundingSphere, {
			duration: duration,
			offset: new Cesium.HeadingPitchRange(
				Cesium.Math.toRadians(heading),
				Cesium.Math.toRadians(pitch),
				boundingSphere.radius * radius,
			),
			complete: options.callback,
		});
	}
}
function zoomToList(viewer, list) {
	if (list.length == 1) {
		zoomTo(viewer, {
			center: list[0],
		});
	} else {
		let line = turfLineString(list);
		let bbox = turfBBox(line);
		zoomToExtent(viewer, {
			extent: bbox,
		});
	}
}
