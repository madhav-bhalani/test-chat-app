export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',

  port: Number.parseInt(process.env.PORT || '6090', 10),

  serverApiKey: process.env.SERVER_API_KEY,

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secretKey: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    issuer: process.env.JWT_ISSUER || 'auth-service',
    audience: process.env.JWT_AUDIENCE || 'api-service',
    accessSecret: process.env.JWT_ACCESS_SECRET_KEY,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET_KEY,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '1d',
    tempTokenSecret: process.env.JWT_TEMP_TOKEN_SECRET_KEY,
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
  },

  observe: {
    appKey: process.env.OBSERVE_APP_KEY,
    appSecret: process.env.OBSERVE_APP_SECRET,
  },
});
