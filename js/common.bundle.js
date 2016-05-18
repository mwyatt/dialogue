var $ = require('jquery');
var dialogueFactory = require('../index');
var dialogue = new dialogueFactory();
var dialogueOk = new dialogueFactory();

$('.js-dialogue-1').on('click', function() {
  dialogue.create({
    title: 'Demo Basic',
    description: 'Positioned to the window and fixed, this masks the current window.',
    className: 'dialogue-1',
    mask: true,
    width: 290
  });
});

$('.js-dialogue-2').on('click', function() {
  dialogue.create({
    className: 'dialogue-2',
    positionTo: $('.js-dialogue-2'),
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

$('.js-dialogue-3').on('click', function() {
  dialogue.create({
    hardClose: true,
    className: 'dialogue-3',
    width: 250,
    title: 'Hard Close',
    description: 'Can only be closed using the \'&times;\' icon in the corner.'
  });
});

$('.js-dialogue-4').on('click', function() {
  dialogue.create({
    mask: true,
    width: 550,
    title: 'Very large',
    html: '<p>If it is too large for the window to center in the middle. It will be placed at the top.</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p><p>Demo Line</p>'
  });
});

$('.js-dialogue-5').on('click', function() {
  dialogue.create({
    mask: true,
    width: 250,
    ajaxConfig: {
      type: 'get',
      url: '/dialogue/README.md',
      dataType: 'text',
      data: {},
      success: function(response) {
        this.setHtml(response);
      },
      error: function(response) {
        console.log('dialogue5 error', response);
      }
    }
  });
});

$('.js-dialogue-6').on('click', function() {
  dialogue.create({
    mask: true,
    title: '6',
    description: 'auto width and scrollable'
  });
});

$('.js-dialogue-7').on('click', function() {
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
        var $buttonOk = $('[data-name="Ok"]');
        dialogueOk.create({
          width: 220,
          positionTo: $buttonOk,
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
