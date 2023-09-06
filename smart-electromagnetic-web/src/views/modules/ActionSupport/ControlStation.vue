<!--
 * Created by wqy
 * Date 2023/8/7 19:26
 * Description 无人机放置
-->
<template>
	<div>
		<popdialog @close="onclickCancel" :title="title" :isshowdialog="showdialog" :width="'40vh'" height="auto" :top="top" :left="left">
			<template v-slot:container>
				<el-form id="transmiterplace" label-width="70px">
					<el-form-item label="发射频率">
						<el-input v-model="querymodelcopy.frequency"></el-input>
					</el-form-item>
					<el-form-item label="发射功率">
						<el-input v-model="querymodelcopy.power"></el-input>
					</el-form-item>
					<el-form-item label="天线高度">
						<el-input v-model="querymodelcopy.antennaHeight"></el-input>
					</el-form-item>
					<el-form-item label="天线增益">
						<el-input v-model="querymodelcopy.antennaGain"></el-input>
					</el-form-item>
					<el-form-item label="位置">
						<span style="width: calc(100% - 20px)"
							><span>{{ querymodelcopy.x }}</span
							>&nbsp;&nbsp;&nbsp;<span>{{ querymodelcopy.y }}</span></span
						>
						<el-icon :size="20" title="设置位置" @click="onclickloc()">
							<Position />
						</el-icon>
					</el-form-item>
					<!-- <el-form-item label="计算模型">
						<el-select v-model="querymodelcopy.model">
							<el-option label="RT" :value="0"></el-option>
							<el-option label="Okumura-Hata" :value="1"></el-option>
							<el-option label="自由空间" :value="2"></el-option>
							<el-option label="ITU-R P.1411" :value="3"></el-option>
							<el-option label="ITU-R P.838" :value="4"></el-option>
						</el-select>
					</el-form-item> -->
					<el-form-item label="场景" v-show="querymodelcopy.model === 0">
						<el-select v-model="querymodelcopy.scene">
							<el-option label="地面" :value="0"></el-option>
							<el-option label="天空" :value="1"></el-option>
						</el-select>
					</el-form-item>
					<el-form-item label="天气场景">
						<el-select v-model="querymodelcopy.weatherType">
							<el-option label="晴" :value="1"></el-option>
							<el-option label="雨" :value="2"></el-option>
							<el-option label="雪" :value="3"></el-option>
						</el-select>
					</el-form-item>
					<el-footer>
						<el-button @click="onclickConfirm()">确定</el-button>
						<el-button @click="onclickCancel()">取消</el-button>
					</el-footer>
				</el-form>
			</template>
		</popdialog>
	</div>
</template>

