import { useEffect, useMemo, useRef, useState } from "react";
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

const SEARCH_CACHE_TTL_MS = 120_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;
const NAME_QUERY_DEBOUNCE_MS = 180;

interface SearchCacheEntry {
  timestampMs: number;
  companies: UiCompany[];
  totalResults: number;
}

const searchCache = new Map<string, SearchCacheEntry>();

function normalizeBusinessId(raw: string): string {
  return `${raw.slice(0, 7)}-${raw.slice(7)}`;
}

function getCacheKey(classification: QueryClassification): string | undefined {
  if (classification.kind === "businessId" && classification.normalizedBusinessId) {
    return `b:${classification.normalizedBusinessId}`;
  }

  if (classification.kind === "name" && classification.value) {
    return `n:${classification.value.toLowerCase()}`;
  }

  return undefined;
}

function setCacheEntry(key: string, companies: UiCompany[], totalResults: number): void {
  searchCache.set(key, {
    timestampMs: Date.now(),
    companies,
    totalResults,
  });

  if (searchCache.size <= SEARCH_CACHE_MAX_ENTRIES) {
    return;
  }

  let oldestKey: string | undefined;
  let oldestTimestamp = Number.POSITIVE_INFINITY;

  for (const [entryKey, entry] of searchCache.entries()) {
    if (entry.timestampMs < oldestTimestamp) {
      oldestTimestamp = entry.timestampMs;
      oldestKey = entryKey;
    }
  }

  if (oldestKey) {
    searchCache.delete(oldestKey);
  }
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
  isRefreshing: boolean;
  isCachedResult: boolean;
  totalResults: number;
  hasMoreResults: boolean;
  languageOrder: ("1" | "2" | "3")[];
}

export function usePrhSearch(): UsePrhSearchResult {
  const [searchText, setSearchText] = useState("");
  const [companies, setCompanies] = useState<UiCompany[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const requestTokenRef = useRef(0);

  const classification = useMemo(() => classifyQuery(searchText), [searchText]);

  const languageOrder = useMemo(() => {
    const preferred = getPreferredLanguageCode();
    return getLanguageFallbackOrder(preferred);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cacheKey = getCacheKey(classification);

    if (!cacheKey) {
      setCompanies([]);
      setTotalResults(0);
      setIsLoading(false);
      setIsRefreshing(false);
      setIsCachedResult(false);
      return () => {
        controller.abort();
        if (timer) clearTimeout(timer);
      };
    }

    const nowMs = Date.now();
    const cached = searchCache.get(cacheKey);
    const cacheAgeMs = cached ? nowMs - cached.timestampMs : Number.POSITIVE_INFINITY;
    const hasFreshCache = Boolean(cached && cacheAgeMs <= SEARCH_CACHE_TTL_MS);

    if (cached) {
      setCompanies(cached.companies);
      setTotalResults(cached.totalResults);
      setIsCachedResult(true);
      setIsLoading(false);
    }

    if (hasFreshCache) {
      setIsRefreshing(false);
      return () => {
        controller.abort();
        if (timer) clearTimeout(timer);
      };
    }

    if (!cached) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    const requestToken = ++requestTokenRef.current;

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

        if (controller.signal.aborted || requestTokenRef.current !== requestToken) {
          return;
        }

        const mappedCompanies = response.companies.map((company) => toUiCompany(company, languageOrder));
        setCompanies(mappedCompanies);
        setTotalResults(response.totalResults);
        setIsCachedResult(false);
        setCacheEntry(cacheKey, mappedCompanies, response.totalResults);
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        if (!cached) {
          setCompanies([]);
          setTotalResults(0);
          setIsCachedResult(false);
          await showFailureToast(error, { title: "Failed to fetch companies from PRH" });
        }
      } finally {
        if (!controller.signal.aborted && requestTokenRef.current === requestToken) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    if (classification.kind === "name") {
      timer = setTimeout(() => {
        void load();
      }, NAME_QUERY_DEBOUNCE_MS);
    } else {
      void load();
    }

    return () => {
      controller.abort();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [classification, languageOrder]);

  return {
    searchText,
    setSearchText,
    classification,
    companies,
    isLoading,
    isRefreshing,
    isCachedResult,
    totalResults,
    hasMoreResults: totalResults > companies.length,
    languageOrder,
  };
}
