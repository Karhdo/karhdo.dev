/**
 * GitHub GraphQL service (task 20). `fetchRepoData` is v1's `lib/services/github.ts` (same query and
 * post-processing); `fetchGithubActivity` feeds the bento activity card. Both return `null` on a
 * missing token or any upstream error (logged, never the token), with an 8 s upstream timeout.
 * Server-only: reads `GITHUB_API_TOKEN` from `astro:env/server`, so it never runs at build.
 */

import { GITHUB_API_TOKEN } from 'astro:env/server';
import { graphql } from '@octokit/graphql';
import { SITE } from '~/config/site';
import { ACTIVITY_WEEKS, buildActivity, type CalendarWeek, type GithubActivity, todayIn } from '~/lib/github-activity';
import type { GithubRepository, GithubRepositoryCommit } from '~/types/github';

const TIMEOUT_MS = 8000;

const HISTORY_QUERY = `
  defaultBranchRef {
    target {
      ... on Commit {
        history(first: 1) {
          edges {
            node {
              ... on Commit {
                id
                abbreviatedOid
                committedDate
                message
                url
                status {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RawRepository = Omit<GithubRepository, 'languages' | 'repositoryTopics' | 'lastCommit'> & {
  defaultBranchRef?: { target?: { history?: { edges: { node: GithubRepositoryCommit }[] } } } | null;
  languages: { edges: { node: { color: string | null; name: string } }[] };
  repositoryTopics: { edges: { node: { topic: { name: string } } }[] };
};

function client() {
  return graphql.defaults({
    headers: { authorization: `token ${GITHUB_API_TOKEN}` },
    request: { signal: AbortSignal.timeout(TIMEOUT_MS) },
  });
}

/** Logs the failure without the request options (they carry the auth header). */
function logError(scope: string, error: unknown) {
  console.error(`[github] ${scope} failed:`, error instanceof Error ? error.message : String(error));
}

export async function fetchRepoData({
  repo = '',
  includeLastCommit = false,
}: {
  repo: string;
  includeLastCommit?: boolean;
}): Promise<GithubRepository | null> {
  if (!GITHUB_API_TOKEN || !repo) {
    console.error('Missing `GITHUB_API_TOKEN` or `repo`');
    return null;
  }

  const [owner, name] = repo.split('/');
  try {
    const { repository } = await client()<{ repository: RawRepository | null }>(
      `
        query repository($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            stargazerCount
            description
            homepageUrl
            owner {
              avatarUrl
              login
              url
            }
            ${includeLastCommit ? HISTORY_QUERY : ''}
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                node {
                  color
                  name
                }
              }
            }
            name
            nameWithOwner
            url
            forkCount
            repositoryTopics(first: 20) {
              edges {
                node {
                  topic {
                    name
                  }
                }
              }
            }
          }
        }
      `,
      { owner, repo: name }
    );
    if (!repository) return null;

    const { defaultBranchRef, languages, repositoryTopics, ...rest } = repository;
    const result: GithubRepository = {
      ...rest,
      languages: languages.edges.map((edge) => ({ color: edge.node.color ?? '', name: edge.node.name })),
      repositoryTopics: repositoryTopics.edges.map((edge) => edge.node.topic.name),
    };
    if (includeLastCommit) {
      const lastCommit = defaultBranchRef?.target?.history?.edges[0]?.node;
      if (lastCommit) result.lastCommit = lastCommit;
    }
    return result;
  } catch (error) {
    logError(`repository ${repo}`, error);
    return null;
  }
}

type ActivityResponse = {
  user: {
    repositories: { totalCount: number };
    contributionsCollection: {
      contributionCalendar: { totalContributions: number; weeks: CalendarWeek[] };
    };
  } | null;
};

/** 46-week contribution heatmap, total, day streak and public repo count for `login`. */
export async function fetchGithubActivity(
  login: string = SITE.socialAccounts.github,
  weeks: number = ACTIVITY_WEEKS
): Promise<GithubActivity | null> {
  if (!GITHUB_API_TOKEN) {
    console.error('Missing `GITHUB_API_TOKEN`');
    return null;
  }

  try {
    const { user } = await client()<ActivityResponse>(
      `
        query activity($login: String!) {
          user(login: $login) {
            repositories(privacy: PUBLIC, ownerAffiliations: OWNER) {
              totalCount
            }
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    weekday
                  }
                }
              }
            }
          }
        }
      `,
      { login }
    );
    if (!user) return null;
    return buildActivity(
      user.contributionsCollection.contributionCalendar.weeks,
      user.repositories.totalCount,
      todayIn(SITE.timezone),
      weeks
    );
  } catch (error) {
    logError(`activity ${login}`, error);
    return null;
  }
}
