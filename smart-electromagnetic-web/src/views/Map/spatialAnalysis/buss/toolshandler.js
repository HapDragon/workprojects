/**
 * 地图测量工具和采点以及天气特效
 */
import Bus from '@/common/eventBus';
import { GlobalState } from '@/common/GlobalState';
import { GetPickedRayPositionWGS84, SetEntity, RemoveEntityById, GetLerpWGS84, GetWindowPosFromWGS84 } from '@/views/Map/buss/MapHandler.js';
import Coordinates from '@/views/Map/buss/Coordinates';

const MeasureHeightEntityId = ref('measureheightentity'); //高度量算entityid
const MeasureDistanceEntityId = ref('measuredistanceentity'); //距离量算entityid
const MeasureSquareEntityId = ref('measuresquareentity'); //面积量算entityid
const MeasureLocationEntityId = ref('measurelocationentity'); //位置量算entity
const CurrentHeightDistance = ref(0); //当前高度空间距离 单位m
const CurrentHeightVerticalDistance = ref(0); //当前高度垂直距离 单位m
const CurrentHeightHorizonDistance = ref(0); //当前高度水平距离 单位m
const CurrentDistance = ref(0); //当前距离量算距离数值 单位m
const CurrentSquare = ref(0); //当前面积量算数值 单位平方米
const subcurTool = ref(null);
const HeightPois = ref([]); //高度量算所需点
const DistancePois = ref([]); //距离量算所需点
const SquarePois = ref([]); //面积量算所需点
const LocationPoi = ref(null); //位置量算所需点
const SquareLeftClicked = ref(false);
const SquarePolygon = ref(null); //面积量算所需面
const DistanceStartMeasure = ref(false); //开始距离量算，结束设置为false
const HeightStartMeasure = ref(false); //开始高度量算，结束设置为false
const SquareStartMeasure = ref(false); //开始面积量算，结束设置为false
const CesiumPostRenderLister = ref(null); //CesiumPostRender监听事件
const showmousetip = ref(false); // 是否显示鼠标操作提示
const MeasureType =  ref({
    HEIGHT_MEASURE: 'elevation',
    DISTANCE_MEASURE: 'distance',
    SQUARE_MEASURE: 'area',
});
// 拾取坐标点
const wgs84poi = ref({
    lon: '',
    lat: '',
    height: '',
});

