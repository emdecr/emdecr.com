import WeekBlock from '../components/WeekBlock';

type DecadeProps = {
  decade: {
    label: string;
    years: {
      year: number;
      weeks: {
        weekNumber: number;
        isPast: boolean;
        note?: string;
      }[];
    }[];
  };
};

export default function DecadeSection({ decade }: DecadeProps) {
  return (
    <div className="space-y-2">
      {decade.years.map((year) => (
        <div key={year.year}>
          <div className="text-sm text-gray-600 mb-1">{year.year}</div>
          <div className="grid grid-cols-52 gap-0.5">
            {year.weeks.map((week, idx) => (
              <WeekBlock key={idx} isPast={week.isPast} note={week.note} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
