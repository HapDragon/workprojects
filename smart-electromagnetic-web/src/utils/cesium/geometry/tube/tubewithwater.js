/**
 * Created by wqy
 * Date 2023/2/17 15:02
 * Description
 */
//借助了three里面提供的方法构造tubegeometry的顶点
import {ThreeTubeGeometry} from "./threetubegeometry";
import {Lines} from "./Lines";
import coordinates from '@/modules/Map/Coordinates'
import {GlobalState} from "@/common/GlobalState";

function getBSAndcarlistBydegreeheightArr(degreeheightArray) {
	let centerpri = [0, 0, 0];
	let cartesianpos = [];
	for (let i = 0; i < degreeheightArray.length; i++) {
		if (i % 3 == 0) {
			centerpri[0] += degreeheightArray[i];
			cartesianpos.push(Cesium.Cartesian3.fromDegrees(
				degreeheightArray[i],
				degreeheightArray[i + 1],
				degreeheightArray[i + 2]
			));
		} else if (i % 3 == 1) {
			centerpri[1] += degreeheightArray[i];
		}
		else {
			centerpri[2] += degreeheightArray[i];
		}
	}
	centerpri[0] /= degreeheightArray.length / 3;
	centerpri[1] /= degreeheightArray.length / 3;
	centerpri[2] /= degreeheightArray.length / 3;
	return {
		boundingSphere: Cesium.BoundingSphere.fromPoints(cartesianpos),
		cartesianlist: cartesianpos
	};
}
function changenumtofragfloatstr(num) {
	let result=num.toString();
	if(result.indexOf('.')>=0) return result;
	return result+".";
}

