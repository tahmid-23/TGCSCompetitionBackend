import { Connection, RowDataPacket } from 'mysql2/promise';

export async function queryAllGrades(
  connection: Connection
): Promise<Record<number, string[]>> {
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT experience.experience_id, experience_grade.grade
     FROM experience, experience_grade
     WHERE experience.experience_id = experience_grade.experience_id`
  );

  const gradeRanges: Record<number, string[]> = {};
  for (const row of rows) {
    const experience_id = row['experience_id'];
    const gradeRange = gradeRanges[experience_id];
    if (gradeRange) {
      gradeRange.push(row['grade']);
    } else {
      gradeRanges[experience_id] = [row['grade']];
    }
  }

  return gradeRanges;
}
