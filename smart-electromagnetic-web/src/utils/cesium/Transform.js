/**
 * @Author: dongnan
 * @Description: 设置模型位置及状态
 * @Date: 2022-02-11 14:08:14
 * @param {Object} params
 * @param {Float} tx 模型中心X轴坐标（经度 单位：度）
 * @param {Float} ty 模型中心Y轴坐标（纬度 单位：度）
 * @param {Float} tz 模型中心Z轴坐标（高程 单位：米）
 * @param {Float} rx X轴（经度）方向旋转角度（单位：度） roll
 * @param {Float} ry Y轴（经度）方向旋转角度（单位：度） pitch
 * @param {Float} rz Z轴（高程）方向旋转角度（单位：度） heading
 * @param {Float} sx X轴缩放比例
 * @param {Float} sy Y轴缩放比例
 * @param {Float} sz Z轴缩放比例
 * @param {String} type 参数类型 cartesian  degrees(默认)
 */
export function setMatrix(params) {
	if (!Cesium.defined(params) && !Cesium.defined(params.tx) && !Cesium.defined(params.ty)) return;
	let m = new Cesium.Matrix4();
	// 初始位置
	if (params.type == "cartesian") {
		let position = new Cesium.Cartesian3(params.tx, params.ty, Cesium.defaultValue(params.tz, 0));
		m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
	} else {
		let position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, Cesium.defaultValue(params.tz, 0));
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
	if (Cesium.defined(params.sx) || Cesium.defined(params.sy) || Cesium.defined(params.sz)) {
		Cesium.Matrix4.multiplyByScale(
			m,
			new Cesium.Cartesian3(Cesium.defaultValue(params.sx, 1), Cesium.defaultValue(params.sy, 1), Cesium.defaultValue(params.sz, 1)),
			m,
		);
	}
	// 返回矩阵
	return m;
}

/**
 * Author:wangqiuyan
 * Date:2022-10-29
 * Description:更新mesh倾斜数据代表的3dtilese一类数据根节点位置和旋转matrix
 * @param tileset
 * @param params
 */
export function update3dtilesMaxtrix(tileset,params) {
	//旋转
	var mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
	var my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
	var mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
	var rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
	var rotationY = Cesium.Matrix4.fromRotationTranslation(my);
	var rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
	//平移
	var position = new Cesium.Cartesian3(params.tx, params.ty, params.tz);
	var m = Cesium.Transforms.eastNorthUpToFixedFrame(position);

	//旋转、平移矩阵相乘
	Cesium.Matrix4.multiply(m, rotationX, m);
	Cesium.Matrix4.multiply(m, rotationY, m);
	Cesium.Matrix4.multiply(m, rotationZ, m);
	//赋值给tileset
	tileset._root.transform = m;
}

/**
 * @Author: dongnan
 * @Description: 矩阵叠加
 * @Date: 2022-02-21 11:16:59
 * @param {Matrix4} matrix 初始矩阵
 * @param {Object} params
 * @param {Float} tx X轴平移距离 单位：米
 * @param {Float} ty Y轴平移距离 单位：米
 * @param {Float} tz Z轴平移距离 单位：米
 * @param {Float} rx X轴（经度）方向旋转角度（单位：度）
 * @param {Float} ry Y轴（经度）方向旋转角度（单位：度）
 * @param {Float} rz Z轴（高程）方向旋转角度（单位：度）
 * @param {Float} sx X轴缩放比例
 * @param {Float} sy Y轴缩放比例
 * @param {Float} sz Z轴缩放比例
 */
export function moveMatrix(matrix, params) {
	if (!Cesium.defined(params)) return;
	let m = matrix.clone();
	// 平移
	if (Cesium.defined(params.tx) || Cesium.defined(params.ty) || Cesium.defined(params.tz)) {
		let translation = new Cesium.Cartesian3(
			Cesium.defaultValue(params.tx, 0),
			Cesium.defaultValue(params.ty, 0),
			Cesium.defaultValue(params.tz, 0),
		);
		Cesium.Matrix4.multiplyByTranslation(m, translation, m);
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
	if (Cesium.defined(params.sx) || Cesium.defined(params.sy) || Cesium.defined(params.sz)) {
		Cesium.Matrix4.multiplyByScale(
			m,
			new Cesium.Cartesian3(Cesium.defaultValue(params.sx, 1), Cesium.defaultValue(params.sy, 1), Cesium.defaultValue(params.sz, 1)),
			m,
		);
	}
	// 返回矩阵
	return m;
}
