import { Action, ActionPanel, Detail, Icon } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { useEffect, useMemo, useState } from "react";
import { getRawCompanyApiUrl, searchCompanies } from "../api/prh";
import { AUTHORITY_LABELS, REGISTER_LABELS, YTJ_SEARCH_URL } from "../constants";
import { formatAddress, formatDate } from "../lib/format";
import { getActiveRegisteredEntries, getEntryLabel, getPrimaryAddressText, toUiCompany } from "../lib/selectors";
import type { PrhLanguageCode } from "../types/prh";
import type { UiCompany } from "../types/ui";

interface CompanyDetailProps {
  businessId: string;
  languageOrder: PrhLanguageCode[];
  initialCompany?: UiCompany;
  isFavorite: boolean;
  onAddFavorite: (company: UiCompany) => Promise<void>;
  onRemoveFavorite: (businessId: string) => Promise<void>;
}

function buildRegisterLine(company: UiCompany, languageOrder: PrhLanguageCode[]): string[] {
  const activeEntries = getActiveRegisteredEntries(company.registeredEntries);

  if (!activeEntries.length) {
    return ["- No active register entries available"];
  }

  return activeEntries.map((entry) => {
    const label = getEntryLabel(entry, languageOrder);
    const register = REGISTER_LABELS[entry.register] ?? `Register ${entry.register}`;
    const authority = AUTHORITY_LABELS[entry.authority] ?? `Authority ${entry.authority}`;
    const since = formatDate(entry.registrationDate);
    const sinceText = since ? `; since ${since}` : "";

    return `- ${label} (${register}; ${authority}${sinceText})`;
  });
}

function buildAddressesMarkdown(company: UiCompany): string[] {
  if (!company.addresses.length) {
    return ["- No addresses available"];
  }

  const lines = company.addresses
    .map((address) => {
      const formatted = formatAddress(address, company.languageOrder);
      if (!formatted) {
        return undefined;
      }

      const typeLabel = address.type === 1 ? "Street" : address.type === 2 ? "Postal" : `Type ${address.type}`;
      return `- ${typeLabel}: ${formatted}`;
    })
    .filter((line): line is string => Boolean(line));

  if (!lines.length) {
    return ["- No addresses available"];
  }

  return lines;
}

function buildMarkdown(company: UiCompany): string {
  const primaryAddress = getPrimaryAddressText(company);
  const status = company.businessIdStatusLabel
    ? `${company.businessIdStatusLabel}${company.businessIdStatusCode ? ` (${company.businessIdStatusCode})` : ""}`
    : company.businessIdStatusCode
      ? `Code ${company.businessIdStatusCode}`
      : "Not available";

  const tradeStatus = company.tradeRegisterStatusLabel
    ? `${company.tradeRegisterStatusLabel}${company.tradeRegisterStatusCode ? ` (${company.tradeRegisterStatusCode})` : ""}`
    : company.tradeRegisterStatusCode
      ? `Code ${company.tradeRegisterStatusCode}`
      : "Not available";

  const companyFormText = company.companyFormLabel
    ? `${company.companyFormLabel}${company.companyFormCode ? ` (${company.companyFormCode})` : ""}`
    : company.companyFormCode
      ? `Code ${company.companyFormCode}`
      : "Not available";

  const mainBusinessLineText = company.mainBusinessLineLabel
    ? `${company.mainBusinessLineLabel}${company.mainBusinessLineCode ? ` (${company.mainBusinessLineCode})` : ""}`
    : company.mainBusinessLineCode
      ? `Code ${company.mainBusinessLineCode}`
      : "Not available";

  const registerLines = buildRegisterLine(company, company.languageOrder).join("\n");
  const addressLines = buildAddressesMarkdown(company).join("\n");

  return `# ${company.displayName}

## Identity
- Business ID: ${company.businessId}
- EUID: ${company.euId ?? "Not available"}

## Status
- Business ID status: ${status}
- Trade register status: ${tradeStatus}

## Classification
- Company form: ${companyFormText}
- Main business line: ${mainBusinessLineText}

## Contact
- Website: ${company.website ? `[${company.website}](${company.website})` : "Not available"}

## Addresses
- Primary: ${primaryAddress ?? "Not available"}
${addressLines}

## Registers (active)
${registerLines}

## Dates
- Registration date: ${formatDate(company.registrationDate) ?? "Not available"}
- End date: ${formatDate(company.endDate) ?? "Not available"}
- Last modified: ${formatDate(company.lastModified) ?? company.lastModified ?? "Not available"}
`;
}

