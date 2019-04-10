import $ from 'jquery';
import Range from './range';
import requestAnimationFrame from './raf';

export default class Phantom extends Range {
  constructor(options) {
    super($.extend({
      readonly: true,
      label: '+'
    }, options));
    this.$el.addClass('hero-phantom');
    this.on('mousedown.hero touchstart.hero', $.proxy(this.mousedown, this));
  }

  mousedown(ev) {
    if(ev.which === 1) { // left mouse button
      var startX = ev.pageX;
      var newRange = this.options.perant.addRange(this.val());
      this.remove();
      this.options.perant.trigger('addrange', [newRange.val(), newRange]);
      requestAnimationFrame(function() {
        newRange.$el.find('.hero-handle:first-child').trigger(ev.type);
      });
    }
  }

  removePhantom() {
    // NOOP
  }
}
