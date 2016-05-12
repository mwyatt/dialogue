var $ = require('jquery');
var dialogueFactory = require('../index');
var dialogue1 = new dialogueFactory();
var dialogue2 = new dialogueFactory();
var dialogue3 = new dialogueFactory();
var dialogue4 = new dialogueFactory();
var dialogue5 = new dialogueFactory();
var dialogue6 = new dialogueFactory();

// masked
$('.js-dialogue-1').on('click', function() {
  dialogue1.create({
    mask: true,
    className: 'dialogue-1',
    width: 200,
    title: 'Masked',
    description: 'Positioned to the window and fixed, this masks the current window.',
    actions: {
      'Cancel': function() {
        this.close();
      },
      'Ok': function() {
        console.log('Ok');
      }
    },
    onComplete: function() {
      console.log('dialogue.onComplete');
    },
    onClose: function() {
      console.log('dialogue.onClose');
    }
  });
});

// positioned
$('.js-dialogue-2').on('click', function() {
  dialogue2.create({
    className: 'dialogue-2',
    positionTo: $('.js-dialogue-2'),
    width: 200,
    title: 'Positioned',
    description: 'This dialogue is positioned to the selector \'.js-dialogue-2\'.',
    actions: {
      'Ok': function() {
        dialogue2.close(dialogue2);
      }
    }
  });
});

// well-hard only closable via action or cross
$('.js-dialogue-3').on('click', function() {
  dialogue3.create({
    hardClose: true,
    className: 'dialogue-3',
    width: 250,
    title: 'Well Hard To Close',
    description: 'Harder than usual to close.',
    actions: {
      'Close': function() {
        this.close();
      }
    }
  });
});

// edge case testing
$('.js-dialogue-4').on('click', function() {
  dialogue4.create({
    mask: true,
    width: 550,
    title: 'Very large',
    html: '<p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p><p>Hi</p>'
  });
});

// ajax
$('.js-dialogue-5').on('click', function() {
  dialogue5.create({
    title: 'does this appear?',
    description: 'does this appear?',
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

// auto width scrollable
$('.js-dialogue-6').on('click', function() {
  dialogue5.create({
    mask: true,
    title: '6',
    description: 'auto width and scrollable'
  });
});
