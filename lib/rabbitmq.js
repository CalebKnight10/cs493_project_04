const amqp = require('amqplib/callback_api');

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || 5672;

const QueueName = {
  PHOTOS: 'photos'
}

function sendToQueue(queueName, data, timeout = 5000) {
  console.log(`Connecting to amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`)
  amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (err, conn) => {
    console.log(`Connected to rabbitmq://${RABBITMQ_HOST}:${RABBITMQ_PORT}, status: ${err ? 'error' : 'success'}`)
    if (err) {
      throw err;
    }
    conn.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      channel.assertQueue(queueName, {
        durable: true
      });

      channel.sendToQueue(queueName, Buffer.from(data));
      console.log(`Message sent to queue: ${data}`);
    });

    setTimeout(() => {
      console.log(`Timeout connection closed`)
      conn.close();
    }, timeout)
  })
}

exports.sendToQueue = sendToQueue;


async function receiveFromQueue(queueName, callback) {
  console.log(`Connecting to amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`)
  await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`, (err, conn) => {
    console.log(`Connected to rabbitmq://${RABBITMQ_HOST}:${RABBITMQ_PORT}, status: ${err ? 'error' : 'success'}`)
    if (err) {
      throw err;
    }
    conn.createChannel((err, channel) => {
      if (err) {
        throw err;
      }

      channel.assertQueue(queueName, {
        durable: true
      });

      channel.consume(queueName, (msg) => {
        msg = msg.content.toString();
        console.log(`Message received from queue: ${msg.toString()}`);
        callback(msg.toString());
      }, {
        noAck: true
      });
    });
  });
}

exports.receiveFromQueue = receiveFromQueue;

exports.QueueName = QueueName;