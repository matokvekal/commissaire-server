import swaggerAutogen from 'swagger-autogen';

const swagger = swaggerAutogen();
const doc = {
  info: {
    title: 'Kids & Parents API',
    description: 'APIs for managing kids and parents data and interactions.',
  },
  host: "18.199.57.38:5000",
  schemes: ['http'],
  basePath: '/api',
  tags: [
    {
      name: 'Kid APIs',
      description: 'Endpoints for managing kids data and interactions',
    },
    {
      name: 'Parent APIs',
      description: 'Endpoints for parent user management and interactions',
    },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
    },
  },
  security: [{ bearerAuth: [] }], // Apply security to all routes
};

const outputFile = './swagger.json'; // Path for the generated JSON file
const endpointsFiles = [
  './app/routes/kid/kid.js',      // Kid-specific routes
  './app/routes/kid/auth.js',     // Kid authentication routes
  './app/routes/parent/parent.js', // Parent-specific routes
  './app/routes/parent/auth.js'    // Parent authentication routes
];

// Generate swagger.json and start the server
swagger(outputFile, endpointsFiles, doc).then(() => {
  import('./app/config/index.js'); // Entry file for server startup
});
