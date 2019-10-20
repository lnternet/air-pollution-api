const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const csv = require('csvtojson');

/*
    Aerosol Optical Depth (AOD) measurements parsed from CSV files.

    CSV files were provided by Space Apps Challenge. 

    AOD data can be generated from https://ladsweb.modaps.eosdis.nasa.gov/

    It takes anywhere from 5 minutes to 10+ days to generate data for region.


	- YYYY, MM, DD, Latitude, Longitude, AOD1, AOD3, STD3
        Where
        AOD1: Aerosol Optical Depth at 550 nm for nearest grid to ground location
        AOD3: Aerosol Optical Depth at 550 nm, averaged for 3x3 grids around ground location
        STD3: Standard Deviation in AOD3 

    - The Product Name:
        - MYD04 : This represents MODIS-AQUA satellite (Afternoon overpass)
        - MOD04 : This represents MODIS-TERRA satellite (Morning overpass)
*/

const files = [
    './AOD_API/US_LosAngeles-LongBeach-SantaAna_Anaheim.MOD04.csv',
    './AOD_API/US_LosAngeles-LongBeach-SantaAna_Glendora-Laurel.MOD04.csv',
    './AOD_API/US_LosAngeles-LongBeach-SantaAna_LosAngeles-N.Mai.MOD04.csv',
    './AOD_API/US_LosAngeles-LongBeach-SantaAna_Reseda.MOD04.csv',
    './AOD_API/US_LosAngeles-LongBeach-SantaAna_SantaClarita.MOD04.csv',
    './AOD_API/US_LosAngeles-LongBeach-SantaAna_SouthLongBeach.MOD04.csv'];


let data = []; // Parsed data from CSV files

async function start() {
    await loadAllFiles();
    startServer();
}

async function loadAllFiles() {
    for(let i = 0; i < files.length; i++) {
        let r = await loadData(files[i]);
        data.push(r);
    }
}

async function loadData(path) {
    return await csv({
        noheader: true, 
        headers: ['year','month','day','longitude','latitude','aod','aod3','std3']
    }).fromFile(path);
}

function getLatest() {
    let result = [];
    data.forEach(d => {
        result.push(d[d.length-1]);
    });
    return result;
}

function getHistorical(lat, long, n) {
    let result = [];
    data.forEach(d => {
        if (d[0].latitude == lat && d[0].longitude == long) {
            let arr = [];
            for(let i = 0; i < n; i++)
                arr.push(d[d.length-(n-i)]);
            result.push(arr)
        }
    });
    return result;
}

// Define types:
const typeDefs = gql`
  extend type Query {
    getLatest(lat: Float!, long: Float!) : [AOD_Measurement]
    getHistorical(lat: Float!, long: Float!, n: Int!) : [ [ AOD_Measurement ] ]
  }

  type AOD_Measurement {
    latitude: Float
    longitude: Float
    aod: Float
  }
`;

// Define resolvers
const resolvers = {
    Query: {
        getLatest(_, args) {
            // Completely ignore incoming latitude and longitude since 
            // there is no other data than Los Angeles anyway
            return getLatest();
        },
        getHistorical(_, args) {
            // Completely ignore incoming latitude and longitude since 
            // there is no other data than Los Angeles anyway
            return getHistorical(args.lat, args.long, args.n);
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

async function startServer() {
    // Start listening:
    server.listen({ port: 4002 }).then(({ url }) => {
        console.log(`Server ready at ${url}`);
    });
}

start();
