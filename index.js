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
var docBody = document.querySelector('body');

// checks if el is inside a parent el
// if there is no HTML element this will explode.
var isInside = function(el, parentEl) {
  
  if (el == parentEl || el.tagName == 'HTML') {
    return true;
  }

  while (el.tagName !== 'BODY') {
       
    if (el.parentNode == parentEl) {
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
  this.options;
  this.container;
  this.dialogue;
  this.dialogueHtml;
  this.dialogueMask;

  var optionsTemplate = {
    id: '', // randomly generated on creation, but why?
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
  
  extend(optionsTemplate, options);

  this.options = optionsTemplate;

  // need to have a unique classname otherwise it cant be selected
  this.options.className = this.options.className ? this.options.className : getRandomString();

  this.options.id = getRandomString();

  // for mustache template
  if (this.options.actions) {
    this.options.actionNames = [];
    for (var actionName in this.options.actions) {
      this.options.actionNames.push(actionName);
    };
  };

  docBody.insertAdjacentHTML('afterbegin', mustache.render(templateContainer, this.options));

  this.container = document.querySelector(class_(classNames.container) + class_(this.options.className + '-container'));
  this.dialogue = this.container.querySelector(class_(classNames.dialogue));
  this.dialogueHtml = this.container.querySelector(class_(classNames.dialogueHtml));

  // blur the element used to open this dialogue, as enter key could be pressed once the dialogue is open and open it again
  document.activeElement.blur();

  if (this.options.mask) {
    this.dialogueMask = this.container.querySelector(class_(classNames.dialogueMask));
  };

  if (this.options.draggable) {
    new draggable(this.dialogue, {
      filterTarget: function(target) {
        return target.classList.contains('js-dialogue-draggable-handle');
      }
    });
  }

  if (!dialoguesOpen.length) {
    document.addEventListener('keyup', handleKeyup);
    document.addEventListener('mousedown', handleMousedown);
  }

  setEvents(this);

  if (this.options.ajax) {
    this.setHtml('<div class="dialogue-spinner-container"><div class="dialogue-spinner"></div></div>');
  }

  dialoguesOpen.push(this);

  applyCssPosition(this);

  this.options.onComplete.call(this);
};

function handleKeyup(event) {
  
  if (event.which == keyCode.esc) {
    var dialogue = getDialogueCurrent();
    closeInstance(dialogue);
  }
}

function getDialogueCurrent() {
  var key = dialoguesOpen.length - 1;
  if (key in dialoguesOpen) {
    return dialoguesOpen[key];
  }
}

/**
 * clicking anything not inside the most current dialogue
 */
function handleMousedown(event) {

  // get currently open dialogue
  var dialogue = getDialogueCurrent();

  if (dialogue.options.hardClose) {
    return;
  }

  var result = isInside(event.target, dialogue.dialogue);
  if (!result) {
    closeInstance(dialogue);
  }
}

function setEvents(dialogue) {

  // option actions [ok, cancel]
  if (dialogue.options.actions) {
    var lastButton;

    for (var actionName in dialogue.options.actions) {
      lastButton = dialogue.container.querySelector('.js-dialogue-action[data-name="' + actionName + '"]');
      setActionEvent(dialogue, lastButton, dialogue.options.actions[actionName]);
    };

    if (lastButton) {
      lastButton.focus();
    }
  };

  // click body means dont close
  dialogue.dialogue.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  // clicking close [x]
  if (!dialogue.options.hideClose) {
    var button = dialogue.container.querySelector(class_(classNames.dialogueClose));
    button.addEventListener('click', function(event) {
      closeInstance(dialogue);
    });
  }
}

function setActionEvent(dialogue, button, actionCallback) {
  if (button) {
    button.addEventListener('click', function() {
      actionCallback.call(dialogue);
    });
  }
};

function parsePx(int) {
  if (int === 'auto') {
    return int;
  }
  return int + 'px';
}

function getStyle(oElm, strCssRule) {
  var strValue = "";
  if(document.defaultView && document.defaultView.getComputedStyle){
    strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
  }
  else if(oElm.currentStyle){
    strCssRule = strCssRule.replace(/\-(\w)/g, function (strMatch, p1){
      return p1.toUpperCase();
    });
    strValue = oElm.currentStyle[strCssRule];
  }
  return strValue;
}

// apply the css to the dialogue to position correctly
function applyCssPosition(dialogue) {
  var positionalEl = dialogue.options.positionTo;
  var containerPadding = 20;
  var cssSettings = {
    top: '',
    left: '',
    position: '',
    margin: '',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    maxWidth: dialogue.options.width
  };
  var clientFrame = {
    positionVertical: window.pageYOffset,
    height: window.innerHeight,
    width: window.innerWidth
  };
  var borderWidth = parseInt(getStyle(dialogue.dialogue, 'border-width'));
  var dialogueHeight = parseInt(dialogue.dialogue.offsetHeight) + (borderWidth * 2);

  // position container
  dialogue.container.style.top = parsePx(clientFrame.positionVertical);

  // position to element or centrally window
  if (positionalEl) {
    var boundingRect = positionalEl.getBoundingClientRect();

    // calc top
    cssSettings.position = 'absolute';
    cssSettings.top = parseInt(boundingRect.top);
    cssSettings.left = parseInt(boundingRect.left);

    // if the right side of the dialogue is poking out of the clientFrame then
    // bring it back in plus 50px padding
    if ((cssSettings.left + cssSettings['maxWidth']) > clientFrame.width) {
      cssSettings.left = clientFrame.width - 50;
      cssSettings.left = cssSettings.left - cssSettings['maxWidth'];
    };

    // no positional element so center to window
  } else {
    cssSettings.position = 'relative';
    cssSettings.left = 'auto';
    cssSettings.marginTop = 0;
    cssSettings.marginRight = 'auto';
    cssSettings.marginBottom = 0;
    cssSettings.marginLeft = 'auto';

    // center vertically if there is room
    // otherwise send to top and then just scroll
    if (dialogueHeight < clientFrame.height) {
      cssSettings.top = parseInt(clientFrame.height / 2) - parseInt(dialogueHeight / 2) - containerPadding;
    } else {
      cssSettings.top = 'auto';
    };
  };

  dialogue.container.style.zIndex = 500 + dialoguesOpen.length;
  dialogue.dialogue.style.top = parsePx(cssSettings.top);
  dialogue.dialogue.style.left = parsePx(cssSettings.left);
  dialogue.dialogue.style.position = parsePx(cssSettings.position);
  dialogue.dialogue.style.marginTop = parsePx(cssSettings.marginTop);
  dialogue.dialogue.style.marginRight = parsePx(cssSettings.marginRight);
  dialogue.dialogue.style.marginBottom = parsePx(cssSettings.marginBottom);
  dialogue.dialogue.style.marginLeft = parsePx(cssSettings.marginLeft);
  dialogue.dialogue.style.maxWidth = parsePx(cssSettings.maxWidth);
};

/**
 * call onclose and remove
 * @param  {object} data
 * @return {null}
 */
function closeInstance(dialogue) {

  if (!dialoguesOpen.length) {
    return;
  }

  dialoguesOpen.forEach(function(dialogueSingle, index) {
    if (dialogueSingle.options.id == dialogue.options.id) {
      dialoguesOpen.splice(index, 1);
    }
  });

  if (!dialoguesOpen.length) {
    document.removeEventListener('keyup', handleKeyup);
    document.removeEventListener('mousedown', handleMousedown);
  }

  // .off('click.dialogue.action')

  // dialogue.container.off(); // needed?
  docBody.removeChild(dialogue.container);
  dialogue.options.onClose.call(dialogue);
};

Dialogue.prototype.close = function() {
  closeInstance(this);
};

Dialogue.prototype.setHtml = function(html) {
  this.dialogueHtml.innerHTML = html;
};

Dialogue.prototype.setTitle = function(html) {
  this.dialogue.find('.js-dialogue-title').html(html);
};

Dialogue.prototype.isOpen = function() {
  return typeof this.dialogue !== 'undefined';
};

Dialogue.prototype.reposition = function() {
  applyCssPosition(this);
};

module.exports = Dialogue;
