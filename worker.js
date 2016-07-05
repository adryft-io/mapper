var rp = require('request-promise');
var Consumer = require('sqs-consumer');
var AWS = require('aws-sdk');
require('dotenv').config({ silent: true });
AWS.config.update({region: process.env.AWS_REGION});

var sqs = new AWS.SQS();


var handleMessage = function(data, done) {
  // throw away message if not valid json
  try {
    body = JSON.parse(data.Body);
  } catch(e) {
    console.error(e);
    return done();
  }

  //a query that will find the formula given a action
  var q = 'action_name=' + body.action_name + '&action_channel=' + body.action_channel + '&user_id=' + body.user_id;
  console.log('Recieved from action:', body);

  // create a promise request to the controller
  rp(process.env.FORMULAE_SERVICE_URL + '/v1/formulae/?' + q)
  .then(function(response) {

    // parse data from the database:
    var formulae = JSON.parse(response).data;

    // loop through data array
    for (var i = 0; i < formulae.length; i++) {
      var formula = formulae[i];
      formula.action_props = body.action_props || {};

      // for each element in the array store the queueName of each element
      var queueName = formula.reaction_channel + '-channel';
      console.log('Queue Being Sent To:', queueName);
      sqs.getQueueUrl({ QueueName: queueName }, function(err, data) {
        // if there is an error getting queue name
        if (err) return console.log(err);

        // set url to the queue url retrieved
        var url = data.QueueUrl;

        // Sending a message
        var queue = new AWS.SQS({params: {QueueUrl: url}});

        // parse the inner reaction_fields for each element
        // formula.data[i].reaction_fields = JSON.parse(formula.data[i].reaction_fields);
        var body = JSON.stringify(formula);

        console.log('Message being sent:', body);

        // send the message to the queue
        queue.sendMessage({ MessageBody: body }, function (err, data) {
          if (err) return console.log(err);
        });
      });
    } // closes for loop

    return formulae;
  })
  .catch(function(err){
    console.log('err: ', err);
    return err;
  });
  done();
}

sqs.getQueueUrl({ QueueName: 'action' }, function(err, data) {
  if (err) return console.log(err);
  console.log(data.QueueUrl);
  var app = Consumer.create({
    queueUrl: data.QueueUrl,
    handleMessage: handleMessage,
    sqs: sqs
  });
  app.on('error', function(err) { console.log(err.message) });
  app.start();
});
