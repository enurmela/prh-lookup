import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { getRawCompanyApiUrl } from "./api/prh";
import CompanyDetail from "./components/company-detail";
import { useFavorites } from "./hooks/use-favorites";
import { usePrhSearch } from "./hooks/use-prh-search";
import { YTJ_SEARCH_URL } from "./constants";
import { buildSplitDetailMetadata } from "./lib/detail-view";
import { toEuVatNumber } from "./lib/format";
import { buildMapSearchLinks } from "./lib/maps";
import { getPrimaryAddressText, getPrimaryCity } from "./lib/selectors";
import type { FavoriteCompany, UiCompany } from "./types/ui";

function toCompanyFromFavorite(favorite: FavoriteCompany, languageOrder: ("1" | "2" | "3")[]): UiCompany {
  return {
    businessId: favorite.businessId,
    euVatNumber: toEuVatNumber(favorite.businessId),
    displayName: favorite.displayName,
    currentLegalName: favorite.displayName,
    previousLegalNames: [],
    alternateNames: [],
    previousLegalNameCount: 0,
    alternateNameCount: 0,
    searchKeywords: [favorite.displayName, favorite.businessId],
    companyFormLabel: favorite.companyForm,
    website: favorite.website,
    addresses: [],
    registeredEntries: [],
    languageOrder,
    raw: {
      businessId: { value: favorite.businessId, source: "0" },
      registeredEntries: [],
      tradeRegisterStatus: "",
      lastModified: favorite.updatedAt,
      names: favorite.displayName ? [{ name: favorite.displayName, type: "1", version: 1, source: "0" }] : undefined,
    },
  };
}

function CompanyActions({
  company,
  isFavorite,
  onAddFavorite,
  onRemoveFavorite,
  languageOrder,
}: {
  company: UiCompany;
  isFavorite: boolean;
  onAddFavorite: (company: UiCompany) => Promise<void>;
  onRemoveFavorite: (businessId: string) => Promise<void>;
  languageOrder: ("1" | "2" | "3")[];
}) {
  const primaryAddress = getPrimaryAddressText(company);
  const mapLinks = buildMapSearchLinks(company.displayName, primaryAddress);

  return (
    <ActionPanel>
      <Action.Push
        title="View Details"
        target={
          <CompanyDetail businessId={company.businessId} languageOrder={languageOrder} initialCompany={company} />
        }
      />
      <Action.CopyToClipboard title="Copy Business Id" content={company.businessId} />
      {company.euVatNumber ? <Action.CopyToClipboard title="Copy Eu Vat Number" content={company.euVatNumber} /> : null}
      {primaryAddress ? <Action.CopyToClipboard title="Copy Primary Address" content={primaryAddress} /> : null}
      {isFavorite ? (
        <Action
          title="Remove Favorite"
          icon={Icon.StarDisabled}
          onAction={() => {
            void onRemoveFavorite(company.businessId);
          }}
        />
      ) : (
        <Action
          title="Add Favorite"
          icon={Icon.Star}
          onAction={() => {
            void onAddFavorite(company);
          }}
        />
      )}
      {mapLinks ? <Action.OpenInBrowser title="Open in Google Maps" url={mapLinks.googleMaps} icon={Icon.Map} /> : null}
      {mapLinks ? <Action.OpenInBrowser title="Open in Apple Maps" url={mapLinks.appleMaps} icon={Icon.Map} /> : null}
      {company.website ? <Action.OpenInBrowser title="Open Website" url={company.website} /> : null}
      <Action.OpenInBrowser title="Open Ytj Search Page" url={YTJ_SEARCH_URL} />
      <Action.OpenInBrowser title="Open Raw Prh JSON" url={getRawCompanyApiUrl(company.businessId)} />
    </ActionPanel>
  );
}

function getResultSectionTitle(isCachedResult: boolean, isRefreshing: boolean, isLoadingMore: boolean): string {
  if (isLoadingMore) {
    return "Results (Loading More...)";
  }

  if (isCachedResult && isRefreshing) {
    return "Results (Cached - Refreshing...)";
  }

  if (isCachedResult) {
    return "Results (Cached)";
  }

  if (isRefreshing) {
    return "Results (Refreshing...)";
  }

  return "Results";
}

