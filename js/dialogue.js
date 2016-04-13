var $ = require('jquery');
var mustache = require('mustache');

var $document = $(document);
var $window = $(window);

var templateContainer = '<div class="dialogue-container js-dialogue-container {{#className}}{{className}}-container{{/className}}">{{#mask}}	<div class="dialogue-mask js-dialogue-mask {{#className}}{{className}}-mask{{/className}}"></div>{{/mask}}<div class="dialogue js-dialogue {{#className}}{{className}}-dialogue{{/className}}"><span class="dialogue-close js-dialogue-close">&times;</span>{{#title}}<h6 class="dialogue-title">{{title}}</h6>{{/title}}{{#description}}<p class="dialogue-description">{{description}}</p>{{/description}}<div class="dialogue-html js-dialogue-html">{{{html}}}</div><div class="dialogue-actions">{{#actionNames}}<button class="button primary dialogue-action js-dialogue-action" data-name="{{.}}">{{.}}</button>{{/actionNames}}</div></div></div>';

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
var gS = function(className) {
  return '.' + className;
};

function getRandomString() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (var i = 0; i < 5; i++)
  text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// unchanging events
// does event pass?
var Dialogue = function(event) {};

// override if you wish to use your own template
Dialogue.prototype.setTemplateContainer = function(html) {
  templateContainer = html;
};

/**
 * render, bind events, and position new dialogue
 */
Dialogue.prototype.create = function(options) {
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
    actions: {
    // 'Cancel': function() {
    //   this.close();
    // },
    // 'Ok': function() {
    //   console.log('Ok');
    // }
    },

    // new layout which allows for limitless definition of what an action does
    // should basic actions be removed? yes to keep all consistent
    actions: [
    // {
    //    name: 'Open',
    //    classes: ['button primary', 'right'],
    //    action: function() {

		 //    }
    // }
    ],
    onComplete: function() {}, // fired when dialogue has been rendered
    onClose: function() {}, // fired when dialogue has been closed

    // jquery ajax object
    ajaxConfig: false,

    // proposed
    cssAnimation: false // to tell close whether to check for animation end? still a problem with browser compatibility
  };
  this.options = $.extend(defaultOptions, options);
  this.options.className = this.options.className ? this.options.className : getRandomString();

  if (this.options.actions) {
    this.options.actionNames = [];
    for (var actionName in this.options.actions) {
      this.options.actionNames.push(actionName);
    };
  };

  $('body').append(mustache.render(templateContainer, this.options));
  this.$container = $(gS(classNames.container) + gS(this.options.className + '-container'));
  this.$dialogue = this.$container.find(gS(classNames.dialogue));
  this.$dialogueHtml = this.$container.find(gS(classNames.dialogueHtml));

  if (this.options.mask) {
    this.$dialogueMask = this.$container.find(gS(classNames.dialogueMask));
  };

  if (typeof event == 'undefined') {
    var event = {};
  }
  event.data = this;

  this.applyCss(event);
  this.setEvents(event);

  if (this.options.ajaxConfig) {
    this.handleAjax(event);

    // no ajax
  } else {

    // completed build
    this.options.onComplete.call(event.data);
    event.data.applyCss(event);
  };
};

Dialogue.prototype.handleAjax = function(event) {
  var config = event.data.options.ajaxConfig;
  var isImage;

  // using a class because cant think of a way to get the ajax loader
  // inside the plugin, css3 spinner?
  var ajaxLoadClass = 'dialogue-ajax-is-loading';

  event.data.$container.addClass(ajaxLoadClass);
  event.data.applyCss(event);

  // image or data?
  // if (config.url.indexOf('.jpg') || config.url.indexOf('.gif') || config.url.indexOf('.png')) {
  //   isImage = true;
  // };

  $.ajax({
    type: config.type,
    url: config.url,
    dataType: config.dataType,
    data: config.data,
    complete: function() {
      event.data.$container.removeClass(ajaxLoadClass);
      // config.complete.call(event.data);
      event.data.options.onComplete.call(event.data);
      event.data.applyCss(event);
    },
    success: function(response) {
      config.success.call(event.data, response);
      event.data.applyCss(event);
    },
    error: function(response) {
      config.error.call(event.data, response);
      event.data.applyCss(event);
    }
  });
};

