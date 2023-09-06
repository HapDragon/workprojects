/**
 * 电磁平台倾斜三维数据
 */


import { GlobalState } from "@/common/GlobalState";

export const buildings = {
    // roleindex:[IndexSettingMainView.EmergencyManage,IndexSettingMainView.GridManage,IndexSettingMainView.OneMap,IndexSettingMainView.RunMonitor,IndexSettingMainView.Simulate],
    data: undefined,
    setvisible(visible){
        let scope = this;
        if(visible && this.data == undefined){
            scope.data = GlobalState.getInstance().viewer.scene.primitives.add(
                new Cesium.Cesium3DTileset({
                    url: config.data_3dtile,
					shadows: Cesium.ShadowMode.CAST_ONLY,
                    show: visible,
                }),
            );
			// scope.data.style = new Cesium.Cesium3DTileStyle({
			// 	color: "color('rgba(255,255,255,0.5)')",
			//
			// });
			GlobalState.getInstance().viewer.camera.setView({
				destination : Cesium.Cartesian3.fromDegrees(118.81602974710775, 32.1404495782302, 377.3106901908607),
				orientation : {
					heading :0.44088091374101435,
					pitch : -0.5405112119162183,
					roll : 0.0
				}
            })
            // scope.data.readyPromise.then(function () {
            //     scope.raise3dtile(scope.data, -8);
            // });
            // GlobalState.getInstance().viewer.flyTo(scope.data);
        } else if(this.data != undefined){
            this.data.show = visible;
        }
    },
    /**
     * 倾斜模型的变换，整体抬高一些，防止被地形遮盖
     * @param tileset 待变换的模型
     * @param height 平移的高度
     */
    raise3dtile(tileset, height) {
        // 平移的高度
        let raiseHeight = height == null ? 10 : height;
        // GlobalState.getInstance().viewer.camera.viewBoundingSphere(tileset.boundingSphere);
        let boundingSphere = tileset.boundingSphere;
        let cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        let surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0);
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    },


}
