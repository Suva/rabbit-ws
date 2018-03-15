const amqp = require('amqplib');
var generateName = require('sillyname');

(async () => {
    const channel = await getChannel();

    const exchange = await channel.assertExchange("Vihula");
    const database = {}

    // Send email that we are not your friends :(
    const terroristQueue = await channel.assertQueue("", {durable: false, autoDelete: true});
    channel.bindQueue(terroristQueue.name, exchange.exchange, "IsTerrorist");
    channel.consume(terroristQueue.name, (message) => {
        let terroristCheck = message.content.toString();
        let name = terroristCheck.name
        if(database[terroristCheck]) database[name].isTerrorist = terroristCheck.isTerrorist;

        console.log("Terrorist check received: ", database[name])
    })

    // Decision service
    const queue = await channel.assertQueue("", {durable: false, autoDelete: true});
    channel.bindQueue(queue.name, exchange.exchange, "LoanApplication");
    channel.consume(queue.name, (msg) => {
        console.log("Application received:", msg.content.toString())
        try {
            const loanApplication = JSON.parse(msg.content.toString())
            database[loanApplication.name] = { loanApplication };

            if(loanApplication.loanSum < 1000) {
                channel.publish("Vihula", "LoanRejected", Buffer.from(loanApplication.name))
            }

            // LoanApproved

            channel.ack(msg)
        } catch (err) {
            // IGNORE ALL ERRORS O_O
        }
    })

    //channel.publish("Vihula", "message", Buffer.from("Hello from Jaan!"), { contentType: "text/plain"})
    setInterval(() =>
        channel.publish("Vihula", "LoanApplication", Buffer.from(JSON.stringify(
            {
                loanSum: Math.floor(Math.random() * 3000),
                loanPeriod: Math.floor(Math.random() * 12 + 1),
                name: generateName()
            }
        )), { contentType: "text/plain"}),
        10000
    )

    // Send email that we are not your friends :(
    const rejectedQueue = await channel.assertQueue("", {durable: false, autoDelete: true});
    channel.bindQueue(queue.name, exchange.exchange, "LoanRejected");
    channel.consume(rejectedQueue.name, (message) => {
        console.log("Loan was rejected: ", message.content.toString())
    })

    // Send message about successful loan
    const contractQueue = await channel.assertQueue("", {durable: false, autoDelete: true});
    channel.bindQueue(queue.name, exchange.exchange, "LoanContract");
    channel.consume(contractQueue.name, (message) => {
        console.log("Loan contract: ", message.content.toString())
    })

    const approvedQueue = await channel.assertQueue("", {durable: false, autoDelete: true});
    channel.bindQueue(queue.name, exchange.exchange, "LoanApproved");
    channel.consume(rejectedQueue.name, (message) => {
        const name = message.content.toString();
        const application = database[name];

        console.log("Loan was approved: ", message.content.toString(), application)

        if(name && application) {
            channel.publish("Vihula", "LoanContract", Buffer.from(JSON.stringify(
                {
                    title: "Loan Contract for " + name,
                    loanSum: application.loanSum + " EUROS",
                    loanPeriod: application.loanPeriod + " month",
                }
            )), { contentType: "text/plain"})
        }
    })

})();

async function getChannel() {
    const conn = await amqp.connect("amqp://rjsydvru:1s9kKNAhjd2mNWBUf3JIBSEA4R8ygAar@duckbill.rmq.cloudamqp.com/rjsydvru");
    return conn.createChannel();
}

// http://www.squaremobius.net/amqp.node/