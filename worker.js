var rp = require('request-promise');
var Consumer = require('sqs-consumer');
var AWS = require('aws-sdk');
require('dotenv').config({ silent: true });
AWS.config.update({region: process.env.AWS_REGION});

var sqs = new AWS.SQS();

// TODO: Handle multiple reactions for one action

sqs.getQueueUrl({ QueueName: 'action' }, function(err, data) {
  if (err) return console.log(err);
  var app = Consumer.create({
    queueUrl: data.QueueUrl,
    handleMessage: function(data, done) {
      body = JSON.parse(data.Body);

      //a query that will find the formula given a action
      var q = 'action_name=' + body.action_name + '&action_channel=' + body.action_channel + '&user_id=' + body.user_id;
      console.log('Recieved from action:', body);

      // create a promise request to the controller
      rp(process.env.FORMULAE_SERVICE_URL + '/v1/formulae/?' + q)
      .then(function(data) {

        // parse data from the database:
        var formula = JSON.parse(data);

        // loop through data array
        for (var i = 0; i < data.length; i++) {

          // for each element in the array store the queueName of each element
          var queueName = formula.data[i].reaction_channel + '-channel';
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
            var body = JSON.stringify(formula.data[i]);
            console.log('Message being sent:', body);

            // send the message to the queue
            queue.sendMessage({ MessageBody: body }, function (err, data) {
              if (err) return console.log(err);
            });
          });
        } // closes for loop
        // get the queue url
        return formula;
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
