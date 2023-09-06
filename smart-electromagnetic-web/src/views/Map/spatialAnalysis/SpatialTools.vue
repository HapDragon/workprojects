<!--
 * Created by wqy
 * Date 2021/3/3 8:41
 * Description
-->
<template>
	<div id="SpatialTools">
		<div id="MainFrame" ref="spacetoolmainframeref" class="spatialtoolanimation" :style="store.curindex != 5 ? '' : 'right:48px;'" v-show="store.curindex != 1">
			<div :class="curTool && curTool.name == '空间量算' ? 'funcbt select' : 'funcbt'" @click="clickmenu('空间量算')">
				<img class="curTool_img" src="../assets/空间量算.png" alt="" />
				<span class="curTool_text">空间量算</span>
			</div>
			<div>|</div>
			<div :class="curTool && curTool.name == '三维特效' ? 'funcbt select' : 'funcbt'" @click="clickmenu('三维特效')">
				<img class="curTool_img" src="../assets/三维特效.png" alt="" />
				<span class="curTool_text">三维特效</span>
			</div>
		</div>
		<spacemeasuretool ref="spacemeasuretool" @close="onclosetool('空间量算')" :winWidth="winWidth"></spacemeasuretool>
		<specialeffectstool ref="specialeffectstool" @close="onclosetool('三维特效')" :winWidth="winWidth"></specialeffectstool>
		<layercontrol></layercontrol>
	</div>
</template>

<script>
import spacemeasuretool from './SpaceMeasure/common/components/SpaceMeasure.vue';
import specialeffectstool from './SpecialEffects/common/components/SpecialEffects.vue';
import layercontrol from '@/views/Map/LayerControl/index.vue';
import { store } from '@/store/index.js';

export default {
	name: 'SpatialTools',
	data() {
		return {
			store,
			curTool: null,
			SubTools: [
				{ name: '空间量算', refname: 'spacemeasuretool' },
				{ name: '三维特效', refname: 'specialeffectstool' },
			],
		};
	},
	props: ['winWidth'],
	components: {
		specialeffectstool,
		spacemeasuretool,
		layercontrol,
	},
	computed: {},
	mounted() {
		const scope = this;
		store.registercurindexchangehandler(function (oldval, newval) {
			scope.$refs.spacetoolmainframeref.className = '';
			scope.$refs.spacemeasuretool.HiddenMenuWithAnamate();
			scope.$refs.specialeffectstool.HiddenMenuWithAnamate();
			setTimeout(function () {
				if (oldval == 5) scope.$refs.spacetoolmainframeref.className = 'spatialtoolanimation2';
				else if (newval == 5) {
					scope.$refs.spacetoolmainframeref.className = 'spatialtoolanimation3';
				} else {
					scope.$refs.spacetoolmainframeref.className = 'spatialtoolanimation';
				}
			}, 0);
		});
	},
	methods: {
		clickmenu(menuname) {
			let tool = this.SubTools.find((item) => item.name == menuname);
			let refname = '';
			if (!tool) return;
			if (this.curTool && menuname == this.curTool.name) {
				//用动画效果关闭当前tool
				refname = this.curTool.refname;
				if (refname && refname != '' && this.$refs[refname].ShowMenu && typeof this.$refs[refname].HiddenMenuWithAnamate == 'function') {
					this.$refs[refname].HiddenMenuWithAnamate();
				}
				this.curTool = null;
			} else {
				this.closesubmenus();
				this.curTool = this.SubTools.find((item) => item.name == menuname);
				refname = this.curTool.refname;
				if (refname && refname != '' && this.$refs[refname].ShowMenu && typeof this.$refs[refname].ShowMenu == 'function') {
					this.$refs[refname].ShowMenu();
				}
			}
		},

		closesubmenus() {
			let that = this;
			this.SubTools.forEach((subtool) => {
				if (subtool.refname && subtool.refname != '' && that.$refs[subtool.refname].HiddenMenu && typeof that.$refs[subtool.refname].HiddenMenu == 'function') {
					that.$refs[subtool.refname].HiddenMenu();
				}
			});
			this.curTool = null;
		},

		onclosetool(toolname) {
			if (this.curTool && this.curTool.name === toolname) {
				this.curTool = null;
			}
		},
	},
	watch: {},
};
</script>

<style>
#SpatialTools #Interval {
	width: 2vh;
	height: 0.2vh;
	background: #ffffffb2;
	margin: auto;
	margin-top: 0.5vh;
}

.funcbt {
	display: flex;
}

@keyframes spatialtoolsani1 {
	0% {
		right: -21vh;
	}
}

@keyframes spatialtoolsani2 {
	0% {
		right: 5vh;
	}
}

@keyframes spatialtoolsani3 {
	0% {
		right: 20vh;
	}
}

.spatialtoolanimation {
	animation-name: spatialtoolsani1;
	animation-timing-function: ease-out;
	animation-duration: 1s;
}

.spatialtoolanimation2 {
	animation-name: spatialtoolsani2;
	animation-duration: 1s;
	animation-timing-function: ease-out;
}

.spatialtoolanimation3 {
	animation-name: spatialtoolsani3;
	animation-duration: 1s;
	animation-timing-function: ease-out;
}

#SpatialTools #MainFrame {
	cursor: pointer;
	user-select: none;
	position: fixed;
	background: #091426b2;
	height: 4vh;
	color: #ffffffb2;
	line-height: 2vh;
	top: 11vh;
	right: 55vh;
	padding: 1.1vh;
	box-sizing: border-box;
	font-family: 'puhui_thin_45';
	font-size: 1.6vh;
}

#SpatialTools #MainFrame div {
	padding: 0 0.8vh;
	float: left;
}

#SpatialTools #MainFrame .funcbt:hover {
	color: #22e8e27f;
}

#SpatialTools #MainFrame .select {
	color: #22e8e2;
}

.curTool_img {
	height: 2vh;
	/* margin: 2px; */
}
</style>
