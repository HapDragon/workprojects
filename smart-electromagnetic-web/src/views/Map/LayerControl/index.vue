<script setup>
	import { GlobalState } from "@/common/GlobalState";
	import { getTdtImageLabel, getTdtImage, getTdtVector, getTdtVectorLabel } from "@/views/Map/buss/MapHandler";
	import { buildings } from "@/views/Map/MapFeatures/mesh.js";
	import { store } from "../../../store/index.js";
	import { setsituationmapshow as controlShow } from "@/views/modules/ActionSupport/situationdraw_control";
	import { setsituationmapshow as interfereShow } from "@/views/modules/ActionSupport/situationdraw_interfere";
	import { setsituationmapshow as emiterShow} from '@/views/modules/situationdraw'
    import { setsituationmapshow as interfereJudgeShow} from "@/views/modules/interfereJudge/situationdraw";
	import {setsituationmapshow as connectjudgeShow} from "@/views/modules/ConnectJudge/situationdraw";

	const LayerData = ref([
		{
			id: 1,
			label: "影像",
			children: [
				// { id: 2, label: '天地图影像' },
				// { id: 3, label: '天地图矢量' },
			],
		},
		{
			id: 2,
			label: "地形",
		},
		{
			id: 3,
			label: "倾斜模型",
		},
		{
			id: 4,
			label: "场强热力图",
			children: [
				{ id: 5, label: "发射机场强" },
				{ id: 6, label: "无人控制站场强" },
				{ id: 8, label: "车辆场强" },
				{ id: 7, label: "无人干扰站场强" },
				{ id: 9, label: "干扰机场强" },
			],
		},
	]);
	const defaultchecked = ref([1, 3, 4, 5]); // 默认已经选中的节点
	const layertreeRef = ref(null);
	function handleCheckChange(data, checked) {
		//天地图影像和天地图矢量只能选一个而且有一个必选
		// if (data.label == '天地图影像' && checked) {
		// 	changeMap('天地图影像');
		// 	layertreeRef.value.setChecked(3, false);
		// } else if (data.label == '天地图影像' && !checked) {
		// 	layertreeRef.value.setChecked(2, false);
		// } else if (data.label == '天地图矢量' && checked) {
		// 	changeMap('天地图矢量');
		// 	layertreeRef.value.setChecked(2, false);
		// } else if (data.label == '天地图矢量' && !checked) {
		// 	layertreeRef.value.setChecked(3, false);
		if (data.label == "影像") {
			GlobalState.getInstance().viewer.imageryLayers.get(0).show = checked;
		} else if (data.label == "地形") {
			if (checked) {
				GlobalState.getInstance().viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
					url: config.terrain.url,
				});
			} else {
				GlobalState.getInstance().viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
			}
		} else if (data.label == "倾斜模型") {
			buildings.setvisible(checked);
		} else if (data.label == "发射机场强") {
			emiterShow(checked);
		} else if (data.label == "无人干扰站场强") {
			interfereShow(checked);
		} else if (data.label == "车辆场强") {
			connectjudgeShow(checked);
		} else if (data.label == "干扰机场强") {
			interfereJudgeShow(checked);
		} else if (data.label == "无人控制站场强") {
			controlShow(checked);
		}
	}

	// 天地图的矢量和影像切换
	function changeMap(labeltext) {
		if (labeltext == "天地图影像") {
			GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(getTdtImage());
		} else {
			GlobalState.getInstance().viewer.imageryLayers.addImageryProvider(getTdtVector());
		}
		//保证显示效果和性能，1s后移除第二层底图
		setTimeout(() => {
			GlobalState.getInstance().viewer.imageryLayers.remove(
				GlobalState.getInstance().viewer.imageryLayers.get(GlobalState.getInstance().viewer.imageryLayers.length - 2),
			);
		}, 3000);
	}
</script>

<template>
	<div id="layercontainer">
		<el-tree
			:data="LayerData"
			ref="layertreeRef"
			show-checkbox
			@check-change="handleCheckChange"
			:default-checked-keys="defaultchecked"
		/>
	</div>
</template>

<style lang="less">
	#layercontainer {
		position: absolute;
		background-color: #071f3588;
		box-sizing: border-box;
		top: 16.4vh;
		right: 6vh;
		width: 30vh;
		// min-height: 15vh;
		font-size: 2vh;
	}

	#layercontainer .el-tree {
		background-color: transparent;
		color: #ffffffb2;
		--el-tree-node-hover-bg-color: transparent;
	}
	#layercontainer .el-tree-node__content:hover {
		background-color: transparent;
		color: #3affff;
	}
</style>
