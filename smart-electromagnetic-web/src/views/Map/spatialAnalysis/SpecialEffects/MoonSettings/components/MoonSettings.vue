<!--
 * Created by wqy
 * Date 2023/5/10 9:34
 * Description
-->
<template>
	<div id="MoonSettings">
		<Modal ref="sourceModal" class="sourceModal" title="月亮光设置" @close="close" @sure="onsubmit">
			<template v-slot:container>
				<div class="container">
					<el-form :model="MoonLightSettings">
						<!--<el-form-item label="阴影可见距离">-->
						<!--<el-slider v-model="MoonLightSettings.ShadowDistance" :min="1" :max="10000" :step="1"/>-->
						<!--&lt;!&ndash;<el-input v-model="MoonLightSettings.ShadowDistance" clearable/>&ndash;&gt;-->
						<!--</el-form-item>-->
						<el-form-item label="光强">
							<el-slider v-model="MoonLightSettings.LightIntensity" :min="0.1" :max="1" :step="0.01" />
							<!--<el-input v-model="MoonLightSettings.LightIntensity" clearable/>-->
						</el-form-item>
						<!--<el-form-item label="色温">-->
						<!--<el-slider v-model="MoonLightSettings.LightTemp" :min="2700" :max="12000"/>-->
						<!--</el-form-item>-->
						<el-form-item label="光颜色">
							<el-color-picker v-model="MoonLightSettings.UiColor" />
						</el-form-item>
					</el-form>
				</div>
			</template>
		</Modal>
	</div>
</template>

<script setup>
import Modal from '@/components/Modal/index.vue';
import { MoonLightSettings } from '@/views/Map/buss/MapHandler';

const sourceModal = ref(null);
defineExpose({
	sourceModal,
	show,
});

const emits = defineEmits(['close']);
// 关闭事件
function close() {
	MoonLightSettings.Init();
	emits('close');
}

function onsubmit() {
	MoonLightSettings.SetSure();
	emits('close');
}

function show() {
	MoonLightSettings.Init();
	sourceModal.value.show();
}
</script>

<style lang="less">
#MoonSettings > div:first-child {
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

#MoonSettings .el-form-item__label {
	width: 10vh;
}
</style>
