import { drawDoubleImageCanvas, drawDoubleTextCanvas, drawSingleTextCanvas, drawTextCanvas } from "@/utils/cesium/CanvasLabel";
// addMaterials();
/**
 * @Author: dongnan
 * @Description: 添加撒点
 * @Date: 2021-07-30 16:53:36
 * @param {*} viewer
 * @param {*} data  主要结构[{x:111,y:22,ImageOptions:{},TextOptions:{},CircleOptions:{}}]
 * ImageOptions:{height:高度(单位:米),image:图片地址,scale:缩放比例,scaleByDistance:缩放大小随距离变化(如：[1200,1,5200,0.8],1200米到5200米scale展示1,5200米以上展示0.8),highlight:高亮图标地}
 * TextOptions:{height:高度(单位:米),image:展示的背景图片,text:展示的文本,fontOptions:{}(文档writeTextToCanvas配置项),scale:缩放比例,offset:总偏移量(如:[0,0]),padding:[20,20,20,20](用于文字偏移背景图片),displayByDistance:[0,5000](距离显示条件),scaleByDistance:缩放大小随距离变化}
 * CircleOptions:{radius:20,MaterialOptions:{}}
 * attributes 需要暴露给事件的信息
 * Key为PrimitivePoints 唯一标识 用于过滤触发点击事件
 * @param {*} saveData 保存地址
 * @param {*} subNum 分段数量
 */