Dialogue.prototype.setEvents = function(event) {

  // not hard to close
  if (!event.data.options.hardClose) {

    // hit esc
    $document.on('keyup.dialogue.close', event.data, function(event) {
      if (event.which == keyCode.esc) {
        event.data.closeWithEvent(event);
      }
    });

    // mousedown outside of dialogue
    // down used because when clicking and dragging an input value will
    // close it
    event.data.$container.on('mousedown.dialogue.close', event.data, function(event) {
      if (!$(event.target).closest(gS(classNames.dialogue)).length) {
        event.data.closeWithEvent(event);
      }
    });
  };

  // option actions [ok, cancel]
  var actions = event.data.options.actions;
  if (actions) {
    $document.on('keypress.dialogue.action', '.js-dialogue-action', function(event) {
      if (event.which == keyCode.enter) {
        $(this).trigger('click.dialogue.action');
      };
    });
    for (var actionName in actions) {
      event.data.setActionEvent(event, actionName, actions[actionName]);
    };
    $('.js-dialogue-action').last().focus();
  };

  // click body means dont close
  event.data.$container.on('click.dialogue.body', gS(classNames.dialogue), this, function(event) {
    event.stopPropagation();
  });

  // clicking close [x]
  event.data.$container.on('click.dialogue.close', gS(classNames.dialogueClose), this, function(event) {
    event.data.closeWithEvent(event);
  });
};

Dialogue.prototype.setActionEvent = function(event, actionName, actionFunction) {
  event.data.$container.on('click.dialogue.action', '.js-dialogue-action[data-name="' + actionName + '"]', event.data, function(event) {
    actionFunction.call(event.data);
  });
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
    cssSettings.left = parseInt($positionalElement.offset().left);

    // if the right side of the dialogue is poking out of the frame then
    // bring it back in plus 50px padding
    if ((cssSettings.left + cssSettings['max-width']) > frame.width) {
      cssSettings.left = frame.width - 50;
      cssSettings.left = cssSettings.left - cssSettings['max-width'];
    };

    // no positional element so center to window
  } else {
    cssSettings.position = 'relative';
    cssSettings.margin = '0 auto';
    cssSettings.left = 'auto';

    // center vertically if there is room
    // otherwise send to top and then just scroll
    if (event.data.$dialogue.height() < event.data.$container.height()) {
      cssSettings.top = (event.data.$container.height() / 2) - (event.data.$dialogue.height() / 2) - 20;
    } else {
      cssSettings.top = 0;
    };
  };

  event.data.$dialogue.css(cssSettings);
};

/**
 * call onclose and remove
 * @param  {object} data
 * @return {null}
 */
Dialogue.prototype.closeWithEvent = function(event) {

  // remove after animation (issue with if there was no animation)
  // var removeClassName = 'dialogue-remove';
  // this.$container.addClass(removeClassName);
  // this.$dialogue.on(getMotionEventName('animation'), function() {

  // remove events
  $document
  // .off('click.dialogue.action')
  .off('keyup.dialogue.close');

  // may have never been opened, attempted to close without ever opening
  if (typeof event.data.$container !== 'undefined') {
    event.data.$container.off(); // needed?
    event.data.$container.remove();
    event.data.options.onClose.call(event.data);
  }
};

Dialogue.prototype.close = function() {
  this.closeWithEvent({data: this});
};

Dialogue.prototype.setHtml = function(html) {
  this.$dialogueHtml.html(html);
};

Dialogue.prototype.reposition = function() {
  this.applyCss({data: this});
};

module.exports = Dialogue;