// app/api/github/route.ts
import { NextResponse } from 'next/server';

// 直接定义类型，彻底解决导入问题
interface GitHubRepoOwner {
  login: string;
  avatar_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: GitHubRepoOwner;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

// 缓存策略：1小时（3600秒），避免频繁请求GitHub API
export const revalidate = 3600;

// 配置API请求参数（调整后，解决超时问题）
const API_CONFIG = {
  PER_PAGE: 100,
  TOTAL_PAGES: 5, // 先改成5页，测试稳定性
  SEARCH_QUERY: 'stars:>10000',
  SORT: 'stars',
  ORDER: 'desc',
  TIMEOUT: 25000, // 延长到25秒
  USER_AGENT: 'github-stars-ranking'
};

// 配置API路由的最大执行时长（Next.js 13+ 新规范）
export const maxDuration = 30;

export async function GET() {
  try {
    // 1. 验证环境变量配置
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error('❌ 环境变量GITHUB_TOKEN未配置');
      return NextResponse.json(
        { error: '服务器配置错误：缺少GitHub API Token', details: '请在.env.local文件中添加GITHUB_TOKEN' },
        { status: 500 }
      );
    }

    // 2. 配置请求头（符合GitHub API规范）
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': API_CONFIG.USER_AGENT,
    };

    // 3. 创建所有页面的请求数组（并发请求提升性能）
    const requests = Array.from({ length: API_CONFIG.TOTAL_PAGES }, (_, index) => {
      const page = index + 1;
      const url = new URL('https://api.github.com/search/repositories');
      
      // 构建查询参数
      url.searchParams.append('q', API_CONFIG.SEARCH_QUERY);
      url.searchParams.append('sort', API_CONFIG.SORT);
      url.searchParams.append('order', API_CONFIG.ORDER);
      url.searchParams.append('per_page', API_CONFIG.PER_PAGE.toString());
      url.searchParams.append('page', page.toString());

      // 发送请求并设置超时
      return fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      });
    });

    // 4. 并行执行所有请求
    const responses = await Promise.all(requests);

    // 5. 统一错误处理（检查所有请求状态）
    const errorResponse = responses.find(res => !res.ok);
    if (errorResponse) {
      const errorPage = responses.indexOf(errorResponse)+1;
      const errorDetails = await errorResponse.text().catch(() => '未知错误');
      throw new Error(
        `第${errorPage}页请求失败，状态码: ${errorResponse.status}, 详情: ${errorDetails}`
      );
    }

    // 6. 解析所有响应数据
    const allData = await Promise.all(
      responses.map(res => res.json() as Promise<GitHubSearchResponse>)
    );

    // 7. 合并并去重仓库数据（防止分页边界重复）
    const allItems = allData.flatMap(page => page.items);
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.id, item])).values()
    );

    console.log(`✅ 成功获取 ${uniqueItems.length} 个仓库数据（去重后）`);

    // 8. 返回标准化响应
    return NextResponse.json({
      success: true,
      total_count: allData[0]?.total_count || 0,
      items_count: uniqueItems.length,
      items: uniqueItems
    });

  } catch (error) {
    // 安全处理错误，解决TypeScript报错
    console.error('❌ 服务器内部错误:', error);

    let errorMessage = '未知错误';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError') {
        statusCode = 504; // 超时错误返回504
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: '服务器内部错误，请稍后重试',
        details: errorMessage
      },
      { status: statusCode }
    );
  }
}