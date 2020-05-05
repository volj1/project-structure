import fetchJson from "../../utils/fetch-json.js";

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  element;
  subElements = {};
  chartHeight = 50;

  constructor({
    url = null,
    label = '',
    link = '',
    format = num => num
  } = {}) {
    this.url = new URL(url ?? `api/dashboard/${label}`, BACKEND_URL);
    this.mockData();
    this.label = label;
    this.link = link;
    this.format = format;

    // NOTE: needed for correct work in src/pages/dashboard/index.js:93
    // this.render();
  }

  async updateDateRange(from, to) {
    this.dateRange = {from: from, to: to};
    await this.loadData();

    this.subElements.header.textContent = this.format(this.value);
    this.subElements.body.innerHTML = this.getColumnBody(this.data);
  }

  async loadData() {
    if (this.dateRange?.from) {
      this.url.searchParams.set('from', this.dateRange.from.toISOString());
    }
    if (this.dateRange?.to) {
      this.url.searchParams.set('to', this.dateRange.to.toISOString());
    }
    this.data = await fetchJson(this.url.toString());

    this.value = Object.values(this.data).reduce((accum, item) => accum + item, 0);
  }

  mockData() {
    this.data = {};
    for (let i = 1; i < 10; i++) {
      const date = `2020-04-0${i}`;
      this.data[date] = Math.floor(Math.random() * Math.floor(25));
    }
    this.value = Object.values(this.data).reduce((accum, item) => accum + item, 0);
  }

  getColumnBody(data) {
    const maxValue = Math.max(...Object.values(data));
    const scale = this.chartHeight / maxValue;

    return Object.entries(data).map(([key, value]) => {
      return `<div style="--value: ${Math.floor(value * scale)}" data-tooltip="${key}"></div>`;
    })
    .join('');
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : '';
  }

  get template () {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">
            ${this.format(this.value)}
          </div>
          <div data-element="body" class="column-chart__chart">
            ${this.getColumnBody(this.data)}
          </div>
        </div>
      </div>
    `;
  }

  async render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    this.element.classList.remove(`column-chart_loading`);

    this.subElements = this.getSubElements(this.element);

    return this.element;
  }

  getSubElements (element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  destroy() {
    this.element.remove();
  }
}
