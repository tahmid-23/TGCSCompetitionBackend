import dotenv from 'dotenv';
import express from 'express';

import { createTGCSPool } from './connection.js';
import { queryAllExperiences } from './queries/experience.js';

dotenv.config();

const pool = createTGCSPool(
  process.env.HOST,
  Number(process.env.DB_PORT) || 3306,
  process.env.PASSWORD
);

const app = express();
const serverPort = process.env.SERVER_PORT || 3000;

app.get('/experiences', async (_req, res) => {
  const connection = await pool.getConnection();
  const experiences = await queryAllExperiences(connection);
  res.send(experiences);
});

app.listen(serverPort);
