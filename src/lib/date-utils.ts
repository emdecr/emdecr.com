export function calculateWeeksFromBirth(
    birthDate: Date,
    records: { week: string; note: string }[] = []
  ) {
    const totalWeeks = 90 * 52; // Approximation
    const today = new Date();
    const diffInTime = today.getTime() - birthDate.getTime();
    const weeksSinceBirth = Math.floor(diffInTime / (1000 * 60 * 60 * 24 * 7));
  
    const notesByWeek = new Map(records.map((r) => [parseInt(r.week), r.note]));
  
    const birthYear = birthDate.getFullYear();
    const groupedByDecade = [];
  
    let weekCounter = 0;
  
    for (let decade = 0; decade < 9; decade++) {
      const years = [];
  
      for (let y = 0; y < 10; y++) {
        const year = birthYear + decade * 10 + y;
        const weeks = [];
  
        for (let w = 0; w < 52; w++) {
          weeks.push({
            weekNumber: weekCounter,
            isPast: weekCounter < weeksSinceBirth,
            note: notesByWeek.get(weekCounter) || null,
          });
          weekCounter++;
        }
  
        years.push({ year, weeks });
      }
  
      groupedByDecade.push({
        label: `${birthYear + decade * 10}s`,
        years,
      });
    }
  
    return {
      totalWeeks,
      weeksSinceBirth,
      groupedByDecade,
    };
  }
  