export function addPrimitivePoints(viewer, option) {
	if (!Array.isArray(option.data) || option.data.length == 0) return;
	let subNum = parseInt(Cesium.defaultValue(option.subNum, 200));
	let markers = new Cesium.BillboardCollection();
	markers._guid=Cesium.createGuid();
	let texts = new Cesium.BillboardCollection();
	let circles = new Cesium.PrimitiveCollection();
	let markerPrimitive = viewer.scene.primitives.add(markers);
	let textPrimitive = viewer.scene.primitives.add(texts);
	let circlePrimitive = viewer.scene.primitives.add(circles);
	markerPrimitive.Key = "PrimitivePoints"; // 唯一标识 可触发点击事件
	textPrimitive.Key = "PrimitivePoints"; // 唯一标识 可触发点击事件
	option.data.some((point, index) => {
		if (typeof point.x == "undefined" || typeof point.y == "undefined" || !point.x || !point.y) return false;
		// 需要显示图标时
		if (Cesium.defined(point.ImageOptions)) {
			let item = markers.add({
				position: Cesium.Cartesian3.fromDegrees(
					parseFloat(point.x),
					parseFloat(point.y),
					Cesium.defaultValue(point.ImageOptions.height, 0),
				),
				disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
				image: Cesium.defaultValue(point.ImageOptions.image,new URL('@/assets/cesium/zdry1.png', import.meta.url).href),
				scale: Cesium.defaultValue(point.ImageOptions.scale, 1),
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				scaleByDistance: Cesium.defined(point.ImageOptions.scaleByDistance)
					? new Cesium.NearFarScalar(
							point.ImageOptions.scaleByDistance[0],
							point.ImageOptions.scaleByDistance[1],
							point.ImageOptions.scaleByDistance[2],
							point.ImageOptions.scaleByDistance[3],
					  )
					: new Cesium.NearFarScalar(0, 1, 1, 1),
			});
			item.attributes = point.attributes;
		}
		// 需要显示扩散圆时
		if (Cesium.defined(point.CircleOptions)) {
			let circleDiameter = Cesium.defaultValue(point.CircleOptions.radius, 20) * 2;
			point.CircleOptions.MaterialOptions = Cesium.defaultValue(point.CircleOptions.MaterialOptions, {});
			circles.add(
				new Cesium.Primitive({
					geometryInstances: new Cesium.GeometryInstance({
						geometry: new Cesium.EllipseGeometry({
							center: Cesium.Cartesian3.fromDegrees(parseFloat(point.x), parseFloat(point.y)),
							semiMajorAxis: circleDiameter,
							semiMinorAxis: circleDiameter,
							height: Cesium.defaultValue(point.CircleOptions.height, 1),
						}),
					}),
					appearance: new Cesium.EllipsoidSurfaceAppearance({
						material: Cesium.Material.fromType(Cesium.defaultValue(point.CircleOptions.MaterialOptions.type, "EllipseWave"), {
							color: Cesium.defaultValue(
								point.CircleOptions.MaterialOptions.color,
								Cesium.Color.fromCssColorString("#4fa9cb"),
							),
							speed: Cesium.defaultValue(point.CircleOptions.MaterialOptions.speed, 15),
							count: Cesium.defaultValue(point.CircleOptions.MaterialOptions.count, 2),
							gradient: Cesium.defaultValue(point.CircleOptions.MaterialOptions.gradient, 5),
						}),
					}),
				}),
			);
		}
		// 需要显示文本时
		if (Cesium.defined(point.TextOptions)) {
			if (Cesium.defined(point.TextOptions.image)) {
				let image = new Image();
				image.src = point.TextOptions.image;
				image.onload = function () {
					let imageCanvas;
					if (Cesium.defined(point.TextOptions.text2)) {
						imageCanvas = drawDoubleTextCanvas(image, point.TextOptions);
					} else {
						imageCanvas = drawSingleTextCanvas(image, point.TextOptions);
					}
					let temp = texts.add({
						position: Cesium.Cartesian3.fromDegrees(
							parseFloat(point.x),
							parseFloat(point.y),
							Cesium.defaultValue(point.TextOptions.height, 0),
						),
						disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
						image: imageCanvas,
						scale: Cesium.defaultValue(point.TextOptions.scale, 1),
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
						horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
						pixelOffset: Cesium.defined(point.TextOptions.offset)
							? new Cesium.Cartesian2(point.TextOptions.offset[0], point.TextOptions.offset[1])
							: new Cesium.Cartesian2(0, 0),
						distanceDisplayCondition: Cesium.defined(point.TextOptions.displayByDistance)
							? new Cesium.DistanceDisplayCondition(
									point.TextOptions.displayByDistance[0],
									point.TextOptions.displayByDistance[1],
							  )
							: new Cesium.DistanceDisplayCondition(0, 100000000),
						scaleByDistance: Cesium.defined(point.TextOptions.scaleByDistance)
							? new Cesium.NearFarScalar(
									point.TextOptions.scaleByDistance[0],
									point.TextOptions.scaleByDistance[1],
									point.TextOptions.scaleByDistance[2],
									point.TextOptions.scaleByDistance[3],
							  )
							: new Cesium.NearFarScalar(0, 1, 1, 1),
					});
					temp.attributes = point.attributes;
				};
			} else {
				let temp = texts.add({
					position: Cesium.Cartesian3.fromDegrees(
						parseFloat(point.x),
						parseFloat(point.y),
						Cesium.defaultValue(point.TextOptions.height, 0),
					),
					disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
					image: drawTextCanvas(point.TextOptions),
					scale: Cesium.defaultValue(point.TextOptions.scale, 1),
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					pixelOffset: Cesium.defined(point.TextOptions.offset)
						? new Cesium.Cartesian2(point.TextOptions.offset[0], point.TextOptions.offset[1])
						: new Cesium.Cartesian2(0, 0),
					distanceDisplayCondition: Cesium.defined(point.TextOptions.displayByDistance)
						? new Cesium.DistanceDisplayCondition(
								point.TextOptions.displayByDistance[0],
								point.TextOptions.displayByDistance[1],
						  )
						: new Cesium.DistanceDisplayCondition(0, 100000000),
					scaleByDistance: Cesium.defined(point.TextOptions.scaleByDistance)
						? new Cesium.NearFarScalar(
								point.TextOptions.scaleByDistance[0],
								point.TextOptions.scaleByDistance[1],
								point.TextOptions.scaleByDistance[2],
								point.TextOptions.scaleByDistance[3],
						  )
						: new Cesium.NearFarScalar(0, 1, 1, 1),
				});
				temp.attributes = point.attributes;
			}
		}
		if (index > 0 && index % subNum == 0) {
			option.saveData.push({
				marker: markerPrimitive,
				text: textPrimitive,
				circle: circlePrimitive,
			});
			markers = new Cesium.BillboardCollection();
			texts = new Cesium.BillboardCollection();
			circles = new Cesium.PrimitiveCollection();
			markerPrimitive = viewer.scene.primitives.add(markers);
			textPrimitive = viewer.scene.primitives.add(texts);
			circlePrimitive = viewer.scene.primitives.add(circles);
			markerPrimitive.Key = "PrimitivePoints"; // 唯一标识 可触发点击事件
			textPrimitive.Key = "PrimitivePoints"; // 唯一标识 可触发点击事件
		}
	});
	// 存储
	option.saveData.push({
		marker: markerPrimitive,
		text: textPrimitive,
		circle: circlePrimitive,
	});
}
/**
 * @Author: dongnan
 * @Description: 删除撒点
 * @Date: 2021-07-31 11:50:46
 * @param {*} viewer
 * @param {*} saveData
 */
