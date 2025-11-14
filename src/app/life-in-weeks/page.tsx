import { readFile } from 'fs/promises';
import path from 'path';

// Week data type
type WeekData = {
  week: number;
  note?: string;
  thoughts?: string;
};

const birthdate = new Date('1991-08-24');

function getCurrentWeekNumber(birthdate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - birthdate.getTime();
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks + 1;
}

// const lifespanYears = 100;
const weeksPerYear = 52;
// const totalWeeks = lifespanYears * weeksPerYear;

function getAgeAtYear(birthdate: Date, year: number): number {
  return year - birthdate.getFullYear();
}

// function getWeekNumberForYearStart(year: number): number {
//   const yearStartDate = new Date(year, 0, 1);
//   const diffMs = yearStartDate.getTime() - birthdate.getTime();
//   return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)) + 1;
// }

export default async function LifeInWeeksPage() {
  const jsonPath = path.join(process.cwd(), 'data', 'life-in-weeks.json');
  const file = await readFile(jsonPath, 'utf8');
  const weekEntries: WeekData[] = JSON.parse(file);

  const weeksLookup = new Map<number, WeekData>();
  weekEntries.forEach((entry) => weeksLookup.set(entry.week, entry));

  const currentWeek = getCurrentWeekNumber(birthdate);

  const decadeBlocks = Array.from({ length: 9 }, (_, decadeIndex) => {
    const startYear = decadeIndex * 10;
    const startWeek = decadeIndex * 520 + 1;
    const years = Array.from({ length: 10 }, (_, yearIndex) => {
      const year = startYear + yearIndex;
      const yearStartWeek = startWeek + yearIndex * weeksPerYear;
      const age = getAgeAtYear(birthdate, birthdate.getFullYear() + year);

      const weeks = Array.from({ length: weeksPerYear }, (_, i) => {
        const weekNumber = yearStartWeek + i;
        const entry = weeksLookup.get(weekNumber);
        const isCurrent = weekNumber === currentWeek;

        return (
          <div
            key={weekNumber}
            title={
              entry
                ? `${entry.note}${entry.thoughts ? `\n${entry.thoughts}` : ''}`
                : `Week ${weekNumber}`
            }
            style={{
              width: 12,
              height: 12,
              backgroundColor: entry ? 'black' : 'lightgray',
              border: isCurrent ? '2px solid red' : '1px solid #ccc',
              borderRadius: 2,
              cursor: entry ? 'pointer' : 'default',
            }}
          />
        );
      });

      return {
        yearLabel: `${age} in ${birthdate.getFullYear() + year}`,
        weeks,
      };
    });

    return {
      label: `${decadeIndex * 10}–${decadeIndex * 10 + 9}`,
      years,
    };
  });

  return (
    <main>
      <h1>Life in Weeks</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {decadeBlocks.map((block, idx) => (
          <div key={idx}>
            <h2 style={{ marginBottom: 8 }}>{block.label}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {block.years.map((year, yearIdx) => (
                <div key={yearIdx}>
                  <div style={{ marginBottom: 4, fontSize: '0.9rem', color: '#555' }}>{year.yearLabel}</div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(52, 1fr)',
                      gap: 4,
                      maxWidth: 52 * 14,
                    }}
                  >
                    {year.weeks}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
