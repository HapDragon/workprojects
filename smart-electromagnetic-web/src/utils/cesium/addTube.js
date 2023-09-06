import * as turf from "@turf/turf";
/**
 * @Author: dongnan
 * @Description: 绘制水管
 * @Date: 2022-11-04 16:02:27
 * @param {Object} option
 * @param {Cesium.viewer} option.viewer
 * @param {Array} option.list 数组[[lon,lat,height]]
 * @param {number} option.radius 半径
 * @param {Cesium.Material} option.material 材质
 * @return {Cesium.Entity}
 */
export function addTube(option) {
	if (!option || !Array.isArray(option.list) || option.list.length == 0) return;
	let list = option.list.concat();
	let viewer = option.viewer;
	let radius = option?.radius ?? 1;
	let material = option?.material ?? Cesium.Color.GREEN.withAlpha(0.9);
	let tube;
	if (list.length == 1) {
		// 垂直管道
		tube = addVerticalTube({
			viewer: viewer,
			list: list.concat(),
			radius: radius,
			material: material,
		});
	} else {
		// 水平管道
		tube = addHorizontalTube({
			viewer: viewer,
			list: list.concat(),
			radius: radius,
			material: material,
		});
	}
	return tube;
}
/**
 * @Author: dongnan
 * @Description: 添加垂直管道
 * @Date: 2022-11-04 16:57:34
 * @param {Object} option
 * @param {Cesium.Viewer} option.viewer
 * @param {Array} option.list [[lon,lat,height,extrudedHeight]]
 * @param {number} option.radius 半径
 * @param {Cesium.Material} option.material 材质
 * @return {Cesium.Entity}
 */
export function addVerticalTube(option) {
	if (!Array.isArray(option.list) || option.list.length < 1) return;
	let list = option.list[0];
	let viewer = option.viewer;
	let radius = option?.radius ?? 0.8;
	let height = isNaN(list[2]) ? 0.0 : list[2];
	let extrudedHeight = isNaN(list[3]) ? 1.0 : list[3];
	let material = option?.material ?? Cesium.Color.GREEN.withAlpha(0.9);
	// 管道实体
	let tube = viewer.entities.add({
		position: Cesium.Cartesian3.fromDegrees(list[0], list[1]),
		polygon: {
			hierarchy: {
				positions: Cesium.Cartesian3.fromDegreesArray(computeVerticalCircle(list, radius)),
				// holes: [
				// 	{
				// 		positions: Cesium.Cartesian3.fromDegreesArray(computeVerticalCircle(list, (radius * 3) / 4)),
				// 	},
				// ],
			},
			height: height,
			extrudedHeight: extrudedHeight,
			material: material,
		},
	});
	return tube;
}
/**
 * @Author: dongnan
 * @Description: 添加水平管道
 * @Date: 2022-11-05 16:08:47
 * @param {Object} option
 * @param {Cesium.Viewer} option.viewer
 * @param {Array} option.list [[lon,lat,height],[lon,lat,height]]
 * @param {number} option.radius 半径
 * @param {Cesium.Material} option.material 材质
 * @param {Array} option.cut [left,right] 裁剪大小 单位米
 * @return {Cesium.Entity}
 */
export function addHorizontalTube(option) {
	let list = option.list;
	if (!Array.isArray(list) || list.length < 1) return;
	let viewer = option.viewer;
	let radius = option?.radius ?? 0.8;
	let material = option?.material ?? Cesium.Color.GREEN.withAlpha(0.9);
	let tube = viewer.entities.add({
		polylineVolume: {
			positions: toCartesian3(list),
			shape: computeHorizontalCircle(radius),
			material: material,
		},
	});
	return tube;
}
/**
 * @Author: dongnan
 * @Description:
 * @Date: 2022-11-05 17:31:45
 * @param {Object} option
 * @param {Array} option.list [[lon,lat,height],[lon,lat,height]]
 * @param {Array} option.cut [start,end]
 * @return {Array} [lon,lat,height]
 */
