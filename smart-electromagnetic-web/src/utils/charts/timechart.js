/**
 * Created by wqy
 * Date 2023/6/9 14:50
 * Description
 */
export function disposeChart(domid){
	let dom = document.getElementById(domid);
	if(dom==null) return;
	let chartInstance = echarts.getInstanceByDom(dom);
	if(chartInstance){
		echarts.dispose(chartInstance);
	}
}
function initChart(dom){
	let chartDom = document.getElementById(dom);
	if(chartDom==undefined) return;
	let chartInstance = echarts.getInstanceByDom(chartDom);
	if(chartInstance){
		return chartInstance;
	} else{
		let myChart = echarts.init(chartDom);
		return myChart;
	}
}

function clearframe() {
	if(framehandle!=undefined&&framehandle>-1){
		cancelAnimationFrame(framehandle);
		framehandle=-1;
	}
}

function onticksetchartoption(mychart,newoptioncallback,timeinterval){
	let curtime=new Date();
	const timespan=curtime-lastupdatetime;
	if(timespan<timeinterval) {
		framehandle=requestAnimationFrame(getframehandler(mychart,newoptioncallback,timeinterval));
		return;
	}
	lastupdatetime=curtime;

	// 图表被销毁之后就终止循环
	if(mychart._disposed){
		clearframe();
		return;
	}

	mychart.setOption(newoptioncallback(),true);
	framehandle=requestAnimationFrame(getframehandler(mychart,newoptioncallback,timeinterval));
}
function getframehandler(mychart,newoption,timeinterval){
	return function () {
		onticksetchartoption(mychart,newoption,timeinterval);
	}
}


let framehandle,lastupdatetime=new Date('1988-1-1');

export function initchartoptions(domid,ongetnewoptioncallback,timeinterval=3000) {
	if(ongetnewoptioncallback==undefined||domid==undefined) return;


	// disposeChart(domid);
	let mychart = initChart(domid);


	onticksetchartoption(mychart,ongetnewoptioncallback,timeinterval);



	mychart.on('mouseover', function(param){
		clearframe();
	});
	mychart.on('mouseout', function(param){
		onticksetchartoption(mychart,ongetnewoptioncallback,timeinterval);
	});
}

export function getFrame() {
	return framehandle;
}
export function setFrame(newval) {
	framehandle=newval;
}

export function setLstUpdTime(value) {
	lastupdatetime=value;
}




