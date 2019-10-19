const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const https = require('https');

/*

    API integrated with data from Groud Stations taken from WAQI API.

    Documentation can be found here: http://aqicn.org/api/  

*/

// Define types:
const typeDefs = gql`
  extend type Query {
    getStations(minLat: Float!, minLong: Float!, maxLat: Float!, maxLong: Float!): [ GroundMeasurementStation ]
    getMeasurement(lat: Float!, long: Float!): GroundMeasurement
  }

  type GroundMeasurement {
    groundStation: GroundMeasurementStation
    biggestPollutant: String
    measurements: [ Measurement ]
  }

  type GroundMeasurementStation {
    latitude: Float
    longitude: Float
    uid: Int
    aqi: String
    name: String
    time: String
  }

  type Measurement {
      type: String
      value: Float
      yellowZone: Float
      redZone: Float
  }
`;

// Define resolvers
const resolvers = {
    Query: {
        getStations: async (_, args) => {
            const r = await requestStationsFromOpenAPI(args.minLat, args.minLong, args.maxLat, args.maxLong);
            if (r.status == 'ok') {
                let mappedResponse = [];
                r.data.forEach(el => {
                    mappedResponse.push({
                        latitude: el.lat,
                        longitude: el.lon,
                        uid: el.uid,
                        aqi: el.aqi,
                        name: el.station.name,
                        time: el.station.time
                    });
                });
                return mappedResponse;
            }
            
            return null;
        },
        getMeasurement: async (_, args) => {
            const r = await requestMeasurementsFromOpenAPI(args.lat, args.long);
            if (r.status == 'ok') {
                let mappedMeasurements = [];
                Object.keys(r.data.iaqi).forEach(key => {
                    if(shouldUseMeasurement(key))
                        mappedMeasurements.push({
                            type: getMeasurementTypeByKey(key),
                            value: r.data.iaqi[key].v
                        });
                });

                return {
                    groundStation: {
                        latitude: r.data.city.geo[0],
                        longitude: r.data.city.geo[1],
                        name: r.data.city.name,
                        aqi: r.data.aqi
                    },
                    biggestPollutant: getMeasurementTypeByKey(r.data.dominentpol),
                    measurements: mappedMeasurements
                };
            }
            
            return null;
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

async function requestStationsFromOpenAPI(minLat, minLong, maxLat, maxLong) {
    return await new Promise(function(resolve, reject) {
        https.get(`https://api.waqi.info/map/bounds/?token=aa5209e068f86a4cae5ee4f418c36e36ca46ca6f&latlng=${minLat},${minLong},${maxLat},${maxLong}`, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on("error", (err) => { 
            console.log(err);
            reject(); });
    });
}

async function requestMeasurementsFromOpenAPI(lat, long) {
    return await new Promise(function(resolve, reject) {
        https.get(`https://api.waqi.info/feed/geo:${lat};${long}/?token=aa5209e068f86a4cae5ee4f418c36e36ca46ca6f`, (resp) => {
            let data = '';
            resp.on('data', (chunk) => { data += chunk; });
            resp.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on("error", (err) => { 
            console.log(err);
            reject(); });
    });
}

function shouldUseMeasurement(key) {
    return key == 'p' ||
        key == 't' ||
        key == 'o3' ||
        key == 'pm25' ||
        key == 'pm10' ||
        key == 'so2' ||
        key == 'no2' ||
        key == 'co';
}

function getMeasurementTypeByKey(key) {
    switch(key) {
        case 'p':
            return 'Atmospheric pressure';
        case 't':
                return 'Temperature';
        case 'o3':
                return 'Ozone';
        case 'pm25':
            return 'PM2.5';
        case 'pm10':
            return 'PM10';
        case 'so2':
            return 'Sulfur dioxide';
        case 'no2':
            return 'Nitrogen dioxide';
        case 'co':
            return 'Carbon monoxide';
        default:
            return 'Unknown';
   }
}