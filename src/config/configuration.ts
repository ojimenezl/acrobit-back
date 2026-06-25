export default () => ({
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  mongodbUri: process.env['MONGODB_URI'] ?? '',
  /** Una URL o varias separadas por coma (prod + preview). */
  corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200',
  firebaseProjectId: process.env['FIREBASE_PROJECT_ID'] ?? 'acrobit-app',
  /** JSON completo del service account (Vercel / producción). */
  firebaseServiceAccountJson:
    process.env['FIREBASE_SERVICE_ACCOUNT_JSON'] ?? '',
  /** Ruta al .json en local (no subir a Vercel). */
  firebaseCredentialsPath:
    process.env['GOOGLE_APPLICATION_CREDENTIALS'] ?? '',

  openaiApiKey: process.env['OPENAI_API_KEY'] ?? '',
  openaiModel: process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini',
  openaiMaxOutputTokens: parseInt(
    process.env['OPENAI_MAX_OUTPUT_TOKENS'] ?? '6000',
    10,
  ),
});
