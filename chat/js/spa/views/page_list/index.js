import AbstractView from "../AbstractView.js";
import load from "./load.js";

export default class extends AbstractView {
  constructor() {
    super();
  }

  getHtml() {
    return new Promise((res) => {
      load.page((htmlData) => {
        res({
          html: htmlData.html,
          page: {
            ko: htmlData.title_ko,
            en: htmlData.title_en
          },
          sendData: htmlData.send_data
        });
      });
    });
  }
}