var dialogueFactory = require('./dialogue');
var domready = require('domready');

var dialogue = new dialogueFactory();
var dialogueSecondary = new dialogueFactory();
dialogue.close();
domready(function() {

  document.querySelector('.js-test-me').addEventListener('click', function() {
    dialogue.create({
      title: 'Testing positioned on tall page',
      positionTo: this,
      width: 150
    });
  });

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
