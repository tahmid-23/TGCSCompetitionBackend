import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

import { createTGCSPool } from './connection.js';
import { queryAllExperiences } from './queries/experience.js';
import { queryAllSponsors } from './queries/sponsor.js';
import { insert, remove, update } from './queries/update.js';

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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

export interface CustomRequest<T> extends Express.Request {
  body: T;
}

export interface InsertData {
  tableName: string;
  data: Record<string, object>;
}

app.post('/insert', async (req: CustomRequest<InsertData>, res) => {
  if (!req.body.tableName || !req.body.data) {
    return;
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  insert(connection, req.body.tableName, req.body.data);

  connection.commit();

  res.sendStatus(200);
});

export interface UpdateData {
  tableName: string;
  rowId: number;
  data: Record<string, object>;
}

app.post('/update', async (req: CustomRequest<UpdateData>, res) => {
  if (!req.body.tableName || !req.body.rowId || !req.body.data) {
    return;
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  update(connection, req.body.tableName, req.body.rowId, req.body.data);

  connection.commit();

  res.sendStatus(200);
});

export interface RemoveData {
  tableName: string;
  rowId: number;
}

app.post('/remove', async (req: CustomRequest<RemoveData>, res) => {
  if (!req.body.tableName || !req.body.rowId) {
    return;
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  remove(connection, req.body.tableName, req.body.rowId);

  connection.commit();

  res.sendStatus(200);
});

app.listen(serverPort);
