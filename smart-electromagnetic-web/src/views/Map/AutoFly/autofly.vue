<!--
 * Created by wqy
 * Date 2022/11/11 9:17
 * Description
-->
<template>
	<div id="autofly" v-drag:[dragcontainerclassname]>
		<div class="controltitle">场景漫游</div>
		<img type="image" class="closebtn" src="@/views/Map/assets/close.svg" @click="onclose" />
		<div class="intervalline"></div>
		<el-scrollbar>
			<div class="routecontainer">
				<div v-for="(item, index) in flylines" class="flylineitem" @dblclick="onflyline(item)">
					<span>{{ item.name }}</span>
					<div class="contentinterval"></div>
				</div>
			</div>
		</el-scrollbar>

		<!-- 以下按钮可用于取点 -->
		<!-- <el-button @click="onaddnode">addnode</el-button>-->
		<!-- <el-button @click="onprintnode">printnode</el-button>-->
		<!-- <el-button @click="onremoveallnodes">removeallnodes</el-button>-->
		<!-- <el-button @click="onremovelastnode">removelastnode</el-button>-->
		<!-- <el-button @click="flylinetest">flyline</el-button>-->
		<!-- <el-button @click="onslow">slow</el-button>-->
		<!-- <el-button @click="onfast">fast</el-button>-->
	</div>
</template>

<script setup>
import { addnode, printnodes, flyline, removeallnodes, removelastnode, slow, fast, cancelfly } from './autofly';

const { proxy } = getCurrentInstance();
const dragcontainerclassname = ref('controltitle');
const flylines = ref([]);

function onaddnode() {
	addnode();
}
function onremovelastnode() {
	removelastnode();
}
function onremoveallnodes() {
	removeallnodes();
}
function onprintnode() {
	printnodes();
}
function onflyline(item) {
	proxy.$parent.ishowAutofly = false;
	cancelfly();
	flyline(item.nodes);
}
function flylinetest() {
	flyline();
}
function onslow() {
	slow();
}
function onfast() {
	fast();
}
function onclose() {
	cancelfly();
	proxy.$parent.ishowAutofly = false;
}

onMounted(() => {
	flylines.value = FlyNodes;
});
</script>

<style scoped>
@import url('./autoflystyle.css');
</style>

<style>
.el-scrollbar {
	height: 85%;
}
</style>
