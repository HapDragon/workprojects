/**
 * Created by wqy
 * Date 2023/8/8 8:06
 * Description 态势接口
 */

const api = {
	queryElectrolInfo: config.baseserverUrl + "/electro/queryElectroInfo", //查询场强信息
	queryInterferenceInfo:config.baseserverUrl+"/electro/queryInterferenceInfo",//查询一个点场强
};
export default api;
