import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const config = `window.CONFIG = {
  API_BASE_URL: '${process.env.API_BASE_URL}',
  API_USERNAME: '${process.env.API_USERNAME}',
  API_PASSWORD: '${process.env.API_PASSWORD}'
};`;

fs.writeFileSync('config.js', config);
console.log('config.js generated successfully');