import swaggerAutogen from 'swagger-autogen';

const swagger = swaggerAutogen();
const doc = {
  info: {
    title: 'Kids Api',
    description: 'API Description',
  },
  host: "18.199.57.38:5000",
  schemes: ['http'],
  basePath: '/api',
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
    },
  },
  security: [{ bearerAuth: [] }], // Apply to all routes
};

const outputFile = './swagger.json'; // Path for the generated JSON file
const endpointsFiles = ['./app/routes/kid/kid.js','./app/routes/kid/auth.js']; // Path to the file that contains your routes

// This will generate a swagger.json file and then you can start your application
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  import('./app/config/index.js'); // Your entry file that starts the server
});