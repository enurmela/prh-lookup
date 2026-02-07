import { showToast, Toast } from "@raycast/api";
import { useLocalStorage } from "@raycast/utils";
import { useMemo } from "react";
import { FAVORITES_STORAGE_KEY } from "../constants";
import { getPrimaryCity } from "../lib/selectors";
import type { FavoriteCompany, UiCompany } from "../types/ui";

function createFavoriteSnapshot(company: UiCompany): FavoriteCompany {
  return {
    businessId: company.businessId,
    displayName: company.displayName,
    companyForm: company.companyFormLabel,
    city: getPrimaryCity(company),
    website: company.website,
    updatedAt: new Date().toISOString(),
  };
}

interface UseFavoritesResult {
  favorites: FavoriteCompany[];
  isLoading: boolean;
  favoriteIds: Set<string>;
  isFavorite: (businessId: string) => boolean;
  addFavorite: (company: UiCompany) => Promise<void>;
  removeFavorite: (businessId: string) => Promise<void>;
  toggleFavorite: (company: UiCompany) => Promise<void>;
}

export function useFavorites(): UseFavoritesResult {
  const {
    value: favorites,
    setValue: setFavorites,
    isLoading,
  } = useLocalStorage<FavoriteCompany[]>(FAVORITES_STORAGE_KEY, []);

  const favoritesList = Array.isArray(favorites) ? favorites : [];

  const favoriteIds = useMemo(() => new Set(favoritesList.map((favorite) => favorite.businessId)), [favoritesList]);

  const isFavorite = (businessId: string) => favoriteIds.has(businessId);

  const addFavorite = async (company: UiCompany) => {
    const snapshot = createFavoriteSnapshot(company);
    const withoutExisting = favoritesList.filter((favorite) => favorite.businessId !== snapshot.businessId);
    const next = [snapshot, ...withoutExisting];
    await setFavorites(next);
    await showToast({
      style: Toast.Style.Success,
      title: "Saved to favorites",
      message: company.displayName,
    });
  };

  const removeFavorite = async (businessId: string) => {
    const existing = favoritesList.find((favorite) => favorite.businessId === businessId);
    if (!existing) {
      return;
    }

    const next = favoritesList.filter((favorite) => favorite.businessId !== businessId);
    await setFavorites(next);
    await showToast({
      style: Toast.Style.Success,
      title: "Removed from favorites",
      message: existing.displayName,
    });
  };

  const toggleFavorite = async (company: UiCompany) => {
    if (isFavorite(company.businessId)) {
      await removeFavorite(company.businessId);
      return;
    }

    await addFavorite(company);
  };

  return {
    favorites: favoritesList,
    isLoading,
    favoriteIds,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
