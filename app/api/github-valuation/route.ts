import { NextRequest } from "next/server";
import { fetchGitHubRepoSignals } from "@/lib/github/repo-fetcher";
import { valueGitHubIdeaStageStartup } from "@/lib/valuation/github-idea-stage-engine";
import { errorResponse, successResponse } from "@/lib/utils/response";
import { GitHubRepoInput } from "@/types/github-valuation";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndIncrementRateLimits, getFreeToolDailyLimit } from "@/lib/utils/rate-limit";
import { AppError } from "@/lib/utils/errors";
import { withLeadAttribution } from "@/lib/leads/attribution";
import { insertLead } from "@/lib/leads/store";

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

    if (!body.email?.trim()) {
      return errorResponse("Email is required.", 400);
    }

    if (!body.phone?.trim()) {
      return errorResponse("Phone number is required.", 400);
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const normalizedPhone = body.phone.replace(/\D/g, "") || body.phone.trim().toLowerCase();

    const adminClient = createAdminClient();
    const dailyLimit = getFreeToolDailyLimit("GITHUB_FREE_VALUATION_DAILY_LIMIT");
    const rateLimit = await checkAndIncrementRateLimits(
      [
        `github:session:${body.sessionToken}`,
        `github:email:${normalizedEmail}`,
        `github:phone:${normalizedPhone}`,
      ],
      dailyLimit,
      adminClient
    );

    if (!rateLimit.allowed) {
      return errorResponse(
        new AppError("RATE_LIMITED", `Daily limit reached. You can run ${dailyLimit} free GitHub repo valuations per day.`, 429, {
          resetsAt: rateLimit.resetsAt,
        }),
        429
      );
    }

    const leadMetadata = withLeadAttribution(request, {
      fullName: normalizedEmail.split("@")[0],
      useCase: `GitHub repo valuation: ${body.repoUrl}`,
      type: "github_repo_valuation",
      source: "github_repo_valuation",
      intendedCustomer: body.intendedCustomer || null,
      monetizationPlan: body.monetizationPlan || null,
      market: body.market || null,
      geography: body.geography || "global",
      founderCommitment: body.founderCommitment || "unknown",
    }, (body as any).attribution);

    await insertLead(adminClient, {
      email: normalizedEmail,
      phone: body.phone || null,
      company_name: body.repoUrl,
      website_url: body.repoUrl,
      metadata: leadMetadata,
      ip_address: request.headers.get("x-forwarded-for") || null,
      country: null,
      city: null,
      isp: null,
      valuation_low: null,
      valuation_mid: null,
      valuation_high: null,
    });

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
