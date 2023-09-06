/**
 * Created by wqy
 * Date 2023/3/30 17:04
 * Description 单例化全局状态管理
 */
import Bus from './eventBus'
export class GlobalState{
	constructor() {
		this.instance = null;
		this.viewer=null;

		// 因为有的数据获取一次但是要在很多不同地方加载，
        // 比如行政区划region_grid和region_onemap都是获取接口中城镇数据，
		// 所以定义了下面这个变量存储获取一次的json，第二次加载的时候不需要再次获取json了
		this.resdata={
			river:null,
			region:null,
			gridwall:null,
		}
	}
	static getInstance() {
		if (!this.instance) {
			this.instance = new GlobalState();
		}
		return this.instance;
	}


}






