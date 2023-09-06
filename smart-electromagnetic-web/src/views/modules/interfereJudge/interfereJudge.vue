<!--
 * Created by wqy
 * Date 2023/8/30 9:39
 * Description
-->
<template>
    <div id="interfereJudge">
        <popdialog @close="onclickCancel" title="干扰机干扰判断" :isshowdialog="showdialog"
                   width="36vh"
                   height="16vh"
                   left="1vh"
                   top="12vh">
            <template v-slot:container>
                <el-button @click="onclickaddvechile()">添加干扰机</el-button>
                <el-button @click="onclickaddpeople()">添加受扰机</el-button>
            </template>
        </popdialog>
        <transmiterplace
                v-if="showaddvechile"
                @close="onsubclose"
                title="添加干扰机"
                left="40vh"
                top="12vh"
        ></transmiterplace>
    </div>
</template>

<script setup>
	import popdialog from '@/components/Dialog/popdialog.vue';
	import { inoutmodule } from "./AddDisturbed.js";
	import transmiterplace from "./transmiterplace.vue";

	const emits = defineEmits(['close']);
	const showdialog=ref(true);
	const showaddvechile=ref(false);
	function onclickCancel() {
		inoutmodule(false);
		showaddvechile.value=false;
		emits('close');
	}

	function onsubclose() {
		showaddvechile.value=false;
	}

	function onclickaddpeople() {
		inoutmodule(true);
	}

	function onclickaddvechile() {
		showaddvechile.value=true;
	}
	onUnmounted(()=>{
		inoutmodule(false);
		showaddvechile.value=false;
    })
</script>

<style lang="less">
    #interfereJudge{
    .el-button{
        --el-button-bg-color:#009adc;
        --el-button-hover-text-color:white;
        --el-button-hover-bg-color:#009adc;
        --el-button-text-color:white;
        width:34%;
        --el-border:none;
        margin-top: -12px;
    }
    .contetnDiv{
        display:flex;
        flex-direction: row;
        justify-content: space-evenly;
        align-items: center;
    }
    }
</style>
