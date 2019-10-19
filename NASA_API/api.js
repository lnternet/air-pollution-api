const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

/*

    API integrated with NASA data.

*/

// Define types:
const typeDefs = gql`
  extend type Query {
    getNumber: Int
    getFakeData: GroundMeasurement
  }

  type GroundMeasurement {
    groundStation: GroundStation
    measurements: AirPollutants
    weather: Weather
  }

  type GroundStation {
    name: String
    lat: Float
    long: Float 
  }

  type AirPollutants {
    o3: Measurement
    pm25: Measurement
    pm10: Measurement
    so2: Measurement
    w: Measurement
    wg: Measurement
  }

  type Measurement {
      value: Float
      yellowZone: Float
      redZone: Float
  }

  type Weather {
      t: Float
      wind: Float
      windDirection: Float
  }
`;

// Define resolvers
const resolvers = {
    Query: {
        getNumber(_, args) {
            return 42;
        },
        getFakeData(_, args) {
            return {
                groundStation: {
                    name: 'Fake Ground Station',
                    lat: 10.4,
                    long: 56.1
                },
                measurements: {
                    o3: {
                        value: 5,
                        yellowZone: 3,
                        redZone: 7
                    },
                    pm25: {
                        value: 3,
                        yellowZone: 7,
                        redZone: 20
                    },
                    pm10: {
                        value: 1,
                        yellowZone: 10,
                        redZone: 100
                    },
                    so2: {
                        value: 0.01,
                        yellowZone: 0.4,
                        redZone: 1.2
                    }
                },
                weather: {
                    t: 10.4,
                    wind: 7,
                    windDirection: 36
                }
            }
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