import { useEffect, useMemo, useState } from "react";
import { showFailureToast } from "@raycast/utils";
import {
  DIGITS_ONLY_REGEX,
  EIGHT_DIGIT_BUSINESS_ID_REGEX,
  FULL_BUSINESS_ID_REGEX,
  MIN_TEXT_QUERY_LENGTH,
} from "../constants";
import { searchCompanies } from "../api/prh";
import { getLanguageFallbackOrder, getPreferredLanguageCode } from "../lib/language";
import { toUiCompany } from "../lib/selectors";
import type { QueryClassification, UiCompany } from "../types/ui";

const NUMERIC_HINT = "Enter 8 digits or full 7+1 format";
const TEXT_HINT = "Enter at least 2 characters";

function normalizeBusinessId(raw: string): string {
  return `${raw.slice(0, 7)}-${raw.slice(7)}`;
}

export function classifyQuery(rawInput: string): QueryClassification {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return { kind: "empty" };
  }

  if (FULL_BUSINESS_ID_REGEX.test(trimmed)) {
    return {
      kind: "businessId",
      value: trimmed,
      normalizedBusinessId: trimmed,
    };
  }

  if (EIGHT_DIGIT_BUSINESS_ID_REGEX.test(trimmed)) {
    const normalized = normalizeBusinessId(trimmed);
    return {
      kind: "businessId",
      value: trimmed,
      normalizedBusinessId: normalized,
    };
  }

  if (DIGITS_ONLY_REGEX.test(trimmed)) {
    return {
      kind: "invalid-numeric",
      value: trimmed,
      hint: NUMERIC_HINT,
    };
  }

  if (trimmed.length < MIN_TEXT_QUERY_LENGTH) {
    return {
      kind: "too-short-text",
      value: trimmed,
      hint: TEXT_HINT,
    };
  }

  return {
    kind: "name",
    value: trimmed,
  };
}

interface UsePrhSearchResult {
  searchText: string;
  setSearchText: (value: string) => void;
  classification: QueryClassification;
  companies: UiCompany[];
  isLoading: boolean;
  totalResults: number;
  hasMoreResults: boolean;
  languageOrder: ("1" | "2" | "3")[];
}

export function usePrhSearch(): UsePrhSearchResult {
  const [searchText, setSearchText] = useState("");
  const [companies, setCompanies] = useState<UiCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const classification = useMemo(() => classifyQuery(searchText), [searchText]);

  const languageOrder = useMemo(() => {
    const preferred = getPreferredLanguageCode();
    return getLanguageFallbackOrder(preferred);
  }, []);

  const languageOrderKey = languageOrder.join("-");

  useEffect(() => {
    const controller = new AbortController();

    if (classification.kind !== "businessId" && classification.kind !== "name") {
      setCompanies([]);
      setTotalResults(0);
      setIsLoading(false);
      return () => {
        controller.abort();
      };
    }

    setIsLoading(true);

    const load = async () => {
      try {
        const response = await searchCompanies(
          {
            businessId: classification.kind === "businessId" ? classification.normalizedBusinessId : undefined,
            name: classification.kind === "name" ? classification.value : undefined,
            page: 1,
          },
          controller.signal,
        );

        setTotalResults(response.totalResults);
        setCompanies(response.companies.map((company) => toUiCompany(company, languageOrder)));
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        setCompanies([]);
        setTotalResults(0);
        await showFailureToast(error, { title: "Failed to fetch companies from PRH" });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [classification.kind, classification.normalizedBusinessId, classification.value, languageOrder, languageOrderKey]);

  return {
    searchText,
    setSearchText,
    classification,
    companies,
    isLoading,
    totalResults,
    hasMoreResults: totalResults > companies.length,
    languageOrder,
  };
}
