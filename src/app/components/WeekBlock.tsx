type WeekBlockProps = {
  isPast: boolean;
  note?: string;
};

export default function WeekBlock({ isPast, note }: WeekBlockProps) {
  return (
    <div
      className={`w-3 h-3 rounded-sm ${isPast ? 'bg-gray-800' : 'bg-gray-200'}`}
      title={note || ''}
    />
  );
}
