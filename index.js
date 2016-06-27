var mustache = require('mustache');
var draggable = require('draggable');
var extend = require('extend');
var dialoguesOpen = [];
var templateContainer = require('./js/container.mustache');
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

if (typeof document === 'undefined') {
  console.warn('document object undefined.');
}

if (typeof window === 'undefined') {
  console.warn('window object undefined.');
}

var body = document.querySelector('body');
if (!body) {
  console.warn('body element not found.');
}

// checks if el is inside a target class
// if there is no HTML element this will explode.
var isInside = function(el, parentClass) {
  while (el.tagName !== 'HTML') {
       
    if (el.parentNode.classList.contains(parentClass)) {
      return true;
    }
       
    el = el.parentNode;
  }
};

// obtains css selector version of a class name
// how can this be done better?
var class_ = function(className) {
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
    id: '',
    templateContainer: '', // the mustache template container html
    className: '', // to identify the dialogue uniquely

    // optional
    title: '',
    description: '',
    positionTo: '', // selector where the dialogue will appear
    hardClose: false, // make it difficult to close the dialogue
    mask: false, // mask the page below
    width: false, // int
    ajax: false, // starts the dialogue with html = spinner
    hideClose: false,
    html: '', // raw html to be placed in to body area, under description
    draggable: '', // draggable instance
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
    onClose: function() {} // fired when dialogue has been closed
  };
  extend(this.options, defaultOptions, options);

  // need to have a unique classname otherwise it cant be selected
  this.options.className = this.options.className ? this.options.className : getRandomString();

  this.options.id = getRandomString();

  if (this.options.actions) {
    this.options.actionNames = [];
    for (var actionName in this.options.actions) {
      this.options.actionNames.push(actionName);
    };
  };

  body.innerHtml = mustache.render(templateContainer, this.options) + body.innerHtml;

  this.container = document.querySelector(class_(classNames.container) + class_(this.options.className + '-container'));
  this.dialogue = this.container.querySelector(class_(classNames.dialogue));
  this.dialogueHtml = this.container.querySelector(class_(classNames.dialogueHtml));

  if (this.options.mask) {
    this.dialogueMask = this.container.querySelector(class_(classNames.dialogueMask));
  };

  if (this.options.draggable) {
    new draggable (this.dialogue, {
      filterTarget: function(target) {
        return target.classList.contains('js-dialogue-draggable-handle');
      }
    });
  }

  if (!dialoguesOpen.length) {
    document.addEventListener('keyup', handleKeyup);
  }

  setEvents(this);

  if (this.options.ajax) {
    this.setHtml('<div class="dialogue-spinner-container"><div class="dialogue-spinner"></div></div>');
  }

  dialoguesOpen.push({
    container: this.container
  });

  this.container.css('z-index', dialogueOpenCount++);
  event.data.applyCssPosition(event);
  this.options.onComplete.call(event.data);
};

function handleKeyup(event) {
  
  if (event.which == keyCode.esc) {
    var dialogue = dialoguesOpen.splice(-1, 1);
    closeInstance(dialogue);
  }
}

function setEvents(dialogue) {

  // not hard to close
  if (!dialogue.options.hardClose) {

    // mousedown outside of dialogue, down used because when
    // clicking and dragging an input value will close it
    dialogue.container.addEventListener('mousedown', function(event) {
      var result = isInside(event.target, class_(classNames.dialogue));
      if (!result) {
        dialogue.closeInstance(dialogue);
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
  event.data.$container.on('click.dialogue.body', class_(classNames.dialogue), this, function(event) {
    event.stopPropagation();
  });

  // clicking close [x]
  event.data.$container.on('click', class_(classNames.dialogueClose), this, function(event) {
    event.data.closeInstance(event);
  });

}

Dialogue.prototype.setActionEvent = function(event, actionName, actionFunction) {
  event.data.$container.on('click.dialogue.action', '.js-dialogue-action[data-name="' + actionName + '"]', event.data, function(event) {
    actionFunction.call(event.data);
  });
};

// apply the css to the dialogue
// max-width
// position
Dialogue.prototype.applyCssPosition = function(event) {
  var containerPadding = 20;
  var cssSettings = {};
  cssSettings['max-width'] = event.data.options.width;

  // position dialogue
  var $positionalElement = event.data.options.positionTo;
  var clientFrame = {
    positionVertical: $window[0].pageYOffset,
    height: $window[0].innerHeight,
    width: $window.width()
  };

  var borderWidth = 1;
  var paddingWidth = 20;
  var dialogueHeight = parseInt(event.data.$dialogue.height()) + (paddingWidth * 2) + (borderWidth * 2);

  // position container
  event.data.$container.css({
    top: clientFrame.positionVertical
  });

  // position to element or centrally window
  if ($positionalElement.length) {

    // calc top
    cssSettings.position = 'absolute';
    cssSettings.top = parseInt($positionalElement.offset().top) - parseInt(event.data.$container.offset().top);
    cssSettings.left = parseInt($positionalElement.offset().left);

    // if the right side of the dialogue is poking out of the clientFrame then
    // bring it back in plus 50px padding
    if ((cssSettings.left + cssSettings['max-width']) > clientFrame.width) {
      cssSettings.left = clientFrame.width - 50;
      cssSettings.left = cssSettings.left - cssSettings['max-width'];
    };

    // no positional element so center to window
  } else {
    cssSettings.position = 'relative';
    cssSettings.margin = '0 auto';
    cssSettings.left = 'auto';

    // center vertically if there is room
    // otherwise send to top and then just scroll
    if (dialogueHeight < clientFrame.height) {
      cssSettings.top = parseInt(clientFrame.height / 2) - parseInt(dialogueHeight / 2) - containerPadding;
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
Dialogue.prototype.closeInstance = function(dialogue) {

  if (!dialoguesOpen.length) {
    return;
  }

  dialoguesOpen.forEach(function(dialogueSingle, index) {
    if (dialogueSingle.options.id == dialogue.id) {
      dialoguesOpen.splice(index, 1);
    }
  });

  if (!dialoguesOpen.length) {
    document.removeEventListener('keyup', handleKeyup)
  }

  // .off('click.dialogue.action')

  // dialogue.container.off(); // needed?
  dialogue.container.remove();
  dialogue.options.onClose.call(dialogue);
};

Dialogue.prototype.close = function() {
  this.closeInstance({data: this});
};

Dialogue.prototype.setHtml = function(html) {
  this.dialogueHtml.html(html);
};

Dialogue.prototype.setTitle = function(html) {
  this.dialogue.find('.js-dialogue-title').html(html);
};

Dialogue.prototype.isOpen = function() {
  return typeof this.dialogue !== 'undefined';
};

Dialogue.prototype.reposition = function() {
  this.applyCssPosition({data: this});
};

module.exports = Dialogue;
