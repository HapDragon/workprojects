let pagechangehandlers = [];
export const store = reactive({
	curindex: 0,
	setcurindex(value) {
		let originvalue = this.curindex;
		this.curindex = value;
		pagechangehandlers.forEach((item) => {
			item(originvalue, value);
		});
	},
	registercurindexchangehandler(callback) {
		pagechangehandlers.push(callback);
	},
	clearallcurindexchangehandlers() {
		pagechangehandlers = [];
	},
	filterDate(date, fmt) {
		if (date == null) return "";
		let _date = new Date(date);
		return _date.Format(fmt);
	},
	findstylebyrank(rank) {
		switch (rank) {
			case 1:
				return "background-color:#b41b1b;width:30px;border-radius:8px;height:16px;line-height:16px;margin:auto;display:block;";
			case 2:
				return "background-color:#d66c18;width:30px;border-radius:8px;height:16px;line-height:16px;margin:auto;display:block;";
			case 3:
				return "background-color:#e2b414;width:30px;border-radius:8px;height:16px;line-height:16px;margin:auto;display:block;";
			default:
				return "";
		}
	},
	findclassbyrank(rank) {
		switch (rank) {
			case 1:
				return "rank1";
			case 2:
				return "rank2";
			case 3:
				return "rank3";
			default:
				return "";
		}
	},
});
