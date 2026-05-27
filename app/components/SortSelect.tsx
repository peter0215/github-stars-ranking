'use client';

type SortSelectProps = {
  sortBy: string;
  setSortBy: (value: string) => void;
};

export default function SortSelect({ sortBy, setSortBy }: SortSelectProps) {
  return (
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="bg-gray-900 text-white px-4 py-2 rounded-xl border border-gray-700"
    >
      <option value="stars">按 Star 数排序</option>
      <option value="forks">按 Fork 数排序</option>
      <option value="updated">按更新时间排序</option>
    </select>
  );
}