export function removePrimitivePoints(viewer, saveData) {
	saveData.some((item) => {
		// item.marker && viewer.scene.primitives.remove(item.marker);
		if(item.marker!=null){
			viewer.scene.primitives.remove(item.marker);
		}
		item.text && viewer.scene.primitives.remove(item.text);
		item.circle && viewer.scene.primitives.remove(item.circle);
	});
	saveData.splice(0, saveData.length);
}
/**
 * @Author: dongnan
 * @Description: 添加撒点
 * @Date: 2021-11-16 15:23:53
 * @param {*} viewer
 * @param {*} data  主要结构[{x:111,y:22,ImageOptions:{},TextOptions:{},CircleOptions:{}}]
 * ImageOptions:{height:高度(单位:米),image:图片地址,scale:缩放比例,scaleByDistance:缩放大小随距离变化(如：[1200,1,5200,0.8],1200米到5200米scale展示1,5200米以上展示0.8),highlight:高亮图标地}
 * TextOptions:{height:高度(单位:米),image:展示的背景图片,text:展示的文本,fontOptions:{}(文档writeTextToCanvas配置项),scale:缩放比例,offset:总偏移量(如:[0,0]),padding:[20,20,20,20](用于文字偏移背景图片),displayByDistance:[0,5000](距离显示条件),scaleByDistance:缩放大小随距离变化}
 * attributes 需要暴露给事件的信息
 * Key为ClusterPoints 唯一标识 用于过滤触发点击事件
 * @param {*} saveData 保存地址
 * @param {*} subNum 分段数量
 */
export function addClusterPoints(viewer, option) {
	if (!Array.isArray(option.data) || option.data.length == 0) return;
	let subNum = parseInt(Cesium.defaultValue(option.subNum, 200));
	// 分段聚合 解决数据量过大
	while (Math.floor(option.data.length / subNum) >= 1) {
		let data = option.data.splice(0, subNum);
		clusterDataSource(viewer, {
			data: data,
			saveData: option.saveData,
		});
	}
	clusterDataSource(viewer, {
		data: option.data,
		saveData: option.saveData,
	});
}
/**
 * @Author: dongnan
 * @Description: 删除撒点
 * @Date: 2021-11-16 15:23:40
 * @param {*} viewer
 * @param {*} saveData
 */
export function removeClusterPoints(viewer, saveData) {
	saveData.some((item) => {
		viewer.dataSources.remove(item.source);
	});
	saveData.splice(0, saveData.length);
}
/**
 * @Author: dongnan
 * @Description: 聚合entity
 * @Date: 2021-10-22 10:34:06
 * @param {*} viewer
 * @param {*} data 主要结构[{x:111,y:22,TextOptions:{},ImageOptions:{},attributes:{}}]
 * @param {*} clusterOptions
 * @param {*} saveData 数据存储
 */
