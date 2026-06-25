/** Punto de entrada Vercel — usa el Nest compilado en dist/ */
module.exports = async (req, res) => {
  const { default: handler } = require('../dist/serverless.js');
  return handler(req, res);
};
