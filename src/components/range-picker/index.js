export default class RangePicker {
  element;
  subElements = {};

  constructor({
    from = null,
    to = null} = {}
  ) {
    const current = new Date();
    from = from ?? new Date(current.getFullYear(), current.getMonth() - 1, current.getDate());
    to = to ?? current;

    this.startSelecting = false;
    this.showDateFrom = new Date(from);
    this.selected = {from, to};

    this.onPointerDown = this.onPointerDown.bind(this);

    this.render();
    this.dispatchEvent();
  }

  get template () {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-elem="input">
          <span data-elem="from"></span> - <span data-elem="to"></span>
        </div>
        <div class="rangepicker__selector" data-elem="selector">
          <div class="rangepicker__selector-arrow"></div>
          <div class="rangepicker__selector-control-left"></div>
          <div class="rangepicker__selector-control-right"></div>
          <div class="rangepicker__calendar" data-elem="calendar1"></div>
          <div class="rangepicker__calendar" data-elem="calendar2"></div>
        </div>
      </div>
    `;
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    const element = wrapper.firstElementChild;
    this.element = element;
    this.subElements = this.getSubElements(element);

    this.renderInput();
    this.renderSelector();

    this.initEventListeners();

    return this.element;
  }

  renderInput() {
    this.subElements.from.innerHTML = this.selected.from.toLocaleDateString();
    this.subElements.to.innerHTML = this.selected.to.toLocaleDateString();
  }

  renderSelector() {
    const renderCalendar = (idx) => {
      const firstLetterUpper = (str) => str[0].toUpperCase() + str.slice(1);

      const renderDay = (day) => {
        const currentDate = new Date(startDate.setDate(day));
        const startDayStyle = day === 1 ? ` style="--start-from: ${weekStart}"` : '';
        return `<button type="button" class="rangepicker__cell" data-value="${currentDate.valueOf()}"${startDayStyle}>${day}</button>`;
      }

      const startDate = new Date(this.showDateFrom.getFullYear(), this.showDateFrom.getMonth() + idx - 1, 1);
      const month = firstLetterUpper(startDate.toLocaleString('default', { month: 'long' }));
      const daysInMonth = 32 - new Date(startDate.getFullYear(), startDate.getMonth(), 32).getDate();
      const weekStart = startDate.getDay() === 0 ? 7 : startDate.getDay();

      let days = [];
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(renderDay(i));
      }

      return `
      <div class="rangepicker__month-indicator">
        <time datetime="${month}">${month}</time>
      </div>
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
      <div class="rangepicker__date-grid">
        ${days.join('')}
      </div>
      `;    
    }

    for (let i = 1; i <= 2; i++) {
      this.subElements['calendar' + i].innerHTML = renderCalendar(i);
    }

    this.setCalendarIntervals();
  }

  setCalendarIntervals() {
    for (let button of this.subElements.selector.querySelectorAll('button')) {      
      const buttonDate = +button.dataset.value;
      let classes = ['rangepicker__cell'];
      if (buttonDate == this.selected.from.valueOf()) {
        classes.push('rangepicker__selected-from');
      } else 
        if (buttonDate == this.selected.to.valueOf()) {
          classes.push('rangepicker__selected-to');
        } else
          if (buttonDate > this.selected.from.valueOf() && buttonDate < this.selected.to.valueOf()) {
            classes.push('rangepicker__selected-between');
          }
      button.className = classes.join(' ');
    }
  }

  dispatchEvent() {
    this.element.dispatchEvent(new CustomEvent('date-select', {
      bubbles: true,
      detail:  this.selected
    }));
  }

  getSubElements (element) {
    const subElements = {};

    for (const subElement of element.querySelectorAll('[data-elem]')) {
      subElements[subElement.dataset.elem] = subElement;
    }

    return subElements;
  }

  initEventListeners () {
    document.addEventListener('pointerdown', this.onPointerDown);
    this.subElements.input.addEventListener('click', () => this.onInputClick());
    this.subElements.selector.addEventListener('click', (event) => this.onSelectorClick(event));
  }

  onInputClick() {
    this.element.classList.add('rangepicker_open');
  }

  onPointerDown(event) {
    if (!(event.target.closest('div.rangepicker__selector'))) {
      this.element.classList.remove('rangepicker_open');
    } 
  }

  onSelectorClick(event) {
    if (event.target.closest('div.rangepicker__selector-control-left')) {
      this.showDateFrom = new Date(this.showDateFrom.getFullYear(), this.showDateFrom.getMonth() - 1, 1);
      this.renderSelector();
      return;
    } 

    if (event.target.closest('div.rangepicker__selector-control-right')) {
      this.showDateFrom = new Date(this.showDateFrom.getFullYear(), this.showDateFrom.getMonth() + 1, 1);
      this.renderSelector();
      return;
    }

    const button = event.target.closest('button.rangepicker__cell');
    if (button) {
      if (this.startSelecting === false) {
        this.startSelecting = true;
        this.selected.from = this.selected.to = new Date(+button.dataset.value);
      } 
      else {
        const date1 = +button.dataset.value;
        const date2 = this.selected.from.valueOf(); 

        this.selected.from = new Date(Math.min(date1, date2));
        this.selected.to = new Date(Math.max(date1, date2));

        this.startSelecting = false;
        this.renderInput();
        this.element.classList.remove('rangepicker_open');

        this.dispatchEvent();
      }
      this.setCalendarIntervals();
    }
  }

  remove () {
    document.removeEventListener('pointerdown', this.onPointerDown);
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
