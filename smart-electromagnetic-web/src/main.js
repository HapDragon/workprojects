import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from "./App.vue";
import router from "./router";
import utils from "./utils/index.js";
import "@/utils/cesium/registerMaterial.js"


const app = createApp(App);

// 添加状态管理工具
import { createPinia } from "pinia";
app.use(createPinia());

// axios拦截器配置
import { get, post } from "./request/index.js";
app.config.globalProperties.$get = get;
app.config.globalProperties.$post = post;

// 添加路由守卫
import "./request/permission.js";

import modal from "@/utils/tools/modal";
app.config.globalProperties.$modal = modal;

app.use(ElementPlus);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.use(router);
app.use(utils);
app.mount("#app");
