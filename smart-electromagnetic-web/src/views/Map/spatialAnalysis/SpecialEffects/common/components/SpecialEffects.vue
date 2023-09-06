<!--
 * Created by wqy
 * Date 2021/3/3 8:49
 * Description
-->
<template>
	<div id="SpecialEffects">
		<div id="SubMainFrame" class="position-fixed" :style="store.curindex == 5 ? 'right:48px;' : ''">
			<img v-for="(item, index) in subtools" :src="item.checked == true ? 'img/SpecialEffects/' + item.imgfilename + 'selected.svg' : 'img/SpecialEffects/' + item.imgfilename + '.svg'" :title="item.name" @click="item.checked = !item.checked" />
			<div id="Interval"></div>
			<img src="/img/common/close.svg" @click="HiddenMenuWithAnamate" />
		</div>
		<sunlight ref="sunlight" :winWidth="winWidth" @close="closesunlight"></sunlight>
		<datetimeselect ref="datetimeselect" @close="closedatetime"></datetimeselect>
		<timezoneselect ref="timezoneselect" @close="closedatetime"></timezoneselect>
		<sunsettings ref="sunsettings" @close="closesunsettings"></sunsettings>
		<moonsettings ref="moonsettings" @close="closemoonsettings"></moonsettings>
	</div>
</template>

<script>
import sunlight from '../../Sunlight/components/Sunlight.vue';
import datetimeselect from '../../DateTimeSelect/components/DateTimeSelect.vue';
import timezoneselect from '../../TimeZoneSelect/components/TimeZoneSelect.vue';
import moonsettings from '../../MoonSettings/components/MoonSettings.vue';
import sunsettings from '../../SunSettings/components/SunSettings.vue';

import { GlobalState } from '@/common/GlobalState';
import { SetRainVisible, SetSnowVisible, SetFogVisible, SetCloudyVisible, SetSunnyVisible, SetDayOrNight } from '@/views/Map/buss/MapHandler';
import Bus from '@/common/eventBus';
import { store } from '@/store/index.js';
import $ from 'jquery';

