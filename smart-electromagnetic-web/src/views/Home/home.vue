<script setup>

	import maptools from "@/views/Map/spatialAnalysis/MapTools.vue";
	import mainview from "@/views/mainview/mainview.vue";
	import mousetip from '@/components/mousetip/index.vue'
	import Bus from '@/common/eventBus';
	const showmousetip=ref(false);
	const mousetiptext=ref('');
	Bus.VM.$on(Bus.SignalType.SHOWMOUSETIP,function (options) {
		showmousetip.value=options.visible;
		mousetiptext.value=options.text;
	});
</script>

<script>
    import {removefieldpopup} from "../modules/situationdraw";

	export default defineComponent({
		beforeRouteLeave(to, from, next) {
			removefieldpopup();
			next();
		},
	});
</script>


<template>
	<div id="Home" class="homecontainer">
		<div id="backgroundimg"></div>


		<maptools></maptools>
		<mainview></mainview>
		<mousetip v-if="showmousetip">
			<span id="mousetipspan">{{mousetiptext}}</span>
		</mousetip>
	</div>
</template>

<style scoped lang="less">
	.homecontainer {
		width: 100%;
		height: 12vh;
		position: absolute;
		z-index: 1;
        top:0;

	}
	#mousetipspan {
		background: #00000066;
		color: white;
		display: block;
		// margin-top: -30px;
		// margin-left: -20px;

	}
</style>
