var rp = require('request-promise');
var Consumer = require('sqs-consumer');
var AWS = require('aws-sdk');
require('dotenv').config({ silent: true });
AWS.config.update({region: process.env.AWS_REGION});

var sqs = new AWS.SQS();

// TODO: factor this out
// should listen for triggers on the queue
sqs.getQueueUrl({ QueueName: 'trigger' }, function(err, data) {
  var app = Consumer.create({
    queueUrl: data.QueueUrl,
    handleMessage: (data, done) => {
      body = JSON.parse(data.Body);
      // set the trigger info into variables
      var data = {}
      data.userid = body.user_id;
      data.triggerchannel = body.trigger_channel;
      data.triggername = body.trigger_name;
      
      //a query that will find the recipe given a trigger
      var q = 'trigger_name='+ data.triggername +'&trigger_channel='+data.triggerchannel+ '&user_id='+ data.userid;
      console.log('Recieved from trigger:', data);

      // create a promise request to the controller
      rp('http://web:3000/v1/recipes/?' + q)
      .then(function(data){
        var recipe = JSON.parse(data);
        var actionChannel = recipe.data[0].action_channel + '-channel';
        console.log('Queue Being Sent To:', actionChannel);
        sqs.getQueueUrl({ QueueName: actionChannel }, function(err, data) {
          
          // send message code goes here
          if (err) return console.log(err);
          var url = data.QueueUrl;
          
          // Sending a message
          // The following example sends a message to the queue created in the previous example.
          var queue = new AWS.SQS({params: {QueueUrl: url}});
          
          // parse the inner action_fields
          recipe.data[0].action_fields = JSON.parse(recipe.data[0].action_fields);
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
  app.on('error', err => console.log(err.message))
  app.start();
});
