/**
 * Created by wqy
 * Date 2023/8/16 14:26
 * Description 首页电子围栏和标签（小区名称）
 */
import axios from "axios";
import {
	addPrimitiveWalls,
	removePrimitiveWalls,
} from "@/utils/cesium/addWall.js";
import { GlobalState } from "@/common/GlobalState";

export const dianziweilan={
	data: undefined,
	setvisible(visible){
		let scope = this;
		if (visible===true && this.data == undefined ) {
			scope.data = [];
			scope.isadding = true;
			axios.get("json/communityfence.json").then((res) => {
				res.data.some((item) => {
					item.TextOptions.image = new URL(
						"@/assets/cesium/RegionLabel.png",
						import.meta.url
					).href;
				});
				res.data.forEach((item) => {
					let datamodel = {
						id: item.id,
						//模型电子围栏
						modelfence: [],
						//模型本身
						tileset: null,
					};
					//添加模型电子围栏
					addPrimitiveWalls(GlobalState.getInstance().viewer, {
						data: [item],
						saveData: datamodel.modelfence,
					});
					scope.data.push(datamodel);
				});
				scope.isadding = false;
			});

		} else if (this.data != undefined) {
			this.data.forEach((datamodel) => {
				if (datamodel.textpoi) {
					datamodel.textpoi.show = visible;
				} else {
					datamodel.modelfence.forEach((item) => {
						item.wall.show = item.text.show = visible;
					});
				}
			});
		}
	},
}
