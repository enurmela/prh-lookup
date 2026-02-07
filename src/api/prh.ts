import { PRH_API_BASE_URL } from "../constants";
import type { PrhCompanyResult, PrhErrorResponse } from "../types/prh";

export interface SearchCompaniesParams {
  name?: string;
  businessId?: string;
  page?: number;
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const maybeError = payload as PrhErrorResponse;
  return maybeError.message || maybeError.errorcode || maybeError.code;
}

function buildQueryString(params: SearchCompaniesParams): string {
  const query = new URLSearchParams();

  if (params.name) {
    query.set("name", params.name);
  }

  if (params.businessId) {
    query.set("businessId", params.businessId);
  }

  query.set("page", String(params.page ?? 1));

  return query.toString();
}

export async function searchCompanies(params: SearchCompaniesParams, signal?: AbortSignal): Promise<PrhCompanyResult> {
  const queryString = buildQueryString(params);
  const url = `${PRH_API_BASE_URL}/companies?${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = (await response.json()) as unknown;
      detail = getErrorMessage(payload) ?? "";
    } catch {
      detail = "";
    }

    const suffix = detail ? `: ${detail}` : "";
    throw new Error(`PRH request failed (${response.status})${suffix}`);
  }

  return (await response.json()) as PrhCompanyResult;
}

export function getRawCompanyApiUrl(businessId: string): string {
  const encoded = encodeURIComponent(businessId);
  return `${PRH_API_BASE_URL}/companies?businessId=${encoded}`;
}
