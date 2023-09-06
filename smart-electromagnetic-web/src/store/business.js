import { defineStore } from "pinia";
import { ref, reactive, toRefs } from "vue";
export default defineStore("business", () => {
	const state = reactive({
		menuActiveIndex: "0",
	});
	return {
		...toRefs(state),
	};
});