function clusterDataSource(viewer, option) {
	let dataSourcePromise = viewer.dataSources.add(Cesium.GeoJsonDataSource.load(toGeojson(option.data)));
	dataSourcePromise.then(function (dataSource) {
		// 设置聚合范围
		let rangeOptions = Cesium.defaultValue(option.clusterOptions, {
			pixelRange: 10,
			minimumClusterSize: 2,
		});
		let pixelRange = Cesium.defaultValue(rangeOptions.pixelRange, 10);
		let minimumClusterSize = Cesium.defaultValue(rangeOptions.minimumClusterSize, 2);
		dataSource.clustering.enabled = true;
		dataSource.clustering.pixelRange = pixelRange;
		dataSource.clustering.minimumClusterSize = minimumClusterSize;
		// 添加聚合数据
		let entities = dataSource.entities.values;
		entities.some((entity) => {
			// 唯一标识 可触发点击事件
			entity.Key = "ClusterPoints";
			entity.billboard.show = false;
			let attr = entity.properties;
			entity.attributes = Cesium.defined(attr.attributes) ? attr.attributes._value : {};
			let val = entity.position._value;
			if (Cesium.defined(attr.ImageOptions)) {
				let ImageOptions = attr.ImageOptions._value;
				let position = new Cesium.Cartesian3(val.x, val.y, val.z + parseFloat(Cesium.defaultValue(ImageOptions.height, 0.0)));
				entity.position = position;
				entity.billboard = {
					show: true,
					disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
					image: Cesium.defaultValue(ImageOptions.image, new URL('@/assets/cesium/zdry1.png', import.meta.url).href),
					scale: Cesium.defaultValue(ImageOptions.scale, 1),
					verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
					scaleByDistance: Cesium.defined(ImageOptions.scaleByDistance)
						? new Cesium.NearFarScalar(
								ImageOptions.scaleByDistance[0],
								ImageOptions.scaleByDistance[1],
								ImageOptions.scaleByDistance[2],
								ImageOptions.scaleByDistance[3],
						  )
						: new Cesium.NearFarScalar(0, 1, 1, 1),
				};
			} else {
				let TextOptions = attr.TextOptions._value;
				let position = new Cesium.Cartesian3(val.x, val.y, val.z + parseFloat(Cesium.defaultValue(TextOptions.height, 0.0)));
				if (Cesium.defined(TextOptions.image)) {
					let image = new Image();
					image.src = TextOptions.image;
					image.onload = function () {
						let imageCanvas;
						if (Cesium.defined(TextOptions.text2) && !Cesium.defined(TextOptions.image2)) {
							imageCanvas = drawDoubleTextCanvas(image, TextOptions);
						} else {
							imageCanvas = drawSingleTextCanvas(image, TextOptions);
						}
						if (Cesium.defined(TextOptions.image2)) {
							let image2 = new Image();
							image2.src = TextOptions.image2;
							image2.onload = function () {
								entity.position = position;
								entity.billboard = {
									show: true,
									disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
									image: drawDoubleImageCanvas(image, image2, TextOptions),
									scale: Cesium.defaultValue(TextOptions.scale, 1),
									verticalOrigin: Cesium.VerticalOrigin.CENTER,
									horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
									pixelOffset: Cesium.defined(TextOptions.offset)
										? new Cesium.Cartesian2(TextOptions.offset[0], TextOptions.offset[1])
										: new Cesium.Cartesian2(0, 0),
									distanceDisplayCondition: Cesium.defined(TextOptions.displayByDistance)
										? new Cesium.DistanceDisplayCondition(
												TextOptions.displayByDistance[0],
												TextOptions.displayByDistance[1],
										  )
										: new Cesium.DistanceDisplayCondition(0, 100000000),
									scaleByDistance: Cesium.defined(TextOptions.scaleByDistance)
										? new Cesium.NearFarScalar(
												TextOptions.scaleByDistance[0],
												TextOptions.scaleByDistance[1],
												TextOptions.scaleByDistance[2],
												TextOptions.scaleByDistance[3],
										  )
										: new Cesium.NearFarScalar(0, 1, 1, 1),
								};
							};
						} else {
							entity.position = position;
							entity.billboard = {
								show: true,
								disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
								image: imageCanvas,
								scale: Cesium.defaultValue(TextOptions.scale, 1),
								verticalOrigin: Cesium.VerticalOrigin.CENTER,
								horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
								pixelOffset: Cesium.defined(TextOptions.offset)
									? new Cesium.Cartesian2(TextOptions.offset[0], TextOptions.offset[1])
									: new Cesium.Cartesian2(0, 0),
								distanceDisplayCondition: Cesium.defined(TextOptions.displayByDistance)
									? new Cesium.DistanceDisplayCondition(
											TextOptions.displayByDistance[0],
											TextOptions.displayByDistance[1],
									  )
									: new Cesium.DistanceDisplayCondition(0, 100000000),
								scaleByDistance: Cesium.defined(TextOptions.scaleByDistance)
									? new Cesium.NearFarScalar(
											TextOptions.scaleByDistance[0],
											TextOptions.scaleByDistance[1],
											TextOptions.scaleByDistance[2],
											TextOptions.scaleByDistance[3],
									  )
									: new Cesium.NearFarScalar(0, 1, 1, 1),
							};
						}
					};
				} else {
					entity.position = position;
					entity.billboard = {
						show: true,
						disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
						image: drawTextCanvas(TextOptions),
						scale: Cesium.defaultValue(TextOptions.scale, 1),
						verticalOrigin: Cesium.VerticalOrigin.CENTER,
						horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
						pixelOffset: Cesium.defined(TextOptions.offset)
							? new Cesium.Cartesian2(TextOptions.offset[0], TextOptions.offset[1])
							: new Cesium.Cartesian2(0, 0),
						distanceDisplayCondition: Cesium.defined(TextOptions.displayByDistance)
							? new Cesium.DistanceDisplayCondition(TextOptions.displayByDistance[0], TextOptions.displayByDistance[1])
							: new Cesium.DistanceDisplayCondition(0, 100000000),
						scaleByDistance: Cesium.defined(TextOptions.scaleByDistance)
							? new Cesium.NearFarScalar(
									TextOptions.scaleByDistance[0],
									TextOptions.scaleByDistance[1],
									TextOptions.scaleByDistance[2],
									TextOptions.scaleByDistance[3],
							  )
							: new Cesium.NearFarScalar(0, 1, 1, 1),
					};
				}
			}
		});
		// 监听聚合事件 更改聚合后样式
		let clusterEvent = function (entities, cluster) {
			cluster.label.show = false;
			cluster.billboard.show = false;
		};
		dataSource.clustering.clusterEvent.addEventListener(clusterEvent);
		// 存储
		option.saveData.push({
			points: entities,
			source: dataSource,
			event: clusterEvent,
		});
	});
}
/**
 * @Author: dongnan
 * @Description: 转换成geojson格式
 * @Date: 2021-01-29 15:10:33
 */
