<!--
 * Created by wqy
 * Date 2023/8/8 10:33
 * Description
-->
<template>
	<div id="mousetip" ref="mousetipref">
		<slot></slot>
	</div>
</template>

<script setup>
import Bus from '@/common/eventBus';

const mousetipref = ref(null);

function onappmousemove(e) {
	mousetipref.value.style.left = e.clientX - 5 + 'px';
	mousetipref.value.style.top = e.clientY - 30 + 'px';
}
onMounted(() => {
	Bus.VM.$on(Bus.SignalType.AppMouseMove, onappmousemove);
});
onUnmounted(() => {
	Bus.VM.$off(Bus.SignalType.AppMouseMove, onappmousemove);
});
</script>

<style scoped>
#mousetip {
	position: fixed;
	user-select: none;
}
</style>
