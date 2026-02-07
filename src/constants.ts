export const PRH_API_BASE_URL = "https://avoindata.prh.fi/opendata-ytj-api/v3";

export const YTJ_SEARCH_URL = "https://www.ytj.fi/en/index/company-search";

export const MIN_TEXT_QUERY_LENGTH = 2;

export const FULL_BUSINESS_ID_REGEX = /^\d{7}-\d$/;
export const EIGHT_DIGIT_BUSINESS_ID_REGEX = /^\d{8}$/;
export const DIGITS_ONLY_REGEX = /^\d+$/;

export const FAVORITES_STORAGE_KEY = "prh-favorites-v1";

export const BUSINESS_ID_STATUS_LABELS: Record<string, string> = {
  "1": "Pending",
  "2": "Valid",
  "5": "Business ID invalidated",
};

export const TRADE_REGISTER_STATUS_LABELS: Record<string, string> = {
  "0": "Unregistered",
  "1": "Registered",
  "2": "Removed from register",
  "3": "Start-up not registered",
  "4": "Ceased",
};

export const REGISTER_LABELS: Record<string, string> = {
  "1": "Trade register",
  "2": "Foundation register",
  "3": "Register of Associations",
  "4": "Tax Administration",
  "5": "Prepayment register",
  "6": "Value added tax-liability",
  "7": "Employer register",
  "8": "Register for insurance premium taxpayers",
};

export const AUTHORITY_LABELS: Record<string, string> = {
  "1": "Tax Administration",
  "2": "Finnish Patent and Registration Office",
  "3": "Finnish Population Register Centre",
};

export const APP_LINKS = {
  prhSwagger: "https://avoindata.prh.fi/fi/ytj/swagger-ui",
  prhSchema: "https://avoindata.prh.fi/opendata-ytj-api/v3/schema?lang=en",
  ytjSearch: YTJ_SEARCH_URL,
};
