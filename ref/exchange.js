const amqp = require('amqplib');
(async () => {
    const channel = await getChannel();

    const queue = await channel.assertQueue("", {durable: false, autoDelete: true});
    const exchange = await channel.assertExchange("EventsExchange");

    channel.bindQueue(queue.name, exchange.exchange, "event")

    channel.consume(queue.name, (msg) => {
        console.log(msg.content.toString())
        channel.ack(msg)
    })
})();

async function getChannel() {
    const conn = await amqp.connect("amqp://rjsydvru:1s9kKNAhjd2mNWBUf3JIBSEA4R8ygAar@duckbill.rmq.cloudamqp.com/rjsydvru");
    return conn.createChannel();
}
