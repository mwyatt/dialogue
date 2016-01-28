var dialogueFactory = require('./dialogue');
dialogueFactory.setTemplateContainer($('#mst-dialogue').html());
var dialogue1 = new dialogueFactory();

dialogue1.create({
  title: 'title',
  description: 'description'
});
