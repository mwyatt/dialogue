(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

  dialoguesOpen.push(this);

  applyCssPosition(this);

  this.options.onComplete.call(this);
};

function handleKeyup(event) {
  
  if (event.which == keyCode.esc) {
    var dialogue = dialoguesOpen[dialoguesOpen.length - 1];
    closeInstance(dialogue);
  }
}

function setEvents(dialogue) {

  // not hard to close
  if (!dialogue.options.hardClose) {

    // mousedown outside of dialogue, down used because when
    // clicking and dragging an input value will close it
    dialogue.container.addEventListener('mousedown', function(event) {
      if (event.target.classList.contains(classNames.dialogue)) {
        return;
      }
      var result = isInside(event.target, classNames.dialogue);
      if (!result) {
        closeInstance(dialogue);
      }
    });
  };

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

},{"./js/container.mustache":3,"draggable":5,"extend":6,"mustache":7}],2:[function(require,module,exports){
var dialogueFactory = require('../index');
var ready = require('./ready');

var dialogue = new dialogueFactory();
var dialogueSecondary = new dialogueFactory();

ready(function() {

  document.querySelector('.js-dialogue-8').addEventListener('click', function() {
    dialogue.create({
      title: 'Draggable',
      description: 'Powered by bcherny/draggable! Drag me you loaf!',
      className: 'dialogue-8',
      positionTo: this,
      draggable: true,
      mask: true,
      width: 250
    });
  });

  document.querySelector('.js-dialogue-1').addEventListener('click', function() {
    dialogue.create({
      title: 'Demo Basic',
      description: 'Positioned to the window and fixed, this masks the current window.',
      className: 'dialogue-1',
      mask: true,
      width: 290
    });
  });

  document.querySelector('.js-dialogue-2').addEventListener('click', function() {
    dialogue.create({
      className: 'dialogue-2',
      positionTo: document.querySelector('.js-dialogue-2'),
      width: 250,
      title: 'Inline Position',
      description: 'This dialogue is positioned to the selector \'.js-dialogue-2\'.',
      actions: {
        'Close': function() {
          this.close();
        }
      }
    });
  });

  document.querySelector('.js-dialogue-3').addEventListener('click', function() {
    dialogue.create({
      hardClose: true,
      className: 'dialogue-3',
      width: 250,
      title: 'Hard Close',
      description: 'Can only be closed using the \'x\' icon in the corner.'
    });
  });

  // document.querySelector('.js-dialogue-4').addEventListener('click', function() {
  //   dialogue.create({
  //     mask: true,
  //     width: 550,
  //     title: 'Very large',
  //     html: '<p>If it is too large for the window to center in the middle. It will be placed at the top.</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p>'
  //   });
  // });

  document.querySelector('.js-dialogue-5').addEventListener('click', function() {
    dialogue.create({
      mask: true,
      width: 250,
      ajax: true
    });

    setTimeout(function() {
      dialogue.setHtml('Nothing was loaded, the ajax option just sets the dialogue up to look as thought it is loading something. It is up to you to create a request and then modify the dialogue from there.');
      dialogue.reposition();
    }, 2000);
  });

  document.querySelector('.js-dialogue-6').addEventListener('click', function() {
    dialogue.create({
      mask: true,
      title: '6',
      description: 'auto width and scrollable'
    });
  });

  document.querySelector('.js-dialogue-7').addEventListener('click', function() {
    dialogue.create({
      title: 'Actions',
      description: 'Below are actions which can have callbacks.',
      mask: true,
      width: 290,
      actions: {
        'Close': function() {
          this.close();
        },
        'Ok': function() {
          dialogueSecondary.create({
            width: 220,
            mask: true,
            positionTo: document.querySelector('[data-name="Ok"]'),
            title: 'Ok Clicked',
            description: 'Ok was indeed clicked.',
            actions: {
              Close: function() {
                this.close();
              }
            }
          });
        }
      }
    });
  });
});

},{"../index":1,"./ready":4}],3:[function(require,module,exports){
module.exports = "<div class=\"dialogue-container js-dialogue-container {{#className}}{{className}}-container{{/className}}\">\n\n{{#mask}}\n\n    <div class=\"dialogue-mask js-dialogue-mask {{#className}}{{className}}-mask{{/className}}\"></div>\n\n{{/mask}}\n\n    <div class=\"dialogue js-dialogue {{#className}}{{className}}-dialogue{{/className}}\">\n\n{{#draggable}}\n\n        <div class=\"dialogue-draggable-handle js-dialogue-draggable-handle\"></div>\n    \n{{/draggable}}\n{{^hideClose}}\n\n        <span class=\"dialogue-close js-dialogue-close\">&times;</span>\n\n{{/hideClose}}\n{{#title}}\n\n        <h6 class=\"dialogue-title js-dialogue-title\">{{title}}</h6>\n\n{{/title}}\n{{#description}}\n\n        <p class=\"dialogue-description\">{{description}}</p>\n\n{{/description}}\n\n        <div class=\"dialogue-html js-dialogue-html\">{{{html}}}</div>\n\n{{#actionNames.length}}\n\n        <div class=\"dialogue-actions\">\n\n    {{#actionNames}}\n\n            <button class=\"button primary dialogue-action js-dialogue-action\" data-name=\"{{.}}\">{{.}}</button>\n\n    {{/actionNames}}\n\n        </div>\n\n{{/actionNames.length}}\n\n    </div>\n</div>\n";

},{}],4:[function(require,module,exports){
module.exports = function (fn) {
  if (document.readyState != 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

},{}],5:[function(require,module,exports){
!function(a,b){"object"==typeof exports?module.exports=b():"function"==typeof define&&define.amd?define([],b):a.Draggable=b()}(this,function(){"use strict";function a(a,b){var c=this,d=k.bind(c.start,c),e=k.bind(c.drag,c),g=k.bind(c.stop,c);if(!f(a))throw new TypeError("Draggable expects argument 0 to be an Element");k.assign(c,{element:a,handlers:{start:{mousedown:d,touchstart:d},move:{mousemove:e,mouseup:g,touchmove:e,touchend:g}},options:k.assign({},i,b)}),c.initialize()}function b(a){return parseInt(a,10)}function c(a){return"currentStyle"in a?a.currentStyle:getComputedStyle(a)}function d(a){return a instanceof Array}function e(a){return void 0!==a&&null!==a}function f(a){return a instanceof Element||a instanceof HTMLDocument}function g(a){return a instanceof Function}function h(){}var i={grid:0,filterTarget:null,limit:{x:null,y:null},threshold:0,setCursor:!1,setPosition:!0,smoothDrag:!0,useGPU:!0,onDrag:h,onDragStart:h,onDragEnd:h},j={transform:function(){for(var a=" -o- -ms- -moz- -webkit-".split(" "),b=document.body.style,c=a.length;c--;){var d=a[c]+"transform";if(d in b)return d}}()},k={assign:function(){for(var a=arguments[0],b=arguments.length,c=1;b>c;c++){var d=arguments[c];for(var e in d)a[e]=d[e]}return a},bind:function(a,b){return function(){a.apply(b,arguments)}},on:function(a,b,c){if(b&&c)k.addEvent(a,b,c);else if(b)for(var d in b)k.addEvent(a,d,b[d])},off:function(a,b,c){if(b&&c)k.removeEvent(a,b,c);else if(b)for(var d in b)k.removeEvent(a,d,b[d])},limit:function(a,b){return d(b)?(b=[+b[0],+b[1]],a<b[0]?a=b[0]:a>b[1]&&(a=b[1])):a=+b,a},addEvent:"attachEvent"in Element.prototype?function(a,b,c){a.attachEvent("on"+b,c)}:function(a,b,c){a.addEventListener(b,c,!1)},removeEvent:"attachEvent"in Element.prototype?function(a,b,c){a.detachEvent("on"+b,c)}:function(a,b,c){a.removeEventListener(b,c)}};return k.assign(a.prototype,{setOption:function(a,b){var c=this;return c.options[a]=b,c.initialize(),c},get:function(){var a=this.dragEvent;return{x:a.x,y:a.y}},set:function(a,b){var c=this,d=c.dragEvent;return d.original={x:d.x,y:d.y},c.move(a,b),c},dragEvent:{started:!1,x:0,y:0},initialize:function(){var a,b=this,d=b.element,e=d.style,f=c(d),g=b.options,h=j.transform,i=b._dimensions={height:d.offsetHeight,left:d.offsetLeft,top:d.offsetTop,width:d.offsetWidth};g.useGPU&&h&&(a=f[h],"none"===a&&(a=""),e[h]=a+" translate3d(0,0,0)"),g.setPosition&&(e.display="block",e.left=i.left+"px",e.top=i.top+"px",e.bottom=e.right="auto",e.margin=0,e.position="absolute"),g.setCursor&&(e.cursor="move"),b.setLimit(g.limit),k.assign(b.dragEvent,{x:i.left,y:i.top}),k.on(b.element,b.handlers.start)},start:function(a){var b=this,c=b.getCursor(a),d=b.element;b.useTarget(a.target||a.srcElement)&&(a.preventDefault?a.preventDefault():a.returnValue=!1,b.dragEvent.oldZindex=d.style.zIndex,d.style.zIndex=1e4,b.setCursor(c),b.setPosition(),b.setZoom(),k.on(document,b.handlers.move))},drag:function(a){var b=this,c=b.dragEvent,d=b.element,e=b._cursor,f=b._dimensions,g=b.options,h=f.zoom,i=b.getCursor(a),j=g.threshold,k=(i.x-e.x)/h+f.left,l=(i.y-e.y)/h+f.top;!c.started&&j&&Math.abs(e.x-i.x)<j&&Math.abs(e.y-i.y)<j||(c.original||(c.original={x:k,y:l}),c.started||(g.onDragStart(d,k,l,a),c.started=!0),b.move(k,l)&&g.onDrag(d,c.x,c.y,a))},move:function(a,b){var c=this,d=c.dragEvent,e=c.options,f=e.grid,g=c.element.style,h=c.limit(a,b,d.original.x,d.original.y);return!e.smoothDrag&&f&&(h=c.round(h,f)),h.x!==d.x||h.y!==d.y?(d.x=h.x,d.y=h.y,g.left=h.x+"px",g.top=h.y+"px",!0):!1},stop:function(a){var b,c=this,d=c.dragEvent,e=c.element,f=c.options,g=f.grid;k.off(document,c.handlers.move),e.style.zIndex=d.oldZindex,f.smoothDrag&&g&&(b=c.round({x:d.x,y:d.y},g),c.move(b.x,b.y),k.assign(c.dragEvent,b)),c.dragEvent.started&&f.onDragEnd(e,d.x,d.y,a),c.reset()},reset:function(){this.dragEvent.started=!1},round:function(a){var b=this.options.grid;return{x:b*Math.round(a.x/b),y:b*Math.round(a.y/b)}},getCursor:function(a){return{x:(a.targetTouches?a.targetTouches[0]:a).clientX,y:(a.targetTouches?a.targetTouches[0]:a).clientY}},setCursor:function(a){this._cursor=a},setLimit:function(a){var b=this,c=function(a,b){return{x:a,y:b}};if(g(a))b.limit=a;else if(f(a)){var d=b._dimensions,h=a.scrollHeight-d.height,i=a.scrollWidth-d.width;b.limit=function(a,b){return{x:k.limit(a,[0,i]),y:k.limit(b,[0,h])}}}else if(a){var j={x:e(a.x),y:e(a.y)};b.limit=j.x||j.y?function(b,c){return{x:j.x?k.limit(b,a.x):b,y:j.y?k.limit(c,a.y):c}}:c}else b.limit=c},setPosition:function(){var a=this,c=a.element,d=c.style;k.assign(a._dimensions,{left:b(d.left)||c.offsetLeft,top:b(d.top)||c.offsetTop})},setZoom:function(){for(var a=this,b=a.element,d=1;b=b.offsetParent;){var e=c(b).zoom;if(e&&"normal"!==e){d=e;break}}a._dimensions.zoom=d},useTarget:function(a){var b=this.options.filterTarget;return b instanceof Function?b(a):!0},destroy:function(){k.off(this.element,this.handlers.start),k.off(document,this.handlers.move)}}),a});
},{}],6:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {/**/}

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],7:[function(require,module,exports){
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(global.Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '2.2.1';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImpzL2NvbW1vbi5idW5kbGUuanMiLCJqcy9jb250YWluZXIubXVzdGFjaGUiLCJqcy9yZWFkeS5qcyIsIm5vZGVfbW9kdWxlcy9kcmFnZ2FibGUvZGlzdC9kcmFnZ2FibGUubWluLmpzIiwibm9kZV9tb2R1bGVzL2V4dGVuZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tdXN0YWNoZS9tdXN0YWNoZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBtdXN0YWNoZSA9IHJlcXVpcmUoJ211c3RhY2hlJyk7XG52YXIgZHJhZ2dhYmxlID0gcmVxdWlyZSgnZHJhZ2dhYmxlJyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnZXh0ZW5kJyk7XG52YXIgZGlhbG9ndWVzT3BlbiA9IFtdO1xudmFyIHRlbXBsYXRlQ29udGFpbmVyID0gcmVxdWlyZSgnLi9qcy9jb250YWluZXIubXVzdGFjaGUnKTtcbnZhciBrZXlDb2RlID0ge1xuICBlc2M6IDI3XG59O1xudmFyIGNsYXNzTmFtZXMgPSB7XG4gIGNvbnRhaW5lcjogJ2pzLWRpYWxvZ3VlLWNvbnRhaW5lcicsXG4gIGRpYWxvZ3VlOiAnanMtZGlhbG9ndWUnLFxuICBkaWFsb2d1ZUh0bWw6ICdqcy1kaWFsb2d1ZS1odG1sJyxcbiAgZGlhbG9ndWVDbG9zZTogJ2pzLWRpYWxvZ3VlLWNsb3NlJyxcbiAgZGlhbG9ndWVNYXNrOiAnanMtZGlhbG9ndWUtbWFzaydcbn07XG52YXIgZG9jQm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKTtcblxuLy8gY2hlY2tzIGlmIGVsIGlzIGluc2lkZSBhIHRhcmdldCBjbGFzc1xuLy8gaWYgdGhlcmUgaXMgbm8gSFRNTCBlbGVtZW50IHRoaXMgd2lsbCBleHBsb2RlLlxudmFyIGlzSW5zaWRlID0gZnVuY3Rpb24oZWwsIHBhcmVudENsYXNzKSB7XG4gIHdoaWxlIChlbC50YWdOYW1lICE9PSAnSFRNTCcpIHtcbiAgICAgICBcbiAgICBpZiAoZWwucGFyZW50Tm9kZS5jbGFzc0xpc3QuY29udGFpbnMocGFyZW50Q2xhc3MpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgICAgXG4gICAgZWwgPSBlbC5wYXJlbnROb2RlO1xuICB9XG59O1xuXG4vLyBvYnRhaW5zIGNzcyBzZWxlY3RvciB2ZXJzaW9uIG9mIGEgY2xhc3MgbmFtZVxuLy8gaG93IGNhbiB0aGlzIGJlIGRvbmUgYmV0dGVyP1xudmFyIGNsYXNzXyA9IGZ1bmN0aW9uKGNsYXNzTmFtZSkge1xuICByZXR1cm4gJy4nICsgY2xhc3NOYW1lO1xufTtcblxuZnVuY3Rpb24gZ2V0UmFuZG9tU3RyaW5nKCkge1xuICB2YXIgdGV4dCA9ICcnO1xuICB2YXIgcG9zc2libGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eic7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgNTsgaSsrKVxuICB0ZXh0ICs9IHBvc3NpYmxlLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb3NzaWJsZS5sZW5ndGgpKTtcbiAgcmV0dXJuIHRleHQ7XG59XG5cbi8vIHVuY2hhbmdpbmcgZXZlbnRzXG4vLyBkb2VzIGV2ZW50IHBhc3M/XG52YXIgRGlhbG9ndWUgPSBmdW5jdGlvbihldmVudCkge307XG5cbi8vIG92ZXJyaWRlIGlmIHlvdSB3aXNoIHRvIHVzZSB5b3VyIG93biB0ZW1wbGF0ZVxuRGlhbG9ndWUucHJvdG90eXBlLnNldFRlbXBsYXRlQ29udGFpbmVyID0gZnVuY3Rpb24oaHRtbCkge1xuICB0ZW1wbGF0ZUNvbnRhaW5lciA9IGh0bWw7XG59O1xuXG4vKipcbiAqIHJlbmRlciwgYmluZCBldmVudHMsIGFuZCBwb3NpdGlvbiBuZXcgZGlhbG9ndWVcbiAqL1xuRGlhbG9ndWUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdGhpcy5vcHRpb25zO1xuICB0aGlzLmNvbnRhaW5lcjtcbiAgdGhpcy5kaWFsb2d1ZTtcbiAgdGhpcy5kaWFsb2d1ZUh0bWw7XG4gIHRoaXMuZGlhbG9ndWVNYXNrO1xuXG4gIHZhciBvcHRpb25zVGVtcGxhdGUgPSB7XG4gICAgaWQ6ICcnLCAvLyByYW5kb21seSBnZW5lcmF0ZWQgb24gY3JlYXRpb24sIGJ1dCB3aHk/XG4gICAgdGVtcGxhdGVDb250YWluZXI6ICcnLCAvLyB0aGUgbXVzdGFjaGUgdGVtcGxhdGUgY29udGFpbmVyIGh0bWxcbiAgICBjbGFzc05hbWU6ICcnLCAvLyB0byBpZGVudGlmeSB0aGUgZGlhbG9ndWUgdW5pcXVlbHlcblxuICAgIC8vIG9wdGlvbmFsXG4gICAgdGl0bGU6ICcnLFxuICAgIGRlc2NyaXB0aW9uOiAnJyxcbiAgICBwb3NpdGlvblRvOiAnJywgLy8gc2VsZWN0b3Igd2hlcmUgdGhlIGRpYWxvZ3VlIHdpbGwgYXBwZWFyXG4gICAgaGFyZENsb3NlOiBmYWxzZSwgLy8gbWFrZSBpdCBkaWZmaWN1bHQgdG8gY2xvc2UgdGhlIGRpYWxvZ3VlXG4gICAgbWFzazogZmFsc2UsIC8vIG1hc2sgdGhlIHBhZ2UgYmVsb3dcbiAgICB3aWR0aDogZmFsc2UsIC8vIGludFxuICAgIGFqYXg6IGZhbHNlLCAvLyBzdGFydHMgdGhlIGRpYWxvZ3VlIHdpdGggaHRtbCA9IHNwaW5uZXJcbiAgICBoaWRlQ2xvc2U6IGZhbHNlLFxuICAgIGh0bWw6ICcnLCAvLyByYXcgaHRtbCB0byBiZSBwbGFjZWQgaW4gdG8gYm9keSBhcmVhLCB1bmRlciBkZXNjcmlwdGlvblxuICAgIGRyYWdnYWJsZTogJycsIC8vIGRyYWdnYWJsZSBpbnN0YW5jZVxuICAgIGFjdGlvbnM6IHtcbiAgICAvLyAnQ2FuY2VsJzogZnVuY3Rpb24oKSB7XG4gICAgLy8gICB0aGlzLmNsb3NlKCk7XG4gICAgLy8gfSxcbiAgICAvLyAnT2snOiBmdW5jdGlvbigpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdPaycpO1xuICAgIC8vIH1cbiAgICB9LFxuXG4gICAgLy8gbmV3IGxheW91dCB3aGljaCBhbGxvd3MgZm9yIGxpbWl0bGVzcyBkZWZpbml0aW9uIG9mIHdoYXQgYW4gYWN0aW9uIGRvZXNcbiAgICAvLyBzaG91bGQgYmFzaWMgYWN0aW9ucyBiZSByZW1vdmVkPyB5ZXMgdG8ga2VlcCBhbGwgY29uc2lzdGVudFxuICAgIGFjdGlvbnM6IFtcbiAgICAvLyB7XG4gICAgLy8gICAgbmFtZTogJ09wZW4nLFxuICAgIC8vICAgIGNsYXNzZXM6IFsnYnV0dG9uIHByaW1hcnknLCAncmlnaHQnXSxcbiAgICAvLyAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuXG5cdFx0IC8vICAgIH1cbiAgICAvLyB9XG4gICAgXSxcbiAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbigpIHt9LCAvLyBmaXJlZCB3aGVuIGRpYWxvZ3VlIGhhcyBiZWVuIHJlbmRlcmVkXG4gICAgb25DbG9zZTogZnVuY3Rpb24oKSB7fSAvLyBmaXJlZCB3aGVuIGRpYWxvZ3VlIGhhcyBiZWVuIGNsb3NlZFxuICB9O1xuICBcbiAgZXh0ZW5kKG9wdGlvbnNUZW1wbGF0ZSwgb3B0aW9ucyk7XG5cbiAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1RlbXBsYXRlO1xuXG4gIC8vIG5lZWQgdG8gaGF2ZSBhIHVuaXF1ZSBjbGFzc25hbWUgb3RoZXJ3aXNlIGl0IGNhbnQgYmUgc2VsZWN0ZWRcbiAgdGhpcy5vcHRpb25zLmNsYXNzTmFtZSA9IHRoaXMub3B0aW9ucy5jbGFzc05hbWUgPyB0aGlzLm9wdGlvbnMuY2xhc3NOYW1lIDogZ2V0UmFuZG9tU3RyaW5nKCk7XG5cbiAgdGhpcy5vcHRpb25zLmlkID0gZ2V0UmFuZG9tU3RyaW5nKCk7XG5cbiAgLy8gZm9yIG11c3RhY2hlIHRlbXBsYXRlXG4gIGlmICh0aGlzLm9wdGlvbnMuYWN0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucy5hY3Rpb25OYW1lcyA9IFtdO1xuICAgIGZvciAodmFyIGFjdGlvbk5hbWUgaW4gdGhpcy5vcHRpb25zLmFjdGlvbnMpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5hY3Rpb25OYW1lcy5wdXNoKGFjdGlvbk5hbWUpO1xuICAgIH07XG4gIH07XG5cbiAgZG9jQm9keS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCBtdXN0YWNoZS5yZW5kZXIodGVtcGxhdGVDb250YWluZXIsIHRoaXMub3B0aW9ucykpO1xuXG4gIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihjbGFzc18oY2xhc3NOYW1lcy5jb250YWluZXIpICsgY2xhc3NfKHRoaXMub3B0aW9ucy5jbGFzc05hbWUgKyAnLWNvbnRhaW5lcicpKTtcbiAgdGhpcy5kaWFsb2d1ZSA9IHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoY2xhc3NfKGNsYXNzTmFtZXMuZGlhbG9ndWUpKTtcbiAgdGhpcy5kaWFsb2d1ZUh0bWwgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGNsYXNzXyhjbGFzc05hbWVzLmRpYWxvZ3VlSHRtbCkpO1xuXG4gIC8vIGJsdXIgdGhlIGVsZW1lbnQgdXNlZCB0byBvcGVuIHRoaXMgZGlhbG9ndWUsIGFzIGVudGVyIGtleSBjb3VsZCBiZSBwcmVzc2VkIG9uY2UgdGhlIGRpYWxvZ3VlIGlzIG9wZW4gYW5kIG9wZW4gaXQgYWdhaW5cbiAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cbiAgaWYgKHRoaXMub3B0aW9ucy5tYXNrKSB7XG4gICAgdGhpcy5kaWFsb2d1ZU1hc2sgPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGNsYXNzXyhjbGFzc05hbWVzLmRpYWxvZ3VlTWFzaykpO1xuICB9O1xuXG4gIGlmICh0aGlzLm9wdGlvbnMuZHJhZ2dhYmxlKSB7XG4gICAgbmV3IGRyYWdnYWJsZSAodGhpcy5kaWFsb2d1ZSwge1xuICAgICAgZmlsdGVyVGFyZ2V0OiBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2pzLWRpYWxvZ3VlLWRyYWdnYWJsZS1oYW5kbGUnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGlmICghZGlhbG9ndWVzT3Blbi5sZW5ndGgpIHtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGhhbmRsZUtleXVwKTtcbiAgfVxuXG4gIHNldEV2ZW50cyh0aGlzKTtcblxuICBpZiAodGhpcy5vcHRpb25zLmFqYXgpIHtcbiAgICB0aGlzLnNldEh0bWwoJzxkaXYgY2xhc3M9XCJkaWFsb2d1ZS1zcGlubmVyLWNvbnRhaW5lclwiPjxkaXYgY2xhc3M9XCJkaWFsb2d1ZS1zcGlubmVyXCI+PC9kaXY+PC9kaXY+Jyk7XG4gIH1cblxuICBkaWFsb2d1ZXNPcGVuLnB1c2godGhpcyk7XG5cbiAgYXBwbHlDc3NQb3NpdGlvbih0aGlzKTtcblxuICB0aGlzLm9wdGlvbnMub25Db21wbGV0ZS5jYWxsKHRoaXMpO1xufTtcblxuZnVuY3Rpb24gaGFuZGxlS2V5dXAoZXZlbnQpIHtcbiAgXG4gIGlmIChldmVudC53aGljaCA9PSBrZXlDb2RlLmVzYykge1xuICAgIHZhciBkaWFsb2d1ZSA9IGRpYWxvZ3Vlc09wZW5bZGlhbG9ndWVzT3Blbi5sZW5ndGggLSAxXTtcbiAgICBjbG9zZUluc3RhbmNlKGRpYWxvZ3VlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRFdmVudHMoZGlhbG9ndWUpIHtcblxuICAvLyBub3QgaGFyZCB0byBjbG9zZVxuICBpZiAoIWRpYWxvZ3VlLm9wdGlvbnMuaGFyZENsb3NlKSB7XG5cbiAgICAvLyBtb3VzZWRvd24gb3V0c2lkZSBvZiBkaWFsb2d1ZSwgZG93biB1c2VkIGJlY2F1c2Ugd2hlblxuICAgIC8vIGNsaWNraW5nIGFuZCBkcmFnZ2luZyBhbiBpbnB1dCB2YWx1ZSB3aWxsIGNsb3NlIGl0XG4gICAgZGlhbG9ndWUuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWVzLmRpYWxvZ3VlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgcmVzdWx0ID0gaXNJbnNpZGUoZXZlbnQudGFyZ2V0LCBjbGFzc05hbWVzLmRpYWxvZ3VlKTtcbiAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgIGNsb3NlSW5zdGFuY2UoZGlhbG9ndWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIG9wdGlvbiBhY3Rpb25zIFtvaywgY2FuY2VsXVxuICBpZiAoZGlhbG9ndWUub3B0aW9ucy5hY3Rpb25zKSB7XG4gICAgdmFyIGxhc3RCdXR0b247XG5cbiAgICBmb3IgKHZhciBhY3Rpb25OYW1lIGluIGRpYWxvZ3VlLm9wdGlvbnMuYWN0aW9ucykge1xuICAgICAgbGFzdEJ1dHRvbiA9IGRpYWxvZ3VlLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuanMtZGlhbG9ndWUtYWN0aW9uW2RhdGEtbmFtZT1cIicgKyBhY3Rpb25OYW1lICsgJ1wiXScpO1xuICAgICAgc2V0QWN0aW9uRXZlbnQoZGlhbG9ndWUsIGxhc3RCdXR0b24sIGRpYWxvZ3VlLm9wdGlvbnMuYWN0aW9uc1thY3Rpb25OYW1lXSk7XG4gICAgfTtcblxuICAgIGlmIChsYXN0QnV0dG9uKSB7XG4gICAgICBsYXN0QnV0dG9uLmZvY3VzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGNsaWNrIGJvZHkgbWVhbnMgZG9udCBjbG9zZVxuICBkaWFsb2d1ZS5kaWFsb2d1ZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIC8vIGNsaWNraW5nIGNsb3NlIFt4XVxuICBpZiAoIWRpYWxvZ3VlLm9wdGlvbnMuaGlkZUNsb3NlKSB7XG4gICAgdmFyIGJ1dHRvbiA9IGRpYWxvZ3VlLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKGNsYXNzXyhjbGFzc05hbWVzLmRpYWxvZ3VlQ2xvc2UpKTtcbiAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgY2xvc2VJbnN0YW5jZShkaWFsb2d1ZSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0QWN0aW9uRXZlbnQoZGlhbG9ndWUsIGJ1dHRvbiwgYWN0aW9uQ2FsbGJhY2spIHtcbiAgaWYgKGJ1dHRvbikge1xuICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgYWN0aW9uQ2FsbGJhY2suY2FsbChkaWFsb2d1ZSk7XG4gICAgfSk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHBhcnNlUHgoaW50KSB7XG4gIGlmIChpbnQgPT09ICdhdXRvJykge1xuICAgIHJldHVybiBpbnQ7XG4gIH1cbiAgcmV0dXJuIGludCArICdweCc7XG59XG5cbmZ1bmN0aW9uIGdldFN0eWxlKG9FbG0sIHN0ckNzc1J1bGUpIHtcbiAgdmFyIHN0clZhbHVlID0gXCJcIjtcbiAgaWYoZG9jdW1lbnQuZGVmYXVsdFZpZXcgJiYgZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSl7XG4gICAgc3RyVmFsdWUgPSBkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKG9FbG0sIFwiXCIpLmdldFByb3BlcnR5VmFsdWUoc3RyQ3NzUnVsZSk7XG4gIH1cbiAgZWxzZSBpZihvRWxtLmN1cnJlbnRTdHlsZSl7XG4gICAgc3RyQ3NzUnVsZSA9IHN0ckNzc1J1bGUucmVwbGFjZSgvXFwtKFxcdykvZywgZnVuY3Rpb24gKHN0ck1hdGNoLCBwMSl7XG4gICAgICByZXR1cm4gcDEudG9VcHBlckNhc2UoKTtcbiAgICB9KTtcbiAgICBzdHJWYWx1ZSA9IG9FbG0uY3VycmVudFN0eWxlW3N0ckNzc1J1bGVdO1xuICB9XG4gIHJldHVybiBzdHJWYWx1ZTtcbn1cblxuLy8gYXBwbHkgdGhlIGNzcyB0byB0aGUgZGlhbG9ndWUgdG8gcG9zaXRpb24gY29ycmVjdGx5XG5mdW5jdGlvbiBhcHBseUNzc1Bvc2l0aW9uKGRpYWxvZ3VlKSB7XG4gIHZhciBwb3NpdGlvbmFsRWwgPSBkaWFsb2d1ZS5vcHRpb25zLnBvc2l0aW9uVG87XG4gIHZhciBjb250YWluZXJQYWRkaW5nID0gMjA7XG4gIHZhciBjc3NTZXR0aW5ncyA9IHtcbiAgICB0b3A6ICcnLFxuICAgIGxlZnQ6ICcnLFxuICAgIHBvc2l0aW9uOiAnJyxcbiAgICBtYXJnaW46ICcnLFxuICAgIG1hcmdpblRvcDogMCxcbiAgICBtYXJnaW5SaWdodDogMCxcbiAgICBtYXJnaW5Cb3R0b206IDAsXG4gICAgbWFyZ2luTGVmdDogMCxcbiAgICBtYXhXaWR0aDogZGlhbG9ndWUub3B0aW9ucy53aWR0aFxuICB9O1xuICB2YXIgY2xpZW50RnJhbWUgPSB7XG4gICAgcG9zaXRpb25WZXJ0aWNhbDogd2luZG93LnBhZ2VZT2Zmc2V0LFxuICAgIGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0LFxuICAgIHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aFxuICB9O1xuICB2YXIgYm9yZGVyV2lkdGggPSBwYXJzZUludChnZXRTdHlsZShkaWFsb2d1ZS5kaWFsb2d1ZSwgJ2JvcmRlci13aWR0aCcpKTtcbiAgdmFyIGRpYWxvZ3VlSGVpZ2h0ID0gcGFyc2VJbnQoZGlhbG9ndWUuZGlhbG9ndWUub2Zmc2V0SGVpZ2h0KSArIChib3JkZXJXaWR0aCAqIDIpO1xuXG4gIC8vIHBvc2l0aW9uIGNvbnRhaW5lclxuICBkaWFsb2d1ZS5jb250YWluZXIuc3R5bGUudG9wID0gcGFyc2VQeChjbGllbnRGcmFtZS5wb3NpdGlvblZlcnRpY2FsKTtcblxuICAvLyBwb3NpdGlvbiB0byBlbGVtZW50IG9yIGNlbnRyYWxseSB3aW5kb3dcbiAgaWYgKHBvc2l0aW9uYWxFbCkge1xuICAgIHZhciBib3VuZGluZ1JlY3QgPSBwb3NpdGlvbmFsRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAvLyBjYWxjIHRvcFxuICAgIGNzc1NldHRpbmdzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICBjc3NTZXR0aW5ncy50b3AgPSBwYXJzZUludChib3VuZGluZ1JlY3QudG9wKTtcbiAgICBjc3NTZXR0aW5ncy5sZWZ0ID0gcGFyc2VJbnQoYm91bmRpbmdSZWN0LmxlZnQpO1xuXG4gICAgLy8gaWYgdGhlIHJpZ2h0IHNpZGUgb2YgdGhlIGRpYWxvZ3VlIGlzIHBva2luZyBvdXQgb2YgdGhlIGNsaWVudEZyYW1lIHRoZW5cbiAgICAvLyBicmluZyBpdCBiYWNrIGluIHBsdXMgNTBweCBwYWRkaW5nXG4gICAgaWYgKChjc3NTZXR0aW5ncy5sZWZ0ICsgY3NzU2V0dGluZ3NbJ21heFdpZHRoJ10pID4gY2xpZW50RnJhbWUud2lkdGgpIHtcbiAgICAgIGNzc1NldHRpbmdzLmxlZnQgPSBjbGllbnRGcmFtZS53aWR0aCAtIDUwO1xuICAgICAgY3NzU2V0dGluZ3MubGVmdCA9IGNzc1NldHRpbmdzLmxlZnQgLSBjc3NTZXR0aW5nc1snbWF4V2lkdGgnXTtcbiAgICB9O1xuXG4gICAgLy8gbm8gcG9zaXRpb25hbCBlbGVtZW50IHNvIGNlbnRlciB0byB3aW5kb3dcbiAgfSBlbHNlIHtcbiAgICBjc3NTZXR0aW5ncy5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgY3NzU2V0dGluZ3MubGVmdCA9ICdhdXRvJztcbiAgICBjc3NTZXR0aW5ncy5tYXJnaW5Ub3AgPSAwO1xuICAgIGNzc1NldHRpbmdzLm1hcmdpblJpZ2h0ID0gJ2F1dG8nO1xuICAgIGNzc1NldHRpbmdzLm1hcmdpbkJvdHRvbSA9IDA7XG4gICAgY3NzU2V0dGluZ3MubWFyZ2luTGVmdCA9ICdhdXRvJztcblxuICAgIC8vIGNlbnRlciB2ZXJ0aWNhbGx5IGlmIHRoZXJlIGlzIHJvb21cbiAgICAvLyBvdGhlcndpc2Ugc2VuZCB0byB0b3AgYW5kIHRoZW4ganVzdCBzY3JvbGxcbiAgICBpZiAoZGlhbG9ndWVIZWlnaHQgPCBjbGllbnRGcmFtZS5oZWlnaHQpIHtcbiAgICAgIGNzc1NldHRpbmdzLnRvcCA9IHBhcnNlSW50KGNsaWVudEZyYW1lLmhlaWdodCAvIDIpIC0gcGFyc2VJbnQoZGlhbG9ndWVIZWlnaHQgLyAyKSAtIGNvbnRhaW5lclBhZGRpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNzc1NldHRpbmdzLnRvcCA9ICdhdXRvJztcbiAgICB9O1xuICB9O1xuXG4gIGRpYWxvZ3VlLmNvbnRhaW5lci5zdHlsZS56SW5kZXggPSA1MDAgKyBkaWFsb2d1ZXNPcGVuLmxlbmd0aDtcbiAgZGlhbG9ndWUuZGlhbG9ndWUuc3R5bGUudG9wID0gcGFyc2VQeChjc3NTZXR0aW5ncy50b3ApO1xuICBkaWFsb2d1ZS5kaWFsb2d1ZS5zdHlsZS5sZWZ0ID0gcGFyc2VQeChjc3NTZXR0aW5ncy5sZWZ0KTtcbiAgZGlhbG9ndWUuZGlhbG9ndWUuc3R5bGUucG9zaXRpb24gPSBwYXJzZVB4KGNzc1NldHRpbmdzLnBvc2l0aW9uKTtcbiAgZGlhbG9ndWUuZGlhbG9ndWUuc3R5bGUubWFyZ2luVG9wID0gcGFyc2VQeChjc3NTZXR0aW5ncy5tYXJnaW5Ub3ApO1xuICBkaWFsb2d1ZS5kaWFsb2d1ZS5zdHlsZS5tYXJnaW5SaWdodCA9IHBhcnNlUHgoY3NzU2V0dGluZ3MubWFyZ2luUmlnaHQpO1xuICBkaWFsb2d1ZS5kaWFsb2d1ZS5zdHlsZS5tYXJnaW5Cb3R0b20gPSBwYXJzZVB4KGNzc1NldHRpbmdzLm1hcmdpbkJvdHRvbSk7XG4gIGRpYWxvZ3VlLmRpYWxvZ3VlLnN0eWxlLm1hcmdpbkxlZnQgPSBwYXJzZVB4KGNzc1NldHRpbmdzLm1hcmdpbkxlZnQpO1xuICBkaWFsb2d1ZS5kaWFsb2d1ZS5zdHlsZS5tYXhXaWR0aCA9IHBhcnNlUHgoY3NzU2V0dGluZ3MubWF4V2lkdGgpO1xufTtcblxuLyoqXG4gKiBjYWxsIG9uY2xvc2UgYW5kIHJlbW92ZVxuICogQHBhcmFtICB7b2JqZWN0fSBkYXRhXG4gKiBAcmV0dXJuIHtudWxsfVxuICovXG5mdW5jdGlvbiBjbG9zZUluc3RhbmNlKGRpYWxvZ3VlKSB7XG5cbiAgaWYgKCFkaWFsb2d1ZXNPcGVuLmxlbmd0aCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGRpYWxvZ3Vlc09wZW4uZm9yRWFjaChmdW5jdGlvbihkaWFsb2d1ZVNpbmdsZSwgaW5kZXgpIHtcbiAgICBpZiAoZGlhbG9ndWVTaW5nbGUub3B0aW9ucy5pZCA9PSBkaWFsb2d1ZS5vcHRpb25zLmlkKSB7XG4gICAgICBkaWFsb2d1ZXNPcGVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAoIWRpYWxvZ3Vlc09wZW4ubGVuZ3RoKSB7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBoYW5kbGVLZXl1cCk7XG4gIH1cblxuICAvLyAub2ZmKCdjbGljay5kaWFsb2d1ZS5hY3Rpb24nKVxuXG4gIC8vIGRpYWxvZ3VlLmNvbnRhaW5lci5vZmYoKTsgLy8gbmVlZGVkP1xuICBkb2NCb2R5LnJlbW92ZUNoaWxkKGRpYWxvZ3VlLmNvbnRhaW5lcik7XG4gIGRpYWxvZ3VlLm9wdGlvbnMub25DbG9zZS5jYWxsKGRpYWxvZ3VlKTtcbn07XG5cbkRpYWxvZ3VlLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICBjbG9zZUluc3RhbmNlKHRoaXMpO1xufTtcblxuRGlhbG9ndWUucHJvdG90eXBlLnNldEh0bWwgPSBmdW5jdGlvbihodG1sKSB7XG4gIHRoaXMuZGlhbG9ndWVIdG1sLmlubmVySFRNTCA9IGh0bWw7XG59O1xuXG5EaWFsb2d1ZS5wcm90b3R5cGUuc2V0VGl0bGUgPSBmdW5jdGlvbihodG1sKSB7XG4gIHRoaXMuZGlhbG9ndWUuZmluZCgnLmpzLWRpYWxvZ3VlLXRpdGxlJykuaHRtbChodG1sKTtcbn07XG5cbkRpYWxvZ3VlLnByb3RvdHlwZS5pc09wZW4gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHR5cGVvZiB0aGlzLmRpYWxvZ3VlICE9PSAndW5kZWZpbmVkJztcbn07XG5cbkRpYWxvZ3VlLnByb3RvdHlwZS5yZXBvc2l0aW9uID0gZnVuY3Rpb24oKSB7XG4gIGFwcGx5Q3NzUG9zaXRpb24odGhpcyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpYWxvZ3VlO1xuIiwidmFyIGRpYWxvZ3VlRmFjdG9yeSA9IHJlcXVpcmUoJy4uL2luZGV4Jyk7XHJcbnZhciByZWFkeSA9IHJlcXVpcmUoJy4vcmVhZHknKTtcclxuXHJcbnZhciBkaWFsb2d1ZSA9IG5ldyBkaWFsb2d1ZUZhY3RvcnkoKTtcclxudmFyIGRpYWxvZ3VlU2Vjb25kYXJ5ID0gbmV3IGRpYWxvZ3VlRmFjdG9yeSgpO1xyXG5cclxucmVhZHkoZnVuY3Rpb24oKSB7XHJcblxyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qcy1kaWFsb2d1ZS04JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgIGRpYWxvZ3VlLmNyZWF0ZSh7XHJcbiAgICAgIHRpdGxlOiAnRHJhZ2dhYmxlJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdQb3dlcmVkIGJ5IGJjaGVybnkvZHJhZ2dhYmxlISBEcmFnIG1lIHlvdSBsb2FmIScsXHJcbiAgICAgIGNsYXNzTmFtZTogJ2RpYWxvZ3VlLTgnLFxyXG4gICAgICBwb3NpdGlvblRvOiB0aGlzLFxyXG4gICAgICBkcmFnZ2FibGU6IHRydWUsXHJcbiAgICAgIG1hc2s6IHRydWUsXHJcbiAgICAgIHdpZHRoOiAyNTBcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtZGlhbG9ndWUtMScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICBkaWFsb2d1ZS5jcmVhdGUoe1xyXG4gICAgICB0aXRsZTogJ0RlbW8gQmFzaWMnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1Bvc2l0aW9uZWQgdG8gdGhlIHdpbmRvdyBhbmQgZml4ZWQsIHRoaXMgbWFza3MgdGhlIGN1cnJlbnQgd2luZG93LicsXHJcbiAgICAgIGNsYXNzTmFtZTogJ2RpYWxvZ3VlLTEnLFxyXG4gICAgICBtYXNrOiB0cnVlLFxyXG4gICAgICB3aWR0aDogMjkwXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmpzLWRpYWxvZ3VlLTInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgZGlhbG9ndWUuY3JlYXRlKHtcclxuICAgICAgY2xhc3NOYW1lOiAnZGlhbG9ndWUtMicsXHJcbiAgICAgIHBvc2l0aW9uVG86IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qcy1kaWFsb2d1ZS0yJyksXHJcbiAgICAgIHdpZHRoOiAyNTAsXHJcbiAgICAgIHRpdGxlOiAnSW5saW5lIFBvc2l0aW9uJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdUaGlzIGRpYWxvZ3VlIGlzIHBvc2l0aW9uZWQgdG8gdGhlIHNlbGVjdG9yIFxcJy5qcy1kaWFsb2d1ZS0yXFwnLicsXHJcbiAgICAgIGFjdGlvbnM6IHtcclxuICAgICAgICAnQ2xvc2UnOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtZGlhbG9ndWUtMycpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICBkaWFsb2d1ZS5jcmVhdGUoe1xyXG4gICAgICBoYXJkQ2xvc2U6IHRydWUsXHJcbiAgICAgIGNsYXNzTmFtZTogJ2RpYWxvZ3VlLTMnLFxyXG4gICAgICB3aWR0aDogMjUwLFxyXG4gICAgICB0aXRsZTogJ0hhcmQgQ2xvc2UnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0NhbiBvbmx5IGJlIGNsb3NlZCB1c2luZyB0aGUgXFwneFxcJyBpY29uIGluIHRoZSBjb3JuZXIuJ1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qcy1kaWFsb2d1ZS00JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAvLyAgIGRpYWxvZ3VlLmNyZWF0ZSh7XHJcbiAgLy8gICAgIG1hc2s6IHRydWUsXHJcbiAgLy8gICAgIHdpZHRoOiA1NTAsXHJcbiAgLy8gICAgIHRpdGxlOiAnVmVyeSBsYXJnZScsXHJcbiAgLy8gICAgIGh0bWw6ICc8cD5JZiBpdCBpcyB0b28gbGFyZ2UgZm9yIHRoZSB3aW5kb3cgdG8gY2VudGVyIGluIHRoZSBtaWRkbGUuIEl0IHdpbGwgYmUgcGxhY2VkIGF0IHRoZSB0b3AuPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+PHA+RGVtbyBMaW5lPC9wPjxwPkRlbW8gTGluZTwvcD48cD5EZW1vIExpbmU8L3A+J1xyXG4gIC8vICAgfSk7XHJcbiAgLy8gfSk7XHJcblxyXG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qcy1kaWFsb2d1ZS01JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgIGRpYWxvZ3VlLmNyZWF0ZSh7XHJcbiAgICAgIG1hc2s6IHRydWUsXHJcbiAgICAgIHdpZHRoOiAyNTAsXHJcbiAgICAgIGFqYXg6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgIGRpYWxvZ3VlLnNldEh0bWwoJ05vdGhpbmcgd2FzIGxvYWRlZCwgdGhlIGFqYXggb3B0aW9uIGp1c3Qgc2V0cyB0aGUgZGlhbG9ndWUgdXAgdG8gbG9vayBhcyB0aG91Z2h0IGl0IGlzIGxvYWRpbmcgc29tZXRoaW5nLiBJdCBpcyB1cCB0byB5b3UgdG8gY3JlYXRlIGEgcmVxdWVzdCBhbmQgdGhlbiBtb2RpZnkgdGhlIGRpYWxvZ3VlIGZyb20gdGhlcmUuJyk7XHJcbiAgICAgIGRpYWxvZ3VlLnJlcG9zaXRpb24oKTtcclxuICAgIH0sIDIwMDApO1xyXG4gIH0pO1xyXG5cclxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtZGlhbG9ndWUtNicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICBkaWFsb2d1ZS5jcmVhdGUoe1xyXG4gICAgICBtYXNrOiB0cnVlLFxyXG4gICAgICB0aXRsZTogJzYnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ2F1dG8gd2lkdGggYW5kIHNjcm9sbGFibGUnXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmpzLWRpYWxvZ3VlLTcnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgZGlhbG9ndWUuY3JlYXRlKHtcclxuICAgICAgdGl0bGU6ICdBY3Rpb25zJyxcclxuICAgICAgZGVzY3JpcHRpb246ICdCZWxvdyBhcmUgYWN0aW9ucyB3aGljaCBjYW4gaGF2ZSBjYWxsYmFja3MuJyxcclxuICAgICAgbWFzazogdHJ1ZSxcclxuICAgICAgd2lkdGg6IDI5MCxcclxuICAgICAgYWN0aW9uczoge1xyXG4gICAgICAgICdDbG9zZSc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJ09rJzogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBkaWFsb2d1ZVNlY29uZGFyeS5jcmVhdGUoe1xyXG4gICAgICAgICAgICB3aWR0aDogMjIwLFxyXG4gICAgICAgICAgICBtYXNrOiB0cnVlLFxyXG4gICAgICAgICAgICBwb3NpdGlvblRvOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1uYW1lPVwiT2tcIl0nKSxcclxuICAgICAgICAgICAgdGl0bGU6ICdPayBDbGlja2VkJyxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPayB3YXMgaW5kZWVkIGNsaWNrZWQuJyxcclxuICAgICAgICAgICAgYWN0aW9uczoge1xyXG4gICAgICAgICAgICAgIENsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0pO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwiPGRpdiBjbGFzcz1cXFwiZGlhbG9ndWUtY29udGFpbmVyIGpzLWRpYWxvZ3VlLWNvbnRhaW5lciB7eyNjbGFzc05hbWV9fXt7Y2xhc3NOYW1lfX0tY29udGFpbmVye3svY2xhc3NOYW1lfX1cXFwiPlxcblxcbnt7I21hc2t9fVxcblxcbiAgICA8ZGl2IGNsYXNzPVxcXCJkaWFsb2d1ZS1tYXNrIGpzLWRpYWxvZ3VlLW1hc2sge3sjY2xhc3NOYW1lfX17e2NsYXNzTmFtZX19LW1hc2t7ey9jbGFzc05hbWV9fVxcXCI+PC9kaXY+XFxuXFxue3svbWFza319XFxuXFxuICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZ3VlIGpzLWRpYWxvZ3VlIHt7I2NsYXNzTmFtZX19e3tjbGFzc05hbWV9fS1kaWFsb2d1ZXt7L2NsYXNzTmFtZX19XFxcIj5cXG5cXG57eyNkcmFnZ2FibGV9fVxcblxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9ndWUtZHJhZ2dhYmxlLWhhbmRsZSBqcy1kaWFsb2d1ZS1kcmFnZ2FibGUtaGFuZGxlXFxcIj48L2Rpdj5cXG4gICAgXFxue3svZHJhZ2dhYmxlfX1cXG57e15oaWRlQ2xvc2V9fVxcblxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImRpYWxvZ3VlLWNsb3NlIGpzLWRpYWxvZ3VlLWNsb3NlXFxcIj4mdGltZXM7PC9zcGFuPlxcblxcbnt7L2hpZGVDbG9zZX19XFxue3sjdGl0bGV9fVxcblxcbiAgICAgICAgPGg2IGNsYXNzPVxcXCJkaWFsb2d1ZS10aXRsZSBqcy1kaWFsb2d1ZS10aXRsZVxcXCI+e3t0aXRsZX19PC9oNj5cXG5cXG57ey90aXRsZX19XFxue3sjZGVzY3JpcHRpb259fVxcblxcbiAgICAgICAgPHAgY2xhc3M9XFxcImRpYWxvZ3VlLWRlc2NyaXB0aW9uXFxcIj57e2Rlc2NyaXB0aW9ufX08L3A+XFxuXFxue3svZGVzY3JpcHRpb259fVxcblxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiZGlhbG9ndWUtaHRtbCBqcy1kaWFsb2d1ZS1odG1sXFxcIj57e3todG1sfX19PC9kaXY+XFxuXFxue3sjYWN0aW9uTmFtZXMubGVuZ3RofX1cXG5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImRpYWxvZ3VlLWFjdGlvbnNcXFwiPlxcblxcbiAgICB7eyNhY3Rpb25OYW1lc319XFxuXFxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cXFwiYnV0dG9uIHByaW1hcnkgZGlhbG9ndWUtYWN0aW9uIGpzLWRpYWxvZ3VlLWFjdGlvblxcXCIgZGF0YS1uYW1lPVxcXCJ7ey59fVxcXCI+e3sufX08L2J1dHRvbj5cXG5cXG4gICAge3svYWN0aW9uTmFtZXN9fVxcblxcbiAgICAgICAgPC9kaXY+XFxuXFxue3svYWN0aW9uTmFtZXMubGVuZ3RofX1cXG5cXG4gICAgPC9kaXY+XFxuPC9kaXY+XFxuXCI7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChmbikge1xuICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSAhPSAnbG9hZGluZycpe1xuICAgIGZuKCk7XG4gIH0gZWxzZSB7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZuKTtcbiAgfVxufVxuIiwiIWZ1bmN0aW9uKGEsYil7XCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9YigpOlwiZnVuY3Rpb25cIj09dHlwZW9mIGRlZmluZSYmZGVmaW5lLmFtZD9kZWZpbmUoW10sYik6YS5EcmFnZ2FibGU9YigpfSh0aGlzLGZ1bmN0aW9uKCl7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gYShhLGIpe3ZhciBjPXRoaXMsZD1rLmJpbmQoYy5zdGFydCxjKSxlPWsuYmluZChjLmRyYWcsYyksZz1rLmJpbmQoYy5zdG9wLGMpO2lmKCFmKGEpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJEcmFnZ2FibGUgZXhwZWN0cyBhcmd1bWVudCAwIHRvIGJlIGFuIEVsZW1lbnRcIik7ay5hc3NpZ24oYyx7ZWxlbWVudDphLGhhbmRsZXJzOntzdGFydDp7bW91c2Vkb3duOmQsdG91Y2hzdGFydDpkfSxtb3ZlOnttb3VzZW1vdmU6ZSxtb3VzZXVwOmcsdG91Y2htb3ZlOmUsdG91Y2hlbmQ6Z319LG9wdGlvbnM6ay5hc3NpZ24oe30saSxiKX0pLGMuaW5pdGlhbGl6ZSgpfWZ1bmN0aW9uIGIoYSl7cmV0dXJuIHBhcnNlSW50KGEsMTApfWZ1bmN0aW9uIGMoYSl7cmV0dXJuXCJjdXJyZW50U3R5bGVcImluIGE/YS5jdXJyZW50U3R5bGU6Z2V0Q29tcHV0ZWRTdHlsZShhKX1mdW5jdGlvbiBkKGEpe3JldHVybiBhIGluc3RhbmNlb2YgQXJyYXl9ZnVuY3Rpb24gZShhKXtyZXR1cm4gdm9pZCAwIT09YSYmbnVsbCE9PWF9ZnVuY3Rpb24gZihhKXtyZXR1cm4gYSBpbnN0YW5jZW9mIEVsZW1lbnR8fGEgaW5zdGFuY2VvZiBIVE1MRG9jdW1lbnR9ZnVuY3Rpb24gZyhhKXtyZXR1cm4gYSBpbnN0YW5jZW9mIEZ1bmN0aW9ufWZ1bmN0aW9uIGgoKXt9dmFyIGk9e2dyaWQ6MCxmaWx0ZXJUYXJnZXQ6bnVsbCxsaW1pdDp7eDpudWxsLHk6bnVsbH0sdGhyZXNob2xkOjAsc2V0Q3Vyc29yOiExLHNldFBvc2l0aW9uOiEwLHNtb290aERyYWc6ITAsdXNlR1BVOiEwLG9uRHJhZzpoLG9uRHJhZ1N0YXJ0Omgsb25EcmFnRW5kOmh9LGo9e3RyYW5zZm9ybTpmdW5jdGlvbigpe2Zvcih2YXIgYT1cIiAtby0gLW1zLSAtbW96LSAtd2Via2l0LVwiLnNwbGl0KFwiIFwiKSxiPWRvY3VtZW50LmJvZHkuc3R5bGUsYz1hLmxlbmd0aDtjLS07KXt2YXIgZD1hW2NdK1widHJhbnNmb3JtXCI7aWYoZCBpbiBiKXJldHVybiBkfX0oKX0saz17YXNzaWduOmZ1bmN0aW9uKCl7Zm9yKHZhciBhPWFyZ3VtZW50c1swXSxiPWFyZ3VtZW50cy5sZW5ndGgsYz0xO2I+YztjKyspe3ZhciBkPWFyZ3VtZW50c1tjXTtmb3IodmFyIGUgaW4gZClhW2VdPWRbZV19cmV0dXJuIGF9LGJpbmQ6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gZnVuY3Rpb24oKXthLmFwcGx5KGIsYXJndW1lbnRzKX19LG9uOmZ1bmN0aW9uKGEsYixjKXtpZihiJiZjKWsuYWRkRXZlbnQoYSxiLGMpO2Vsc2UgaWYoYilmb3IodmFyIGQgaW4gYilrLmFkZEV2ZW50KGEsZCxiW2RdKX0sb2ZmOmZ1bmN0aW9uKGEsYixjKXtpZihiJiZjKWsucmVtb3ZlRXZlbnQoYSxiLGMpO2Vsc2UgaWYoYilmb3IodmFyIGQgaW4gYilrLnJlbW92ZUV2ZW50KGEsZCxiW2RdKX0sbGltaXQ6ZnVuY3Rpb24oYSxiKXtyZXR1cm4gZChiKT8oYj1bK2JbMF0sK2JbMV1dLGE8YlswXT9hPWJbMF06YT5iWzFdJiYoYT1iWzFdKSk6YT0rYixhfSxhZGRFdmVudDpcImF0dGFjaEV2ZW50XCJpbiBFbGVtZW50LnByb3RvdHlwZT9mdW5jdGlvbihhLGIsYyl7YS5hdHRhY2hFdmVudChcIm9uXCIrYixjKX06ZnVuY3Rpb24oYSxiLGMpe2EuYWRkRXZlbnRMaXN0ZW5lcihiLGMsITEpfSxyZW1vdmVFdmVudDpcImF0dGFjaEV2ZW50XCJpbiBFbGVtZW50LnByb3RvdHlwZT9mdW5jdGlvbihhLGIsYyl7YS5kZXRhY2hFdmVudChcIm9uXCIrYixjKX06ZnVuY3Rpb24oYSxiLGMpe2EucmVtb3ZlRXZlbnRMaXN0ZW5lcihiLGMpfX07cmV0dXJuIGsuYXNzaWduKGEucHJvdG90eXBlLHtzZXRPcHRpb246ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzO3JldHVybiBjLm9wdGlvbnNbYV09YixjLmluaXRpYWxpemUoKSxjfSxnZXQ6ZnVuY3Rpb24oKXt2YXIgYT10aGlzLmRyYWdFdmVudDtyZXR1cm57eDphLngseTphLnl9fSxzZXQ6ZnVuY3Rpb24oYSxiKXt2YXIgYz10aGlzLGQ9Yy5kcmFnRXZlbnQ7cmV0dXJuIGQub3JpZ2luYWw9e3g6ZC54LHk6ZC55fSxjLm1vdmUoYSxiKSxjfSxkcmFnRXZlbnQ6e3N0YXJ0ZWQ6ITEseDowLHk6MH0saW5pdGlhbGl6ZTpmdW5jdGlvbigpe3ZhciBhLGI9dGhpcyxkPWIuZWxlbWVudCxlPWQuc3R5bGUsZj1jKGQpLGc9Yi5vcHRpb25zLGg9ai50cmFuc2Zvcm0saT1iLl9kaW1lbnNpb25zPXtoZWlnaHQ6ZC5vZmZzZXRIZWlnaHQsbGVmdDpkLm9mZnNldExlZnQsdG9wOmQub2Zmc2V0VG9wLHdpZHRoOmQub2Zmc2V0V2lkdGh9O2cudXNlR1BVJiZoJiYoYT1mW2hdLFwibm9uZVwiPT09YSYmKGE9XCJcIiksZVtoXT1hK1wiIHRyYW5zbGF0ZTNkKDAsMCwwKVwiKSxnLnNldFBvc2l0aW9uJiYoZS5kaXNwbGF5PVwiYmxvY2tcIixlLmxlZnQ9aS5sZWZ0K1wicHhcIixlLnRvcD1pLnRvcCtcInB4XCIsZS5ib3R0b209ZS5yaWdodD1cImF1dG9cIixlLm1hcmdpbj0wLGUucG9zaXRpb249XCJhYnNvbHV0ZVwiKSxnLnNldEN1cnNvciYmKGUuY3Vyc29yPVwibW92ZVwiKSxiLnNldExpbWl0KGcubGltaXQpLGsuYXNzaWduKGIuZHJhZ0V2ZW50LHt4OmkubGVmdCx5OmkudG9wfSksay5vbihiLmVsZW1lbnQsYi5oYW5kbGVycy5zdGFydCl9LHN0YXJ0OmZ1bmN0aW9uKGEpe3ZhciBiPXRoaXMsYz1iLmdldEN1cnNvcihhKSxkPWIuZWxlbWVudDtiLnVzZVRhcmdldChhLnRhcmdldHx8YS5zcmNFbGVtZW50KSYmKGEucHJldmVudERlZmF1bHQ/YS5wcmV2ZW50RGVmYXVsdCgpOmEucmV0dXJuVmFsdWU9ITEsYi5kcmFnRXZlbnQub2xkWmluZGV4PWQuc3R5bGUuekluZGV4LGQuc3R5bGUuekluZGV4PTFlNCxiLnNldEN1cnNvcihjKSxiLnNldFBvc2l0aW9uKCksYi5zZXRab29tKCksay5vbihkb2N1bWVudCxiLmhhbmRsZXJzLm1vdmUpKX0sZHJhZzpmdW5jdGlvbihhKXt2YXIgYj10aGlzLGM9Yi5kcmFnRXZlbnQsZD1iLmVsZW1lbnQsZT1iLl9jdXJzb3IsZj1iLl9kaW1lbnNpb25zLGc9Yi5vcHRpb25zLGg9Zi56b29tLGk9Yi5nZXRDdXJzb3IoYSksaj1nLnRocmVzaG9sZCxrPShpLngtZS54KS9oK2YubGVmdCxsPShpLnktZS55KS9oK2YudG9wOyFjLnN0YXJ0ZWQmJmomJk1hdGguYWJzKGUueC1pLngpPGomJk1hdGguYWJzKGUueS1pLnkpPGp8fChjLm9yaWdpbmFsfHwoYy5vcmlnaW5hbD17eDprLHk6bH0pLGMuc3RhcnRlZHx8KGcub25EcmFnU3RhcnQoZCxrLGwsYSksYy5zdGFydGVkPSEwKSxiLm1vdmUoayxsKSYmZy5vbkRyYWcoZCxjLngsYy55LGEpKX0sbW92ZTpmdW5jdGlvbihhLGIpe3ZhciBjPXRoaXMsZD1jLmRyYWdFdmVudCxlPWMub3B0aW9ucyxmPWUuZ3JpZCxnPWMuZWxlbWVudC5zdHlsZSxoPWMubGltaXQoYSxiLGQub3JpZ2luYWwueCxkLm9yaWdpbmFsLnkpO3JldHVybiFlLnNtb290aERyYWcmJmYmJihoPWMucm91bmQoaCxmKSksaC54IT09ZC54fHxoLnkhPT1kLnk/KGQueD1oLngsZC55PWgueSxnLmxlZnQ9aC54K1wicHhcIixnLnRvcD1oLnkrXCJweFwiLCEwKTohMX0sc3RvcDpmdW5jdGlvbihhKXt2YXIgYixjPXRoaXMsZD1jLmRyYWdFdmVudCxlPWMuZWxlbWVudCxmPWMub3B0aW9ucyxnPWYuZ3JpZDtrLm9mZihkb2N1bWVudCxjLmhhbmRsZXJzLm1vdmUpLGUuc3R5bGUuekluZGV4PWQub2xkWmluZGV4LGYuc21vb3RoRHJhZyYmZyYmKGI9Yy5yb3VuZCh7eDpkLngseTpkLnl9LGcpLGMubW92ZShiLngsYi55KSxrLmFzc2lnbihjLmRyYWdFdmVudCxiKSksYy5kcmFnRXZlbnQuc3RhcnRlZCYmZi5vbkRyYWdFbmQoZSxkLngsZC55LGEpLGMucmVzZXQoKX0scmVzZXQ6ZnVuY3Rpb24oKXt0aGlzLmRyYWdFdmVudC5zdGFydGVkPSExfSxyb3VuZDpmdW5jdGlvbihhKXt2YXIgYj10aGlzLm9wdGlvbnMuZ3JpZDtyZXR1cm57eDpiKk1hdGgucm91bmQoYS54L2IpLHk6YipNYXRoLnJvdW5kKGEueS9iKX19LGdldEN1cnNvcjpmdW5jdGlvbihhKXtyZXR1cm57eDooYS50YXJnZXRUb3VjaGVzP2EudGFyZ2V0VG91Y2hlc1swXTphKS5jbGllbnRYLHk6KGEudGFyZ2V0VG91Y2hlcz9hLnRhcmdldFRvdWNoZXNbMF06YSkuY2xpZW50WX19LHNldEN1cnNvcjpmdW5jdGlvbihhKXt0aGlzLl9jdXJzb3I9YX0sc2V0TGltaXQ6ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcyxjPWZ1bmN0aW9uKGEsYil7cmV0dXJue3g6YSx5OmJ9fTtpZihnKGEpKWIubGltaXQ9YTtlbHNlIGlmKGYoYSkpe3ZhciBkPWIuX2RpbWVuc2lvbnMsaD1hLnNjcm9sbEhlaWdodC1kLmhlaWdodCxpPWEuc2Nyb2xsV2lkdGgtZC53aWR0aDtiLmxpbWl0PWZ1bmN0aW9uKGEsYil7cmV0dXJue3g6ay5saW1pdChhLFswLGldKSx5OmsubGltaXQoYixbMCxoXSl9fX1lbHNlIGlmKGEpe3ZhciBqPXt4OmUoYS54KSx5OmUoYS55KX07Yi5saW1pdD1qLnh8fGoueT9mdW5jdGlvbihiLGMpe3JldHVybnt4OmoueD9rLmxpbWl0KGIsYS54KTpiLHk6ai55P2subGltaXQoYyxhLnkpOmN9fTpjfWVsc2UgYi5saW1pdD1jfSxzZXRQb3NpdGlvbjpmdW5jdGlvbigpe3ZhciBhPXRoaXMsYz1hLmVsZW1lbnQsZD1jLnN0eWxlO2suYXNzaWduKGEuX2RpbWVuc2lvbnMse2xlZnQ6YihkLmxlZnQpfHxjLm9mZnNldExlZnQsdG9wOmIoZC50b3ApfHxjLm9mZnNldFRvcH0pfSxzZXRab29tOmZ1bmN0aW9uKCl7Zm9yKHZhciBhPXRoaXMsYj1hLmVsZW1lbnQsZD0xO2I9Yi5vZmZzZXRQYXJlbnQ7KXt2YXIgZT1jKGIpLnpvb207aWYoZSYmXCJub3JtYWxcIiE9PWUpe2Q9ZTticmVha319YS5fZGltZW5zaW9ucy56b29tPWR9LHVzZVRhcmdldDpmdW5jdGlvbihhKXt2YXIgYj10aGlzLm9wdGlvbnMuZmlsdGVyVGFyZ2V0O3JldHVybiBiIGluc3RhbmNlb2YgRnVuY3Rpb24/YihhKTohMH0sZGVzdHJveTpmdW5jdGlvbigpe2sub2ZmKHRoaXMuZWxlbWVudCx0aGlzLmhhbmRsZXJzLnN0YXJ0KSxrLm9mZihkb2N1bWVudCx0aGlzLmhhbmRsZXJzLm1vdmUpfX0pLGF9KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxudmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuXHRpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShhcnIpO1xuXHR9XG5cblx0cmV0dXJuIHRvU3RyLmNhbGwoYXJyKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnZhciBpc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcblx0aWYgKCFvYmogfHwgdG9TdHIuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG5cdHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcblx0Ly8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuXHRpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuXHQvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cblx0dmFyIGtleTtcblx0Zm9yIChrZXkgaW4gb2JqKSB7LyoqL31cblxuXHRyZXR1cm4gdHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcgfHwgaGFzT3duLmNhbGwob2JqLCBrZXkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBleHRlbmQoKSB7XG5cdHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZSxcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMF0sXG5cdFx0aSA9IDEsXG5cdFx0bGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcblx0XHRkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0ZGVlcCA9IHRhcmdldDtcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG5cdFx0Ly8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuXHRcdGkgPSAyO1xuXHR9IGVsc2UgaWYgKCh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKSB8fCB0YXJnZXQgPT0gbnVsbCkge1xuXHRcdHRhcmdldCA9IHt9O1xuXHR9XG5cblx0Zm9yICg7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG5cdFx0Ly8gT25seSBkZWFsIHdpdGggbm9uLW51bGwvdW5kZWZpbmVkIHZhbHVlc1xuXHRcdGlmIChvcHRpb25zICE9IG51bGwpIHtcblx0XHRcdC8vIEV4dGVuZCB0aGUgYmFzZSBvYmplY3Rcblx0XHRcdGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG5cdFx0XHRcdHNyYyA9IHRhcmdldFtuYW1lXTtcblx0XHRcdFx0Y29weSA9IG9wdGlvbnNbbmFtZV07XG5cblx0XHRcdFx0Ly8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuXHRcdFx0XHRpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG5cdFx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdFx0aWYgKGRlZXAgJiYgY29weSAmJiAoaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBpc0FycmF5KGNvcHkpKSkpIHtcblx0XHRcdFx0XHRcdGlmIChjb3B5SXNBcnJheSkge1xuXHRcdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cblx0XHRcdFx0XHRcdHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cblx0XHRcdFx0XHQvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG5cdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2YgY29weSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0XHRcdHRhcmdldFtuYW1lXSA9IGNvcHk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Ly8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3Rcblx0cmV0dXJuIHRhcmdldDtcbn07XG5cbiIsIi8qIVxuICogbXVzdGFjaGUuanMgLSBMb2dpYy1sZXNzIHt7bXVzdGFjaGV9fSB0ZW1wbGF0ZXMgd2l0aCBKYXZhU2NyaXB0XG4gKiBodHRwOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzXG4gKi9cblxuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSBNdXN0YWNoZTogdHJ1ZSovXG5cbihmdW5jdGlvbiBkZWZpbmVNdXN0YWNoZSAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgZXhwb3J0cyAmJiB0eXBlb2YgZXhwb3J0cy5ub2RlTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICBmYWN0b3J5KGV4cG9ydHMpOyAvLyBDb21tb25KU1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSk7IC8vIEFNRFxuICB9IGVsc2Uge1xuICAgIGdsb2JhbC5NdXN0YWNoZSA9IHt9O1xuICAgIGZhY3RvcnkoZ2xvYmFsLk11c3RhY2hlKTsgLy8gc2NyaXB0LCB3c2gsIGFzcFxuICB9XG59KHRoaXMsIGZ1bmN0aW9uIG11c3RhY2hlRmFjdG9yeSAobXVzdGFjaGUpIHtcblxuICB2YXIgb2JqZWN0VG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gaXNBcnJheVBvbHlmaWxsIChvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0VG9TdHJpbmcuY2FsbChvYmplY3QpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGlzRnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSAnZnVuY3Rpb24nO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vcmUgY29ycmVjdCB0eXBlb2Ygc3RyaW5nIGhhbmRsaW5nIGFycmF5XG4gICAqIHdoaWNoIG5vcm1hbGx5IHJldHVybnMgdHlwZW9mICdvYmplY3QnXG4gICAqL1xuICBmdW5jdGlvbiB0eXBlU3RyIChvYmopIHtcbiAgICByZXR1cm4gaXNBcnJheShvYmopID8gJ2FycmF5JyA6IHR5cGVvZiBvYmo7XG4gIH1cblxuICBmdW5jdGlvbiBlc2NhcGVSZWdFeHAgKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvW1xcLVxcW1xcXXt9KCkqKz8uLFxcXFxcXF4kfCNcXHNdL2csICdcXFxcJCYnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOdWxsIHNhZmUgd2F5IG9mIGNoZWNraW5nIHdoZXRoZXIgb3Igbm90IGFuIG9iamVjdCxcbiAgICogaW5jbHVkaW5nIGl0cyBwcm90b3R5cGUsIGhhcyBhIGdpdmVuIHByb3BlcnR5XG4gICAqL1xuICBmdW5jdGlvbiBoYXNQcm9wZXJ0eSAob2JqLCBwcm9wTmFtZSkge1xuICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiAocHJvcE5hbWUgaW4gb2JqKTtcbiAgfVxuXG4gIC8vIFdvcmthcm91bmQgZm9yIGh0dHBzOi8vaXNzdWVzLmFwYWNoZS5vcmcvamlyYS9icm93c2UvQ09VQ0hEQi01NzdcbiAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYW5sL211c3RhY2hlLmpzL2lzc3Vlcy8xODlcbiAgdmFyIHJlZ0V4cFRlc3QgPSBSZWdFeHAucHJvdG90eXBlLnRlc3Q7XG4gIGZ1bmN0aW9uIHRlc3RSZWdFeHAgKHJlLCBzdHJpbmcpIHtcbiAgICByZXR1cm4gcmVnRXhwVGVzdC5jYWxsKHJlLCBzdHJpbmcpO1xuICB9XG5cbiAgdmFyIG5vblNwYWNlUmUgPSAvXFxTLztcbiAgZnVuY3Rpb24gaXNXaGl0ZXNwYWNlIChzdHJpbmcpIHtcbiAgICByZXR1cm4gIXRlc3RSZWdFeHAobm9uU3BhY2VSZSwgc3RyaW5nKTtcbiAgfVxuXG4gIHZhciBlbnRpdHlNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgIFwiJ1wiOiAnJiMzOTsnLFxuICAgICcvJzogJyYjeDJGOycsXG4gICAgJ2AnOiAnJiN4NjA7JyxcbiAgICAnPSc6ICcmI3gzRDsnXG4gIH07XG5cbiAgZnVuY3Rpb24gZXNjYXBlSHRtbCAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIFN0cmluZyhzdHJpbmcpLnJlcGxhY2UoL1smPD5cIidgPVxcL10vZywgZnVuY3Rpb24gZnJvbUVudGl0eU1hcCAocykge1xuICAgICAgcmV0dXJuIGVudGl0eU1hcFtzXTtcbiAgICB9KTtcbiAgfVxuXG4gIHZhciB3aGl0ZVJlID0gL1xccyovO1xuICB2YXIgc3BhY2VSZSA9IC9cXHMrLztcbiAgdmFyIGVxdWFsc1JlID0gL1xccyo9LztcbiAgdmFyIGN1cmx5UmUgPSAvXFxzKlxcfS87XG4gIHZhciB0YWdSZSA9IC8jfFxcXnxcXC98PnxcXHt8Jnw9fCEvO1xuXG4gIC8qKlxuICAgKiBCcmVha3MgdXAgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgc3RyaW5nIGludG8gYSB0cmVlIG9mIHRva2Vucy4gSWYgdGhlIGB0YWdzYFxuICAgKiBhcmd1bWVudCBpcyBnaXZlbiBoZXJlIGl0IG11c3QgYmUgYW4gYXJyYXkgd2l0aCB0d28gc3RyaW5nIHZhbHVlczogdGhlXG4gICAqIG9wZW5pbmcgYW5kIGNsb3NpbmcgdGFncyB1c2VkIGluIHRoZSB0ZW1wbGF0ZSAoZS5nLiBbIFwiPCVcIiwgXCIlPlwiIF0pLiBPZlxuICAgKiBjb3Vyc2UsIHRoZSBkZWZhdWx0IGlzIHRvIHVzZSBtdXN0YWNoZXMgKGkuZS4gbXVzdGFjaGUudGFncykuXG4gICAqXG4gICAqIEEgdG9rZW4gaXMgYW4gYXJyYXkgd2l0aCBhdCBsZWFzdCA0IGVsZW1lbnRzLiBUaGUgZmlyc3QgZWxlbWVudCBpcyB0aGVcbiAgICogbXVzdGFjaGUgc3ltYm9sIHRoYXQgd2FzIHVzZWQgaW5zaWRlIHRoZSB0YWcsIGUuZy4gXCIjXCIgb3IgXCImXCIuIElmIHRoZSB0YWdcbiAgICogZGlkIG5vdCBjb250YWluIGEgc3ltYm9sIChpLmUuIHt7bXlWYWx1ZX19KSB0aGlzIGVsZW1lbnQgaXMgXCJuYW1lXCIuIEZvclxuICAgKiBhbGwgdGV4dCB0aGF0IGFwcGVhcnMgb3V0c2lkZSBhIHN5bWJvbCB0aGlzIGVsZW1lbnQgaXMgXCJ0ZXh0XCIuXG4gICAqXG4gICAqIFRoZSBzZWNvbmQgZWxlbWVudCBvZiBhIHRva2VuIGlzIGl0cyBcInZhbHVlXCIuIEZvciBtdXN0YWNoZSB0YWdzIHRoaXMgaXNcbiAgICogd2hhdGV2ZXIgZWxzZSB3YXMgaW5zaWRlIHRoZSB0YWcgYmVzaWRlcyB0aGUgb3BlbmluZyBzeW1ib2wuIEZvciB0ZXh0IHRva2Vuc1xuICAgKiB0aGlzIGlzIHRoZSB0ZXh0IGl0c2VsZi5cbiAgICpcbiAgICogVGhlIHRoaXJkIGFuZCBmb3VydGggZWxlbWVudHMgb2YgdGhlIHRva2VuIGFyZSB0aGUgc3RhcnQgYW5kIGVuZCBpbmRpY2VzLFxuICAgKiByZXNwZWN0aXZlbHksIG9mIHRoZSB0b2tlbiBpbiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUuXG4gICAqXG4gICAqIFRva2VucyB0aGF0IGFyZSB0aGUgcm9vdCBub2RlIG9mIGEgc3VidHJlZSBjb250YWluIHR3byBtb3JlIGVsZW1lbnRzOiAxKSBhblxuICAgKiBhcnJheSBvZiB0b2tlbnMgaW4gdGhlIHN1YnRyZWUgYW5kIDIpIHRoZSBpbmRleCBpbiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgYXRcbiAgICogd2hpY2ggdGhlIGNsb3NpbmcgdGFnIGZvciB0aGF0IHNlY3Rpb24gYmVnaW5zLlxuICAgKi9cbiAgZnVuY3Rpb24gcGFyc2VUZW1wbGF0ZSAodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICBpZiAoIXRlbXBsYXRlKVxuICAgICAgcmV0dXJuIFtdO1xuXG4gICAgdmFyIHNlY3Rpb25zID0gW107ICAgICAvLyBTdGFjayB0byBob2xkIHNlY3Rpb24gdG9rZW5zXG4gICAgdmFyIHRva2VucyA9IFtdOyAgICAgICAvLyBCdWZmZXIgdG8gaG9sZCB0aGUgdG9rZW5zXG4gICAgdmFyIHNwYWNlcyA9IFtdOyAgICAgICAvLyBJbmRpY2VzIG9mIHdoaXRlc3BhY2UgdG9rZW5zIG9uIHRoZSBjdXJyZW50IGxpbmVcbiAgICB2YXIgaGFzVGFnID0gZmFsc2U7ICAgIC8vIElzIHRoZXJlIGEge3t0YWd9fSBvbiB0aGUgY3VycmVudCBsaW5lP1xuICAgIHZhciBub25TcGFjZSA9IGZhbHNlOyAgLy8gSXMgdGhlcmUgYSBub24tc3BhY2UgY2hhciBvbiB0aGUgY3VycmVudCBsaW5lP1xuXG4gICAgLy8gU3RyaXBzIGFsbCB3aGl0ZXNwYWNlIHRva2VucyBhcnJheSBmb3IgdGhlIGN1cnJlbnQgbGluZVxuICAgIC8vIGlmIHRoZXJlIHdhcyBhIHt7I3RhZ319IG9uIGl0IGFuZCBvdGhlcndpc2Ugb25seSBzcGFjZS5cbiAgICBmdW5jdGlvbiBzdHJpcFNwYWNlICgpIHtcbiAgICAgIGlmIChoYXNUYWcgJiYgIW5vblNwYWNlKSB7XG4gICAgICAgIHdoaWxlIChzcGFjZXMubGVuZ3RoKVxuICAgICAgICAgIGRlbGV0ZSB0b2tlbnNbc3BhY2VzLnBvcCgpXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNwYWNlcyA9IFtdO1xuICAgICAgfVxuXG4gICAgICBoYXNUYWcgPSBmYWxzZTtcbiAgICAgIG5vblNwYWNlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIG9wZW5pbmdUYWdSZSwgY2xvc2luZ1RhZ1JlLCBjbG9zaW5nQ3VybHlSZTtcbiAgICBmdW5jdGlvbiBjb21waWxlVGFncyAodGFnc1RvQ29tcGlsZSkge1xuICAgICAgaWYgKHR5cGVvZiB0YWdzVG9Db21waWxlID09PSAnc3RyaW5nJylcbiAgICAgICAgdGFnc1RvQ29tcGlsZSA9IHRhZ3NUb0NvbXBpbGUuc3BsaXQoc3BhY2VSZSwgMik7XG5cbiAgICAgIGlmICghaXNBcnJheSh0YWdzVG9Db21waWxlKSB8fCB0YWdzVG9Db21waWxlLmxlbmd0aCAhPT0gMilcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZ3M6ICcgKyB0YWdzVG9Db21waWxlKTtcblxuICAgICAgb3BlbmluZ1RhZ1JlID0gbmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodGFnc1RvQ29tcGlsZVswXSkgKyAnXFxcXHMqJyk7XG4gICAgICBjbG9zaW5nVGFnUmUgPSBuZXcgUmVnRXhwKCdcXFxccyonICsgZXNjYXBlUmVnRXhwKHRhZ3NUb0NvbXBpbGVbMV0pKTtcbiAgICAgIGNsb3NpbmdDdXJseVJlID0gbmV3IFJlZ0V4cCgnXFxcXHMqJyArIGVzY2FwZVJlZ0V4cCgnfScgKyB0YWdzVG9Db21waWxlWzFdKSk7XG4gICAgfVxuXG4gICAgY29tcGlsZVRhZ3ModGFncyB8fCBtdXN0YWNoZS50YWdzKTtcblxuICAgIHZhciBzY2FubmVyID0gbmV3IFNjYW5uZXIodGVtcGxhdGUpO1xuXG4gICAgdmFyIHN0YXJ0LCB0eXBlLCB2YWx1ZSwgY2hyLCB0b2tlbiwgb3BlblNlY3Rpb247XG4gICAgd2hpbGUgKCFzY2FubmVyLmVvcygpKSB7XG4gICAgICBzdGFydCA9IHNjYW5uZXIucG9zO1xuXG4gICAgICAvLyBNYXRjaCBhbnkgdGV4dCBiZXR3ZWVuIHRhZ3MuXG4gICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKG9wZW5pbmdUYWdSZSk7XG5cbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgdmFsdWVMZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGkgPCB2YWx1ZUxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgY2hyID0gdmFsdWUuY2hhckF0KGkpO1xuXG4gICAgICAgICAgaWYgKGlzV2hpdGVzcGFjZShjaHIpKSB7XG4gICAgICAgICAgICBzcGFjZXMucHVzaCh0b2tlbnMubGVuZ3RoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRva2Vucy5wdXNoKFsgJ3RleHQnLCBjaHIsIHN0YXJ0LCBzdGFydCArIDEgXSk7XG4gICAgICAgICAgc3RhcnQgKz0gMTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciB3aGl0ZXNwYWNlIG9uIHRoZSBjdXJyZW50IGxpbmUuXG4gICAgICAgICAgaWYgKGNociA9PT0gJ1xcbicpXG4gICAgICAgICAgICBzdHJpcFNwYWNlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWF0Y2ggdGhlIG9wZW5pbmcgdGFnLlxuICAgICAgaWYgKCFzY2FubmVyLnNjYW4ob3BlbmluZ1RhZ1JlKSlcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGhhc1RhZyA9IHRydWU7XG5cbiAgICAgIC8vIEdldCB0aGUgdGFnIHR5cGUuXG4gICAgICB0eXBlID0gc2Nhbm5lci5zY2FuKHRhZ1JlKSB8fCAnbmFtZSc7XG4gICAgICBzY2FubmVyLnNjYW4od2hpdGVSZSk7XG5cbiAgICAgIC8vIEdldCB0aGUgdGFnIHZhbHVlLlxuICAgICAgaWYgKHR5cGUgPT09ICc9Jykge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKGVxdWFsc1JlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuKGVxdWFsc1JlKTtcbiAgICAgICAgc2Nhbm5lci5zY2FuVW50aWwoY2xvc2luZ1RhZ1JlKTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3snKSB7XG4gICAgICAgIHZhbHVlID0gc2Nhbm5lci5zY2FuVW50aWwoY2xvc2luZ0N1cmx5UmUpO1xuICAgICAgICBzY2FubmVyLnNjYW4oY3VybHlSZSk7XG4gICAgICAgIHNjYW5uZXIuc2NhblVudGlsKGNsb3NpbmdUYWdSZSk7XG4gICAgICAgIHR5cGUgPSAnJic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IHNjYW5uZXIuc2NhblVudGlsKGNsb3NpbmdUYWdSZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIE1hdGNoIHRoZSBjbG9zaW5nIHRhZy5cbiAgICAgIGlmICghc2Nhbm5lci5zY2FuKGNsb3NpbmdUYWdSZSkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgdGFnIGF0ICcgKyBzY2FubmVyLnBvcyk7XG5cbiAgICAgIHRva2VuID0gWyB0eXBlLCB2YWx1ZSwgc3RhcnQsIHNjYW5uZXIucG9zIF07XG4gICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG5cbiAgICAgIGlmICh0eXBlID09PSAnIycgfHwgdHlwZSA9PT0gJ14nKSB7XG4gICAgICAgIHNlY3Rpb25zLnB1c2godG9rZW4pO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnLycpIHtcbiAgICAgICAgLy8gQ2hlY2sgc2VjdGlvbiBuZXN0aW5nLlxuICAgICAgICBvcGVuU2VjdGlvbiA9IHNlY3Rpb25zLnBvcCgpO1xuXG4gICAgICAgIGlmICghb3BlblNlY3Rpb24pXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbm9wZW5lZCBzZWN0aW9uIFwiJyArIHZhbHVlICsgJ1wiIGF0ICcgKyBzdGFydCk7XG5cbiAgICAgICAgaWYgKG9wZW5TZWN0aW9uWzFdICE9PSB2YWx1ZSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuY2xvc2VkIHNlY3Rpb24gXCInICsgb3BlblNlY3Rpb25bMV0gKyAnXCIgYXQgJyArIHN0YXJ0KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ25hbWUnIHx8IHR5cGUgPT09ICd7JyB8fCB0eXBlID09PSAnJicpIHtcbiAgICAgICAgbm9uU3BhY2UgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnPScpIHtcbiAgICAgICAgLy8gU2V0IHRoZSB0YWdzIGZvciB0aGUgbmV4dCB0aW1lIGFyb3VuZC5cbiAgICAgICAgY29tcGlsZVRhZ3ModmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1ha2Ugc3VyZSB0aGVyZSBhcmUgbm8gb3BlbiBzZWN0aW9ucyB3aGVuIHdlJ3JlIGRvbmUuXG4gICAgb3BlblNlY3Rpb24gPSBzZWN0aW9ucy5wb3AoKTtcblxuICAgIGlmIChvcGVuU2VjdGlvbilcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5jbG9zZWQgc2VjdGlvbiBcIicgKyBvcGVuU2VjdGlvblsxXSArICdcIiBhdCAnICsgc2Nhbm5lci5wb3MpO1xuXG4gICAgcmV0dXJuIG5lc3RUb2tlbnMoc3F1YXNoVG9rZW5zKHRva2VucykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIHRoZSB2YWx1ZXMgb2YgY29uc2VjdXRpdmUgdGV4dCB0b2tlbnMgaW4gdGhlIGdpdmVuIGB0b2tlbnNgIGFycmF5XG4gICAqIHRvIGEgc2luZ2xlIHRva2VuLlxuICAgKi9cbiAgZnVuY3Rpb24gc3F1YXNoVG9rZW5zICh0b2tlbnMpIHtcbiAgICB2YXIgc3F1YXNoZWRUb2tlbnMgPSBbXTtcblxuICAgIHZhciB0b2tlbiwgbGFzdFRva2VuO1xuICAgIGZvciAodmFyIGkgPSAwLCBudW1Ub2tlbnMgPSB0b2tlbnMubGVuZ3RoOyBpIDwgbnVtVG9rZW5zOyArK2kpIHtcbiAgICAgIHRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICBpZiAodG9rZW4pIHtcbiAgICAgICAgaWYgKHRva2VuWzBdID09PSAndGV4dCcgJiYgbGFzdFRva2VuICYmIGxhc3RUb2tlblswXSA9PT0gJ3RleHQnKSB7XG4gICAgICAgICAgbGFzdFRva2VuWzFdICs9IHRva2VuWzFdO1xuICAgICAgICAgIGxhc3RUb2tlblszXSA9IHRva2VuWzNdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNxdWFzaGVkVG9rZW5zLnB1c2godG9rZW4pO1xuICAgICAgICAgIGxhc3RUb2tlbiA9IHRva2VuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNxdWFzaGVkVG9rZW5zO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcm1zIHRoZSBnaXZlbiBhcnJheSBvZiBgdG9rZW5zYCBpbnRvIGEgbmVzdGVkIHRyZWUgc3RydWN0dXJlIHdoZXJlXG4gICAqIHRva2VucyB0aGF0IHJlcHJlc2VudCBhIHNlY3Rpb24gaGF2ZSB0d28gYWRkaXRpb25hbCBpdGVtczogMSkgYW4gYXJyYXkgb2ZcbiAgICogYWxsIHRva2VucyB0aGF0IGFwcGVhciBpbiB0aGF0IHNlY3Rpb24gYW5kIDIpIHRoZSBpbmRleCBpbiB0aGUgb3JpZ2luYWxcbiAgICogdGVtcGxhdGUgdGhhdCByZXByZXNlbnRzIHRoZSBlbmQgb2YgdGhhdCBzZWN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gbmVzdFRva2VucyAodG9rZW5zKSB7XG4gICAgdmFyIG5lc3RlZFRva2VucyA9IFtdO1xuICAgIHZhciBjb2xsZWN0b3IgPSBuZXN0ZWRUb2tlbnM7XG4gICAgdmFyIHNlY3Rpb25zID0gW107XG5cbiAgICB2YXIgdG9rZW4sIHNlY3Rpb247XG4gICAgZm9yICh2YXIgaSA9IDAsIG51bVRva2VucyA9IHRva2Vucy5sZW5ndGg7IGkgPCBudW1Ub2tlbnM7ICsraSkge1xuICAgICAgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICAgIHN3aXRjaCAodG9rZW5bMF0pIHtcbiAgICAgICAgY2FzZSAnIyc6XG4gICAgICAgIGNhc2UgJ14nOlxuICAgICAgICAgIGNvbGxlY3Rvci5wdXNoKHRva2VuKTtcbiAgICAgICAgICBzZWN0aW9ucy5wdXNoKHRva2VuKTtcbiAgICAgICAgICBjb2xsZWN0b3IgPSB0b2tlbls0XSA9IFtdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcvJzpcbiAgICAgICAgICBzZWN0aW9uID0gc2VjdGlvbnMucG9wKCk7XG4gICAgICAgICAgc2VjdGlvbls1XSA9IHRva2VuWzJdO1xuICAgICAgICAgIGNvbGxlY3RvciA9IHNlY3Rpb25zLmxlbmd0aCA+IDAgPyBzZWN0aW9uc1tzZWN0aW9ucy5sZW5ndGggLSAxXVs0XSA6IG5lc3RlZFRva2VucztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBjb2xsZWN0b3IucHVzaCh0b2tlbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5lc3RlZFRva2VucztcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNpbXBsZSBzdHJpbmcgc2Nhbm5lciB0aGF0IGlzIHVzZWQgYnkgdGhlIHRlbXBsYXRlIHBhcnNlciB0byBmaW5kXG4gICAqIHRva2VucyBpbiB0ZW1wbGF0ZSBzdHJpbmdzLlxuICAgKi9cbiAgZnVuY3Rpb24gU2Nhbm5lciAoc3RyaW5nKSB7XG4gICAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG4gICAgdGhpcy50YWlsID0gc3RyaW5nO1xuICAgIHRoaXMucG9zID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdGFpbCBpcyBlbXB0eSAoZW5kIG9mIHN0cmluZykuXG4gICAqL1xuICBTY2FubmVyLnByb3RvdHlwZS5lb3MgPSBmdW5jdGlvbiBlb3MgKCkge1xuICAgIHJldHVybiB0aGlzLnRhaWwgPT09ICcnO1xuICB9O1xuXG4gIC8qKlxuICAgKiBUcmllcyB0byBtYXRjaCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uIGF0IHRoZSBjdXJyZW50IHBvc2l0aW9uLlxuICAgKiBSZXR1cm5zIHRoZSBtYXRjaGVkIHRleHQgaWYgaXQgY2FuIG1hdGNoLCB0aGUgZW1wdHkgc3RyaW5nIG90aGVyd2lzZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiBzY2FuIChyZSkge1xuICAgIHZhciBtYXRjaCA9IHRoaXMudGFpbC5tYXRjaChyZSk7XG5cbiAgICBpZiAoIW1hdGNoIHx8IG1hdGNoLmluZGV4ICE9PSAwKVxuICAgICAgcmV0dXJuICcnO1xuXG4gICAgdmFyIHN0cmluZyA9IG1hdGNoWzBdO1xuXG4gICAgdGhpcy50YWlsID0gdGhpcy50YWlsLnN1YnN0cmluZyhzdHJpbmcubGVuZ3RoKTtcbiAgICB0aGlzLnBvcyArPSBzdHJpbmcubGVuZ3RoO1xuXG4gICAgcmV0dXJuIHN0cmluZztcbiAgfTtcblxuICAvKipcbiAgICogU2tpcHMgYWxsIHRleHQgdW50aWwgdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbiBjYW4gYmUgbWF0Y2hlZC4gUmV0dXJuc1xuICAgKiB0aGUgc2tpcHBlZCBzdHJpbmcsIHdoaWNoIGlzIHRoZSBlbnRpcmUgdGFpbCBpZiBubyBtYXRjaCBjYW4gYmUgbWFkZS5cbiAgICovXG4gIFNjYW5uZXIucHJvdG90eXBlLnNjYW5VbnRpbCA9IGZ1bmN0aW9uIHNjYW5VbnRpbCAocmUpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLnRhaWwuc2VhcmNoKHJlKSwgbWF0Y2g7XG5cbiAgICBzd2l0Y2ggKGluZGV4KSB7XG4gICAgICBjYXNlIC0xOlxuICAgICAgICBtYXRjaCA9IHRoaXMudGFpbDtcbiAgICAgICAgdGhpcy50YWlsID0gJyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAwOlxuICAgICAgICBtYXRjaCA9ICcnO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIG1hdGNoID0gdGhpcy50YWlsLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgIHRoaXMudGFpbCA9IHRoaXMudGFpbC5zdWJzdHJpbmcoaW5kZXgpO1xuICAgIH1cblxuICAgIHRoaXMucG9zICs9IG1hdGNoLmxlbmd0aDtcblxuICAgIHJldHVybiBtYXRjaDtcbiAgfTtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhIHJlbmRlcmluZyBjb250ZXh0IGJ5IHdyYXBwaW5nIGEgdmlldyBvYmplY3QgYW5kXG4gICAqIG1haW50YWluaW5nIGEgcmVmZXJlbmNlIHRvIHRoZSBwYXJlbnQgY29udGV4dC5cbiAgICovXG4gIGZ1bmN0aW9uIENvbnRleHQgKHZpZXcsIHBhcmVudENvbnRleHQpIHtcbiAgICB0aGlzLnZpZXcgPSB2aWV3O1xuICAgIHRoaXMuY2FjaGUgPSB7ICcuJzogdGhpcy52aWV3IH07XG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnRDb250ZXh0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29udGV4dCB1c2luZyB0aGUgZ2l2ZW4gdmlldyB3aXRoIHRoaXMgY29udGV4dFxuICAgKiBhcyB0aGUgcGFyZW50LlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIHB1c2ggKHZpZXcpIHtcbiAgICByZXR1cm4gbmV3IENvbnRleHQodmlldywgdGhpcyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBnaXZlbiBuYW1lIGluIHRoaXMgY29udGV4dCwgdHJhdmVyc2luZ1xuICAgKiB1cCB0aGUgY29udGV4dCBoaWVyYXJjaHkgaWYgdGhlIHZhbHVlIGlzIGFic2VudCBpbiB0aGlzIGNvbnRleHQncyB2aWV3LlxuICAgKi9cbiAgQ29udGV4dC5wcm90b3R5cGUubG9va3VwID0gZnVuY3Rpb24gbG9va3VwIChuYW1lKSB7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZTtcblxuICAgIHZhciB2YWx1ZTtcbiAgICBpZiAoY2FjaGUuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgIHZhbHVlID0gY2FjaGVbbmFtZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBjb250ZXh0ID0gdGhpcywgbmFtZXMsIGluZGV4LCBsb29rdXBIaXQgPSBmYWxzZTtcblxuICAgICAgd2hpbGUgKGNvbnRleHQpIHtcbiAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignLicpID4gMCkge1xuICAgICAgICAgIHZhbHVlID0gY29udGV4dC52aWV3O1xuICAgICAgICAgIG5hbWVzID0gbmFtZS5zcGxpdCgnLicpO1xuICAgICAgICAgIGluZGV4ID0gMDtcblxuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIFVzaW5nIHRoZSBkb3Qgbm90aW9uIHBhdGggaW4gYG5hbWVgLCB3ZSBkZXNjZW5kIHRocm91Z2ggdGhlXG4gICAgICAgICAgICogbmVzdGVkIG9iamVjdHMuXG4gICAgICAgICAgICpcbiAgICAgICAgICAgKiBUbyBiZSBjZXJ0YWluIHRoYXQgdGhlIGxvb2t1cCBoYXMgYmVlbiBzdWNjZXNzZnVsLCB3ZSBoYXZlIHRvXG4gICAgICAgICAgICogY2hlY2sgaWYgdGhlIGxhc3Qgb2JqZWN0IGluIHRoZSBwYXRoIGFjdHVhbGx5IGhhcyB0aGUgcHJvcGVydHlcbiAgICAgICAgICAgKiB3ZSBhcmUgbG9va2luZyBmb3IuIFdlIHN0b3JlIHRoZSByZXN1bHQgaW4gYGxvb2t1cEhpdGAuXG4gICAgICAgICAgICpcbiAgICAgICAgICAgKiBUaGlzIGlzIHNwZWNpYWxseSBuZWNlc3NhcnkgZm9yIHdoZW4gdGhlIHZhbHVlIGhhcyBiZWVuIHNldCB0b1xuICAgICAgICAgICAqIGB1bmRlZmluZWRgIGFuZCB3ZSB3YW50IHRvIGF2b2lkIGxvb2tpbmcgdXAgcGFyZW50IGNvbnRleHRzLlxuICAgICAgICAgICAqKi9cbiAgICAgICAgICB3aGlsZSAodmFsdWUgIT0gbnVsbCAmJiBpbmRleCA8IG5hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSBuYW1lcy5sZW5ndGggLSAxKVxuICAgICAgICAgICAgICBsb29rdXBIaXQgPSBoYXNQcm9wZXJ0eSh2YWx1ZSwgbmFtZXNbaW5kZXhdKTtcblxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZVtuYW1lc1tpbmRleCsrXV07XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlID0gY29udGV4dC52aWV3W25hbWVdO1xuICAgICAgICAgIGxvb2t1cEhpdCA9IGhhc1Byb3BlcnR5KGNvbnRleHQudmlldywgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobG9va3VwSGl0KVxuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0LnBhcmVudDtcbiAgICAgIH1cblxuICAgICAgY2FjaGVbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpXG4gICAgICB2YWx1ZSA9IHZhbHVlLmNhbGwodGhpcy52aWV3KTtcblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICAvKipcbiAgICogQSBXcml0ZXIga25vd3MgaG93IHRvIHRha2UgYSBzdHJlYW0gb2YgdG9rZW5zIGFuZCByZW5kZXIgdGhlbSB0byBhXG4gICAqIHN0cmluZywgZ2l2ZW4gYSBjb250ZXh0LiBJdCBhbHNvIG1haW50YWlucyBhIGNhY2hlIG9mIHRlbXBsYXRlcyB0b1xuICAgKiBhdm9pZCB0aGUgbmVlZCB0byBwYXJzZSB0aGUgc2FtZSB0ZW1wbGF0ZSB0d2ljZS5cbiAgICovXG4gIGZ1bmN0aW9uIFdyaXRlciAoKSB7XG4gICAgdGhpcy5jYWNoZSA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFycyBhbGwgY2FjaGVkIHRlbXBsYXRlcyBpbiB0aGlzIHdyaXRlci5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uIGNsZWFyQ2FjaGUgKCkge1xuICAgIHRoaXMuY2FjaGUgPSB7fTtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgYW5kIHJldHVybnMgdGhlIGFycmF5IG9mIHRva2Vuc1xuICAgKiB0aGF0IGlzIGdlbmVyYXRlZCBmcm9tIHRoZSBwYXJzZS5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiBwYXJzZSAodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICAgIHZhciB0b2tlbnMgPSBjYWNoZVt0ZW1wbGF0ZV07XG5cbiAgICBpZiAodG9rZW5zID09IG51bGwpXG4gICAgICB0b2tlbnMgPSBjYWNoZVt0ZW1wbGF0ZV0gPSBwYXJzZVRlbXBsYXRlKHRlbXBsYXRlLCB0YWdzKTtcblxuICAgIHJldHVybiB0b2tlbnM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhpZ2gtbGV2ZWwgbWV0aG9kIHRoYXQgaXMgdXNlZCB0byByZW5kZXIgdGhlIGdpdmVuIGB0ZW1wbGF0ZWAgd2l0aFxuICAgKiB0aGUgZ2l2ZW4gYHZpZXdgLlxuICAgKlxuICAgKiBUaGUgb3B0aW9uYWwgYHBhcnRpYWxzYCBhcmd1bWVudCBtYXkgYmUgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgdGhlXG4gICAqIG5hbWVzIGFuZCB0ZW1wbGF0ZXMgb2YgcGFydGlhbHMgdGhhdCBhcmUgdXNlZCBpbiB0aGUgdGVtcGxhdGUuIEl0IG1heVxuICAgKiBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBpcyB1c2VkIHRvIGxvYWQgcGFydGlhbCB0ZW1wbGF0ZXMgb24gdGhlIGZseVxuICAgKiB0aGF0IHRha2VzIGEgc2luZ2xlIGFyZ3VtZW50OiB0aGUgbmFtZSBvZiB0aGUgcGFydGlhbC5cbiAgICovXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyICh0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpIHtcbiAgICB2YXIgdG9rZW5zID0gdGhpcy5wYXJzZSh0ZW1wbGF0ZSk7XG4gICAgdmFyIGNvbnRleHQgPSAodmlldyBpbnN0YW5jZW9mIENvbnRleHQpID8gdmlldyA6IG5ldyBDb250ZXh0KHZpZXcpO1xuICAgIHJldHVybiB0aGlzLnJlbmRlclRva2Vucyh0b2tlbnMsIGNvbnRleHQsIHBhcnRpYWxzLCB0ZW1wbGF0ZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIExvdy1sZXZlbCBtZXRob2QgdGhhdCByZW5kZXJzIHRoZSBnaXZlbiBhcnJheSBvZiBgdG9rZW5zYCB1c2luZ1xuICAgKiB0aGUgZ2l2ZW4gYGNvbnRleHRgIGFuZCBgcGFydGlhbHNgLlxuICAgKlxuICAgKiBOb3RlOiBUaGUgYG9yaWdpbmFsVGVtcGxhdGVgIGlzIG9ubHkgZXZlciB1c2VkIHRvIGV4dHJhY3QgdGhlIHBvcnRpb25cbiAgICogb2YgdGhlIG9yaWdpbmFsIHRlbXBsYXRlIHRoYXQgd2FzIGNvbnRhaW5lZCBpbiBhIGhpZ2hlci1vcmRlciBzZWN0aW9uLlxuICAgKiBJZiB0aGUgdGVtcGxhdGUgZG9lc24ndCB1c2UgaGlnaGVyLW9yZGVyIHNlY3Rpb25zLCB0aGlzIGFyZ3VtZW50IG1heVxuICAgKiBiZSBvbWl0dGVkLlxuICAgKi9cbiAgV3JpdGVyLnByb3RvdHlwZS5yZW5kZXJUb2tlbnMgPSBmdW5jdGlvbiByZW5kZXJUb2tlbnMgKHRva2VucywgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpIHtcbiAgICB2YXIgYnVmZmVyID0gJyc7XG5cbiAgICB2YXIgdG9rZW4sIHN5bWJvbCwgdmFsdWU7XG4gICAgZm9yICh2YXIgaSA9IDAsIG51bVRva2VucyA9IHRva2Vucy5sZW5ndGg7IGkgPCBudW1Ub2tlbnM7ICsraSkge1xuICAgICAgdmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICB0b2tlbiA9IHRva2Vuc1tpXTtcbiAgICAgIHN5bWJvbCA9IHRva2VuWzBdO1xuXG4gICAgICBpZiAoc3ltYm9sID09PSAnIycpIHZhbHVlID0gdGhpcy5yZW5kZXJTZWN0aW9uKHRva2VuLCBjb250ZXh0LCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgICBlbHNlIGlmIChzeW1ib2wgPT09ICdeJykgdmFsdWUgPSB0aGlzLnJlbmRlckludmVydGVkKHRva2VuLCBjb250ZXh0LCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgICBlbHNlIGlmIChzeW1ib2wgPT09ICc+JykgdmFsdWUgPSB0aGlzLnJlbmRlclBhcnRpYWwodG9rZW4sIGNvbnRleHQsIHBhcnRpYWxzLCBvcmlnaW5hbFRlbXBsYXRlKTtcbiAgICAgIGVsc2UgaWYgKHN5bWJvbCA9PT0gJyYnKSB2YWx1ZSA9IHRoaXMudW5lc2NhcGVkVmFsdWUodG9rZW4sIGNvbnRleHQpO1xuICAgICAgZWxzZSBpZiAoc3ltYm9sID09PSAnbmFtZScpIHZhbHVlID0gdGhpcy5lc2NhcGVkVmFsdWUodG9rZW4sIGNvbnRleHQpO1xuICAgICAgZWxzZSBpZiAoc3ltYm9sID09PSAndGV4dCcpIHZhbHVlID0gdGhpcy5yYXdWYWx1ZSh0b2tlbik7XG5cbiAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICBidWZmZXIgKz0gdmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfTtcblxuICBXcml0ZXIucHJvdG90eXBlLnJlbmRlclNlY3Rpb24gPSBmdW5jdGlvbiByZW5kZXJTZWN0aW9uICh0b2tlbiwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGJ1ZmZlciA9ICcnO1xuICAgIHZhciB2YWx1ZSA9IGNvbnRleHQubG9va3VwKHRva2VuWzFdKTtcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byByZW5kZXIgYW4gYXJiaXRyYXJ5IHRlbXBsYXRlXG4gICAgLy8gaW4gdGhlIGN1cnJlbnQgY29udGV4dCBieSBoaWdoZXItb3JkZXIgc2VjdGlvbnMuXG4gICAgZnVuY3Rpb24gc3ViUmVuZGVyICh0ZW1wbGF0ZSkge1xuICAgICAgcmV0dXJuIHNlbGYucmVuZGVyKHRlbXBsYXRlLCBjb250ZXh0LCBwYXJ0aWFscyk7XG4gICAgfVxuXG4gICAgaWYgKCF2YWx1ZSkgcmV0dXJuO1xuXG4gICAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgICBmb3IgKHZhciBqID0gMCwgdmFsdWVMZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGogPCB2YWx1ZUxlbmd0aDsgKytqKSB7XG4gICAgICAgIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dC5wdXNoKHZhbHVlW2pdKSwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIGJ1ZmZlciArPSB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dC5wdXNoKHZhbHVlKSwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3JpZ2luYWxUZW1wbGF0ZSAhPT0gJ3N0cmluZycpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHVzZSBoaWdoZXItb3JkZXIgc2VjdGlvbnMgd2l0aG91dCB0aGUgb3JpZ2luYWwgdGVtcGxhdGUnKTtcblxuICAgICAgLy8gRXh0cmFjdCB0aGUgcG9ydGlvbiBvZiB0aGUgb3JpZ2luYWwgdGVtcGxhdGUgdGhhdCB0aGUgc2VjdGlvbiBjb250YWlucy5cbiAgICAgIHZhbHVlID0gdmFsdWUuY2FsbChjb250ZXh0LnZpZXcsIG9yaWdpbmFsVGVtcGxhdGUuc2xpY2UodG9rZW5bM10sIHRva2VuWzVdKSwgc3ViUmVuZGVyKTtcblxuICAgICAgaWYgKHZhbHVlICE9IG51bGwpXG4gICAgICAgIGJ1ZmZlciArPSB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgYnVmZmVyICs9IHRoaXMucmVuZGVyVG9rZW5zKHRva2VuWzRdLCBjb250ZXh0LCBwYXJ0aWFscywgb3JpZ2luYWxUZW1wbGF0ZSk7XG4gICAgfVxuICAgIHJldHVybiBidWZmZXI7XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5yZW5kZXJJbnZlcnRlZCA9IGZ1bmN0aW9uIHJlbmRlckludmVydGVkICh0b2tlbiwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpIHtcbiAgICB2YXIgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblsxXSk7XG5cbiAgICAvLyBVc2UgSmF2YVNjcmlwdCdzIGRlZmluaXRpb24gb2YgZmFsc3kuIEluY2x1ZGUgZW1wdHkgYXJyYXlzLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vamFubC9tdXN0YWNoZS5qcy9pc3N1ZXMvMTg2XG4gICAgaWYgKCF2YWx1ZSB8fCAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSlcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlclRva2Vucyh0b2tlbls0XSwgY29udGV4dCwgcGFydGlhbHMsIG9yaWdpbmFsVGVtcGxhdGUpO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUucmVuZGVyUGFydGlhbCA9IGZ1bmN0aW9uIHJlbmRlclBhcnRpYWwgKHRva2VuLCBjb250ZXh0LCBwYXJ0aWFscykge1xuICAgIGlmICghcGFydGlhbHMpIHJldHVybjtcblxuICAgIHZhciB2YWx1ZSA9IGlzRnVuY3Rpb24ocGFydGlhbHMpID8gcGFydGlhbHModG9rZW5bMV0pIDogcGFydGlhbHNbdG9rZW5bMV1dO1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKVxuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyVG9rZW5zKHRoaXMucGFyc2UodmFsdWUpLCBjb250ZXh0LCBwYXJ0aWFscywgdmFsdWUpO1xuICB9O1xuXG4gIFdyaXRlci5wcm90b3R5cGUudW5lc2NhcGVkVmFsdWUgPSBmdW5jdGlvbiB1bmVzY2FwZWRWYWx1ZSAodG9rZW4sIGNvbnRleHQpIHtcbiAgICB2YXIgdmFsdWUgPSBjb250ZXh0Lmxvb2t1cCh0b2tlblsxXSk7XG4gICAgaWYgKHZhbHVlICE9IG51bGwpXG4gICAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5lc2NhcGVkVmFsdWUgPSBmdW5jdGlvbiBlc2NhcGVkVmFsdWUgKHRva2VuLCBjb250ZXh0KSB7XG4gICAgdmFyIHZhbHVlID0gY29udGV4dC5sb29rdXAodG9rZW5bMV0pO1xuICAgIGlmICh2YWx1ZSAhPSBudWxsKVxuICAgICAgcmV0dXJuIG11c3RhY2hlLmVzY2FwZSh2YWx1ZSk7XG4gIH07XG5cbiAgV3JpdGVyLnByb3RvdHlwZS5yYXdWYWx1ZSA9IGZ1bmN0aW9uIHJhd1ZhbHVlICh0b2tlbikge1xuICAgIHJldHVybiB0b2tlblsxXTtcbiAgfTtcblxuICBtdXN0YWNoZS5uYW1lID0gJ211c3RhY2hlLmpzJztcbiAgbXVzdGFjaGUudmVyc2lvbiA9ICcyLjIuMSc7XG4gIG11c3RhY2hlLnRhZ3MgPSBbICd7eycsICd9fScgXTtcblxuICAvLyBBbGwgaGlnaC1sZXZlbCBtdXN0YWNoZS4qIGZ1bmN0aW9ucyB1c2UgdGhpcyB3cml0ZXIuXG4gIHZhciBkZWZhdWx0V3JpdGVyID0gbmV3IFdyaXRlcigpO1xuXG4gIC8qKlxuICAgKiBDbGVhcnMgYWxsIGNhY2hlZCB0ZW1wbGF0ZXMgaW4gdGhlIGRlZmF1bHQgd3JpdGVyLlxuICAgKi9cbiAgbXVzdGFjaGUuY2xlYXJDYWNoZSA9IGZ1bmN0aW9uIGNsZWFyQ2FjaGUgKCkge1xuICAgIHJldHVybiBkZWZhdWx0V3JpdGVyLmNsZWFyQ2FjaGUoKTtcbiAgfTtcblxuICAvKipcbiAgICogUGFyc2VzIGFuZCBjYWNoZXMgdGhlIGdpdmVuIHRlbXBsYXRlIGluIHRoZSBkZWZhdWx0IHdyaXRlciBhbmQgcmV0dXJucyB0aGVcbiAgICogYXJyYXkgb2YgdG9rZW5zIGl0IGNvbnRhaW5zLiBEb2luZyB0aGlzIGFoZWFkIG9mIHRpbWUgYXZvaWRzIHRoZSBuZWVkIHRvXG4gICAqIHBhcnNlIHRlbXBsYXRlcyBvbiB0aGUgZmx5IGFzIHRoZXkgYXJlIHJlbmRlcmVkLlxuICAgKi9cbiAgbXVzdGFjaGUucGFyc2UgPSBmdW5jdGlvbiBwYXJzZSAodGVtcGxhdGUsIHRhZ3MpIHtcbiAgICByZXR1cm4gZGVmYXVsdFdyaXRlci5wYXJzZSh0ZW1wbGF0ZSwgdGFncyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbmRlcnMgdGhlIGB0ZW1wbGF0ZWAgd2l0aCB0aGUgZ2l2ZW4gYHZpZXdgIGFuZCBgcGFydGlhbHNgIHVzaW5nIHRoZVxuICAgKiBkZWZhdWx0IHdyaXRlci5cbiAgICovXG4gIG11c3RhY2hlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlciAodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKSB7XG4gICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgdGVtcGxhdGUhIFRlbXBsYXRlIHNob3VsZCBiZSBhIFwic3RyaW5nXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICdidXQgXCInICsgdHlwZVN0cih0ZW1wbGF0ZSkgKyAnXCIgd2FzIGdpdmVuIGFzIHRoZSBmaXJzdCAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJ2FyZ3VtZW50IGZvciBtdXN0YWNoZSNyZW5kZXIodGVtcGxhdGUsIHZpZXcsIHBhcnRpYWxzKScpO1xuICAgIH1cblxuICAgIHJldHVybiBkZWZhdWx0V3JpdGVyLnJlbmRlcih0ZW1wbGF0ZSwgdmlldywgcGFydGlhbHMpO1xuICB9O1xuXG4gIC8vIFRoaXMgaXMgaGVyZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aCAwLjQueC4sXG4gIC8qZXNsaW50LWRpc2FibGUgKi8gLy8gZXNsaW50IHdhbnRzIGNhbWVsIGNhc2VkIGZ1bmN0aW9uIG5hbWVcbiAgbXVzdGFjaGUudG9faHRtbCA9IGZ1bmN0aW9uIHRvX2h0bWwgKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscywgc2VuZCkge1xuICAgIC8qZXNsaW50LWVuYWJsZSovXG5cbiAgICB2YXIgcmVzdWx0ID0gbXVzdGFjaGUucmVuZGVyKHRlbXBsYXRlLCB2aWV3LCBwYXJ0aWFscyk7XG5cbiAgICBpZiAoaXNGdW5jdGlvbihzZW5kKSkge1xuICAgICAgc2VuZChyZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfTtcblxuICAvLyBFeHBvcnQgdGhlIGVzY2FwaW5nIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIHVzZXIgbWF5IG92ZXJyaWRlIGl0LlxuICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2phbmwvbXVzdGFjaGUuanMvaXNzdWVzLzI0NFxuICBtdXN0YWNoZS5lc2NhcGUgPSBlc2NhcGVIdG1sO1xuXG4gIC8vIEV4cG9ydCB0aGVzZSBtYWlubHkgZm9yIHRlc3RpbmcsIGJ1dCBhbHNvIGZvciBhZHZhbmNlZCB1c2FnZS5cbiAgbXVzdGFjaGUuU2Nhbm5lciA9IFNjYW5uZXI7XG4gIG11c3RhY2hlLkNvbnRleHQgPSBDb250ZXh0O1xuICBtdXN0YWNoZS5Xcml0ZXIgPSBXcml0ZXI7XG5cbn0pKTtcbiJdfQ==
