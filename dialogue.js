var mustache = require('mustache');
var templateContainer;
var keyCode = {
	esc: 27
};
var classNames = {
	container: 'js-dialogue-container',
	dialogue: 'js-dialogue',
	dialogueHtml: 'js-dialogue-html',
	dialogueMask: 'js-dialogue-mask'
};


// will this be needed?
var getMotionEventName = function (type) {
    var t;
    var el = document.createElement('fakeelement');
    var map = {};
    if (type == 'transition') {
      map = {
        'transition':'transitionend',
        'OTransition':'oTransitionEnd',
        'MozTransition':'transitionend',
        'WebkitTransition':'webkitTransitionEnd'
      }
    } else if (type == 'animation') {
      map = {
        'animation':'animationend',
        'OAnimation':'oAnimationEnd',
        'MozAnimation':'animationend',
        'WebkitAnimation':'webkitAnimationEnd'
      }
    };

    for(t in map){
        if( el.style[t] !== undefined ){
            return map[t];
        }
    }
};
// var draggabilly = require('draggabilly');
// var draggie = new draggabilly('.js-dialogue', {});


// obtains css selector version of a class name
// how can this be done better?
function gS (className) {
  return '.' + className;
}


var Dialogue = function () {};


Dialogue.prototype.setTemplateContainer = function(html) {
	templateContainer = html;
};


/**
 * render, bind events, and position new dialogue
 * @param  {object} options 
 * @return {null}         
 */
Dialogue.prototype.create = function(options) {
	var defaults = {
		templateContainer: '', // the mustache template container html
		className: '', // to identify the dialogue uniquely

		// optional
		title: '',
		description: '',
		positionTo: '', // .selector where the dialogue will appear
		hardClose: false, // make it difficult to close the dialogue
		mask: false, // mask the page below
		width: false, // int
		html: '', // raw html to be placed in to body area, under description
		ajaxConfig: false, // ajax - type, url, dataType, data, success, error
		actions: [
		  // {name: 'Cancel', action: function() {
		  //   console.log('Cancel');
		  // }},
		  // {name: 'Ok', action: function() {
		  //   console.log('Ok');
		  // }}
		],
		onComplete: function() {}, // fired when dialogue has been rendered
		onClose: function() {} // fired when dialogue has been closed
	};
	this.options = $.extend(defaults, options);
	this.$container;

	this.cssSettings = {};
	this.cssSettings['max-width'] = data.options.width;

	this.dialogueRender = mustache.render(templateContainer, this.options);

	$('body').append(this.dialogueRender);

	// store dom objects
	this.$container = $(gS(classNames.container) + gS(this.options.className));
	this.$dialogue = this.$container.find('.js-dialogue');
	this.$dialogueHtml = this.$container.find('.js-dialogue-html');
	if (data.options.mask) {
		this.$dialogueMask = this.$container.find('.js-dialogue-mask');
	};

	// set width
	this.$dialogue.css(this.cssSettings);

	// position
	positionThings();

	// set events
	// closing x
	$('.js-dialogue-close').on('click.dialogue', function() {
		data.close(data);
	});

	// easy close events
	if (!data.options.hardClose) {

		// clicking dialogue
		this.$dialogue.on('click.dialogue', function(event) {
			event.stopPropagation();
		});

		// hit esc
		$(document).off('keyup.dialogue').on('keyup.dialogue', function(event) {
			if (event.which == keyCode.esc) {
				data.close(data);
			} 
		});

		// mousedown outside of dialogue
		// down used because when clicking and dragging an input value will
		// close it
		$(document).off('mousedown.dialogue').on('mousedown.dialogue', function(event) {
			if (!$(event.target).closest('.js-dialogue').length) {
				data.close(data);
			}
		});
	};

	// actions in options
	for (var index = data.options.actions.length - 1; index >= 0; index--) {
		setDialogueActionEvent(data.options.actions[index]);
	};

	// ajax
	if (data.options.ajaxConfig) {
		ajaxCall();

	// no ajax
	} else {

		// completed build
		data.options.onComplete.call();
	};
};


function positionThings () {

	// position dialogue
	var $positionalElement = $(data.options.positionTo);
	var frame = {
		positionVertical: $(document.body).scrollTop(),
		height: $(window).height(),
		width: $(window).width()
	};

	// position container
	this.$container.css({
		top: frame.positionVertical
	});

	// position to element or centrally window
	if ($positionalElement.length) {

		// calc top
		var target = {
			position: 'absolute',
			top: parseInt($positionalElement.offset().top) - parseInt(this.$container.offset().top),
			left: $positionalElement.offset().left
		};

		// left out of viewport to the right adjust
		if ((target.left + this.$dialogue.width()) > frame.width) {
			target.left = frame.width - 50;
			target.left = target.left - this.$dialogue.width();
		};

		// position
		this.cssSettings = target;

	// no positional element so center to window
	} else {
		this.cssSettings.position = 'relative';
		this.cssSettings.margin = '0 auto';
		this.cssSettings.left = 'auto';

		// center vertically if there is room
		// otherwise send to top and then just scroll
		if (this.$dialogue.height() < frame.height) {
			this.cssSettings.top = (frame.height / 2) - (this.$dialogue.height() / 2) - 20;
		} else {
			this.cssSettings.top = 0;
		};
	};

	// position it
	this.$dialogue.css(this.cssSettings);
}


function setDialogueActionEvent (action) {
	this.$dialogue
		.find('.js-dialogue-action-' + action.name).on('click.dialogue', function() {
			action.action.call();
		});
}


/**
 * maps the ajax config with an ajax call
 * @return {null} 
 */
function ajaxCall () {
	var config = data.options.ajaxConfig;
	var spin = new spinner(this.$dialogueHtml);
	positionThings();
	$.ajax({
		type: config.type,
		url: config.url,
		dataType: config.dataType,
		data: config.data,
		complete: function() {
			data.options.onComplete.call();
		},
		success: function(response) {
			config.success(response);
			positionThings();
		},
		error: function(response) {
			config.error(response);
			positionThings();
		}
	});
}


/**
 * call onclose and remove
 * @param  {object} data 
 * @return {null}      
 */
Dialogue.prototype.close = function(data) {
	var removeClassName = 'dialogue-remove';
	this.$container.addClass(removeClassName);
	// this.$dialogue.on(getMotionEventName('animation'), function() {
	// });
	this.$container.remove();

	// not after anim because sometimes no anim
	data.options.onClose.call();

	// cleanse events
	$(document)
		.off('keyup.dialogue')
		.off('mousedown.dialogue');
};


module.exports = Dialogue;
