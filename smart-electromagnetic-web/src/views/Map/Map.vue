<script setup>
import { CesiumViewer, getWebTile } from './buss/MapHandler';
// import { onMounted } from "vue";
import { buildings } from '@/views/Map/MapFeatures/mesh.js';
onMounted(() => {
	let njdom = getWebTile(config.localmap, true).provider;
	CesiumViewer([njdom], 'MapContainer');
	buildings.setvisible(true);
});
</script>

<template>
	<div id="Map">
		<div id="MapContainer"></div>
	</div>
</template>

<style scoped lang="less">
#Map,
#MapContainer {
	width: 100%;
	height: 100%;
}
</style>
