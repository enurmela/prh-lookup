import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { getRawCompanyApiUrl } from "./api/prh";
import CompanyDetail from "./components/company-detail";
import { YTJ_SEARCH_URL } from "./constants";
import { getPrimaryAddressText, getPrimaryCity } from "./lib/selectors";
import { useFavorites } from "./hooks/use-favorites";
import { usePrhSearch } from "./hooks/use-prh-search";
import type { FavoriteCompany, UiCompany } from "./types/ui";

function toCompanyFromFavorite(favorite: FavoriteCompany, languageOrder: ("1" | "2" | "3")[]): UiCompany {
  return {
    businessId: favorite.businessId,
    displayName: favorite.displayName,
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

  return (
    <ActionPanel>
      <Action.Push
        title="View Details"
        target={
          <CompanyDetail
            businessId={company.businessId}
            languageOrder={languageOrder}
            initialCompany={company}
            isFavorite={isFavorite}
            onAddFavorite={onAddFavorite}
            onRemoveFavorite={onRemoveFavorite}
          />
        }
      />
      <Action.CopyToClipboard title="Copy Business Id" content={company.businessId} />
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
      {company.website ? <Action.OpenInBrowser title="Open Website" url={company.website} /> : null}
      <Action.OpenInBrowser title="Open Ytj Search Page" url={YTJ_SEARCH_URL} />
      <Action.OpenInBrowser title="Open Raw Prh JSON" url={getRawCompanyApiUrl(company.businessId)} />
    </ActionPanel>
  );
}

export default function Command() {
  const {
    searchText,
    setSearchText,
    classification,
    companies,
    isLoading,
    totalResults,
    hasMoreResults,
    languageOrder,
  } = usePrhSearch();

  const { favorites, isLoading: isLoadingFavorites, isFavorite, addFavorite, removeFavorite } = useFavorites();

  const trimmed = searchText.trim();

  return (
    <List
      isLoading={isLoading || isLoadingFavorites}
      onSearchTextChange={setSearchText}
      throttle
      searchBarPlaceholder="Search by company name or Business ID (e.g. nokia, 0112038-9)"
    >
      {trimmed.length === 0 && favorites.length > 0 ? (
        <List.Section title="Favorites">
          {favorites.map((favorite) => {
            const favoriteCompany = toCompanyFromFavorite(favorite, languageOrder);
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
                          isFavorite={true}
                          onAddFavorite={addFavorite}
                          onRemoveFavorite={removeFavorite}
                        />
                      }
                    />
                    <Action.CopyToClipboard title="Copy Business Id" content={favorite.businessId} />
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
            title="Search Finnish companies"
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

      {trimmed.length > 0 && classification.kind !== "invalid-numeric" && classification.kind !== "too-short-text" ? (
        <List.Section title="Results">
          {companies.map((company) => {
            const primaryCity = getPrimaryCity(company);
            const favorite = isFavorite(company.businessId);

            return (
              <List.Item
                key={company.businessId}
                icon={favorite ? Icon.Star : Icon.Building}
                title={company.displayName}
                subtitle={company.businessId}
                accessories={[
                  company.companyFormLabel ? { text: company.companyFormLabel } : undefined,
                  primaryCity ? { text: primaryCity } : undefined,
                ].filter((entry): entry is { text: string } => Boolean(entry))}
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
              title="No companies found"
              subtitle={`No results for "${trimmed}"`}
              accessories={[{ text: "Try another query" }]}
            />
          ) : null}
        </List.Section>
      ) : null}

      {trimmed.length > 0 && hasMoreResults ? (
        <List.Section title="Notice">
          <List.Item
            icon={Icon.Info}
            title={`Showing first page only (${companies.length} of ${totalResults})`}
            subtitle="Pagination is not implemented in v1"
            accessories={[{ text: "page=1" }]}
          />
        </List.Section>
      ) : null}
    </List>
  );
}