// 距离、面积、高度量测
function maesureMouseFunc() {
    Bus.VM.$on('Scene_Mouse_Left_Click', measureLeftClickFunc, 3);
    Bus.VM.$on('Scene_Mouse_Right_Click', measureRightClickFunc, 3);
    Bus.VM.$on('Scene_Mouse_Move', measureMouseMoveFunc, 3);
    
}
// 拾取地理位置
function pickpointsMouseFunction () {
    Bus.VM.$on('Scene_Mouse_Left_Click', pickpointsLeftClickFunc, 3);
}
function removeMeasureMouseEvent() {
    Bus.VM.$off('Scene_Mouse_Left_Click', measureLeftClickFunc);
    Bus.VM.$off('Scene_Mouse_Right_Click', measureRightClickFunc);
    Bus.VM.$off('Scene_Mouse_Move', measureMouseMoveFunc);
}
function removepickpointsMouseEvent() {
    Bus.VM.$off('Scene_Mouse_Left_Click', pickpointsLeftClickFunc);
}
// 测距、面积、高度鼠标左键点击事件
function measureLeftClickFunc(movement) {
    if (!subcurTool.value) return;
    let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
    if (!pos) return;
    if (subcurTool.value.name === MeasureType.value.HEIGHT_MEASURE) {
        if (HeightPois.value.length > 0) {
            HeightStartMeasure.value = false;
            return;
        }
        HandleHeightLeftClick(pos);
        HeightStartMeasure.value = true;
    } else if (subcurTool.value.name === MeasureType.value.DISTANCE_MEASURE) {
        if (DistancePois.value.length === 0) {
            DistanceStartMeasure.value = true;
        }
        if (!DistanceStartMeasure.value) return;
        HandleDistanceLeftClick(pos);
    } else if (subcurTool.value.name === MeasureType.value.SQUARE_MEASURE) {
        if (SquarePois.value.length === 0) {
            SquareStartMeasure.value = true;
        }
        if (!SquareStartMeasure.value) return;
        HandleSquareLeftClick(pos);
    } else if (subcurTool.value.name == MeasureType.value.LOCATION_MEASURE) {
        HandleLocationLeftClick(pos);
    }
}
// 测距、面积、高度鼠标左键点击事件
function measureRightClickFunc(movement) {
    if (!subcurTool.value) return;
    let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
    if (!pos) return;
    showmousetip.value = false;
    if (subcurTool.value.name === MeasureType.value.HEIGHT_MEASURE) {
        if(HeightPois.value.length <= 1) {
            HeightStartMeasure.value = true;
        }
        DistanceStartMeasure.value = false;
        HandleHeightRightClick();
    } else if (subcurTool.value.name === MeasureType.value.DISTANCE_MEASURE) {
        if (!DistanceStartMeasure.value) return;
        HandleDistanceLeftClick(pos);
        DistanceStartMeasure.value = false;
        HandleDistanceRightClick(pos);
        
    } else if (subcurTool.value.name === MeasureType.value.SQUARE_MEASURE) {
        SquareStartMeasure.value = false;
        HandleSquareRightClick(pos);
    }
}
// 测距、面积、高度鼠标移动事件
function measureMouseMoveFunc(movement) {
    if (!subcurTool.value) return;
    let pos = GetPickedRayPositionWGS84(movement.endPosition, GlobalState.getInstance().viewer);
    if (pos == null) return;
    if (subcurTool.value.name === MeasureType.value.HEIGHT_MEASURE) {
        //高度量算
        if (HeightPois.value.length === 0) return;
        if (HeightStartMeasure.value === false) return;
        HandleHeightMouseMove(pos);
    } else if (subcurTool.value.name === MeasureType.value.DISTANCE_MEASURE) {
        //距离量算
        if (DistancePois.value.length === 0) return;
        if (DistanceStartMeasure.value === false) return;
        HandleDistanceMouseMove(pos);
    } else if (subcurTool.value.name === MeasureType.value.SQUARE_MEASURE) {
        //面积量算
        if (SquarePois.value.length === 0) return;
        if (SquareStartMeasure.value === false) return;
        HandleSquareMouseMove(pos);
    }
}
// 拾取地理位置鼠标左键点击事件
function pickpointsLeftClickFunc(movement) {
    if (subcurTool.value && subcurTool.value.name === 'pick_geo_location') {
        let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
        if (!pos) return;
        //画点
        SetEntity(
            new Cesium.Entity({
                id: MeasureLocationEntityId.value + 'poi',
                position: Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height),
                billboard: {
                    image: '/img/SpaceMeasure/getlocationmap.png',
                    width: 25,
                    height: 25,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    sizeInMeters: false,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                },
            }),
            GlobalState.getInstance().viewer
        );
        wgs84poi.value.lon = pos.longitude;
        wgs84poi.value.lat = pos.latitude;
        wgs84poi.value.height = pos.height;
    }
}
// 测距点击鼠标左键点击
function HandleDistanceLeftClick (pos) {
    DistancePois.value.push(pos);
    SetEntity(
        new Cesium.Entity({
            id: MeasureDistanceEntityId.value + 'poi' + DistancePois.value.length.toString(),
            position: pos.ToCartesian(),
            point: {
                color: Cesium.Color.YELLOW,
                pixelSize: 10,
                // scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        }),
        GlobalState.getInstance().viewer
    );
};
// 测距点击鼠标左键之后鼠标移动
function HandleDistanceMouseMove (pos) {
    //计算距离
    CurrentDistance.value = (CurrentFixedDistance() + Coordinates.CoordinateWGS84.GetDistance(DistancePois.value[DistancePois.value.length - 1], pos)).toFixed(2);
    //设置label位置
    let posscreen = GetWindowPosFromWGS84(pos, GlobalState.getInstance().viewer);
    document.getElementById('distancediv').style.left = (posscreen.x + 6).toString() + 'px';
    document.getElementById('distancediv').style.top = (posscreen.y + 6).toString() + 'px';
    //画线
    let cartesians = DistancePoisCartesian().slice();
    cartesians.push(pos.ToCartesian());
    SetEntity(
        new Cesium.Entity({
            id: MeasureDistanceEntityId.value + 'polyline0',
            polyline: {
                positions: cartesians,
                material: new Cesium.Color(0, 1, 0, 0.6),
                width: 2,
                clampToGround: true,
            },
        }),
        GlobalState.getInstance().viewer
    );
}
// 测距点击鼠标右键
function HandleDistanceRightClick(pos){
    let animateEvent = function (scene, time) {
        let position = Cesium.Cartesian3.fromDegrees(parseFloat(pos.longitude), parseFloat(pos.latitude), parseFloat(pos.height));
        let canvasPosition = GlobalState.getInstance().viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());
        let container = document.getElementById('distancediv');
        if (Cesium.defined(canvasPosition)) {
            // htmlOverlay.style.position = "absolute";
            container.style.top = canvasPosition.y - container.clientHeight - 10 + 'px';
            container.style.left = canvasPosition.x - container.clientWidth / 2 + 'px';
        }
    };
    GlobalState.getInstance().viewer.scene.postUpdate.addEventListener(animateEvent);
    return animateEvent;
}
// 测面积鼠标左键点击
function HandleSquareLeftClick (pos) {
    //this.SquarePois.push(pos);
    if (SquarePois.value.length > 0) {
        SquarePois.value[SquarePois.value.length - 1] = pos;
    } else {
        SquarePois.value.push(pos);
    }
    SetEntity(
        new Cesium.Entity({
            id: MeasureSquareEntityId.value + 'poi' + SquarePois.value.length.toString(),
            position: pos.ToCartesian(),
            point: {
                pixelSize: 10,
                color: Cesium.Color.YELLOW,
                // scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        }),
        GlobalState.getInstance().viewer
    );
    SquareLeftClicked.value = true;
}
// 测面积鼠标移动
function HandleSquareMouseMove (pos) {
    //设置点
    if (SquareLeftClicked.value) {
        SquarePois.value.push(pos);
        SquareLeftClicked.value = false;
    } else {
        SquarePois.value[SquarePois.value.length - 1] = pos;
    }
    //画点
    SetEntity(
        new Cesium.Entity({
            id: MeasureSquareEntityId.value + 'poi' + SquarePois.value.length.toString(),
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
    let cartesians = SquarePoisCartesian().slice();
    cartesians.push(pos.ToCartesian());
    cartesians.push(SquarePois.value[0].ToCartesian());
    SetEntity(
        new Cesium.Entity({
            id: MeasureSquareEntityId.value + 'polyline0',
            polyline: {
                positions: cartesians,
                material: new Cesium.Color(0, 1, 0, 0.6),
                width: 2,
                // depthFailMaterial:this.Color.ToCesiumColor()
            },
        }),
        GlobalState.getInstance().viewer
    );
    if (SquarePois.value < 2) return; //三点才能组成面
    //设置polygon
    cartesians.splice(cartesians.length - 1, 1);
    SetEntity(
        {
            id: MeasureSquareEntityId.value + 'polygon',
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
    CurrentSquare.value = Coordinates.CoordinateWGS84.GetSquareFromPois(SquarePois.value).toFixed(2);
    let posscreen = GetWindowPosFromWGS84(pos, GlobalState.getInstance().viewer);
    document.getElementById('squarediv').style.left = (posscreen.x + 6).toString() + 'px';
    document.getElementById('squarediv').style.top = (posscreen.y + 6).toString() + 'px';
}
// 侧面积鼠标右键点击
function HandleSquareRightClick(pos) {
    let animateEvent = function (scene, time) {
        let position = Cesium.Cartesian3.fromDegrees(parseFloat(pos.longitude), parseFloat(pos.latitude), parseFloat(pos.height));
        let canvasPosition = GlobalState.getInstance().viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());
        let container = document.getElementById('squarediv');
        if (Cesium.defined(canvasPosition)) {
            // htmlOverlay.style.position = "absolute";
            container.style.top = canvasPosition.y - container.clientHeight - 10 + 'px';
            container.style.left = canvasPosition.x - container.clientWidth / 2 + 'px';
        }
    };
    GlobalState.getInstance().viewer.scene.postUpdate.addEventListener(animateEvent);
    return animateEvent;
}
// 测高度鼠标左键点击
function HandleHeightLeftClick (pos) {
    HeightPois.value.push(pos);
    SetEntity(
        new Cesium.Entity({
            id: MeasureHeightEntityId.value + 'poi0',
            position: pos.ToCartesian(),
            point: {
                pixelSize: 10,
                color: Cesium.Color.YELLOW,
                // scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        }),
        GlobalState.getInstance().viewer
    );
    
    let animateEvent = function (scene, time) {
        let position = Cesium.Cartesian3.fromDegrees(parseFloat(pos.longitude), parseFloat(pos.latitude), parseFloat(pos.height));
        let canvasPosition = GlobalState.getInstance().viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());
        let container = document.getElementById('heighthorizondiv');
        if (Cesium.defined(canvasPosition)) {
            // htmlOverlay.style.position = "absolute";
            container.style.top = canvasPosition.y - container.clientHeight - 10 + 'px';
            container.style.left = canvasPosition.x - container.clientWidth / 2 + 'px';
        }
    };
    GlobalState.getInstance().viewer.scene.postUpdate.addEventListener(animateEvent);
    return animateEvent;
}
// 测高度鼠标移动
function HandleHeightMouseMove (pos) {
    //根据当前位置获取新点，经纬度是当前pos，高度是上一个点的pos
    let newpos = new Coordinates.CoordinateWGS84(pos.longitude, pos.latitude, HeightPois.value[0].height);
    if (HeightPois.value.length > 1) {
        HeightPois.value[1] = pos;
        HeightPois.value[2] = newpos;
    } else {
        HeightPois.value.push(pos);
        HeightPois.value.push(newpos);
    }
    //画点
    // console.log("经度:"+pos.longitude+",纬度:"+pos.latitude+",高度:"+pos.height+"米");
    SetEntity(
        new Cesium.Entity({
            id: MeasureHeightEntityId.value + 'poi1',
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
            id: MeasureHeightEntityId.value + 'poi2',
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
            id: MeasureHeightEntityId.value + 'polyline0',
            polyline: {
                positions: [HeightPois.value[0].ToCartesian(), pos.ToCartesian(), newpos.ToCartesian(), HeightPois.value[0].ToCartesian()],
                material: new Cesium.Color(0, 1, 0, 0.6),
                width: 2,
                // depthFailMaterial:this.Color.ToCesiumColor()
            },
        }),
        GlobalState.getInstance().viewer
    );
    //获取标签位置
    let labelpos0, labelpos1, labelpos2;
    labelpos0 = GetLerpWGS84(HeightPois.value[0], pos, 0.5, GlobalState.getInstance().viewer);
    labelpos1 = GetLerpWGS84(HeightPois.value[0], newpos, 0.5, GlobalState.getInstance().viewer);
    labelpos2 = GetLerpWGS84(pos, newpos, 0.5, GlobalState.getInstance().viewer);
    //设置标签位置
    let posscreen0 = GetWindowPosFromWGS84(labelpos0, GlobalState.getInstance().viewer);
    let posscreen1 = GetWindowPosFromWGS84(labelpos1, GlobalState.getInstance().viewer);
    let posscreen2 = GetWindowPosFromWGS84(labelpos2, GlobalState.getInstance().viewer);
    document.getElementById('heightverticaldiv').style.left = (posscreen2.x + 6).toString() + 'px';
    document.getElementById('heightverticaldiv').style.top = (posscreen2.y + 6).toString() + 'px';
    document.getElementById('heighthorizondiv').style.left = (posscreen1.x + 6).toString() + 'px';
    document.getElementById('heighthorizondiv').style.top = (posscreen1.y + 6).toString() + 'px';
    document.getElementById('heightdiv').style.left = (posscreen0.x + 6).toString() + 'px';
    document.getElementById('heightdiv').style.top = (posscreen0.y + 6).toString() + 'px';
    //计算距离
    CurrentHeightDistance.value = Coordinates.CoordinateWGS84.GetDistance(HeightPois.value[0], pos).toFixed(2);
    //this.CurrentHeightHorizonDistance=(Coordinates.CoordinateWGS84.GetDistancePlane(this.HeightPois[0],pos)).toFixed(2);
    CurrentHeightHorizonDistance.value = Coordinates.CoordinateWGS84.GetDistancePlaneWithLocal(HeightPois.value[0], pos).toFixed(2);
    CurrentHeightVerticalDistance.value = (pos.height - newpos.height).toFixed(2);
}
// 测高度鼠标右键点击
function HandleHeightRightClick() {
    HeightStartMeasure.value = false;
    let animateEvent = function (scene, time) {
        if(HeightPois.value.length == 0) return;
        let labelpos1 = GetLerpWGS84(HeightPois.value[0], HeightPois.value[1], 0.5, GlobalState.getInstance().viewer);
        let labelpos2 = GetLerpWGS84(HeightPois.value[1], HeightPois.value[2], 0.5, GlobalState.getInstance().viewer);
        let posscreen1 = GetWindowPosFromWGS84(labelpos1, GlobalState.getInstance().viewer);
        let posscreen2 = GetWindowPosFromWGS84(labelpos2, GlobalState.getInstance().viewer);
        let container1 = document.getElementById('heightdiv');
        let container2 = document.getElementById('heightverticaldiv');
        container1.style.top = posscreen1.y + 6 + 'px';
        container1.style.left = posscreen1.x + 6 + 'px';
        container2.style.top = posscreen2.y + 6 + 'px';
        container2.style.left = posscreen2.x + 6 + 'px';
    };
    GlobalState.getInstance().viewer.scene.postUpdate.addEventListener(animateEvent);
    return animateEvent;
}
function DistancePoisCartesian() {
    let result = [];
    DistancePois.value.forEach((poi) => {
        result.push(poi.ToCartesian());
    });
    return result;
}
function CurrentFixedDistance() {
    //由已经在地表点击点组成的线段的总距离
    let dis = 0;
    for (let i = 1; i < DistancePois.value.length; i++) {
        dis += Coordinates.CoordinateWGS84.GetDistance(DistancePois.value[i - 1], DistancePois.value[i]);
    }
    return dis;
}
function SquarePoisCartesian() {
    let result = [];
    SquarePois.value.forEach((poi) => {
        result.push(poi.ToCartesian());
    });
    return result;
}
// 清除方法
function MeasureHeightClear () {
    for (var i = 0; i < 3; i++) {
        RemoveEntityById(GlobalState.getInstance().viewer, MeasureHeightEntityId.value + 'poi' + i.toString());
    }
    RemoveEntityById(GlobalState.getInstance().viewer, MeasureHeightEntityId.value + 'polyline0');
    HeightPois.value = [];
}
function MeasureDistanceClear () {
    for (var i = 0; i < DistancePois.value.length; i++) {
        RemoveEntityById(GlobalState.getInstance().viewer, MeasureDistanceEntityId.value + 'poi' + (i + 1).toString());
    }
    RemoveEntityById(GlobalState.getInstance().viewer, MeasureDistanceEntityId.value + 'polyline0');
    //既然不使用billboard entity方式显示标签，则不需要在这里删除label entity
    DistancePois.value = [];
    DistanceStartMeasure.value = false;
}
function MeasureSquareClear () {
    for (var i = 0; i < SquarePois.value.length; i++) {
        RemoveEntityById(GlobalState.getInstance().viewer, MeasureSquareEntityId.value + 'poi' + (i + 1).toString());
    }
    RemoveEntityById(GlobalState.getInstance().viewer, MeasureSquareEntityId.value + 'polyline0');
    RemoveEntityById(GlobalState.getInstance().viewer, MeasureSquareEntityId.value + 'polygon');
    SquarePois.value = [];
    SquareStartMeasure.value = false;
}
function MeasureLocationClear() {
    RemoveEntityById(GlobalState.getInstance().viewer, MeasureLocationEntityId.value + 'poi');
    LocationPoi.value = null;
    // this.$refs.getlocation.isShow = false;
}
function MeasureClear() {
    let _counts = GlobalState.getInstance().viewer.scene.postUpdate._listeners.length;
    for(let i = 0; i < _counts; i++) {
        GlobalState.getInstance().viewer.scene.postUpdate.removeEventListener(GlobalState.getInstance().viewer.scene.postUpdate._listeners[i]);
    }
    MeasureDistanceClear();
    MeasureHeightClear();
    MeasureSquareClear();
    MeasureLocationClear();
    subcurTool.value = null;
}

export {
    MeasureHeightEntityId, MeasureDistanceEntityId, MeasureSquareEntityId, MeasureLocationEntityId, CurrentHeightDistance, CurrentHeightVerticalDistance,
    CurrentHeightHorizonDistance, CurrentDistance, CurrentSquare, subcurTool, HeightPois, DistancePois, SquarePois, LocationPoi, SquareLeftClicked,
    SquarePolygon, DistanceStartMeasure, HeightStartMeasure, SquareStartMeasure, CesiumPostRenderLister, maesureMouseFunc, pickpointsMouseFunction,
    removeMeasureMouseEvent, removepickpointsMouseEvent, MeasureClear, wgs84poi, showmousetip,
}
