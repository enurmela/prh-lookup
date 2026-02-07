import { Color, List } from "@raycast/api";
import { formatDate } from "./format";
import { getPrimaryAddressText } from "./selectors";
import type { UiCompany } from "../types/ui";

function getStatusText(label?: string, code?: string): string {
  if (label && code) {
    return `${label} (${code})`;
  }

  if (label) {
    return label;
  }

  if (code) {
    return `Code ${code}`;
  }

  return "Not available";
}

export function buildSplitDetailMarkdown(company: UiCompany): string {
  const primaryAddress = getPrimaryAddressText(company) ?? "Not available";
  const businessStatus = getStatusText(company.businessIdStatusLabel, company.businessIdStatusCode);
  const tradeStatus = getStatusText(company.tradeRegisterStatusLabel, company.tradeRegisterStatusCode);
  const registrationDate = formatDate(company.registrationDate) ?? "Not available";
  const endDate = formatDate(company.endDate) ?? "Not available";
  const lastModified = formatDate(company.lastModified) ?? company.lastModified ?? "Not available";

  return `# ${company.displayName}

- Last modified: ${lastModified}
- Registration date: ${registrationDate}
- End date: ${endDate}
- Business ID: ${company.businessId}
- Business ID status: ${businessStatus}
- Trade register status: ${tradeStatus}
- Company form: ${getStatusText(company.companyFormLabel, company.companyFormCode)}
- Website: ${company.website ? `[${company.website}](${company.website})` : "Not available"}
- Primary address: ${primaryAddress}
`;
}

export function buildSplitDetailMetadata(company: UiCompany): JSX.Element {
  const primaryAddress = getPrimaryAddressText(company);
  const registrationDate = formatDate(company.registrationDate) ?? "Not available";
  const endDate = formatDate(company.endDate) ?? "Not available";
  const lastModified = formatDate(company.lastModified) ?? company.lastModified ?? "Not available";

  return (
    <List.Item.Detail.Metadata>
      <List.Item.Detail.Metadata.Label title="Business ID" text={company.businessId} />
      <List.Item.Detail.Metadata.Label title="Last Modified" text={lastModified} />
      <List.Item.Detail.Metadata.Label title="Registration Date" text={registrationDate} />
      <List.Item.Detail.Metadata.Label title="End Date" text={endDate} />
      <List.Item.Detail.Metadata.TagList title="Business ID Status">
        <List.Item.Detail.Metadata.TagList.Item
          text={getStatusText(company.businessIdStatusLabel, company.businessIdStatusCode)}
          color={company.businessIdStatusCode === "2" ? Color.Green : undefined}
        />
      </List.Item.Detail.Metadata.TagList>
      <List.Item.Detail.Metadata.TagList title="Trade Register Status">
        <List.Item.Detail.Metadata.TagList.Item
          text={getStatusText(company.tradeRegisterStatusLabel, company.tradeRegisterStatusCode)}
        />
      </List.Item.Detail.Metadata.TagList>
      {company.companyFormLabel ? (
        <List.Item.Detail.Metadata.Label title="Company Form" text={company.companyFormLabel} />
      ) : null}
      {company.mainBusinessLineLabel ? (
        <List.Item.Detail.Metadata.Label title="Main Business Line" text={company.mainBusinessLineLabel} />
      ) : null}
      {company.website ? (
        <List.Item.Detail.Metadata.Link title="Website" target={company.website} text={company.website} />
      ) : null}
      {primaryAddress ? <List.Item.Detail.Metadata.Label title="Primary Address" text={primaryAddress} /> : null}
      <List.Item.Detail.Metadata.Label
        title="Active Register Entries"
        text={String(company.activeRegisterCount ?? 0)}
      />
    </List.Item.Detail.Metadata>
  );
}