export default function Command() {
  const {
    searchText,
    setSearchText,
    classification,
    companies,
    isLoading,
    isRefreshing,
    isLoadingMore,
    isCachedResult,
    totalResults,
    hasMoreResults,
    page,
    loadNextPage,
    languageOrder,
  } = usePrhSearch();

  const { favorites, isLoading: isLoadingFavorites, isFavorite, addFavorite, removeFavorite } = useFavorites();

  const trimmed = searchText.trim();
  const isSearchMode = trimmed.length > 0 && (classification.kind === "businessId" || classification.kind === "name");

  return (
    <List
      isLoading={isLoading || isLoadingFavorites}
      isShowingDetail={isSearchMode}
      onSearchTextChange={setSearchText}
      throttle
      searchBarPlaceholder="Search by company name or Business ID (e.g. nokia, 0112038-9)"
    >
      {trimmed.length === 0 && favorites.length > 0 ? (
        <List.Section title="Favorites">
          {favorites.map((favorite) => {
            const favoriteCompany = toCompanyFromFavorite(favorite, languageOrder);
            const favoriteMapLinks = buildMapSearchLinks(favorite.displayName, favorite.city);
            return (
              <List.Item
                key={favorite.businessId}
                icon={Icon.Star}
                title={favorite.displayName}
                subtitle={favorite.businessId}
                accessories={[
                  favorite.companyForm ? { text: favorite.companyForm } : undefined,
                  favorite.city ? { text: favorite.city } : undefined,
                ].filter((entry): entry is { text: string } => Boolean(entry))}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="View Details"
                      target={
                        <CompanyDetail
                          businessId={favorite.businessId}
                          languageOrder={languageOrder}
                          initialCompany={favoriteCompany}
                        />
                      }
                    />
                    <Action.CopyToClipboard title="Copy Business Id" content={favorite.businessId} />
                    {favoriteCompany.euVatNumber ? (
                      <Action.CopyToClipboard title="Copy Eu Vat Number" content={favoriteCompany.euVatNumber} />
                    ) : null}
                    {favoriteMapLinks ? (
                      <Action.OpenInBrowser
                        title="Open in Google Maps"
                        url={favoriteMapLinks.googleMaps}
                        icon={Icon.Map}
                      />
                    ) : null}
                    {favoriteMapLinks ? (
                      <Action.OpenInBrowser
                        title="Open in Apple Maps"
                        url={favoriteMapLinks.appleMaps}
                        icon={Icon.Map}
                      />
                    ) : null}
                    <Action.OpenInBrowser title="Open Ytj Search Page" url={YTJ_SEARCH_URL} />
                    <Action.OpenInBrowser title="Open Raw Prh JSON" url={getRawCompanyApiUrl(favorite.businessId)} />
                    {favorite.website ? <Action.OpenInBrowser title="Open Website" url={favorite.website} /> : null}
                    <Action
                      title="Remove Favorite"
                      icon={Icon.StarDisabled}
                      onAction={() => {
                        void removeFavorite(favorite.businessId);
                      }}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>
      ) : null}

      {trimmed.length === 0 && favorites.length === 0 ? (
        <List.Section title="Get Started">
          <List.Item
            icon={Icon.MagnifyingGlass}
            title="Search Finnish Companies"
            subtitle="Type company name or Business ID to start"
            accessories={[{ text: "PRH YTJ" }]}
          />
        </List.Section>
      ) : null}

      {trimmed.length > 0 && classification.hint ? (
        <List.Section title="Search Hint">
          <List.Item
            icon={Icon.Info}
            title={classification.hint}
            subtitle="No API request was made"
            accessories={[{ text: "Input validation" }]}
          />
        </List.Section>
      ) : null}

      {isSearchMode ? (
        <List.Section title={getResultSectionTitle(isCachedResult, isRefreshing, isLoadingMore)}>
          {companies.map((company) => {
            const primaryCity = getPrimaryCity(company);
            const favorite = isFavorite(company.businessId);

            return (
              <List.Item
                key={company.businessId}
                icon={favorite ? Icon.Star : Icon.Building}
                title={company.displayName}
                subtitle={company.businessId}
                accessories={primaryCity ? [{ text: primaryCity }] : undefined}
                detail={<List.Item.Detail metadata={buildSplitDetailMetadata(company)} />}
                actions={
                  <CompanyActions
                    company={company}
                    isFavorite={favorite}
                    onAddFavorite={addFavorite}
                    onRemoveFavorite={removeFavorite}
                    languageOrder={languageOrder}
                  />
                }
              />
            );
          })}

          {!isLoading && companies.length === 0 ? (
            <List.Item
              icon={Icon.XmarkCircle}
              title="No Companies Found"
              subtitle={`No results for "${trimmed}"`}
              accessories={[{ text: "Try another query" }]}
            />
          ) : null}

          {hasMoreResults ? (
            <List.Item
              icon={isLoadingMore ? Icon.Clock : Icon.ChevronDown}
              title={isLoadingMore ? "Loading More Results..." : "Load More Results"}
              subtitle={`Loaded ${companies.length} of ${totalResults}`}
              accessories={[{ text: `Page ${page}` }]}
              actions={
                <ActionPanel>
                  <Action
                    title="Load More Results"
                    icon={Icon.ChevronDown}
                    onAction={() => {
                      loadNextPage();
                    }}
                  />
                </ActionPanel>
              }
            />
          ) : null}
        </List.Section>
      ) : null}

      {isSearchMode && companies.length > 0 ? (
        <List.Section title="Result Summary">
          <List.Item
            icon={Icon.Info}
            title={`Loaded ${companies.length} of ${totalResults}`}
            subtitle={hasMoreResults ? "More pages available" : "All available results loaded"}
            accessories={[{ text: `Page ${page}` }]}
          />
        </List.Section>
      ) : null}
    </List>
  );
}
