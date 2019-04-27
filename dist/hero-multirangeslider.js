var HeroMultirangeslider = (function ($) {
  'use strict';

  $ = $ && $.hasOwnProperty('default') ? $['default'] : $;

  // thanks to http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
  var lastTime = 0;
  var vendors = ['webkit', 'moz'], requestAnimationFrame = window.requestAnimationFrame;
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
  }

  if (!requestAnimationFrame) {
    requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
      timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  var requestAnimationFrame$1 = requestAnimationFrame;

  class Base {
    constructor(html) {
      this.$el = $(html);
      this.$data = {};
      this.$el.data('element', this);
    }

    draw(css) {
      var self = this;
      if (this.drawing) return this.$el;
      requestAnimationFrame$1(function () {
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

  //import { getEventProperty } from './utils';
  // var vertical = require('./vertical');

  class Range extends Base {
      constructor(options) {
          super('<div class="hero-range"><span class="hero-range-label">');
          var self = this;
          this.options = options;
          this.perant = options.perant;

          if (this.options.rangeClass) this.$el.addClass(this.options.rangeClass);
          if (this.options.modelId) this.$el.attr('data-model-id', this.options.modelId);

          if (!this.readonly()) {
              this.$el.prepend('<div class="hero-handle">').append('<div class="hero-handle">');
              this.on('mouseenter.hero touchstart.hero', $.proxy(this.removePhantom, this));
              this.on('mousedown.hero touchstart.hero', $.proxy(this.mousedown, this));
              this.on('click', $.proxy(this.click, this));
          } else {
              this.$el.addClass('hero-readonly');
          }
          if (typeof this.options.label === 'function') {
              this.on('changing', function (ev, range) {
                  self.writeLabel(
                      self.options.label.call(self, range.map($.proxy(self.perant.normalise, self.perant)))
                  );
              });
          } else {
              this.writeLabel(this.options.label);
          }

          this.range = [];
          this.hasChanged = false;

          if (this.options.value) this.val(this.options.value);

      }

      writeLabel(text) {
          this.$el.find('.hero-range-label')[this.options.htmlLabel ? 'html' : 'text'](text);
      }

      isVertical() {
          return this.perant.options.vertical;
      }

      removePhantom() {
          this.perant.removePhantom();
      }

      readonly() {
          if (typeof this.options.readonly === 'function') {
              return this.options.readonly.call(this.perant, this);
          }
          return this.options.readonly;
      }

      val(range, valOpts) {

          if (typeof range === 'undefined') {
              return this.range;
          }

          valOpts = $.extend({}, {
              dontApplyDelta: false,
              trigger: true
          }, valOpts || {});

          var next = this.perant.nextRange(this.$el),
              prev = this.perant.prevRange(this.$el),
              delta = range[1] - range[0],
              self = this;

          if (this.options.snap) {
              range = range.map(snap);
              delta = snap(delta);
          }
          if (next && next.val()[0] <= range[1] && prev && prev.val()[1] >= range[0]) {
              range[1] = next.val()[0];
              range[0] = prev.val()[1];
          }
          if (next && next.val()[0] < range[1]) {
              if (!this.perant.options.allowSwap || next.val()[1] >= range[0]) {
                  range[1] = next.val()[0];
                  if (!valOpts.dontApplyDelta) range[0] = range[1] - delta;
              } else {
                  this.perant.repositionRange(this, range);
              }
          }
          if (prev && prev.val()[1] > range[0]) {
              if (!this.perant.options.allowSwap || prev.val()[0] <= range[1]) {
                  range[0] = prev.val()[1];
                  if (!valOpts.dontApplyDelta) range[1] = range[0] + delta;
              } else {
                  this.perant.repositionRange(this, range);
              }
          }
          if (range[1] >= 1) {
              range[1] = 1;
              if (!valOpts.dontApplyDelta) range[0] = 1 - delta;
          }
          if (range[0] <= 0) {
              range[0] = 0;
              if (!valOpts.dontApplyDelta) range[1] = delta;
          }
          if (this.perant.options.bound) {
              var bound = this.perant.options.bound(this);
              if (bound) {
                  if (bound.upper && range[1] > this.perant.abnormalise(bound.upper)) {
                      range[1] = this.perant.abnormalise(bound.upper);
                      if (!valOpts.dontApplyDelta) range[0] = range[1] - delta;
                  }
                  if (bound.lower && range[0] < this.perant.abnormalise(bound.lower)) {
                      range[0] = this.perant.abnormalise(bound.lower);
                      if (!valOpts.dontApplyDelta) range[1] = range[0] + delta;
                  }
              }
          }

          if (this.range[0] === range[0] && this.range[1] === range[1]) return this.$el;

          this.range = range;

          if (valOpts.trigger) {
              this.$el.triggerHandler('changing', [range, this.$el]);
              this.hasChanged = true;
          }

          var start = 100 * range[0] + '%',
              size = 100 * (range[1] - range[0]) + '%';

          this.draw(
              this.perant.options.vertical ?
                  { top: start, minHeight: size } :
                  { left: start, minWidth: size }
          );

          return this;

          function snap(val) { return Math.round(val / self.options.snap) * self.options.snap; }
      }

      click(ev) {
          ev.stopPropagation();
          ev.preventDefault();

          var self = this;

          if (ev.which !== 2 || !this.perant.options.allowDelete) return;

          if (this.deleteConfirm) {
              this.perant.removeRange(this);
              clearTimeout(this.deleteTimeout);
          } else {
              this.$el.addClass('hero-delete-confirm');
              this.deleteConfirm = true;

              this.deleteTimeout = setTimeout(function () {
                  self.$el.removeClass('hero-delete-confirm');
                  self.deleteConfirm = false;
              }, this.perant.options.deleteTimeout);
          }
      }

      mousedown(ev) {
          ev.stopPropagation();
          ev.preventDefault();
          this.hasChanged = false;
          if (ev.which > 1) return;

          if ($(ev.target).is('.hero-handle:first-child')) {
              $('body').addClass('hero-resizing').toggleClass('hero-resizing-vertical', this.isVertical());
              $(document).on('mousemove.hero touchmove.hero', this.resizeStart(ev));
          } else if ($(ev.target).is('.hero-handle:last-child')) {
              $('body').addClass('hero-resizing').toggleClass('hero-resizing-vertical', this.isVertical());
              $(document).on('mousemove.hero touchmove.hero', this.resizeEnd(ev));
          } else {
              $('body').addClass('hero-dragging').toggleClass('hero-dragging-vertical', this.isVertical());
              $(document).on('mousemove.hero touchmove.hero', this.drag(ev));
          }

          var self = this;

          $(document).one('mouseup.hero touchend.hero', function (ev) {
              ev.stopPropagation();
              ev.preventDefault();

              if (self.hasChanged && !self.swapping) self.trigger('change', [self.range, self.$el]);
              self.swapping = false;
              $(document).off('mouseup.hero mousemove.hero touchend.hero touchmove.hero');
              $('body').removeClass('hero-resizing hero-dragging hero-resizing-vertical hero-dragging-vertical');
          });
      }

      drag(origEv) {
          var self = this,
              beginStart = this.startProp('offset'),
              beginPosStart = this.startProp('position'),
              mousePos = origEv[this.ifVertical('clientY', 'clientX')],
              mouseOffset = mousePos ? mousePos - beginStart : 0,
              beginSize = this.totalSize(),
              perant = this.options.perant,
              perantStart = perant.startProp('offset'),
              perantSize = perant.totalSize();

          return function (ev) {
              ev.stopPropagation();
              ev.preventDefault();
              var mousePos = ev[self.ifVertical('clientY', 'clientX')];
              if (typeof mousePos !== 'undefined') {
                  var start = mousePos - perantStart - mouseOffset;

                  if (start >= 0 && start <= perantSize - beginSize) {
                      var rangeOffset = start / perantSize - self.range[0];
                      self.val([start / perantSize, self.range[1] + rangeOffset]);
                  } else {
                      mouseOffset = mousePos - self.startProp('offset');
                  }
              }
          };
      }
      resizeEnd(origEv) {
          var self = this,
              beginStart = this.startProp('offset'),
              beginPosStart = this.startProp('position'),
              mousePos = origEv[this.ifVertical('clientY', 'clientX')],
              beginSize = this.totalSize(),
              perant = this.options.perant,
              perantStart = perant.startProp('offset'),
              perantSize = perant.totalSize(),
              minSize = this.options.minSize * perantSize;

          return function (ev) {
              var opposite = ev.type === 'touchmove' ? 'touchend' : 'mouseup',
                  subsequent = ev.type === 'touchmove' ? 'touchstart' : 'mousedown';
              ev.stopPropagation();
              ev.preventDefault();
              var mousePos = ev[self.ifVertical('clientY', 'clientX')];
              var size = mousePos - beginStart;

              if (typeof mousePos !== 'undefined') {
                  if (size > perantSize - beginPosStart) size = perantSize - beginPosStart;
                  if (size >= minSize) {
                      self.val([self.range[0], self.range[0] + size / perantSize], { dontApplyDelta: true });
                  } else if (size <= 10) {
                      self.swapping = true;
                      $(document).trigger(opposite + '.hero');
                      self.$el.find('.hero-handle:first-child').trigger(subsequent + '.hero');
                  }
              }
          };
      }

      resizeStart(origEv) {
          var self = this,
              beginStart = this.startProp('offset'),
              beginPosStart = this.startProp('position'),
              mousePos = origEv[this.ifVertical('clientY', 'clientX')],
              mouseOffset = mousePos ? mousePos - beginStart : 0,
              beginSize = this.totalSize(),
              perant = this.options.perant,
              perantStart = perant.startProp('offset'),
              perantSize = perant.totalSize(),
              minSize = this.options.minSize * perantSize;

          return function (ev) {
              var opposite = ev.type === 'touchmove' ? 'touchend' : 'mouseup',
                  subsequent = ev.type === 'touchmove' ? 'touchstart' : 'mousedown';

              ev.stopPropagation();
              ev.preventDefault();
              var mousePos = ev[self.ifVertical('clientY', 'clientX')];
              var start = mousePos - perantStart - mouseOffset;
              var size = beginPosStart + beginSize - start;

              if (typeof mousePos !== 'undefined') {
                  if (start < 0) {
                      start = 0;
                      size = beginPosStart + beginSize;
                  }
                  if (size >= minSize) {
                      self.val([start / perantSize, self.range[1]], { dontApplyDelta: true });
                  } else if (size <= 10) {
                      self.swapping = true;
                      $(document).trigger(opposite + '.hero');
                      self.$el.find('.hero-handle:last-child').trigger(subsequent + '.hero');
                  }
              }
          };
      }
  }

  class Phantom extends Range {
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
        requestAnimationFrame$1(function() {
          newRange.$el.find('.hero-handle:first-child').trigger(ev.type);
        });
      }
    }

    removePhantom() {
      // NOOP
    }
  }

  //var vertical = require('./vertical');

  class Indicator extends Base {
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

  class  Mark extends Base {
  	constructor(options) {
  		super('<div class="hero-label">');
  		this.$el.css(options.perant.edge('start'), (options.value * 100) + '%');
  	
  		if(typeof options.label === 'function') {
  			this.$el.text(options.label.call(this, options.perant.normalise(options.value)));
  		} else if(typeof options.label === 'string') {
  			this.$el.text(options.label);
  		} else {
  			this.$el.text(options.perant.normalise(options.value));
  		}
  	}
  }

  class HeroMultirangeslider extends Base {
      constructor(options) {
          super('<div class="hero-rangebar">');
          this.setup_options(options);
          this.options.min = this.options.valueParse(this.options.min);
          this.options.max = this.options.valueParse(this.options.max);
          if (this.options.barClass) this.$el.addClass(this.options.barClass);
          if (this.options.vertical) this.$el.addClass('hero-vertical');

          this.ranges = [];
          this.on('mousemove.hero touchmove.hero', $.proxy(this.mousemove, this));
          this.on('mouseleave.hero touchleave.hero', $.proxy(this.removePhantom, this));

          if (options.values) this.setVal(options.values);

          if (options.bgLabels) {
              options.bgMark = { count: options.bgLabels };
          }

          if (options.bgMark) {
              this.$markContainer = $('<div class="hero-labels">').appendTo(this.$el);
              if (options.bgMark.count) {
                  for (var i = 0; i < options.bgMark.count; ++i) {
                      this.$markContainer.append((new Mark({
                          label: options.bgMark.label,
                          value: i / options.bgMark.count,
                          perant: this
                      })).$el);
                  }
              } else if (options.bgMark.interval) {
                  for (var i = this.abnormalise(this.options.min); i < this.abnormalise(this.options.max); i += this.abnormalise(options.bgMark.interval)) {
                      this.$markContainer.append((new Mark({
                          label: options.bgMark.label,
                          value: i,
                          perant: this
                      })).$el);
                  }
              }
          }

          var self = this;

          if (options.indicator) {
              var indicator = this.indicator = new Indicator({
                  perant: this,
                  vertical: this.options.vertical,
                  indicatorClass: options.indicatorClass
              });
              indicator.val(this.abnormalise(options.indicator(this, indicator, function () {
                  indicator.val(self.abnormalise(options.indicator(self, indicator)));
              })));
              this.$el.append(indicator.$el);
          }
      }

      setup_options(options) {
          const default_options = {
              min: 0,
              max: 100,
              valueFormat(a) { return a; },
              valueParse(a) { return a; },
              maxRanges: Infinity,
              readonly: false,
              bgLabels: 0,
              deleteTimeout: 5000,
              allowDelete: false,
              vertical: false,
              htmlLabel: false,
              allowSwap: true
          };
          this.options = Object.assign({}, default_options, options);
      }

      normaliseRaw(value) {
          return this.options.min + value * (this.options.max - this.options.min);
      }

      normalise(value) {
          return this.options.valueFormat(this.normaliseRaw(value));
      }

      abnormaliseRaw(value) {
          return (value - this.options.min) / (this.options.max - this.options.min);
      }

      abnormalise(value) {
          return this.abnormaliseRaw(this.options.valueParse(value));
      }

      findGap(range) {
          var newIndex = 0;
          this.ranges.forEach(function ($r, i) {
              if ($r.val()[0] < range[0] && $r.val()[1] < range[1]) newIndex = i + 1;
          });

          return newIndex;
      }

      insertRangeIndex(range, index, avoidList) {
          if (!avoidList) this.ranges.splice(index, 0, range);

          if (this.ranges[index - 1]) {
              this.ranges[index - 1].$el.after(range.$el);
          } else {
              this.$el.prepend(range.$el);
          }
      }

      addRange(range, data, modelId) {
          var $range = new Range({
              perant: this,
              snap: this.options.snap ? this.abnormaliseRaw(this.options.snap + this.options.min) : null,
              label: this.options.label,
              rangeClass: this.options.rangeClass,
              minSize: this.options.minSize ? this.abnormaliseRaw(this.options.minSize + this.options.min) : null,
              readonly: this.options.readonly,
              htmlLabel: this.options.htmlLabel,
              modelId: modelId ? modelId : null,
          });

          if (this.options.data) {
              $range.data(this.options.data.call($range, this));
          }

          if (data) {
              $range.data(data);
          }

          this.insertRangeIndex($range, this.findGap(range));
          $range.val(range);

          var self = this;

          $range.on('changing', function (ev, nrange, changed) {
              ev.stopPropagation();
              self.trigger('changing', [self.val(), changed]);
          }).on('change', function (ev, nrange, changed) {
              ev.stopPropagation();
              self.trigger('change', [self.val(), changed]);
          });
          return $range;
      }

      prevRange(range) {
          var idx = range.index();
          if (idx >= 0) return this.ranges[idx - 1];
      }

      nextRange(range) {
          var idx = range.index();
          if (idx >= 0) return this.ranges[range instanceof Phantom ? idx : idx + 1];
      }

      setVal(ranges) {
          if (this.ranges.length > ranges.length) {
              for (var i = ranges.length - 1, l = this.ranges.length - 1; i < l; --l) {
                  this.removeRange(i);
              }
              this.ranges.length = ranges.length;
          }

          var self = this;

          ranges.forEach(function (range, i) {
              if (self.ranges[i]) {
                  self.ranges[i].val(range.map($.proxy(self.abnormalise, self)));
              } else {
                  self.addRange(range.map($.proxy(self.abnormalise, self)));
              }
          });

          return this;
      }

      val(ranges) {
          var self = this;
          if (typeof ranges === 'undefined') {
              return this.ranges.map(function (range) {
                  return range.val().map($.proxy(self.normalise, self));
              });
          }

          if (!this.readonly()) this.setVal(ranges);
          return this;
      }

      removePhantom() {
          if (this.phantom) {
              this.phantom.remove();
              this.phantom = null;
          }
      }

      removeRange(i, noTrigger, preserveEvents) {
          if (i instanceof Range) {
              i = this.ranges.indexOf(i);
          }
          this.ranges.splice(i, 1)[0][preserveEvents ? 'detach' : 'remove']();
          if (!noTrigger) {
              this.trigger('change', [this.val()]);
          }
      }

      repositionRange(range, val) {
          this.removeRange(range, true, true);
          this.insertRangeIndex(range, this.findGap(val));
      }

      calcGap(index) {
          var start = this.ranges[index - 1] ? this.ranges[index - 1].val()[1] : 0;
          var end = this.ranges[index] ? this.ranges[index].val()[0] : 1;
          return this.normaliseRaw(end) - this.normaliseRaw(start);
      }

      readonly() {
          if (typeof this.options.readonly === 'function') {
              return this.options.readonly.call(this);
          }
          return this.options.readonly;
      }

      mousemove(ev) {
          var w = this.options.minSize ? this.abnormaliseRaw(this.options.minSize + this.options.min) : 0.05;
          //var pageStart = getEventProperty(this.ifVertical('pageY', 'pageX'), ev);
          var pageStart = event[this.ifVertical('pageY', 'pageX')];
          var val = (pageStart - this.startProp('offset')) / this.totalSize() - w / 2;

          var direct = ev.target === ev.currentTarget;
          var phantom = $(ev.target).is('.hero-phantom');

          if ((direct || phantom) && this.ranges.length < this.options.maxRanges && !$('body').is('.hero-dragging, .hero-resizing') && !this.readonly()) {
              if (!this.phantom) this.phantom = new Phantom({
                  perant: this,
                  snap: this.options.snap ? this.abnormaliseRaw(this.options.snap + this.options.min) : null,
                  label: "+",
                  minSize: this.options.minSize ? this.abnormaliseRaw(this.options.minSize + this.options.min) : null,
                  rangeClass: this.options.rangeClass
              });
              var idx = this.findGap([val, val + w]);
              var self = this;
              this.one('addrange', function (ev, val, range) {
                  range.one('mouseup', function () {
                      self.trigger('change', [self.val(), range]);
                  });
              });

              if (!this.options.minSize || this.calcGap(idx) >= this.options.minSize) {
                  this.insertRangeIndex(this.phantom, idx, true);
                  this.phantom.val([val, val + w], { trigger: false });
              }
          }
      }
  }

  return HeroMultirangeslider;

}($));
