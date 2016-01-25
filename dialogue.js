var mustache = require('mustache');
var keyCode = require('./keyCode');
var getMotionEventName = require('./utility/getMotionEventName');
var data;
var $dialogue;
var $dialogueContainer;
var $dialogueHtml;
var $dialogueMask;
var calculatedLeft;
var intPopWidth;
var intWindowWidth;
var css = {};
var spinner = require('./spinner');
// var draggabilly = require('draggabilly');
// var draggie = new draggabilly('.js-dialogue', {});


/**
 * requirements
 * draggable with custom actions
 * built each time mustache
 * can be simple message 'ok'
 * can be ok / cancel with callback
 */
var Dialogue = function () {};


/**
 * render, bind events, and position new dialogue
 * @param  {object} options 
 * @return {null}         
 */
Dialogue.prototype.create = function(options) {
	var defaults = {
		mstTemplate: '#mst-dialogue', // the mustache template for ui
		hardClose: false, // make it difficult to close the dialogue
		mask: false, // mask the page below
		className: '', // foo-bar
		positionTo: '', // .selector
		width: false, // int
		html: '', // raw html to be placed in to body area, under description
		title: '',
		description: '',
		ajaxConfig: false,
		actions: [
		  // {name: 'Cancel', action: function() {
		  //   console.log('Cancel');
		  // }},
		  // {name: 'Ok', action: function() {
		  //   console.log('Ok');
		  // }}
		],
		onComplete: function() {}, // when dialogue has been rendered fully
		onClose: function() {} // when dialogue has been closed fully (animationend)
	};
	this.options = $.extend(defaults, options);

	// store globally
	data = this;
	css['max-width'] = data.options.width;

	// render
	$('body').append(mustache.render($(data.options.mstTemplate).html(), data.options));

	// store dom objects
	$dialogue = $('.js-dialogue');
	$dialogueContainer = $('.js-dialogue-container');
	$dialogueHtml = $('.js-dialogue-html');
	if (data.options.mask) {
		$dialogueMask = $('.js-dialogue-mask');
	};

	// set width
	$dialogue.css(css);

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
		$dialogue.on('click.dialogue', function(event) {
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
		$(document).off('mouseup.dialogue').on('mousedown.dialogue', function(event) {
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
	$dialogueContainer.css({
		top: frame.positionVertical
	});

	// position to element or centrally window
	if ($positionalElement.length) {

		// calc top
		var target = {
			position: 'absolute',
			top: parseInt($positionalElement.offset().top) - parseInt($dialogueContainer.offset().top),
			left: $positionalElement.offset().left
		};

		// left out of viewport to the right adjust
		if ((target.left + $dialogue.width()) > frame.width) {
			target.left = frame.width - 50;
			target.left = target.left - $dialogue.width();
		};

		// position
		css = target;

	// no positional element so center to window
	} else {
		css.position = 'relative';
		css.margin = '0 auto';
		css.left = 'auto';

		// center vertically if there is room
		// otherwise send to top and then just scroll
		if ($dialogue.height() < frame.height) {
			css.top = (frame.height / 2) - ($dialogue.height() / 2) - 20;
		} else {
			css.top = 0;
		};
	};

	// position it
	$dialogue.css(css);
}


function setDialogueActionEvent (action) {
	$dialogue
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
	var spin = new spinner($dialogueHtml);
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
	$dialogueContainer.addClass(removeClassName);
	// $dialogue.on(getMotionEventName('animation'), function() {
	// });
	$dialogueContainer.remove();

	// not after anim because sometimes no anim
	data.options.onClose.call();

	// cleanse events
	$(document)
		.off('keyup.dialogue')
		.off('mouseup.dialogue');
};


module.exports = Dialogue;
