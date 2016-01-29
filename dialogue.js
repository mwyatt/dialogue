var $ = require('jquery');
var mustache = require('mustache');

var $document = $(document);
var $window = $(window);

var defaultOptions = {
	templateContainer: '', // the mustache template container html
	className: '', // to identify the dialogue uniquely

	// optional
	title: '',
	description: '',
	positionTo: '', // $selector where the dialogue will appear
	hardClose: false, // make it difficult to close the dialogue
	mask: false, // mask the page below
	width: false, // int
	html: '', // raw html to be placed in to body area, under description
	ajaxConfig: false, // ajax - type, url, dataType, data, success, error
	actions: {
	  // {name: 'Cancel', action: function() {
	  //   console.log('Cancel');
	  // }},
	  // {name: 'Ok', action: function() {
	  //   console.log('Ok');
	  // }}
	},
	onComplete: function() {}, // fired when dialogue has been rendered
	onClose: function() {}, // fired when dialogue has been closed

	// proposed
	cssAnimation: false // to tell close whether to check for animation end? still a problem with browser compatibility
};

var templateContainer = '<div class="dialogue-container js-dialogue-container {{className}}">{{#mask}}	<div class="dialogue-mask js-dialogue-mask {{#className}}{{className}}-mask{{/className}}"></div>{{/mask}}<div class="dialogue js-dialogue {{#className}}{{className}}-dialogue{{/className}}"><span class="dialogue-close js-dialogue-close">&times;</span>{{#title}}<h6 class="dialogue-title">{{title}}</h6>{{/title}}{{#description}}<p class="dialogue-description">{{description}}</p>{{/description}}<div class="dialogue-html js-dialogue-html">{{{html}}}</div><div class="dialogue-actions">{{#actions}}<span class="button-primary dialogue-action js-dialogue-action-{{name}}" data-name="{{name}}">{{name}}</span>{{/actions}}</div></div></div>';

var keyCode = {
	esc: 27
};

var classNames = {
	container: 'js-dialogue-container',
	dialogue: 'js-dialogue',
	dialogueHtml: 'js-dialogue-html',
	dialogueClose: 'js-dialogue-close',
	dialogueMask: 'js-dialogue-mask'
};

// var draggabilly = require('draggabilly');
// var draggie = new draggabilly('.js-dialogue', {});


// obtains css selector version of a class name
// how can this be done better?
var gS = function (className) {
  return '.' + className;
}


function getRandomString () {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	for (var i=0; i < 5; i++)
	  text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}


// unchanging events
// does event pass?
var Dialogue = function (event) {

	// click body means dont close
	$document.on('click.dialogue.body', gS(classNames.dialogue), this, function(event) {
		event.stopPropagation();
	});

	// clicking close [x]
	$document.on('click.dialogue.close', gS(classNames.dialogueClose), this, function(event) {
		event.data.close(event);
	});
};


// override if you wish to use your own dialogue template
Dialogue.prototype.setTemplateContainer = function(html) {
	templateContainer = html;
};


/**
 * render, bind events, and position new dialogue
 */
Dialogue.prototype.create = function(options) {
	this.options = $.extend(defaultOptions, options);
	this.options.className = this.options.className ? this.options.className : getRandomString();
	$('body').append(mustache.render(templateContainer, this.options));
	this.$container = $(gS(classNames.container) + gS(this.options.className));
	this.$dialogue = this.$container.find(gS(classNames.dialogue));
	this.$dialogueHtml = this.$container.find(gS(classNames.dialogueHtml));

	if (this.options.mask) {
		this.$dialogueMask = this.$container.find(gS(classNames.dialogueMask));
	};

	event.data = this;

	this.applyCss(event);
	this.setEvents(event);

	if (this.options.ajaxConfig) {
		var config = this.options.ajaxConfig;

		// var spin = new spinner(this.$dialogueHtml);

		$.ajax({
			type: config.type,
			url: config.url,
			dataType: config.dataType,
			data: config.data,
			complete: function() {
				event.data.options.onComplete.call();
				event.data = applyCss();
			},
			success: function(response) {
				config.success(response);
			},
			error: function(response) {
				config.error(response);
			}
		});

	// no ajax
	} else {

		// completed build
		this.options.onComplete.call();
	};
};


Dialogue.prototype.setEvents = function(event) {

	// hard to close
	if (event.data.options.hardClose) {
		$document.off('keyup.dialogue.close');
		$document.off('mousedown.dialogue.close');

	// easy to close
	} else {

		// hit esc
		$document.on('keyup.dialogue.close', event.data, function(event) {
			if (event.which == keyCode.esc) {
				event.data.close(event);
			} 
		});

		// mousedown outside of dialogue
		// down used because when clicking and dragging an input value will
		// close it
		$document.on('mousedown.dialogue.close', event.data, function(event) {
			if (!$(event.target).closest(gS(classNames.dialogue)).length) {
				event.data.close(event);
			}
		});
	};

	// option actions [ok, cancel]
	var actions = event.data.options.actions;
	$document.on('click.dialogue.action', '.selector', function(event) {
		event.preventDefault();
		/* Act on the event */
	});
	if (actions.length) {
		for (var actionName = actions) {
			event.data.$dialogue.find('.js-dialogue-action-' + actionName)
				.off('click.dialogue.action')
				.on('click.dialogue.action', function() {
					actions[actionName].call();
				});
		}
		};
	};
};


// apply the css to the dialogue
// max-width
// position
Dialogue.prototype.applyCss = function(event) {
	var cssSettings = {};
	cssSettings['max-width'] = event.data.options.width;

	// position dialogue
	var $positionalElement = event.data.options.positionTo;
	var frame = {
		positionVertical: $(document.body).scrollTop(),
		height: $window.height(),
		width: $window.width()
	};

	// position container
	event.data.$container.css({
		top: frame.positionVertical
	});

	// position to element or centrally window
	if ($positionalElement.length) {

		// calc top
		cssSettings.position = 'absolute';
		cssSettings.top = parseInt($positionalElement.offset().top) - parseInt(event.data.$container.offset().top);
		cssSettings.left = $positionalElement.offset().left;

		// if the right side of the dialogue is poking out of the frame then
		// bring it back in plus 50px padding
		if ((cssSettings.left + event.data.$dialogue.width()) > frame.width) {
			cssSettings.left = frame.width - 50;
			cssSettings.left = cssSettings.left - event.data.$dialogue.width();
		};

	// no positional element so center to window
	} else {
		cssSettings.position = 'relative';
		cssSettings.margin = '0 auto';
		cssSettings.left = 'auto';

		// center vertically if there is room
		// otherwise send to top and then just scroll
		if (event.data.$dialogue.height() < frame.height) {
			cssSettings.top = (frame.height / 2) - (event.data.$dialogue.height() / 2) - 20;
		} else {
			cssSettings.top = 0;
		};
	};

	event.data.$dialogue.css(cssSettings);
}


/**
 * call onclose and remove
 * @param  {object} data 
 * @return {null}      
 */
Dialogue.prototype.close = function(event) {

	// remove after animation (issue with if there was no animation)
	// var removeClassName = 'dialogue-remove';
	// this.$container.addClass(removeClassName);
	// this.$dialogue.on(getMotionEventName('animation'), function() {

	event.data.$container.remove();
	event.data.options.onClose.call();
};


module.exports = Dialogue;
