import Base from './element';
//var vertical = require('./vertical');

export default class Indicator extends Base {
  constructor(options) {
    super('<div class="hero-indicator">');
    if(options.indicatorClass) this.$el.addClass(options.indicatorClass);
    if(options.value) this.val(options.value);
    this.options = options;
  }

  val(pos) {
    if(pos) {
      if(this.isVertical()) {
        this.draw({top: 100*pos + '%'});
      } else {
        this.draw({left: 100*pos + '%'});
      }
      this.value = pos;
    }
    return this.value;
  }
}
