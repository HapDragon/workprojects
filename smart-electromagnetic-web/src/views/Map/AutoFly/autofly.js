/**
 * Created by wqy
 * Date 2022/11/11 9:16
 * Description
 */
import coordinates from '../buss/Coordinates.js'
import Bus from "@/common/eventBus.js";
import { GlobalState } from '@/common/GlobalState';

let nodelist = [];

function getpoisPlaneDistance(lon1, lon2, lat1, lat2) {
    var wgs84poi1 = new coordinates.CoordinateWGS84(lon1, lat1, 0);
    var wgs84poi2 = new coordinates.CoordinateWGS84(lon2, lat2, 0);
    return coordinates.CoordinateWGS84.GetDistancePlane(wgs84poi1, wgs84poi2);
}

export function addnode() {
    let camerasetting = _GetCamera();
    let newnode = {
        lon: camerasetting.longitude,
        lat: camerasetting.latitude,
        height: camerasetting.height,
        heading: camerasetting.heading,
        pitch: camerasetting.pitch,
        roll: camerasetting.roll,
        time: 0,
        totaltime: 0
    }

    if (nodelist.length > 0) {
        let lon1 = camerasetting.longitude,
            lon2 = nodelist[nodelist.length - 1].lon,
            lat1 = camerasetting.latitude,
            lat2 = nodelist[nodelist.length - 1].lat,
            height1 = camerasetting.height,
            height2 = nodelist[nodelist.length - 1].height;
        newnode.time = getpoisPlaneDistance(lon1, lon2, lat1, lat2) * 2 / (height1 + height2);
        newnode.totaltime = nodelist[nodelist.length - 1].totaltime + newnode.time;
    }

    nodelist.push(newnode);
}

export function removelastnode() {
    if (nodelist.length > 0) {
        nodelist.pop();
    }
}

export function removeallnodes() {
    nodelist = [];
}

export function printnodes() {
    console.log(JSON.stringify(nodelist));
}

function getnewviewpoiByTime(pois, timestamp) {
    var nowidx=pois.findIndex(item=>item.totaltime>=timestamp);
    if (nowidx ==-1) {
        return {
            lon: pois[pois.length - 1].lon,
            lat: pois[pois.length - 1].lat,
            height: pois[pois.length - 1].height,
            heading: pois[pois.length - 1].heading,
            pitch: pois[pois.length - 1].pitch,
            roll: pois[pois.length - 1].roll,
            stop:true
        }
    } else {
        var timepernow = timestamp - pois[nowidx-1].totaltime;
        var timeper = pois[nowidx].time;
        //下面对方向角进行处理，防止转大圈
        if (Math.abs(pois[nowidx].heading - pois[nowidx - 1].heading) > 180) {
            if (pois[nowidx].heading > pois[nowidx - 1].heading)
                pois[nowidx - 1].heading = pois[nowidx - 1].heading + 360;
            else
                pois[nowidx].heading = pois[nowidx].heading + 360;
        }
        //下面对翻转角进行处理，防止转大圈
        if (Math.abs(pois[nowidx].roll - pois[nowidx - 1].roll) > 180) {
            if (pois[nowidx].roll > pois[nowidx - 1].roll)
                pois[nowidx - 1].roll = pois[nowidx - 1].roll + 360;
            else
                pois[nowidx].roll = pois[nowidx].roll + 360;
        }
        return {
            lon: (timepernow / timeper) * (pois[nowidx].lon - pois[nowidx - 1].lon) + pois[nowidx - 1].lon,
            lat: (timepernow / timeper) * (pois[nowidx].lat - pois[nowidx - 1].lat) + pois[nowidx - 1].lat,
            height: (timepernow / timeper) * (pois[nowidx].height - pois[nowidx - 1].height) + pois[nowidx - 1].height,
            heading: (timepernow / timeper) * (pois[nowidx].heading - pois[nowidx - 1].heading) + pois[nowidx - 1].heading,
            pitch: (timepernow / timeper) * (pois[nowidx].pitch - pois[nowidx - 1].pitch) + pois[nowidx - 1].pitch,
            roll: (timepernow / timeper) * (pois[nowidx].roll - pois[nowidx - 1].roll) + pois[nowidx - 1].roll,
        }
    }

}

export function slow() {
    nodelist.forEach(item=>{
        item.time*=2;
        item.totaltime*=2;
    })
}
export function fast() {
    nodelist.forEach(item=>{
        item.time/=2;
        item.totaltime/=2;
    })
}

Bus.VM.$on(Bus.SignalType.Scene_Mouse_Right_Click,cancelfly)
var requestframid=null;
export function cancelfly() {
    if(requestframid!=null){
        cancelAnimationFrame(requestframid);
        requestframid=null;
    }
}
export function flyline(curnodelist) {
    curnodelist=curnodelist||nodelist;
    const jiange=10;
    var curtime=new Date();
    var totaltime=curtime;
    const func=function () {
        let newtime=new Date();
        let timespan=newtime-curtime;
        let totaltimespan=newtime-totaltime;

        // if(timespan<=jiange){
        //     requestframid=requestAnimationFrame(func);
        //     return;
        // }
        let newnode=getnewviewpoiByTime(curnodelist,totaltimespan/1000);
        _CameraGoTo(
            newnode.lat, newnode.lon, newnode.height,
            newnode.heading, newnode.pitch, newnode.roll
        );
        curtime=newtime;
        if(newnode.stop===true)
        {
            cancelAnimationFrame(requestframid);
            requestframid=null;
        }
        else{
            requestframid=requestAnimationFrame(func);
        }

    }
    requestframid=requestAnimationFrame(func)
}

//heading\pitch都为角度，roll目前全部传参为0
function _CameraGoTo(latitude, longitude, height, heading, pitch, roll) {
    // camera set to a position with an orientation using heading, pitch and roll.
    const cesiumViewer = GlobalState.getInstance().viewer;
    if(cesiumViewer != null){
        cesiumViewer.scene.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
            orientation: {
                heading: Cesium.Math.toRadians(heading),
                pitch: Cesium.Math.toRadians(pitch),
                roll: Cesium.Math.toRadians(roll),
            },
        });
    }
}

function _GetCamera() {
    const cesiumViewer = GlobalState.getInstance().viewer;
    if(cesiumViewer != null){
        var ellipsoid = cesiumViewer.scene.globe.ellipsoid;
        var cartesian3 = cesiumViewer.camera.position;
        var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var alt = cartographic.height;
        return {
            longitude: lng,
            latitude: lat,
            height: alt,
            heading: Cesium.Math.toDegrees(cesiumViewer.camera.heading),
            pitch: Cesium.Math.toDegrees(cesiumViewer.camera.pitch),
            roll: Cesium.Math.toDegrees(cesiumViewer.camera.roll),
        };
    }
}