export default function CompanyDetail({
  businessId,
  languageOrder,
  initialCompany,
  isFavorite,
  onAddFavorite,
  onRemoveFavorite,
}: CompanyDetailProps) {
  const [company, setCompany] = useState<UiCompany | undefined>(initialCompany);
  const [isLoading, setIsLoading] = useState(!initialCompany);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await searchCompanies({ businessId, page: 1 }, controller.signal);
        const exact =
          response.companies.find((entry) => entry.businessId.value === businessId) ?? response.companies[0];

        if (!exact) {
          return;
        }

        setCompany(toUiCompany(exact, languageOrder));
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }

        await showFailureToast(error, { title: "Failed to load company details" });
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
  }, [businessId, languageOrder]);

  const displayedCompany = company ?? initialCompany;

  const markdown = useMemo(() => {
    if (!displayedCompany) {
      return "# Company details\n\nCompany data is not available.";
    }

    return buildMarkdown(displayedCompany);
  }, [displayedCompany]);

  const primaryAddress = displayedCompany ? getPrimaryAddressText(displayedCompany) : undefined;
  const rawCompanyUrl = getRawCompanyApiUrl(businessId);

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        displayedCompany ? (
          <Detail.Metadata>
            <Detail.Metadata.TagList title="Favorite">
              <Detail.Metadata.TagList.Item text={isFavorite ? "Yes" : "No"} color={isFavorite ? "green" : "gray"} />
            </Detail.Metadata.TagList>
            <Detail.Metadata.Label title="Business ID" text={displayedCompany.businessId} />
            {displayedCompany.euId ? <Detail.Metadata.Label title="EUID" text={displayedCompany.euId} /> : null}
            {displayedCompany.companyFormLabel ? (
              <Detail.Metadata.Label title="Company Form" text={displayedCompany.companyFormLabel} />
            ) : null}
            {displayedCompany.mainBusinessLineLabel ? (
              <Detail.Metadata.Label title="Main Business Line" text={displayedCompany.mainBusinessLineLabel} />
            ) : null}
            {displayedCompany.website ? (
              <Detail.Metadata.Link title="Website" text={displayedCompany.website} target={displayedCompany.website} />
            ) : null}
            {primaryAddress ? <Detail.Metadata.Label title="Primary Address" text={primaryAddress} /> : null}
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          {displayedCompany ? (
            <Action.CopyToClipboard
              title="Copy Business Id"
              content={displayedCompany.businessId}
              icon={Icon.Clipboard}
            />
          ) : null}
          {primaryAddress ? (
            <Action.CopyToClipboard title="Copy Primary Address" content={primaryAddress} icon={Icon.CopyClipboard} />
          ) : null}
          {isFavorite ? (
            <Action
              title="Remove from Favorites"
              icon={Icon.StarDisabled}
              onAction={() => {
                void onRemoveFavorite(businessId);
              }}
            />
          ) : displayedCompany ? (
            <Action
              title="Add to Favorites"
              icon={Icon.Star}
              onAction={() => {
                void onAddFavorite(displayedCompany);
              }}
            />
          ) : null}
          {displayedCompany?.website ? (
            <Action.OpenInBrowser title="Open Website" url={displayedCompany.website} />
          ) : null}
          <Action.OpenInBrowser title="Open Ytj Search Page" url={YTJ_SEARCH_URL} icon={Icon.Globe} />
          <Action.OpenInBrowser title="Open Raw Prh JSON" url={rawCompanyUrl} icon={Icon.Terminal} />
        </ActionPanel>
      }
    />
  );
}
