const { ApolloServer } = require("apollo-server");
const { ApolloGateway } = require("@apollo/gateway");

// Define list of APIs that will be joined:
const gateway = new ApolloGateway({
    serviceList: [
      { name: "NASA_API", url: "http://localhost:4001/graphql" }
    ]
  });

async function startup() {
  const { schema, executor } = await gateway.load();

  const server = new ApolloServer({ schema, executor });

  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
      console.log(`Gateway ready at ${url}`);
  });
}

// * When starting all projects in parallel with one CLI command delay the startup of gateway a bit:
setTimeout(startup, 10000);