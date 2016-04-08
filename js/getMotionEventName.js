
// will this be needed?
var getMotionEventName = function(type) {
  var t;
  var el = document.createElement('fakeelement');
  var map = {};
  if (type == 'transition') {
    map = {
        'transition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'MozTransition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd'
      };
  } else if (type == 'animation') {
    map = {
        'animation': 'animationend',
        'OAnimation': 'oAnimationEnd',
        'MozAnimation': 'animationend',
        'WebkitAnimation': 'webkitAnimationEnd'
      };
  };

  for (t in map) {
    if (el.style[t] !== undefined) {
      return map[t];
    }
  }
};
