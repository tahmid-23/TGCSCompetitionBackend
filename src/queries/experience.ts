import { Connection, RowDataPacket } from 'mysql2/promise.js';
import { queryAllCompetitions } from './competition.js';
import { queryAllExperienceCategories } from './experience-category.js';
import { queryAllExperiencePrerequisites } from './experience-prerequisite.js';
import { queryAllExperienceSponsors } from './experience-sponsor.js';
import { queryAllGrades } from './experience-grade.js';
import { queryAllImportantDates } from './important-date.js';
import { queryAllPrograms } from './program.js';
import { createCommaSeparatedColumns } from './utils/query-utils.js';

const experienceFields = [
  'experience_id',
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
  'prerequisite_description',
  'entry_description'
];
const experienceColumnNames = createCommaSeparatedColumns(
  'experience',
  experienceFields
);

export async function queryAllExperiences(
  connection: Connection
): Promise<Record<string, object>[]> {
  const gradesPromise = queryAllGrades(connection);
  const experienceCategoriesPromise = queryAllExperienceCategories(connection);
  const importantDatesPromise = queryAllImportantDates(connection);
  const experienceSponsorsPromise = queryAllExperienceSponsors(connection);
  const experiencePrerequisitesPromise =
    queryAllExperiencePrerequisites(connection);
  const competitionsPromise = queryAllCompetitions(connection);
  const programsPromise = queryAllPrograms(connection);
  const experiencesPromise = connection.query<RowDataPacket[]>(
    `SELECT ${experienceColumnNames} FROM experience`
  );

  const [
    grades,
    experienceCategories,
    importantDates,
    experienceSponsors,
    experiencePrerequisites,
    competitions,
    programs,
    [experienceRows]
  ] = await Promise.all([
    gradesPromise,
    experienceCategoriesPromise,
    importantDatesPromise,
    experienceSponsorsPromise,
    experiencePrerequisitesPromise,
    competitionsPromise,
    programsPromise,
    experiencesPromise
  ]);

  const experiences: Record<string, object>[] = [];
  for (const row of experienceRows) {
    const experienceId = row['experience_id'];
    const experienceRecord: Record<string, object> = {
      experience_id: experienceId
    };
    for (const field of experienceFields) {
      experienceRecord[field] = row[field];
    }

    const experienceGrades = grades[experienceId];
    if (experienceGrades) {
      experienceRecord['grades'] = experienceGrades;
    } else {
      experienceRecord['grades'] = [];
    }

    const categories = experienceCategories[experienceId];
    if (categories) {
      experienceRecord['categories'] = categories;
    } else {
      experienceRecord['categories'] = [];
    }

    const experienceImportantDates = importantDates[experienceId];
    if (experienceImportantDates) {
      experienceRecord['important_dates'] = experienceImportantDates;
    } else {
      experienceRecord['important_dates'] = [];
    }

    const sponsors = experienceSponsors[experienceId];
    const mappedSponsors = [];
    if (sponsors) {
      for (const sponsor of sponsors) {
        const sponsorId = sponsor['sponsor_id'];
        if (sponsorId) {
          mappedSponsors.push(sponsorId);
        }
      }
    }
    experienceRecord['sponsors'] = mappedSponsors;

    const prerequisites = experiencePrerequisites[experienceId];
    const mappedPrerequisites = [];
    if (prerequisites) {
      for (const prerequisite of prerequisites) {
        const prerequisiteExperienceId =
          prerequisite['prerequisite_experience_id'];
        if (prerequisiteExperienceId) {
          mappedPrerequisites.push(prerequisiteExperienceId);
        }
      }
    }
    experienceRecord['prerequisites'] = mappedPrerequisites;

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

// lazy
export async function queryExperience(
  connection: Connection,
  experienceId: number
): Promise<Record<string, object> | undefined> {
  const experiences = await queryAllExperiences(connection);
  for (const experience of experiences) {
    if (Number(experience['experience_id']) === experienceId) {
      return experience;
    }
  }

  return undefined;
}
