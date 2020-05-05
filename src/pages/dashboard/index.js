import SortableTable from "../../components/sortable-table/index.js";
import header from './bestsellers-header.js';
import ColumnChart from "../../components/column-chart/index.js";
import RangePicker from "../../components/range-picker/index.js";

export default class Page {
  element;
  subElements = {};
  components = {};

  constructor () {
    this.initComponents();
    this.initEventListeners();

    // сгенерим событие установки начальной даты, почему-то работает только через setTimeout
    window.setTimeout(() => this.components.rangePickerRoot.dispatchEvent(), 1);
  }

  initComponents () {
    const sortableTable = new SortableTable(header, {
      url: 'api/dashboard/bestsellers'
    });

    // TODO: replace "mocked" data by real API calls
    const ordersChart = new ColumnChart({
      label: 'orders',
      link: '#'
    });

    // TODO: replace "mocked" data by real API calls
    const salesChart = new ColumnChart({
      label: 'sales',
      format: num => '$' + num.toLocaleString()
    });

    // TODO: replace "mocked" data by real API calls
    const customersChart = new ColumnChart({
      label: 'customers'
    });

    const rangePicker = new RangePicker();

    this.components.sortableTable = sortableTable;
    this.components.ordersChart = ordersChart;
    this.components.salesChart = salesChart;
    this.components.customersChart = customersChart;
    this.components.rangePickerRoot = rangePicker;
  }

  get template () {
    return `<div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>
        <div data-element="rangePickerRoot"></div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">
        <!-- column-chart components -->
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>

      <h3 class="block-title">Best sellers</h3>

      <div data-element="sortableTable">
        <!-- sortable-table component -->
      </div>
    </div>`;
  }

  async render () {
    const element = document.createElement('div');

    element.innerHTML = this.template;

    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    await this.renderComponents();

    return this.element;
  }

  async renderComponents () {
    // NOTE: All renders in components are async (check in components)
    const promises = Object.values(this.components).map(item => item.render());
    const elements = await Promise.all(promises);

    Object.keys(this.components).forEach((component, index) => {
      this.subElements[component].append(elements[index]);
    });
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  initEventListeners () {
    document.addEventListener('date-select', this.onDateSelect);
  }

  onDateSelect = async event => {
    const {from, to} = event.detail;
    for (let cmp of Object.values(this.components)) {
      if (cmp.updateDateRange) await cmp.updateDateRange(from, to);
    }
  }

  destroy () {
    document.removeEventListener('date-select', this.onDateSelect);
    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
