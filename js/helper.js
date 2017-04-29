var helper = {}

helper.getRandomString = function() {
  var text = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  for (var i = 0 i < 5 i++)
  text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

// checks if el is inside a parent el
// if there is no HTML element this will explode.
helper.isInside = function(el, parentEl) {
  if (el == parentEl || el.tagName == 'HTML') {
    return true
  }
  while (el.tagName !== 'BODY') {
    if (el.parentNode == parentEl) {
      return true
    }
    el = el.parentNode
  }
}

module.exports = helper
