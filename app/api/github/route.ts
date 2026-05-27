// app/api/github/route.ts
import { GitHubSearchResponse } from '../../../types/github';

export const revalidate = 3600; // 缓存1小时，避免频繁请求

// 定义单次最大请求数量和总页数
const PER_PAGE = 100;
const TOTAL_PAGES = 10; // 10页 × 100条 = 1000条，是GitHub API的上限

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('❌ GITHUB_TOKEN 未配置，请在.env.local文件中添加');
      return Response.json(
        { error: '服务器配置错误：缺少GitHub API Token' },
        { status: 500 }
      );
    }

    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'github-stars-ranking',
    };

    // 并发请求所有页面的数据
    const requests = Array.from({ length: TOTAL_PAGES }, (_, i) => {
      const page = i + 1;
      return fetch(
        `https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`,
        { headers }
      );
    });

    const responses = await Promise.all(requests);
    // 检查所有请求是否成功
    responses.forEach((res, index) => {
      if (!res.ok) {
        throw new Error(`第 ${index + 1} 页请求失败，状态码: ${res.status}`);
      }
    });

    // 解析所有数据并合并
    const allData = await Promise.all(
      responses.map((res) => res.json() as Promise<GitHubSearchResponse>)
    );

    // 合并所有页面的仓库列表，去重（防止分页边界重复）
    const allItems = allData.flatMap((page) => page.items);
    const uniqueItems = Array.from(
      new Map(allItems.map((item) => [item.id, item])).values()
    );

    console.log(`✅ 成功获取 ${uniqueItems.length} 个仓库数据`);
    return Response.json({
      total_count: allData[0].total_count,
      items: uniqueItems,
    });

  } catch (error) {
    console.error('❌ 服务器内部错误:', error);
    return Response.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}