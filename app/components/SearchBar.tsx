'use client';
import { Search } from 'lucide-react';

// 1. 先定义组件的props类型
type SearchBarProps = {
  searchTerm: string;          // 搜索关键词，是字符串
  setSearchTerm: (value: string) => void; // 更新关键词的函数
};

// 2. 组件参数加上类型声明
export default function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder="搜索仓库名称/作者/描述"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-gray-900 rounded-xl pl-10 pr-4 py-3 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}