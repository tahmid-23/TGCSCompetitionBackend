import express from 'express';
import dotenv from 'dotenv';

import { createTGCSConnection } from './connection.js';
import { queryAllExperiences } from './queries/experience.js';

dotenv.config();

const connection = await createTGCSConnection(
  process.env.HOST,
  Number(process.env.DB_PORT) || 3306,
  process.env.PASSWORD
);

const app = express();
const serverPort = process.env.SERVER_PORT || 3000;

app.get('/experiences', async (req, res) => {
  const experiences = await queryAllExperiences(connection);
  res.send(experiences);
});

app.listen(serverPort, () => {
  console.log(`server started at http://localhost:${serverPort}`);
});
