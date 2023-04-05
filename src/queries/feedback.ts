import { Connection, RowDataPacket } from 'mysql2/promise.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const feedbackFields = ['feedback_id', 'feedback'];
const feedbackColumns = createCommaSeparatedColumns('feedback', feedbackFields);

export async function queryAllFeedbackIds(
  connection: Connection
): Promise<Record<number, number[]>> {
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT feedback_id, experience_id FROM feedback'
  );

  const record: Record<number, number[]> = {};
  for (const row of rows) {
    const experienceId = row['experience_id'];
    const rowId = row['feedback_id'];

    const feedbackIds = record[experienceId];
    if (feedbackIds) {
      feedbackIds.push(rowId);
    } else {
      record[experienceId] = [rowId];
    }
  }

  return record;
}

export async function queryFeedback(
  connection: Connection,
  feedbackId: number
): Promise<Record<string, object>> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT ${feedbackColumns} FROM feedback
    WHERE \`feedback_id\` = ?`,
    [feedbackId]
  );
  const row = rows[0];

  const record: Record<string, object> = {};
  for (const field of feedbackFields) {
    if (field !== 'feedback_id') {
      record[field] = row[field];
    }
  }

  return record;
}
