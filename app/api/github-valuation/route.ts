import { NextRequest } from "next/server";
import { fetchGitHubRepoSignals } from "@/lib/github/repo-fetcher";
import { valueGitHubIdeaStageStartup } from "@/lib/valuation/github-idea-stage-engine";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { GitHubRepoInput } from "@/types/github-valuation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndIncrementRateLimit } from "@/lib/utils/rate-limit";
import { AppError } from "@/lib/utils/errors";

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const body = (await request.json()) as GitHubRepoInput;
    if (!body.repoUrl?.trim()) {
      return errorResponse("GitHub repository URL is required.", 400);
    }

    if (!body.sessionToken?.trim()) {
      return errorResponse("Session token is required.", 400);
    }

    const rateLimit = await checkAndIncrementRateLimit(
      `github:${body.sessionToken}`,
      5,
      createAdminClient()
    );

    if (!rateLimit.allowed) {
      return errorResponse(
        new AppError("RATE_LIMITED", "Daily limit reached. You can run 5 free GitHub repo valuations per day.", 429, {
          resetsAt: rateLimit.resetsAt,
        }),
        429
      );
    }

    const repo = await fetchGitHubRepoSignals(body.repoUrl);
    const valuation = valueGitHubIdeaStageStartup(repo, {
      ...body,
      geography: body.geography || "global",
      founderCommitment: body.founderCommitment || "unknown",
    });

    return successResponse({ valuation }, 200, Date.now() - start);
  } catch (error) {
    return errorResponse(error, 500);
  }
}