export function cutTube(option) {
	if (!Array.isArray(option.list) || option.list.length < 1) return;
	let list = option.list.concat();
	let cut = option?.cut ?? [0, 0];
	let linePoints = list.map((item) => {
		return [item[0], item[1]];
	});
	let line = turf.lineString(linePoints);
	let left = cut[0];
	let right = cut[1];
	if (left > 0) {
		let chunk = turf.lineChunk(line, left / 1000, { units: "kilometers" });
		let point = chunk.features[0].geometry.coordinates[1];
		let height = list[0]?.[2] ?? 0;
		point.push(height);
		list.shift();
		list = [point].concat(list);
	}
	if (right > 0) {
		let chunk = turf.lineChunk(line, right / 1000, { units: "kilometers" });
		let point = chunk.features[chunk.features.length - 1].geometry.coordinates[0];
		let height = list[list.length - 1]?.[2] ?? 0;
		point.push(height);
		list.pop();
		list.push(point);
	}
	return list;
}
/**
 * @Author: dongnan
 * @Description: 经纬度集合转世界坐标集合
 * @Date: 2022-11-05 16:14:51
 * @param {Array} list [[lon,lat,height],[lon,lat,height]]
 * @return {Array} [cartesian3,cartesian3]
 */
export function toCartesian3(list) {
	let result = [];
	list.some((item) => {
		result.push(Cesium.Cartesian3.fromDegrees(item[0], item[1], isNaN(item[2]) ? 0 : item[2]));
	});
	return result;
}
/**
 * 管道截面形状计算，根据中心点和半径生成圆形
 * @param {Array} list [lon,lat,height]
 * @param {Number} radius 截面半径
 * @return {Array} [[lon,lat],[lon,lat]] 组成截面的点集合
 */
export function computeVerticalCircle(list, radius) {
	let Ea = 6378137; //   赤道半径
	let Eb = 6356725; // 极半径
	let positionArr = [];
	//cesium正东是0°
	for (let i = 0; i <= 360; i++) {
		let dx = radius * Math.sin((i * Math.PI) / 180.0);
		let dy = radius * Math.cos((i * Math.PI) / 180.0);

		let ec = Eb + ((Ea - Eb) * (90.0 - list[1])) / 90.0;
		let ed = ec * Math.cos((list[1] * Math.PI) / 180);

		let BJD = list[0] + ((dx / ed) * 180.0) / Math.PI; // 圆弧点经度
		let BWD = list[1] + ((dy / ec) * 180.0) / Math.PI; // 圆弧点纬度

		positionArr.push(BJD);
		positionArr.push(BWD);
	}
	return positionArr;
}
/**
 * 管道截面形状计算，分为四个阶段：1/4弧、半圆、3/4弧、整圆
 * @param {Number} radius 半径
 * @param {Number} status 截面阶段
 * @return {Array} [[lon,lat],[lon,lat]] 组成截面的点集合
 */
export function computeHorizontalCircle(radius, status) {
	let positions = [];
	let startRad, endRad;
	// 水位截面角度
	switch (status) {
		case 1:
			startRad = 225;
			endRad = 315;
			break;
		case 2:
			startRad = 180;
			endRad = 360;
			break;
		case 3:
			startRad = 135;
			endRad = 405;
			break;
		case 4:
			startRad = 0;
			endRad = 360;
			break;
		default:
			for (let i = 360; i >= 0; i--) {
				let radians = Cesium.Math.toRadians(i);
				positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
			}
	}

	for (let i = startRad; i <= endRad; i++) {
		let radians = Cesium.Math.toRadians(i);
		positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
	}

	return positions;
}
/**
 * @Author: dongnan
 * @Description: 2字段转3字段
 * @Date: 2022-11-02 17:23:22
 * @param {Array} list [[x,y],[x,y]]
 * @param {number} height 统一高度
 * @return {Array} [[x,y,height],[x,y,height]]
 */
export function transformListHeight(list, height) {
	height = Cesium.defaultValue(height, 0);
	let result = [];
	list.some((item) => {
		result.push([item[0], item[1], height]);
	});
	return result;
}

/**
 * @Author: dongnan
 * @Description: 增加高度
 * @Date: 2023-02-13 18:38:17
 * @param {Array} list [[x,y],[x,y]]
 * @param {number} height 统一叠加高度
 * @return {Array} [[x,y,height],[x,y,height]]
 */
export function plusListHeight(list, height) {
	height = Cesium.defaultValue(height, 0);
	let result = [];
	list.some((item) => {
		result.push([item[0], item[1], (item[2]?item[2]:0) + height]);
	});
	return result;
}

/**
 * @Author: dongnan
 * @Description: 经纬度集合转世界坐标集合
 * @Date: 2022-11-02 16:13:09
 * @param {Array} list [[lon,lat],[lon,lat]]
 * @param {number} height
 * @return {Array} [cartesian3,cartesian3] 世界坐标集合
 */
export function cartesian3Height(list, height) {
	height = Cesium.defaultValue(height, 0);
	let result = [];
	list.some((item) => {
		result.push(Cesium.Cartesian3.fromDegrees(item[0], item[1], height));
	});
	return result;
}
