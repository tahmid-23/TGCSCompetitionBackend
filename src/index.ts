import cors from 'cors';
import express, { Request, Response } from 'express';
import { PoolConnection } from 'mysql2/promise.js';
import fetch from 'node-fetch';
import { HTMLElement, NodeType, parse } from 'node-html-parser';

import { createTGCSPool } from './connection.js';
import { queryAllExperiences, queryExperience } from './queries/experience.js';
import { queryAllFeedbackIds } from './queries/feedback.js';
import { queryAllSponsors } from './queries/sponsor.js';
import { addScraper, insert, remove, update } from './queries/update.js';
import session from 'express-session';
import {
  Login,
  createLogin,
  isAdmin,
  queryHash,
  removeLogin,
  updateExpirationTime
} from './queries/password.js';

import bcrypt from 'bcrypt';

import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import * as tf from '@tensorflow/tfjs-node';

import cookieParser from 'cookie-parser';
import { CorsOptions } from 'cors';
import { readFileSync } from 'fs';
import { Config } from './config.js';

const config: Config = JSON.parse(readFileSync('config.json', 'utf8'));

const pool = createTGCSPool(config.sql);

const app = express();
const serverPort = config.backend.port;

app.use(
  cors((req, callback) => {
    callback(null, {
      origin: true,
      credentials: true
    });
  })
);

const sessionSecret = config.backend.secret;
if (!sessionSecret) {
  throw Error('Session secret undefined');
}

declare module 'express-session' {
  interface SessionData {
    email: string;
    admin: boolean;
    hasAccess: boolean;
  }
}

const loginSession: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none'
  }
};

if (app.get('env') === 'production' && loginSession.cookie) {
  loginSession.cookie.secure = true;
}

app.use(session(loginSession));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.set('trust proxy', true);

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

export interface CustomRequest<T> extends Request {
  body: T;
}

interface GoogleLoginData {
  credential: string;
  //g_csrf_token: string;
}

const authClient = new OAuth2Client(config.backend.googleClientId);
app.post('/login', async (req: Request, res) => {
  // const csrfCookie = req.cookies['g_csrf_token'];
  // if (!csrfCookie) {
  //   res.sendStatus(400);
  //   return;
  // }
  // if (!req.body.g_csrf_token) {
  //   res.sendStatus(400);
  //   return;
  // }
  // if (req.body.g_csrf_token != csrfCookie) {
  //   res.sendStatus(400);
  //   return;
  // }

  const ticket = await authClient.verifyIdToken({
    idToken: req.body.credential,
    audience: config.backend.googleClientId
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    res.sendStatus(401);
    return;
  }

  const email = payload.email;
  await execute(res, async (connection) => {
    if (await isAdmin(connection, email)) {
      req.session.email = email;
      req.session.admin = true;
      req.session.hasAccess = true;

      res.send({
        admin: true
      });
    } else if (!email.endsWith('giftedchildsociety.org')) {
      res.sendStatus(401);
    } else {
      req.session.email = email;
      req.session.admin = false;
      req.session.hasAccess = false;

      res.send({
        admin: false
      });
    }
  });
});

interface CreateUserData {
  email: string;
  token: string;
}

app.use(async (req, res, next) => {
  if (!req.session.email) {
    res.sendStatus(401);
  } else {
    next();
  }
});

app.post('/create-user', async (req: CustomRequest<CreateUserData>, res) => {
  if (!req.session.admin) {
    res.sendStatus(403);
    return;
  }

  const hash = await bcrypt.hash(req.body.token, 10);
  await execute(res, async (connection) => {
    await createLogin(connection, req.body.email, hash).then(() => {
      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: true,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.password
        }
      });

      const mailOptions = {
        from: 'tgcs_noreply@rambler.ru',
        to: req.body.email,
        subject: '[NO_REPLY] TGCS Competition Database Login Token',
        text: `This is a confirmation email for your purchase to access the TGCS Competition Database. Please go to {url}/login and log in to your gifted.org email address. You will be prompted to enter a token. Your login token is ${req.body.token}. You will have access to the database for 24 hours from the first time you log in. After this period is over, you may purchase further access, and you will receive a new token. Please send any questions or concerns to admin@gifted.org. Replies to this email will not be processed.`
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    });

    res.sendStatus(200);
  });
});

interface LoginData {
  token: string;
}

app.post('/token', async (req: CustomRequest<LoginData>, res) => {
  await execute(res, async (connection) => {
    const logins = await queryHash(connection, req.session.email!);
    if (logins.length == 0) {
      res.sendStatus(401);
      return;
    }

    const innerPromises = logins.map((login) =>
      bcrypt
        .compare(req.body.token, login.hash)
        .then((areEqual) => areEqual && login)
    );
    const outerPromises: Promise<Login | undefined>[] = innerPromises.map(
      (promise) => {
        return new Promise<Login>((resolve, reject) => {
          promise.then((login) => login && resolve(login), reject);
        });
      }
    );
    outerPromises.push(Promise.race(outerPromises).then(() => undefined));

    const login = await Promise.race(outerPromises);
    if (!login) {
      res.sendStatus(401);
      return;
    }

    if (login.expiration) {
      if (Date.now() >= login.expiration) {
        res.sendStatus(401);
        removeLogin(connection, req.session.email!).catch(console.error);

        return;
      }

      req.session.cookie.maxAge = login.expiration - Date.now();
    } else if (!req.session.admin) {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
      updateExpirationTime(
        connection,
        req.session.email!,
        Date.now() + 24 * 60 * 60 * 1000
      ).catch(console.error);
    }

    req.session.hasAccess = true;
    res.sendStatus(200);
  });
});

