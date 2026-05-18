const swaggerOptions = {
  openapi: "3.0.0",
  info: {
    title: "Minha API",
    version: "1.0.0",
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },

  security: [
    {
      bearerAuth: [],
    },
  ],
};

export default swaggerOptions;