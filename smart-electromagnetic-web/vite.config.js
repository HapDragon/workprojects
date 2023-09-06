import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import autoprefixer from "autoprefixer";
import postcsspxtoviewport from "postcss-px-to-viewport-8-plugin";
import AutoImport from "unplugin-auto-import/vite";
import { resolve } from "path";
import externalGlobals from "rollup-plugin-external-globals";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		AutoImport({
			imports: ["vue", "vue-router", "pinia"],
			dts: "src/auto-import.d.ts",
		}),
	],
	base: "./",
	// postcss配置 自适应屏幕 px-to-vm
	css: {
		postcss: {
			plugins: [
				autoprefixer({}),
				postcsspxtoviewport({
					unitToConvert: "px", // 要转化的单位
					viewportWidth: 1920, // UI设计稿的宽度
					viewportHeight: 1080, // UI设计稿的高度
					unitPrecision: 6, // 转换后的精度，即小数点位数
					propList: ["*"], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
					viewportUnit: "vw", // 指定需要转换成的视窗单位，默认vw
					fontViewportUnit: "vw", // 指定字体需要转换成的视窗单位，默认vw
					// selectorBlackList: [".ignore"], // 指定不转换为视窗单位的类名，
					minPixelValue: 1, // 默认值1，小于或等于1px则不进行转换
					mediaQuery: true, // 是否在媒体查询的css代码中也进行转换，默认false
					replace: true, // 是否转换后直接更换属性值
					exclude: [], // 设置忽略文件，用正则做目录名匹配
					landscape: false, // 是否处理横屏情况
					landscapeUnit: "vw", //横屏时使用的单位
					landscapeWidth: 1920, //横屏时使用的视口宽度
				}),
			],
		},
	},
	build: {
		outDir: "gis",
		rollupOptions: {
			external: ["Cesium"],
			plugins: [
				// commonjs(),
				externalGlobals({
					Cesium: "Cesium",
				}),
			],
		},
		//构建后是否生成 source map 文件
		sourcemap: false,
	},
	server: {
		host: "0.0.0.0",
        port: 3214,
		cors: true, //为开发服务器配置 CORS , 默认启用并允许任何源
        open: true,
	},
	resolve: {
		alias: {
			"@": resolve("src"),
		},
	},
});