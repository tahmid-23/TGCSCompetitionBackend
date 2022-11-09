import { Connection, RowDataPacket } from 'mysql2/promise';
import { queryAllCompetitions } from './competition.js';
import { queryAllGrades } from './grade.js';
import { queryAllPrograms } from './program.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const experienceFields = [
  'website_url',
  'entry_fee',
  'participant_count',
  'name',
  'origin_year',
  'purpose',
  'description',
  'required_items',
  'advice',
  'score_time',
  'score_difficulty',
  'score_benefit',
  'score_mgmt',
  'type',
  'virtual',
  'address',
  'start_date',
  'end_date',
  'application_due_date',
  'prerequisite_description',
  'entry_description'
];

const experienceColumnNames = createCommaSeparatedColumns(
  'experience',
  'experience_id',
  experienceFields
);

export async function queryAllExperiences(
  connection: Connection
): Promise<Record<string, object>[]> {
  const gradesPromise = queryAllGrades(connection);
  const competitionsPromise = queryAllCompetitions(connection);
  const programsPromise = queryAllPrograms(connection);
  const experiencesPromise = connection.query<RowDataPacket[]>(
    `SELECT ${experienceColumnNames} FROM experience`
  );

  const [grades, competitions, programs, [experienceRows]] = await Promise.all([
    gradesPromise,
    competitionsPromise,
    programsPromise,
    experiencesPromise
  ]);

  const experiences: Record<string, object>[] = [];
  for (const row of experienceRows) {
    const experienceId = row['experience_id'];
    const experienceRecord: Record<string, object> = {};
    for (const field of experienceFields) {
      experienceRecord[field] = row[field];
    }

    const experienceGrades = grades[experienceId];
    if (experienceGrades) {
      experienceRecord['grades'] = experienceGrades;
    }

    switch (row['type']) {
      case 'COMPETITION': {
        const competitionRecord = competitions[experienceId];
        if (competitionRecord) {
          for (const key in competitionRecord) {
            experienceRecord[key] = competitionRecord[key];
          }
        }
        break;
      }
      case 'PROGRAM': {
        const programRecord = programs[experienceId];
        if (programRecord) {
          for (const key in programRecord) {
            experienceRecord[key] = programRecord[key];
          }
        }
        break;
      }
      case 'EXTRACURRICULAR':
        break;
    }

    experiences.push(experienceRecord);
  }

  return experiences;
}
