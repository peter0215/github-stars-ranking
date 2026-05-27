'use client';

import { useState, useEffect } from 'react';
import { Star, Search } from 'lucide-react';
import { GitHubRepo } from '../types/github';

// 每页显示数量
const PAGE_SIZE = 50;

export default function GitHubRanking() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // 一次性加载所有数据（API已经请求了1000条）
  useEffect(() => {
    const fetchAllRepos = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/github');
        if (!res.ok) throw new Error('服务器请求失败，请稍后重试');
        const data = await res.json();
        setRepos(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取排行榜失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAllRepos();
  }, []);

  // 过滤和分页逻辑
  const filteredRepos = repos.filter((repo) => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.owner.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === 'All' || repo.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  // 当前页的数据
  const paginatedRepos = filteredRepos.slice(0, currentPage * PAGE_SIZE);
  // 是否还有更多数据
  const hasMore = paginatedRepos.length < filteredRepos.length;

  // 加载更多
  const loadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  // 获取所有语言选项（去重）
  const languages = ['All', ...new Set(repos.map((repo) => repo.language).filter(Boolean))];

  if (loading) return <div className="flex items-center justify-center h-screen">加载中...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* 页面头部 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center">
              <Star size={32} className="text-black" />
            </div>
            <div>
              <h1 className="text-5xl font-bold">GitHub Ranking</h1>
              <p className="text-gray-400 text-lg">最受欢迎的开源项目排行榜</p>
            </div>
          </div>
          <div className="text-gray-400">
            Top {filteredRepos.length} • 每小时自动更新
          </div>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索仓库或作者..."
              className="w-full bg-gray-900 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // 搜索时重置页码
              }}
            />
          </div>
          <select
            className="bg-gray-900 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setCurrentPage(1); // 筛选时重置页码
            }}
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* 仓库列表 */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-gray-400">#</th>
                <th className="px-6 py-4 text-left text-gray-400">仓库</th>
                <th className="px-6 py-4 text-right text-gray-400">Stars</th>
                <th className="px-6 py-4 text-right text-gray-400">Forks</th>
                <th className="px-6 py-4 text-left text-gray-400">语言</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRepos.map((repo, index) => (
                <tr key={repo.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-gray-400">#{index + 1}</td>
                  <td className="px-6 py-4">
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-semibold text-lg"
                    >
                      {repo.full_name}
                    </a>
                    <p className="text-gray-400 text-sm mt-1">{repo.description || '暂无描述'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="flex items-center justify-end gap-2">
                      <Star size={16} className="text-yellow-500" />
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {repo.forks_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                      {repo.language || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 加载更多按钮 */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              加载更多 ({filteredRepos.length - paginatedRepos.length} 条剩余)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}