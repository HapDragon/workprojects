<script setup>
	import Bus from '@/common/eventBus';
	import cesiummap from "@/views/Map/Map.vue";
	import compass from "@/views/Map/Compass.vue";
	document.body.addEventListener('mousemove',(event)=>{
		Bus.VM.$emit(Bus.SignalType.AppMouseMove,event);
	});
	document.oncontextmenu =function(){
		Bus.VM.$emit(Bus.SignalType.AppMouseRightClick,event);
		return false;
	}
</script>

<template>
    <cesiummap></cesiummap>
    <compass></compass>
	<router-view></router-view>
</template>

<style lang="less">
// 引入默认样式
@import url('./assets/global.less');
// 引入阿里巴巴字体
@import url('./assets/font.css');
#app {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
}
</style>
