const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My API',
    description: 'API Description',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './path/to/swagger_output.json'; // Path for the generated JSON file
const endpointsFiles = ['./path/to/your_routes_file.js']; // Path to the file that contains your routes

// This will generate a swagger.json file and then you can start your application
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./index.js'); // Your entry file that starts the server
});
