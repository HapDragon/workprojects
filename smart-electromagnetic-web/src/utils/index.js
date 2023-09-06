// 全局参数挂载
import drag from "./directive/drag";
import { fontSize_VW, fontSize_VH } from "./charts/chartSize";
import { handleTree, parseTime } from "./tools/ruoyi";
import modal from "./tools/modal";

export default function installPlugins(app) {
	//全局的拖动事件
	app.directive("drag", drag);
	app.config.globalProperties.$fontSize_VW = fontSize_VW;
	app.config.globalProperties.$fontSize_VH = fontSize_VH;
	// 模态框对象
	app.config.globalProperties.$modal = modal;
	// 构造树形结构
	app.config.globalProperties.handleTree = handleTree;
	// 解析时间
	app.config.globalProperties.parseTime = parseTime;
}
/**
 * Created by wqy
 * Date 2023/6/25 8:10
 * Description//  对Date的扩展，将 Date 转化为指定格式的String
 //  月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 //  年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 //  例子：
 //  (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 //  (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 */
Date.prototype.Format = function (fmt) {
	// author: meizz
	var o = {
		"M+": this.getMonth() + 1, // 月份
		"d+": this.getDate(), // 日
		"h+": this.getHours(), // 小时
		"m+": this.getMinutes(), // 分
		"s+": this.getSeconds(), // 秒
		"q+": Math.floor((this.getMonth() + 3) / 3), // 季度
		S: this.getMilliseconds(), // 毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
	return fmt;
};

Number.prototype.toPadLeftString=function (totallen,padleftchar) {
	let originstr=this.toString();
	if(originstr.length<totallen){
		for(let i=0;i<totallen-originstr.length;i++){
			originstr=padleftchar+originstr;
		}
	}
	return originstr;
}


