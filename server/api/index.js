import app from '../app.js';

export const config = { runtime: 'nodejs', regions: ['iad1'] };

export default function handler(req, res) {
  return app(req, res);
}