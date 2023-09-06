/**
 * 空间量算句柄
 */
import $ from "jquery";

let handlerDis, handlerArea, handlerHeight;
let clampMode = 0; //空间模式
let vueInstance = {};
let VI = {};

function initHandle() {
  VI = this.vueInstance;
}

function activeMeasureHandler(viewer, type) {
  initAddListeningMeasure(viewer);
  switch (type) {
    case 'distance':
      deactiveAll();
      handlerDis && handlerDis.activate();
      break;
    case 'area':
      deactiveAll();
      handlerArea && handlerArea.activate();
      break;
    case 'elevation':
      deactiveAll();
      handlerHeight && handlerHeight.activate();
      break;
    case 'clear':
      clearAll();
      break;
    default:
      break;
  }
}

function initAddListeningMeasure(viewer) {
  //初始化测量距离
  handlerDis = handlerDis || new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Distance, clampMode);
  //注册测距功能事件
  handlerDis.measureEvt.addEventListener(function (result) {
    var dis = Number(result.distance);
    var distance = dis > 1000 ? (dis / 1000).toFixed(2) + 'km' : dis.toFixed(2) + 'm';
    handlerDis.disLabel.text = '距离:' + distance;
  });
  handlerDis.activeEvt.addEventListener(function (isActive) {
    if (isActive == true) {
      // VI.basic3dStates.distanceState = true;
      viewer.enableCursorStyle = false;
      viewer._element.style.cursor = '';
      $('body').removeClass('measureCur').addClass('measureCur');
    }else {
      // VI.basic3dStates.distanceState = false;
      VI.subcurTool = null;
      viewer.enableCursorStyle = true;
      $('body').removeClass('measureCur');
    }
  });

  //初始化测量面积
  handlerArea = handlerArea || new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Area, clampMode);
  handlerArea.measureEvt.addEventListener(function (result) {
    var mj = Number(result.area);
    var area = mj > 1000000 ? (mj / 1000000).toFixed(2) + 'km²' : mj.toFixed(2) + '㎡'
    handlerArea.areaLabel.text = '面积:' + area;
  });
  handlerArea.activeEvt.addEventListener(function (isActive) {
    if (isActive == true) {
      // VI.basic3dStates.areaState = true;
      viewer.enableCursorStyle = true;
      viewer._element.style.cursor = '';
      $('body').removeClass('measureCur').addClass('measureCur');
    }else {
        // VI.basic3dStates.areaState = false;
        VI.subcurTool = null;
        viewer.enableCursorStyle = false;
      $('body').removeClass('measureCur');
    }
  });

  //初始化测量高度
  handlerHeight = handlerHeight || new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.DVH);
  handlerHeight.measureEvt.addEventListener(function (result) {
    var distance = result.distance > 1000 ? (result.distance / 1000).toFixed(2) + 'km' : result.distance + 'm';
    var vHeight = result.verticalHeight > 1000 ? (result.verticalHeight / 1000).toFixed(2) + 'km' : result.verticalHeight + 'm';
    var hDistance = result.horizontalDistance > 1000 ? (result.horizontalDistance / 1000).toFixed(2) + 'km' : result.horizontalDistance + 'm';
    handlerHeight.disLabel.text = '空间距离:' + distance;
    handlerHeight.vLabel.text = '垂直高度:' + vHeight;
    handlerHeight.hLabel.text = '水平距离:' + hDistance;
  });
  handlerHeight.activeEvt.addEventListener(function (isActive) {
    if (isActive == true) {
      // VI.basic3dStates.altitudeState = true;
      viewer.enableCursorStyle = false;
      viewer._element.style.cursor = '';
      $('body').removeClass('measureCur').addClass('measureCur');
    }else {
        // VI.basic3dStates.altitudeState = false;
        VI.subcurTool = null;
        viewer.enableCursorStyle = true;
      $('body').removeClass('measureCur');
    }
  });
}

function deactiveAll() {
  // resetStatus();
  handlerDis && handlerDis.deactivate();
  handlerArea && handlerArea.deactivate();
  handlerHeight && handlerHeight.deactivate();
}

function resetStatus() {
  VI.subcurTool = null;
}

function clearAll() {
  handlerDis && handlerDis.clear();
  handlerArea && handlerArea.clear();
  handlerHeight && handlerHeight.clear();
}

export default {
  activeMeasureHandler,
  initHandle,
  vueInstance,
  clearAll
}