app.use(async (req, res, next) => {
  if (!req.session.admin && !req.session.hasAccess) {
    res.sendStatus(401);
  } else {
    next();
  }
});

app.get('/experiences', async (_req, res) => {
  await execute(res, async (connection) => {
    const experiences = await queryAllExperiences(connection);
    res.json(experiences);
  });
});

app.get('/experience/:experienceId', async (req, res) => {
  await execute(res, async (connection) => {
    const experience = await queryExperience(
      connection,
      Number(req.params.experienceId)
    );
    res.json(experience);
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
  rowName: string;
  rowId: number;
}

app.post('/remove', async (req: CustomRequest<RemoveData>, res) => {
  if (!req.body.tableName || !req.body.rowName || !req.body.rowId) {
    res.sendStatus(400);
    return;
  }

  await execute(res, async (connection) => {
    await connection.beginTransaction();
    await remove(
      connection,
      req.body.tableName,
      req.body.rowName,
      req.body.rowId
    );
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
  for (
    currentElement = match;
    currentElement.parentNode && currentElement.id;
    currentElement = currentElement.parentNode
  ) {
    path.push(currentElement.parentNode.childNodes.indexOf(currentElement));
  }
  path.reverse();

  await execute(res, async (connection) => {
    await connection.beginTransaction();
    await addScraper(
      connection,
      req.body.experienceId,
      currentElement.id,
      path
    );
    await connection.commit();

    res.sendStatus(200);
  });
});

function pretentiousPhi(score: number) {
  return 1 / (1 + Math.exp(-2 * (score - 5)));
}

const NUM_CATEGORIES = 18;
const ROOT_NUMBER = 2;
function normalizeTGCSVec(tgcs_vec: number[]) {
  return [
    Math.pow(pretentiousPhi(tgcs_vec[0]), 1 / ROOT_NUMBER),
    Math.pow(pretentiousPhi(tgcs_vec[1]), 1 / ROOT_NUMBER),
    Math.pow(pretentiousPhi(tgcs_vec[2]), 1 / ROOT_NUMBER),
    Math.pow(pretentiousPhi(tgcs_vec[3]), 1 / ROOT_NUMBER),
    Math.pow(tgcs_vec[4], 1 / (3 * ROOT_NUMBER)) /
      Math.pow(NUM_CATEGORIES, 1 / (3 * ROOT_NUMBER))
  ];
}

await tf.ready();
const model = await tf.loadLayersModel('file://tgcs_model/model.json');
console.log('Loaded TGCS model.');

interface RecommendationData {
  preferenceVec: number[];
}

const categories = [
  'TECHNOLOGY',
  'SCIENCE',
  'BIOLOGY',
  'CHEMISTRY',
  'PHYSICS',
  'MATH',
  'ENGINEERING',
  'BUSINESS',
  'MEDICAL',
  'CULINARY',
  'MUSIC',
  'ATHLETICS',
  'ART',
  'THEATER',
  'DANCE',
  'LANGUAGE ARTS',
  'SPELLING',
  'GEOGRAPHY',
  'HISTORY',
  'FOREIGN LANGUAGE',
  'CHESS',
  'RESEARCH',
  'OTHER'
];
app.post('/recommendations', (req: CustomRequest<RecommendationData>, res) => {
  execute(res, async (connection) => {
    await connection.beginTransaction();
    const experiences = await queryAllExperiences(connection);
    const inputs: number[][] = [];
    for (const experience of experiences) {
      const categoryRecord = experience['categories'] as Record<
        string,
        object
      >[];
      let prefNorm = 0;
      for (let i = 0; i < req.body.preferenceVec.length; ++i) {
        const hasPreference = req.body.preferenceVec[i];
        const hasActual = categoryRecord.find(
          (categoryObject) =>
            String(categoryObject['category']) == categories[i]
        );
        if (!hasActual || !hasPreference) {
          prefNorm += 0.01;
        } else {
          prefNorm += 1;
        }
      }

      inputs.push(
        normalizeTGCSVec([
          Number(experience['score_time']),
          Number(experience['score_difficulty']),
          Number(experience['score_benefit']),
          Number(experience['score_mgmt']),
          prefNorm
        ])
      );
    }

    const resultTensor = model.predict(tf.tensor(inputs)) as tf.Tensor;
    const result = (await resultTensor.array()) as number[][];
    await connection.commit();

    const response: Record<number, number> = {};
    for (let i = 0; i < experiences.length; ++i) {
      const experience = experiences[i];
      response[experience['experience_id'] as unknown as number] = result[i][0];
    }
    res.send(response);
  });
});

app.listen(serverPort, '0.0.0.0', () => {
  console.log('Backend server started.');
});
