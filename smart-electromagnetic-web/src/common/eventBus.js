import Mitt from "mitt";

const VM = new Mitt();
VM.$on = function (signaltype,call,priority=1) {
	//对于同时生效的事件处理函数，这里定义优先级，如果出现较大的priority，那么该监听会被响应，而其他的会不被响应，
	// priority相同的监听会同时被响应，就像没有定义优先级一样
	let getlisenfunc=function(){
		let listenfunc=function(){
			let listeners=VM.all.get(signaltype);
			if(listeners.length<=0) return;
			let find=listeners.find(item=>item.priority>priority);
			if(find==null){
				call(...arguments);
			}
		}
		//这里需要给一个唯一标识符，用于off的时候识别
		listenfunc.id=Cesium.createGuid();
		call.id=listenfunc.id;
		listenfunc.priority=priority;
		return listenfunc;
	}

	VM.on(signaltype,getlisenfunc());
};
VM.$off = function (signaltype,call) {
	let listeners=VM.all.get(signaltype);
	if(listeners==null) return;
	let find=listeners.find(item=>item.id==call.id);
	if(find){
		VM.off(signaltype,find);
	}
};
VM.$emit = VM.emit;




const SignalType = {
	Scene_Camera_MoveStart: "Scene_Camera_MoveStart", //场景相机开始移动时事件
	Scene_Camera_Changed: "Scene_Camera_Changed", //场景相机参数改变事件
	Scene_Camera_MoveEnd: "Scene_Camera_MoveEnd", //场景相机移动结束事件
	Scene_Mouse_Left_Click: "Scene_Mouse_Left_Click", //场景鼠标左键单击事件
	Scene_Mouse_Right_Click: "Scene_Mouse_Right_Click", //场景鼠标右键单击事件
	Scene_Mouse_DoubleLeft_Click: "Scene_Mouse_DoubleLeft_Click", //场景鼠标左键双击事件
	Scene_Mouse_Move: "Scene_Mouse_Move", //场景鼠标漫游事件
	Scene_Left_Down: "Scene_Left_Down", //场景鼠标左键按下事件
	Scene_Left_Up: "Scene_Left_Up", //场景鼠标左键抬起事件
	Scene_Mouse_Wheel: "Scene_Mouse_Wheel", //场景鼠标滚轮滑动事件
	Scene_Init_Finish: "Scene_Init_Finish", //场景初始化完成事件
	Scene_Mouse_Middle_Move: "Scene_Mouse_Middle_Move", //场景鼠标滚轮按下滑动事件

	AddS3M: "AddS3M",//添加了S3M图层


	//浏览器鼠标抬起事件，传参：无
	AppMouseUp: "AppMouseUp",
	//浏览器鼠标移动事件，传参：1.鼠标位置
	AppMouseMove: "AppMouseMove",
	//网页键盘键抬起事件 传参 1.e
	AppKeyUp: "AppKeyUp",
	//网页键盘键按下事件 传参 1.e
	AppKeyDown: "AppKeyDown",
	AppMouseRightClick:"AppMouseRightClick",


	//场景渲染
	ROADNAMESCHANGED: 'ROADNAMESCHANGED',
	ROADSELECTEDINDEXCHANGED: 'ROADSELECTEDINDEXCHANGED',
	//道路材质compile修改完毕，传参 1.material.uuid
	ROADMATERIALCOMPILED:"ROADMATERIALCOMPILED",

	BLOOMNAMECHANGED:"BLOOMNAMECHANGED",
	BLOOMSELECTEDINDEXCHANGED: 'BLOOMSELECTEDINDEXCHANGED',


	MESHLOADED:"MESHLOADED",
	MESHSETTINGNAMECHANGED:'MESHSETTINGNAMECHANGED',
	MESHSETTINGSELECTEDINDEXCHANGED:'MESHSETTINGSELECTEDINDEXCHANGED',

	//页面修改
	// PAGECHANGED:"PAGECHANGED",

	//修改模型和电子围栏显隐
	VISIBLESETTING:"VISIBLESETTING",

	SHOWMOUSETIP:'SHOWMOUSETIP',









};




export default {
	SignalType,VM
};
