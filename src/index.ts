import cors from 'cors';
import dotenv from 'dotenv';
import express, { Response } from 'express';
import { PoolConnection } from 'mysql2/promise.js';

import { createTGCSPool } from './connection.js';
import { queryAllExperiences } from './queries/experience.js';
import { queryAllFeedbackIds } from './queries/feedback.js';
import { queryAllSponsors } from './queries/sponsor.js';
import { insert, remove, update } from './queries/update.js';

dotenv.config();

const pool = createTGCSPool(
  process.env.HOST,
  Number(process.env.DB_PORT) || 3306,
  process.env.PASSWORD
);

const app = express();
const serverPort = Number(process.env.SERVER_PORT) || 3000;

app.use(
  cors((req, callback) => {
    let corsOptions;
    if (req.ip.startsWith('192.168') || req.ip === '127.0.0.1') {
      corsOptions = { origin: true };
    } else {
      corsOptions = { origin: false };
    }

    callback(null, corsOptions);
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function execute<
  T,
  ResBody = unknown,
  Locals extends Record<string, unknown> = Record<string, unknown>
>(
  res: Response<ResBody, Locals>,
  callback: (connection: PoolConnection) => Promise<T> | T
) {
  let connection: PoolConnection;
  try {
    connection = await pool.getConnection();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
    return;
  }

  try {
    return await callback(connection);
  } catch (err) {
    console.error(err);
    res.sendStatus(400);
  } finally {
    connection.release();
  }
}

app.get('/experiences', async (_req, res) => {
  await execute(res, async (connection) => {
    const experiences = await queryAllExperiences(connection);
    res.json(experiences);
  });
});

app.get('/sponsors', async (_req, res) => {
  await execute(res, async (connection) => {
    const sponsors = await queryAllSponsors(connection);
    res.json(sponsors);
  });
});

app.get('/feedback', async (_req, res) => {
  await execute(res, async (connection) => {
    const feedbackIds = await queryAllFeedbackIds(connection);
    res.json(feedbackIds);
  });
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
    res.sendStatus(400);
    return;
  }

  await execute(res, async (connection) => {
    await connection.beginTransaction();
    const rowId = await insert(connection, req.body.tableName, req.body.data);
    await connection.commit();

    res.json(rowId);
  });
});

export interface UpdateData {
  tableName: string;
  rowId: number;
  data: Record<string, object>;
}

app.post('/update', async (req: CustomRequest<UpdateData>, res) => {
  if (!req.body.tableName || !req.body.rowId || !req.body.data) {
    res.sendStatus(400);
    return;
  }

  await execute(res, async (connection) => {
    await connection.beginTransaction();
    await update(connection, req.body.tableName, req.body.rowId, req.body.data);
    await connection.commit();

    res.sendStatus(200);
  });
});

export interface RemoveData {
  tableName: string;
  rowId: number;
}

app.post('/remove', async (req: CustomRequest<RemoveData>, res) => {
  if (!req.body.tableName || !req.body.rowId) {
    res.sendStatus(400);
    return;
  }

  await execute(res, async (connection) => {
    await connection.beginTransaction();
    await remove(connection, req.body.tableName, req.body.rowId);
    await connection.commit();

    res.sendStatus(200);
  });
});

app.listen(serverPort, '0.0.0.0', () => {
  console.log('Backend server started.');
});
