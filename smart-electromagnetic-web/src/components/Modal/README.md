# 模态框

## 使用方法

import Modal from "./components/Modal/index.vue";
const checkModal = ref(null);

<Modal ref="checkModal" :class="'checkModal'">
<template v-slot:container>

<!-- 内容  -->
<div>内容</div> 
<!-- 内容 -->
</template>
</Modal>

## 显示

checkModal.value.show();

## 隐藏

checkModal.value.hide();
