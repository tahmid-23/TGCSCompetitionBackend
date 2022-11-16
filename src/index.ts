import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { createTGCSPool } from './connection.js';
import { queryAllExperiences } from './queries/experience.js';
import { queryAllSponsors } from './queries/sponsor.js';
import { insert } from './queries/update.js';

dotenv.config();

const pool = createTGCSPool(
  process.env.HOST,
  Number(process.env.DB_PORT) || 3306,
  process.env.PASSWORD
);

const app = express();
const serverPort = process.env.SERVER_PORT || 3000;

app.use(
  cors({
    origin: ['http://192.168.1.9:3000']
  })
);

app.get('/experiences', async (_req, res) => {
  const connection = await pool.getConnection();
  const experiences = await queryAllExperiences(connection);
  res.json(experiences);
});

app.get('/sponsors', async (_req, res) => {
  const connection = await pool.getConnection();
  const sponsors = await queryAllSponsors(connection);
  res.json(sponsors);
});

app.post('/insert', async (_req, res) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  connection.commit();

  res.sendStatus(200);
});

app.listen(serverPort);
