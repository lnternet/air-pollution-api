const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

/*

    API integrated with NASA data.

*/

// Define types:
const typeDefs = gql`
  extend type Query {
    getNumber: Int
  }
`;

// Define resolvers
const resolvers = {
    Query: {
        getNumber(_, args) {
            return 42;
        }
    }
  };

// Create server:
const server = new ApolloServer({
    schema: buildFederatedSchema([
        {
            typeDefs,
            resolvers
        }
    ])
});

// Start listening:
server.listen({ port: 4001 }).then(({ url }) => {
    console.log(`Server ready at ${url}`);
});