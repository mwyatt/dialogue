# Installation
```bash
npm install mwyatt-dialogue --save
```
```javascript
var dialogueFactory = require('mwyatt-dialogue');
var dialogue = new dialogueFactory();

dialogue.create({
  title: 'Hello World'
});
```
## Options
| Property | Value |
| --- | --- |
| `title` | `string` Gives the dialogue a title. |
| `description` | `string` Gives the dialogue a description. |
| `hardClose` | `bool` `default: false` If true, only clicking the cross in the corner will close the dialogue. |
| `className` | `string` Appends the class name string to the dialogue when rendering. This allows for unique styling within specific dialogues. |
| `positionTo` | `object` Pass a jquery selection here and the dialogue will be positioned to it when it opens. |
| `draggable` | `bool` `default: false` If true, makes the dialogue draggable. |
| `actions` | Specify any buttons required for the dialogue and the callback functions which will execute when clicked. `actions: {'Name': function() {}}` |
| `ajax` | `bool` `default: false` If true, the dialogue is created with a CSS spinner in the body. The ajax request must be handled separately. |
| `onComplete` | `function` Callback function, fired when dialogue has been fully rendered and positioned. |
| `onClose` | `function` Fired when dialogue has been closed. |
| `mask` | `bool` `default: false` If true, the browser view port is masked/obscured slightly. |
| `html` | `string` Insert html directly into the dialogue. |
| `hideClose` | `bool` `default: false` If true, hides the closing cross from the corner. |
| `width` | `integer` Integer specifying exact pixel width for dialogue. |
