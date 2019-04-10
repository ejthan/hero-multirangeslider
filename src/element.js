import $ from 'jquery';
import requestAnimationFrame from './raf';

var has = Object.prototype.hasOwnProperty;

export default class Base {
  constructor(html) {
    this.$el = $(html);
    this.$data = {};
    this.$el.data('element', this);
  }

  draw(css) {
    var self = this;
    if (this.drawing) return this.$el;
    requestAnimationFrame(function () {
      self.drawing = false;
      self.$el.css(css);
    });
    this.drawing = true;
    return this.$el;
  }
  on() {
    this.$el.on.apply(this.$el, arguments);
    return this;
  }
  one() {
    this.$el.one.apply(this.$el, arguments);
    return this;
  }
  off() {
    this.$el.off.apply(this.$el, arguments);
    return this;
  }
  trigger() {
    this.$el.trigger.apply(this.$el, arguments);
    return this;
  }
  remove() {
    this.$el.remove();
  }
  detach() {
    this.$el.detach();
  }
  data(key, value) {
    var obj = key;
    if (typeof key === 'string') {
      if (typeof value === 'undefined') {
        return this.$data[key];
      }
      obj = {};
      obj[key] = value;
    }
    $.extend(this.$data, obj);
    return this;
  }
  isVertical() {
    return this.options.vertical;
  }

  ifVertical(v, h) {
    return this.isVertical() ? v : h;
  }
  edge(which) {
    if (which === 'start') {
      return this.ifVertical('top', 'left');
    } else if (which === 'end') {
      return this.ifVertical('bottom', 'right');
    }
    throw new TypeError('What kind of an edge is ' + which);
  }
  totalSize() {
    return this.$el[this.ifVertical('height', 'width')]();
  }
  edgeProp(edge, prop) {
    var o = this.$el[prop]();
    return o[this.edge(edge)];
  }
  startProp(prop) {
    return this.edgeProp('start', prop);
  }
  endProp(prop) {
    return this.edgeProp('end', prop);
  }
}
