<!--
 * Created by wqy
 * Date 2023/5/10 9:35
 * Description
-->
<template>
	<div id="SunSettings">
		<Modal ref="sourceModal" class="sourceModal" title="太阳光设置" @close="close" @sure="onsubmit">
			<template v-slot:container>
				<div class="container">
					<el-form :model="SunLightSettings">
						<el-form-item label="阴影可见距离">
							<el-slider v-model="SunLightSettings.ShadowDistance" :min="5000" :max="10000" :step="1" />
							<!--<el-input v-model="SunLightSettings.ShadowDistance" clearable/>-->
						</el-form-item>
						<el-form-item label="光强">
							<el-slider v-model="SunLightSettings.LightIntensity" :min="0.1" :max="10" :step="0.1" />
							<!--<el-input v-model="MoonLightSettings.LightIntensity" clearable/>-->
						</el-form-item>
						<!--<el-form-item label="色温">-->
						<!--<el-slider v-model="SunLightSettings.LightTemp" :min="2700" :max="12000"/>-->
						<!--</el-form-item>-->
						<el-form-item label="光颜色">
							<el-color-picker v-model="SunLightSettings.UiColor" />
						</el-form-item>
					</el-form>
				</div>
			</template>
		</Modal>
	</div>
</template>

<script setup>
import Modal from '@/components/Modal/index.vue';
import { SunLightSettings } from '@/views/Map/buss/MapHandler';

const sourceModal = ref(null);
defineExpose({
	sourceModal,
	show,
});

const emits = defineEmits(['close']);
// 关闭事件
function close() {
	SunLightSettings.Init();
	emits('close');
}

function onsubmit() {
	SunLightSettings.SetSure();
	emits('close');
}

function show() {
	SunLightSettings.Init();
	sourceModal.value.show();
}
</script>

<style scoped></style>

<style lang="less">
#SunSettings > div:first-child {
	pointer-events: none;
}

.sourceModal {
	--el-dialog-margin-top: 14.8vh !important;
	--el-dialog-width: 60vh !important;

	pointer-events: auto;
	.container {
		width: 50vh;
		margin: 2vh auto;
		padding: 0;
		.el-form {
			width: 100%;
			box-sizing: border-box;
			.el-form-item {
				margin-right: 0px;
				width: 100%;
			}
		}
	}
}

#SunSettings .el-form-item__label {
	width: 16vh;
}
</style>
