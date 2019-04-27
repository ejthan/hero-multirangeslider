import Phantom from './phantom';
import Range from './range';
import Indicator from './indicator';
//import { getEventProperty } from './utils';
//import vertical from 'vertical';
import $ from 'jquery';
import Mark from './mark';
import Base from './element';

export default class HeroMultirangeslider extends Base {
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