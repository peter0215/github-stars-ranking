
const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

export interface StarData {
  date: string;
  count: number;
}

export async function getStarHistory(owner: string, repo: string): Promise<StarData[]> {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub Token 未配置，请检查 .env.local 文件');
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/stargazers?per_page=100`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3.star+json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`仓库 ${owner}/${repo} 不存在或无法访问`);
      }
      if (response.status === 401) {
        throw new Error('GitHub Token 无效或已过期，请检查 .env.local 文件');
      }
      throw new Error(`请求失败 (${response.status})`);
    }

    const data: { starred_at: string }[] = await response.json();

    // 处理成按日期统计的累计 Star 数据
    const starMap = new Map<string, number>();

    data.forEach((star) => {
      const date = new Date(star.starred_at).toISOString().split('T')[0];
      starMap.set(date, (starMap.get(date) || 0) + 1);
    });

    // 转换为累计数据
    let cumulative = 0;
    const result: StarData[] = [];
    
    Array.from(starMap.keys()).sort().forEach(date => {
      cumulative += starMap.get(date)!;
      result.push({ date, count: cumulative });
    });

    // 如果没有数据，返回一个空数据点避免图表报错
    if (result.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return [{ date: today, count: 0 }];
    }

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '未知错误';
    console.error(`获取 ${owner}/${repo} Star 历史失败:`, err);
    throw new Error(message);
  }
}