import { BUSINESS_ID_STATUS_LABELS, TRADE_REGISTER_STATUS_LABELS } from "../constants";
import type {
  PrhAddress,
  PrhCompany,
  PrhCompanyForm,
  PrhDescriptionEntry,
  PrhLanguageCode,
  PrhName,
  PrhRegisteredEntry,
} from "../types/prh";
import type { UiCompany } from "../types/ui";
import { formatAddress, normalizeWebsiteUrl, selectCity } from "./format";

export function selectDescription(
  descriptions: PrhDescriptionEntry[] = [],
  languageOrder: PrhLanguageCode[],
): string | undefined {
  for (const languageCode of languageOrder) {
    const match = descriptions.find(
      (entry) => entry.languageCode === languageCode && (entry.description ?? "").trim().length > 0,
    );

    if (match?.description) {
      return match.description;
    }
  }

  return descriptions.find((entry) => (entry.description ?? "").trim().length > 0)?.description ?? undefined;
}

export function selectPrimaryName(names: PrhName[] = []): PrhName | undefined {
  const preferred = names.find((name) => name.type === "1" && name.version === 1 && !name.endDate);
  if (preferred) {
    return preferred;
  }

  const activeLegalName = names.find((name) => name.type === "1" && !name.endDate);
  if (activeLegalName) {
    return activeLegalName;
  }

  const anyLegalName = names.find((name) => name.type === "1");
  if (anyLegalName) {
    return anyLegalName;
  }

  return names[0];
}

export function selectPrimaryCompanyForm(forms: PrhCompanyForm[] = []): PrhCompanyForm | undefined {
  const preferred = forms.find((form) => !form.endDate && form.version === 1);
  if (preferred) {
    return preferred;
  }

  const active = forms.find((form) => !form.endDate);
  if (active) {
    return active;
  }

  return forms[0];
}

export function selectPrimaryAddress(addresses: PrhAddress[] = []): PrhAddress | undefined {
  const streetAddress = addresses.find((address) => address.type === 1);
  if (streetAddress) {
    return streetAddress;
  }

  const postalAddress = addresses.find((address) => address.type === 2);
  if (postalAddress) {
    return postalAddress;
  }

  return addresses[0];
}

export function getBusinessIdStatusLabel(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }

  return BUSINESS_ID_STATUS_LABELS[code] ?? `Unknown (${code})`;
}

export function getTradeRegisterStatusLabel(code?: string): string | undefined {
  if (!code) {
    return undefined;
  }

  return TRADE_REGISTER_STATUS_LABELS[code] ?? `Unknown (${code})`;
}

export function getActiveRegisteredEntries(entries: PrhRegisteredEntry[] = []): PrhRegisteredEntry[] {
  return entries.filter((entry) => !entry.endDate);
}

export function getEntryLabel(entry: PrhRegisteredEntry, languageOrder: PrhLanguageCode[]): string {
  const description = selectDescription(entry.descriptions ?? [], languageOrder);
  if (description) {
    return description;
  }

  return `Type ${entry.type}`;
}

export function toUiCompany(company: PrhCompany, languageOrder: PrhLanguageCode[]): UiCompany {
  const primaryName = selectPrimaryName(company.names ?? []);
  const primaryForm = selectPrimaryCompanyForm(company.companyForms ?? []);
  const primaryAddress = selectPrimaryAddress(company.addresses ?? []);

  const displayName = primaryName?.name?.trim() || company.businessId.value;
  const companyFormLabel = primaryForm ? selectDescription(primaryForm.descriptions ?? [], languageOrder) : undefined;

  const mainBusinessLineLabel = company.mainBusinessLine
    ? selectDescription(company.mainBusinessLine.descriptions ?? [], languageOrder)
    : undefined;

  const website = normalizeWebsiteUrl(company.website?.url);
  const activeRegisterCount = getActiveRegisteredEntries(company.registeredEntries ?? []).length;

  return {
    businessId: company.businessId.value,
    euId: company.euId?.value,
    displayName,
    primaryNameType: primaryName?.type,
    companyFormCode: primaryForm?.type,
    companyFormLabel,
    tradeRegisterStatusCode: company.tradeRegisterStatus,
    tradeRegisterStatusLabel: getTradeRegisterStatusLabel(company.tradeRegisterStatus),
    businessIdStatusCode: company.status,
    businessIdStatusLabel: getBusinessIdStatusLabel(company.status),
    mainBusinessLineCode: company.mainBusinessLine?.type,
    mainBusinessLineLabel,
    website,
    primaryAddress,
    addresses: company.addresses ?? [],
    registeredEntries: company.registeredEntries ?? [],
    activeRegisterCount,
    registrationDate: company.registrationDate ?? company.businessId.registrationDate ?? undefined,
    endDate: company.endDate ?? undefined,
    lastModified: company.lastModified,
    languageOrder,
    raw: company,
  };
}

export function getPrimaryCity(company: UiCompany): string | undefined {
  const preferredAddress = company.primaryAddress ?? selectPrimaryAddress(company.addresses);
  if (!preferredAddress) {
    return undefined;
  }

  return selectCity(preferredAddress.postOffices ?? [], company.languageOrder);
}

export function getPrimaryAddressText(company: UiCompany): string | undefined {
  return formatAddress(company.primaryAddress ?? selectPrimaryAddress(company.addresses), company.languageOrder);
}

export function hasCriticalDetailData(company?: UiCompany): boolean {
  if (!company) {
    return false;
  }

  const hasTradeRegisterStatus = Boolean(company.tradeRegisterStatusCode);
  const hasAddressesPayload = Array.isArray(company.raw.addresses);
  const hasRegisteredEntriesPayload = Array.isArray(company.raw.registeredEntries);

  return hasTradeRegisterStatus && hasAddressesPayload && hasRegisteredEntriesPayload;
}
