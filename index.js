const amqp = require('amqplib');
(async () => {
    const channel = await getChannel();

    const queue = await channel.assertQueue("messages", {durable: false, autoDelete: true});

    channel.consume(queue.name, (msg) => {
        console.log("Message received:", msg.content.toString())
        channel.ack(msg)
    })
})();

async function getChannel() {
    const conn = await amqp.connect("amqp://rjsydvru:1s9kKNAhjd2mNWBUf3JIBSEA4R8ygAar@duckbill.rmq.cloudamqp.com/rjsydvru");
    return conn.createChannel();
}

// http://www.squaremobius.net/amqp.node/