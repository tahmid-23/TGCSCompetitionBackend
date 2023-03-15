import tf, { mod } from '@tensorflow/tfjs-node';
import { loadSavedModel } from '@tensorflow/tfjs-node/dist/saved_model.js';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Response } from 'express';
import { PoolConnection } from 'mysql2/promise.js';
import fetch from 'node-fetch';
import { HTMLElement, NodeType, parse } from 'node-html-parser';

import { createTGCSPool } from './connection.js';
import { queryAllExperiences } from './queries/experience.js';
import { queryAllFeedbackIds } from './queries/feedback.js';
import { queryAllSponsors } from './queries/sponsor.js';
import { addScraper, insert, remove, update } from './queries/update.js';


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

export interface ScraperData {
  experienceId: number;
  updateUrl: string;
  targetText: string;
}

app.post('/scraper', async (req: CustomRequest<ScraperData>, res) => {
  if (!req.body.experienceId || !req.body.updateUrl || !req.body.targetText) {
    res.sendStatus(400);
    return;
  }

  const updateHtmlResponse = await fetch(req.body.updateUrl);
  const updateHtml = await updateHtmlResponse.text();
  
  const documentRoot = parse(updateHtml);
  const stack: HTMLElement[] = [documentRoot];
  let match: HTMLElement | undefined = undefined;
  while (stack.length !== 0) {
    const top = stack.pop();
    if (!top) {
      break;
    }
    if (top.innerText === req.body.targetText) {
      match = top;
      break;
    }

    for (const child of top.childNodes) {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        stack.push(child as HTMLElement);
      }
    }
  }

  if (!match) {
    res.sendStatus(400);
    return;
  }

  const path: number[] = [];
  let currentElement: HTMLElement;
  for (currentElement = match; currentElement.parentNode && currentElement.id; currentElement = currentElement.parentNode) {
    path.push(currentElement.parentNode.childNodes.indexOf(currentElement));
  }
  path.reverse();

  await execute(res, async (connection) => {
    await connection.beginTransaction();
    await addScraper(connection, req.body.experienceId, currentElement.id, path);
    await connection.commit();

    res.sendStatus(200);
  });
});

function pretentiousPhi(score: number) {
  return 1 / (1 + Math.exp(-2 * (score - 5)))
}

const NUM_CATEGORIES = 18;
const ROOT_NUMBER = 2;
function normalizeTGCSVec(tgcs_vec: number[]) {
    return [Math.pow(pretentiousPhi(tgcs_vec[0]), 1 / ROOT_NUMBER),
            Math.pow(pretentiousPhi(tgcs_vec[1]), 1 / ROOT_NUMBER),
            Math.pow(pretentiousPhi(tgcs_vec[2]), 1 / ROOT_NUMBER),
            Math.pow(pretentiousPhi(tgcs_vec[3]), 1 / ROOT_NUMBER),
            Math.pow(tgcs_vec[4], 1 / ROOT_NUMBER) / Math.pow(NUM_CATEGORIES, 1 / (2 * ROOT_NUMBER))]
}

await tf.ready();
const model = await loadSavedModel('tgcs_model/');
console.log("Loaded TGCS model.");

interface RecommendationData {
  preferenceVec: number[];
}

const categories = ['TECHNOLOGY', 'SCIENCE', 'BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATH', 'ENGINEERING', 'BUSINESS', 'MEDICAL', 'CULINARY', 'MUSIC', 'ATHLETICS', 'ART', 'THEATER', 'DANCE', 'LANGUAGE ARTS', 'SPELLING', 'GEOGRAPHY', 'HISTORY', 'FOREIGN LANGUAGE', 'CHESS', 'RESEARCH', 'OTHER'];
app.post('/recommendations', (req: CustomRequest<RecommendationData>, res) => {
  execute(res, async (connection) => {
    await connection.beginTransaction();
    const experiences = await queryAllExperiences(connection);
    const inputs: number[][] = [];
    for (const experience of experiences) {
      const categoryRecord = experience['categories'] as Record<string, object>[];
      let prefNorm = 0;
      for (let i = 0; i < req.body.preferenceVec.length; ++i) {
        const hasPreference = req.body.preferenceVec[i];
        const hasActual = categoryRecord.find(categoryObject => String(categoryObject['category']) == categories[i]);
        if (!hasActual || !hasPreference) {
          prefNorm += 0.01;
        } else {
          prefNorm += 1;
        }
      }

      inputs.push(normalizeTGCSVec([Number(experience['score_time']), Number(experience['score_difficulty']), Number(experience['score_benefit']), Number(experience['score_mgmt']), prefNorm]));
    }

    const resultTensor = model.predict(tf.tensor(inputs)) as tf.Tensor;
    const result = await resultTensor.array() as number[][];
    console.log(experiences.map((exp, i) => [String(exp['name']), result[i][0]] as [string, number]).sort((groupA, groupB) => groupB[1] - groupA[1]));
    res.sendStatus(200);
    await connection.commit();
  });
});

app.listen(serverPort, '0.0.0.0', () => {
  console.log('Backend server started.');
});