export default {
	name: 'SpecialEffects',
	data() {
		let subtools = [
			{ name: '雨', imgfilename: 'rain', _checked: false },
			{ name: '雪', imgfilename: 'snow', _checked: false },
			{ name: '雾', imgfilename: 'fog', _checked: false },
			{ name: '阴', imgfilename: 'cloudy', _checked: false },
			{ name: '晴', imgfilename: 'sunny', _checked: false },
			{ name: '时间设置', imgfilename: 'time', _checked: false },
			{ name: '时区设置', imgfilename: 'timezone', _checked: false },
			{ name: '昼夜切换', imgfilename: 'day', _checked: false },
			{ name: '太阳光设置', imgfilename: 'sun', _checked: false },
			{ name: '月亮光设置', imgfilename: 'moon', _checked: false },
			{ name: '日照模拟', imgfilename: 'sunlight', _checked: false },
		];
		let DayOrNight = false;
		let that = this;
		subtools.forEach((data) => {
			Object.defineProperty(data, 'checked', {
				get: function () {
					return this._checked;
				},
				set: function (value) {
					if (value != this._checked) {
						this._checked = value;
						that.onsubmenucheckchanged(this);
					}
				},
			});
		});
		return {
			store,
			subtools: subtools,
			DayOrNight: DayOrNight,
		};
	},
	props: ['winWidth'],
	components: { sunsettings, moonsettings, sunlight, datetimeselect, timezoneselect },
	computed: {},
	mounted() {
		// let screenWidth = document.body.clientWidth;
		let screenHeight = document.body.clientHeight;
		window.onresize = () => {
			return (() => {
				// debugger
				// screenWidth = document.body.clientWidth;
				// screenHeight = document.body.clientHeight;
				// 					const originheight=Number($("#SpecialEffects #SubMainFrame")[0].style.height.substring(0,$("#SpecialEffects #SubMainFrame")[0].style.height.length-2));
				// 					if(originheight!=0){
				// // debugger
				// 						$("#SpecialEffects #SubMainFrame").css('height',460*document.body.clientHeight*1.2/screenHeight+"px");
				//
				//                     }
			})();
		};
	},
	methods: {
		ShowMenu() {
			// debugger
			// $("#SpecialEffects #SubMainFrame").css('display', 'block');
			$('#SpecialEffects #SubMainFrame').removeClass('showanimation');
			$('#SpecialEffects #SubMainFrame').removeClass('closeanimation');
			$('#SpecialEffects #SubMainFrame').addClass('showanimation');
			// $("#SpecialEffects #SubMainFrame").animate({height: '460'});
		},
		HiddenMenuWithAnamate() {
			// debugger
			$('#SpecialEffects #SubMainFrame').removeClass('showanimation');
			$('#SpecialEffects #SubMainFrame').removeClass('closeanimation');
			$('#SpecialEffects #SubMainFrame').addClass('closeanimation');
			// $("#SpecialEffects #SubMainFrame").animate({height: '0px'}, '400', function () {
			// 	$("#SpecialEffects #SubMainFrame").css('display', 'none');
			// });
			this.clearanasubmenus();
			this.$emit('close');
		},
		HiddenMenu() {
			$('#SpecialEffects #SubMainFrame').removeClass('showanimation');
			$('#SpecialEffects #SubMainFrame').removeClass('closeanimation');
			// $("#SpecialEffects #SubMainFrame").css('display', 'none');
			// $("#SpecialEffects #SubMainFrame").css('height', '0px');
			this.clearanasubmenus();
		},
		clearanasubmenus() {
			// this.subtools.forEach(subtool => {
			// 	subtool.checked = false;
			// })
			// this.$refs.sunlight.isShow = false;
		},
		onsubmenucheckchanged(subitem) {
			switch (subitem.name) {
				case '雨':
					SetRainVisible(subitem.checked, GlobalState.getInstance().viewer);
					break;
				case '雪':
					SetSnowVisible(subitem.checked, GlobalState.getInstance().viewer);
					break;
				case '雾':
					SetFogVisible(subitem.checked, GlobalState.getInstance().viewer);
					break;
				case '日照模拟':
					subitem.checked === true ? this.$refs.sunlight.show() : this.$refs.sunlight.sourceModal.hide();

					// this.$refs.sunlight.isShow = subitem.checked;
					break;
				case '阴':
					if (subitem.checked === true) {
						const sunnyitem = this.subtools.find((item) => item.name == '晴');
						sunnyitem.checked = false;
					}
					SetCloudyVisible(subitem.checked, GlobalState.getInstance().viewer);
					break;
				case '晴':
					if (subitem.checked === true) {
						const cloudyitem = this.subtools.find((item) => item.name == '阴');
						cloudyitem.checked = false;
					}
					SetSunnyVisible(subitem.checked, GlobalState.getInstance().viewer);
					break;
				case '时间设置':
					if (subitem.checked === true) {
						this.$refs.moonsettings.sourceModal.hide();
						if (this.DayOrNight == true) {
							SetDayOrNight(false, GlobalState.getInstance().viewer);
							let item = this.subtools.find((item) => item.name == '昼夜切换');
							item.checked = false;
						}
						const datetimeselectitem = this.subtools.find((item) => item.name == '时区设置');
						datetimeselectitem.checked = false;
						this.$refs.datetimeselect.isShow = subitem.checked;
					}

					// this.$refs.timezoneselect.isShow = false;

					break;
				case '时区设置':
					if (subitem.checked === true) {
						this.$refs.moonsettings.sourceModal.hide();
						if (this.DayOrNight == true) {
							SetDayOrNight(false, GlobalState.getInstance().viewer);
							let item = this.subtools.find((item) => item.name == '昼夜切换');
							item.checked = false;
						}
						const timezoneselectitem = this.subtools.find((item) => item.name == '时间设置');
						timezoneselectitem.checked = false;
						this.$refs.timezoneselect.isShow = !this.$refs.timezoneselect.isShow;
					}
					// this.$refs.datetimeselect.offset = this.$refs.timezoneselect.offset;
					break;
				case '昼夜切换':
					SetDayOrNight(!subitem.checked, GlobalState.getInstance().viewer);
					this.DayOrNight = subitem.checked;
					this.$refs.moonsettings.sourceModal.hide();
					if (subitem.checked === true) {
						let item1 = this.subtools.find((item) => item.name == '时区设置');
						item1.checked = false;
						const item2 = this.subtools.find((item) => item.name == '时间设置');
						item2.checked = false;
					}
					break;
				case '太阳光设置':
					subitem.checked === true ? this.$refs.sunsettings.show() : this.$refs.sunsettings.sourceModal.hide();
					break;
				case '月亮光设置':
					subitem.checked === true ? this.$refs.moonsettings.show() : this.$refs.moonsettings.sourceModal.hide();

					break;
				default:
					break;
			}
		},
		closesunlight() {
			let tool = this.subtools.find((tool) => tool.name == '日照模拟');
			tool.checked = false;
		},
		closedatetime() {
			let tool = this.subtools.find((tool) => tool.name == '时间设置');
			tool.checked = false;
		},
		closetimezone() {
			let tool = this.subtools.find((tool) => tool.name == '时区设置');
			tool.checked = false;
		},
		closesunsettings() {
			let tool = this.subtools.find((tool) => tool.name == '太阳光设置');
			tool.checked = false;
		},
		closemoonsettings() {
			let tool = this.subtools.find((tool) => tool.name == '月亮光设置');
			tool.checked = false;
		},
	},
	watch: {},
};
</script>

<style scoped></style>
<style>
#SpecialEffects #SubMainFrame {
	background: #122134cc;
	width: 3.4vh;
	overflow: hidden;
	height: 0vh;
	top: 11vh;
	right: 48.5vh;
}

#SpecialEffects #SubMainFrame img {
	width: 2vh;
	height: 2vh;
	margin: 0.9vh 0.7vh;
	box-sizing: border-box;
	vertical-align: top;
	pointer-events: auto;
}

#SpecialEffects #SubMainFrame img:last-child {
	width: 1.1vh;
	height: 1.1vh;
	margin: 1vh 1.1vh;
}

#SpecialEffects .showanimation {
	animation: showani 400ms linear;
	animation-fill-mode: forwards;
}

#SpecialEffects .closeanimation {
	animation: closeani 400ms linear;
	animation-fill-mode: forwards;
}

@keyframes showani {
	0% {
		height: 0;
	}
	100% {
		height: 46vh;
	}
}

@keyframes closeani {
	0% {
		height: 46vh;
	}
	100% {
		height: 0;
	}
}
</style>