export class TubeWithWater {
	constructor(degreeheightArray, radius = 1, radialSegments = 6, withwater = true,
				tubecolor = Cesium.Color.fromCssColorString("#a0a0a0").withAlpha(0.9),
				watercolor = Cesium.Color.fromCssColorString("#00a0a0").withAlpha(1.0), tuberSegments = 100,length) {
		if (degreeheightArray == undefined) return;
		if (degreeheightArray.length < 6 || degreeheightArray.length % 3 != 0) return;
		this._degreeheightarr = degreeheightArray;
		this._radius = radius;
		this._radialsegments = radialSegments;
		this._tuberSegments = tuberSegments;

		this._viewer = GlobalState.getInstance().viewer;
		this._scene = this._viewer.scene;
		this.visible = true;
		const scope = this;

		let len=length;
		if(len==null){
			len=0;
			for(let i=1;i<degreeheightArray.length/3;i++){
				len+=coordinates.CoordinateWGS84.GetDistancePlane(
					new coordinates.CoordinateWGS84(degreeheightArray[i*3-3],degreeheightArray[i*3-2],degreeheightArray[i*3-1]),
					new coordinates.CoordinateWGS84(degreeheightArray[i*3],degreeheightArray[i*3+1],degreeheightArray[i*3+2]),
				)
			}
		}


		this._waterfangda = changenumtofragfloatstr(len/30);
		if(isNaN(this._waterfangda)) return;
		let bscarlist = getBSAndcarlistBydegreeheightArr(degreeheightArray);
		this._boundingSphere = bscarlist.boundingSphere;
		const path = new Lines(bscarlist.cartesianlist);
		if (withwater === true) {
			const geometrywater = new ThreeTubeGeometry(
				path,
				360,
				scope._tuberSegments,
				this._radius * 0.8,
				this._radialsegments,
				false,
				true);
			const appearance = new Cesium.PerInstanceColorAppearance({
				vertexShaderSource:					`
                    attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec3 normal;
attribute vec4 color;
attribute float batchId;
attribute vec2 st;

varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec4 v_color;
varying vec2 v_textureCoordinates;


void main()
{
    vec4 p = czm_computePosition();

    v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
    v_normalEC = czm_normal * normal;                         // normal in eye coordinates
    v_color = color;

    v_textureCoordinates=st;
    gl_Position = czm_modelViewProjectionRelativeToEye * p;
}

                    `,
				fragmentShaderSource: `
                    varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec4 v_color;
varying vec2 v_textureCoordinates;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(1267.9898,23768.233)))*
        445.5453123);
}


void main()
{
    vec2 st = v_textureCoordinates;
    float rnd = random( st );
    
    vec3 positionToEyeEC = -v_positionEC;

    vec3 normalEC = normalize(v_normalEC);
#ifdef FACE_FORWARD
    normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
#endif

    vec4 color = czm_gammaCorrect(v_color);

    czm_materialInput materialInput;
    materialInput.normalEC = normalEC;
    materialInput.positionToEyeEC = positionToEyeEC;
    czm_material material = czm_getDefaultMaterial(materialInput);
    //material.diffuse = color.rgb;
    material.diffuse = mix(color.rgb,step(vec3(0.8),vec3(rnd))*0.5,0.25);
    material.alpha = color.a;
    material.specular = 1.2;
    material.shininess=1.6;


float fangda=${scope._waterfangda};
float xflag=fract(v_textureCoordinates.x*fangda-czm_frameNumber*0.02);
// xflag=smoothstep(0.1,0.33,xflag);
// // material.alpha=xflag;
if(xflag>0.6||xflag<0.2) discard;
   

gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
    
    
}

                    `,
			});

			this._primwater = this._scene.primitives.add(new Cesium.Primitive({
				geometryInstances: new Cesium.GeometryInstance({
					// geometry: new Cesium.EllipseGeometry({
					//     center: Cesium.Cartesian3.fromDegrees(-100.0, 20.0),
					//     semiMinorAxis: 500000.0,
					//     semiMajorAxis: 1000000.0,
					//     rotation: Cesium.Math.PI_OVER_FOUR,
					//     vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
					// })
					geometry: new Cesium.Geometry({
						attributes: {
							position: new Cesium.GeometryAttribute({
								componentDatatype: Cesium.ComponentDatatype.DOUBLE,
								componentsPerAttribute: 3,
								values: geometrywater.attributes.position.array
							}),
							normal: new Cesium.GeometryAttribute({
								componentDatatype: Cesium.ComponentDatatype.FLOAT,
								componentsPerAttribute: 3,
								values: geometrywater.attributes.normal.array
							}),
							st: new Cesium.GeometryAttribute({
								componentDatatype: Cesium.ComponentDatatype.FLOAT,
								componentsPerAttribute: 2,
								values: geometrywater.attributes.uv.array
							})
						},
						indices: geometrywater.index.array,
						primitiveType: Cesium.PrimitiveType.TRIANGLES,
						boundingSphere: Cesium.BoundingSphere.fromVertices(geometrywater.attributes.position.array)
					}),
					attributes: {
						color: Cesium.ColorGeometryInstanceAttribute.fromColor(watercolor)
					}
				}),
				appearance: appearance,
				asynchronous: false,
			}))
		}
		const geometrytube = new ThreeTubeGeometry(path, 360, scope._tuberSegments, this._radius, this._radialsegments, false, false);
		this._primtube = this._scene.primitives.add(new Cesium.Primitive({
			geometryInstances: new Cesium.GeometryInstance({
				// geometry: new Cesium.EllipseGeometry({
				//     center: Cesium.Cartesian3.fromDegrees(-100.0, 20.0),
				//     semiMinorAxis: 500000.0,
				//     semiMajorAxis: 1000000.0,
				//     rotation: Cesium.Math.PI_OVER_FOUR,
				//     vertexFormat: Cesium.VertexFormat.POSITION_AND_ST
				// })
				geometry: new Cesium.Geometry({
					attributes: {
						position: new Cesium.GeometryAttribute({
							componentDatatype: Cesium.ComponentDatatype.DOUBLE,
							componentsPerAttribute: 3,
							values: geometrytube.attributes.position.array
						}),
						normal: new Cesium.GeometryAttribute({
							componentDatatype: Cesium.ComponentDatatype.FLOAT,
							componentsPerAttribute: 3,
							values: geometrytube.attributes.normal.array
						}),
						st: new Cesium.GeometryAttribute({
							componentDatatype: Cesium.ComponentDatatype.FLOAT,
							componentsPerAttribute: 2,
							values: geometrytube.attributes.uv.array
						})
					},
					indices: geometrytube.index.array,
					primitiveType: Cesium.PrimitiveType.TRIANGLES,
					boundingSphere: Cesium.BoundingSphere.fromVertices(geometrytube.attributes.position.array)
				}),
				attributes: {
					color: Cesium.ColorGeometryInstanceAttribute.fromColor(tubecolor)
				}
			}),
			appearance: new Cesium.PerInstanceColorAppearance({
				vertexShaderSource: `
                    attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec3 normal;
attribute vec4 color;
attribute float batchId;
attribute vec2 st;

varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec4 v_color;
varying vec2 v_textureCoordinates;

void main()
{
    vec4 p = czm_computePosition();

    v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
    v_normalEC = czm_normal * normal;                         // normal in eye coordinates
    v_color = color;

    v_textureCoordinates=st;
    gl_Position = czm_modelViewProjectionRelativeToEye * p;
}

                    `,
				fragmentShaderSource: `
                    varying vec3 v_positionEC;
varying vec3 v_normalEC;
varying vec4 v_color;
varying vec2 v_textureCoordinates;

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(1267.9898,23768.233)))*
        445.5453123);
}


void main()
{
    vec2 st = v_textureCoordinates;
    float rnd = random( st );
    
    vec3 positionToEyeEC = -v_positionEC;

    vec3 normalEC = normalize(v_normalEC);
#ifdef FACE_FORWARD
    normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
#endif

    vec4 color = czm_gammaCorrect(v_color);

    czm_materialInput materialInput;
    materialInput.normalEC = normalEC;
    materialInput.positionToEyeEC = positionToEyeEC;
    czm_material material = czm_getDefaultMaterial(materialInput);
    //material.diffuse = color.rgb;
    material.diffuse = mix(color.rgb,step(vec3(0.8),vec3(rnd))*0.5,0.25);
    // material.alpha = color.a;
    material.specular = 0.82;
    material.shininess=3.1;

gl_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
    
    
}

                    `,
			}),
			asynchronous: false,
		}))
	}

	/**
	 * 定位到自己
	 */
	zoomTo() {
		if (this._scene == undefined) return;
		if (this._boundingSphere == undefined) return;
		this._scene.camera.flyToBoundingSphere(this._boundingSphere, {
			duration: 0
		});
	}
}