<script setup>
	import Bus from "@/common/eventBus";

	import { GlobalState } from "@/common/GlobalState";
	import {
		GetPickedRayPositionWGS84,
		SetEntity,
		RemoveEntityById,
		GetLerpWGS84,
		GetWindowPosFromWGS84,
	} from "@/views/Map/buss/MapHandler";

	import msgUtil from "@/utils/MessageUtil";
	import { queryAnddrawSituation, removeSituation, entitypre, removefieldpopup, querymodel } from "./situationdraw_control.js";
	import popdialog from "@/components/Dialog/popdialog.vue";

	// const showmousetip = ref(false);
	const showdialog = ref(true);
	let thisheight = computed(() => {
		return querymodelcopy.model === 0 ? "54vh" : "48vh";
	});

	const props = defineProps({
		title: {
			type: String,
			default: "信息",
		},
		top: {
			type: String,
			default: "20vh",
		},
		left: {
			type: String,
			default: "12vh",
		},
	});

	// const longitude=ref(null);
	// const latitude=ref(null);

	var querymodelcopy = reactive({
		frequency: 800,
		power: 60,
		antennaHeight: 30,
		antennaGain: 30,
		x: null,
		y: null,
		z: null,
		model: 0,
		scene: 0,
		weatherType: 1,
	});

	const emits = defineEmits(["close"]);
	function onclickConfirm() {
		if (querymodelcopy.x == undefined || querymodelcopy.y == undefined) {
			msgUtil.messagePrompt("info", "请选择位置");
			return;
		}
		querymodel.frequency = querymodelcopy.frequency;
		querymodel.power = querymodelcopy.power;
		querymodel.antennaHeight = querymodelcopy.antennaHeight;
		querymodel.antennaGain = querymodelcopy.antennaGain;
		querymodel.x = querymodelcopy.x;
		querymodel.y = querymodelcopy.y;
		querymodel.z = querymodelcopy.z;
		querymodel.model = querymodelcopy.model;
		querymodel.scene = querymodelcopy.scene;
		querymodel.weatherType = querymodelcopy.weatherType;
		queryAnddrawSituation();
		emits("close");
	}

	function onclickCancel() {
		emits("close");
	}

	function onsceneleftclick(movement) {
		RemoveEntityById(GlobalState.getInstance().viewer, entitypre);
		let pos = GetPickedRayPositionWGS84(movement.position, GlobalState.getInstance().viewer);
		if (!pos) return;
		querymodelcopy.x = pos.longitude.toFixed(6);
		querymodelcopy.y = pos.latitude.toFixed(6);
		querymodelcopy.z = pos.height;
		SetEntity(
			{
				id: entitypre,
				position: pos.ToCartesian(),
				model: {
					uri: "/models/vehicle.glb",
					scale: 2,
				},
				point: {
					pixelSize: 10,
					color: Cesium.Color.YELLOW,
					// scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
					disableDepthTestDistance: 0,
				},
			},
			GlobalState.getInstance().viewer,
		);
	}

	function onrightclick() {
		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, { visible: false, text: "" });
		//
		// showmousetip.value = false;
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, onsceneleftclick);
		// RemoveEntityById(GlobalState.getInstance().viewer, entitypre);
	}

	function onclickloc() {
		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, { visible: true, text: "请在场景中左键双击设置发射点，右击结束" });
		// showmousetip.value = true;
		Bus.VM.$on(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, onsceneleftclick, 2);
		Bus.VM.$on(Bus.SignalType.AppMouseRightClick, onrightclick);
	}

	onMounted(() => {
		querymodelcopy.frequency = querymodel.frequency;
		querymodelcopy.power = querymodel.power;
		querymodelcopy.antennaHeight = querymodel.antennaHeight;
		querymodelcopy.antennaGain = querymodel.antennaGain;
		querymodelcopy.x = querymodel.x;
		querymodelcopy.y = querymodel.y;
		querymodelcopy.z = querymodel.z;
		querymodelcopy.model = querymodel.model;
		querymodelcopy.scene = querymodel.scene;
		querymodelcopy.weatherType = querymodel.weatherType;
	});
	onUnmounted(() => {
		Bus.VM.$emit(Bus.SignalType.SHOWMOUSETIP, { visible: false, text: "" });
		// showmousetip.value = false;
		// RemoveEntityById(GlobalState.getInstance().viewer, entitypre);
		Bus.VM.$off(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, onsceneleftclick);
		Bus.VM.$off(Bus.SignalType.AppMouseRightClick, onrightclick);
		// removeSituation();
		showdialog.value = false;
		removefieldpopup();
	});
</script>

<style scoped lang="less">
	#transmiterplace {
		color: white;

		padding: 12px;
		width: 80%;
		margin: auto;

		--el-text-color-regular: white;

		box-sizing: border-box;
	}
</style>
<style lang="less">

	#transmiterplace{

	    .el-input{
	        --el-input-bg-color:transparent;
	        --el-input-border-color:#999;
	    }
	    .el-form-item__label{
	        font-family: puhui_thin_35;
	    }
	    .el-footer{
	        --el-footer-height:auto;
	        display: flex;
	        justify-content: space-between;
	        --el-footer-padding:0px;
	        .el-button{
	            --el-button-bg-color:#009adc;
	            --el-button-hover-text-color:white;
	            --el-button-hover-bg-color:#009adc;
	            --el-button-text-color:white;
	            width:34%;
	            --el-border:none;
	            margin-top: 0;
	        }
	    }


	}

	/*#mousetipspan {*/
	    /*background: #00000066;*/
	    /*color: white;*/
	    /*display: block;*/
	    /*// margin-top: -30px;*/
	    /*// margin-left: -20px;*/

	/*}*/
</style>
