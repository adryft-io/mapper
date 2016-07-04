var rp = require('request-promise');
var Consumer = require('sqs-consumer');
var AWS = require('aws-sdk');
require('dotenv').config({ silent: true });
AWS.config.update({region: process.env.AWS_REGION});

var sqs = new AWS.SQS();

// TODO: factor this out
// should listen for triggers on the queue
sqs.getQueueUrl({ QueueName: 'trigger' }, function(err, data) {
  if (err) return console.log(err);
  var app = Consumer.create({
    queueUrl: data.QueueUrl,
    handleMessage: function(data, done) {
      body = JSON.parse(data.Body);

      //a query that will find the recipe given a trigger
      var q = 'action_name=' + body.action_name + '&action_channel=' + body.action_channel + '&user_id=' + body.user_id;
      console.log('Recieved from trigger:', body);

      // create a promise request to the controller
      rp(process.env.RECIPES_SERVICE_URL + '/v1/formulae/?' + q)
      .then(function(data) {
        var recipe = JSON.parse(data);
        var queueName = recipe.data[0].reaction_channel + '-channel';
        console.log('Queue Being Sent To:', queueName);
        sqs.getQueueUrl({ QueueName: queueName }, function(err, data) {
          
          // send message code goes here
          if (err) return console.log(err);
          var url = data.QueueUrl;
          
          // Sending a message
          // The following example sends a message to the queue created in the previous example.
          var queue = new AWS.SQS({params: {QueueUrl: url}});
          
          // parse the inner reaction_fields
          recipe.data[0].reaction_fields = JSON.parse(recipe.data[0].reaction_fields);
          var body = JSON.stringify(recipe.data[0]);
          console.log('Message being sent:', body);
          queue.sendMessage({ MessageBody: body }, function (err, data) {
            if (err) return console.log(err);
            console.log(data);
          });
        });

        return recipe;
      })
      .catch(function(err){
        console.log('err: ', err);
        return err;
      });
      done();
    },
    sqs: sqs
  });
  app.on('error', function(err) { console.log(err.message) });
  app.start();
});
