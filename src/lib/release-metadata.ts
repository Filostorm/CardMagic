import { supabase } from "@/lib/supabase";

export type CardMagicReleaseDeployment = {
  branch: "beta" | "main";
  version: string;
  branchUrl: string;
  deploymentUrl: string | null;
  deployedAt: string;
};

type CardMagicReleaseDeploymentRow = {
  branch: "beta" | "main";
  version: string;
  branch_url: string;
  deployment_url: string | null;
  deployed_at: string;
};

function normalizeReleaseDeployment(row: CardMagicReleaseDeploymentRow): CardMagicReleaseDeployment {
  return {
    branch: row.branch,
    version: row.version,
    branchUrl: row.branch_url,
    deploymentUrl: row.deployment_url,
    deployedAt: row.deployed_at,
  };
}

export async function fetchCardMagicReleaseDeployment(
  branch: CardMagicReleaseDeployment["branch"],
): Promise<CardMagicReleaseDeployment | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("cardmagic_release_deployments")
    .select("branch, version, branch_url, deployment_url, deployed_at")
    .eq("branch", branch)
    .maybeSingle<CardMagicReleaseDeploymentRow>();

  if (error) {
    throw error;
  }

  return data ? normalizeReleaseDeployment(data) : null;
}
