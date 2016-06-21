# Installation
```
npm install mwyatt-dialogue --save
```
```
var dialogueFactory = require('mwyatt-dialogue');
var dialogue = new dialogueFactory();

dialogue.create({
  title: 'Hello World'
});
```
## Options
### `title`
Gives the dialogue a title.
### `description`
Gives the dialogue a description.
### `hardClose`
`Default: false`

If true, only clicking the cross in the corner will close the dialogue.
### `className`
Appends the class name string to the dialogue when rendering. This allows for unique styling within specific dialogues.
### `positionTo`
Pass a jquery selection here and the dialogue will be positioned to it when it opens.
### `draggable`
`Default: false`

If true, makes the dialogue draggable.
### `actions`
Specify any buttons required for the dialogue and the callback functions which will execute when clicked.
```
actions: {'Name': function() {}}
```
### `ajax`
`Default: false`

If true, the dialogue is created with a CSS spinner in the body. The ajax request must be handled separately.

### `onComplete`
Callback function, fired when dialogue has been fully rendered and positioned.
### `onClose`
Fired when dialogue has been closed.
### `mask`
`Default: false`

If true, the browser view port is masked/obscured slightly.
### `html`
Insert html directly into the dialogue.
### `hideClose`
`Default: false`

If true, hides the closing cross from the corner.
### `width`
Integer specifying exact pixel width for dialogue.
