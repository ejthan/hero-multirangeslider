import Base from './element';

export default class  Mark extends Base {
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
