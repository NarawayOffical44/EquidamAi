import { GitHubRepoSignals } from "@/types/github-valuation";

const GITHUB_API = "https://api.github.com";

interface GitHubRepoApiResponse {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  topics?: string[];
  language: string | null;
  license: { spdx_id?: string; name?: string } | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  subscribers_count?: number;
  default_branch?: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
}

interface GitHubContentItem {
  name?: string;
}

interface GitHubReadmeResponse {
  download_url?: string | null;
}

export function parseGitHubRepoUrl(repoUrl: string): { owner: string; repo: string } {
  let url: URL;
  const trimmedUrl = repoUrl.trim();
  try {
    url = new URL(trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`);
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  if (!owner || !repo) {
    throw new Error("GitHub URL must include an owner and repository name.");
  }

  return { owner, repo: repo.replace(/\.git$/, "") };
}

async function githubFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    headers,
    next: { revalidate: 900 },
  });

  if (response.status === 404) {
    throw new Error("Repository not found or not public.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${text.slice(0, 180)}`);
  }

  return response.json() as Promise<T>;
}

async function optionalGithubFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await githubFetch<T>(path);
  } catch {
    return fallback;
  }
}

export async function fetchGitHubRepoSignals(repoUrl: string): Promise<GitHubRepoSignals> {
  const { owner, repo } = parseGitHubRepoUrl(repoUrl);
  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);

  const [repoData, languages, contributors, releases, commits, contents, readme] =
    await Promise.all([
      githubFetch<GitHubRepoApiResponse>(`/repos/${encodedOwner}/${encodedRepo}`),
      optionalGithubFetch<Record<string, number>>(`/repos/${encodedOwner}/${encodedRepo}/languages`, {}),
      optionalGithubFetch<unknown[]>(`/repos/${encodedOwner}/${encodedRepo}/contributors?per_page=100&anon=false`, []),
      optionalGithubFetch<unknown[]>(`/repos/${encodedOwner}/${encodedRepo}/releases?per_page=100`, []),
      optionalGithubFetch<unknown[]>(`/repos/${encodedOwner}/${encodedRepo}/commits?per_page=100`, []),
      optionalGithubFetch<GitHubContentItem[]>(`/repos/${encodedOwner}/${encodedRepo}/contents`, []),
      optionalGithubFetch<GitHubReadmeResponse | null>(`/repos/${encodedOwner}/${encodedRepo}/readme`, null),
    ]);

  const fileNames = Array.isArray(contents)
    ? contents.map((item) => String(item.name || "").toLowerCase())
    : [];
  const readmeText = await decodeReadme(readme);

  return {
    owner,
    name: repoData.name,
    fullName: repoData.full_name,
    htmlUrl: repoData.html_url,
    description: repoData.description || "",
    topics: repoData.topics || [],
    primaryLanguage: repoData.language || null,
    languages,
    license: repoData.license?.spdx_id || repoData.license?.name || null,
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    watchers: repoData.watchers_count || 0,
    openIssues: repoData.open_issues_count || 0,
    subscribers: repoData.subscribers_count || 0,
    contributorCount: contributors.length,
    commitCount: commits.length,
    releaseCount: releases.length,
    defaultBranch: repoData.default_branch || "main",
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    pushedAt: repoData.pushed_at,
    readmeText,
    hasPackageManifest: hasAny(fileNames, [
      "package.json",
      "pyproject.toml",
      "cargo.toml",
      "go.mod",
      "pom.xml",
      "requirements.txt",
      "gemfile",
    ]),
    hasDockerfile: fileNames.includes("dockerfile") || fileNames.includes("docker-compose.yml"),
    hasDocs: fileNames.includes("docs") || /documentation|quickstart|get started/i.test(readmeText),
    hasTests: fileNames.some((name) => name.includes("test") || name.includes("spec")),
    hasDemoOrWebsite: Boolean(repoData.homepage) || /demo|playground|live app|try it/i.test(readmeText),
    websiteUrl: repoData.homepage || null,
  };
}

function hasAny(fileNames: string[], candidates: string[]) {
  return candidates.some((candidate) => fileNames.includes(candidate));
}

async function decodeReadme(readme: GitHubReadmeResponse | null): Promise<string> {
  if (!readme?.download_url) return "";

  try {
    const response = await fetch(readme.download_url, { next: { revalidate: 900 } });
    if (!response.ok) return "";
    return (await response.text()).slice(0, 12000);
  } catch {
    return "";
  }
}