function toGeojson(list) {
	let jsons = [];
	for (let obj of list) {
		let json = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [parseFloat(obj.x), parseFloat(obj.y)],
			},
			properties: obj,
		};
		jsons.push(json);
	}
	let geojson = {
		type: "FeatureCollection",
		features: jsons,
	};
	return geojson;
}
/**
 * @Author: dongnan
 * @Description: 添加材质
 * @Date: 2021-11-09 14:08:51
 * @param {*}
 */
export function addMaterials() {
	let source = `
        uniform vec4 color;
        uniform float count;
        uniform float gradient;
        uniform float speed;
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            material.diffuse = 1.5 * color.rgb;
            vec2 st = materialInput.st;
            vec3 str = materialInput.str;
            float dis = distance(st, vec2(0.5, 0.5));
            float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
            float per = fract(time);
            if (abs(str.z) > 0.001) {
                discard;
            }
            if (dis > 0.5) { 
                discard; 
            } else { 
                float perDis = 0.5 / count;
                float disNum; 
                float bl = .0; 
                for (int i = 0; i <= 999; i++) { 
                    if (float(i) <= count) { 
                        disNum = perDis * float(i) - dis + per / count; 
                        if (disNum > 0.0) { 
                            if (disNum < perDis) { 
                                bl = 1.0 - disNum / perDis;
                            }
                            else if (disNum - perDis < perDis) { 
                                bl = 1.0 - abs(1.0 - disNum / perDis); 
                            }
                            material.alpha = pow(bl, gradient); 
                        }
                    }
                }
            } 
            return material; 
        }`;
	Cesium.Material._materialCache.addMaterial("EllipseWave", {
		fabric: {
			type: "EllipseWave",
			uniforms: {
				color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
				speed: 10,
				count: 1,
				gradient: 0.1,
			},
			source: source,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
}
