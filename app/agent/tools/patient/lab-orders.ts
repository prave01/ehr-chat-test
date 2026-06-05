import { tool } from "ai";
import { z } from "zod";
import { ehrFetch, isEhrAuthError } from "../../ehr-fetch";

const inputSchema = z.object({
  fromDate: z
    .string()
    .optional()
    .describe("Query parameter: filter orders from this date (e.g. 2026-01-01)"),
  toDate: z
    .string()
    .optional()
    .describe("Query parameter: filter orders to this date (e.g. 2026-12-31)"),
  providerLegalEntityFkey: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: filter by provider legal entity primary key"),
  patientFkey: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: filter by patient primary key (patientPkey)"),
  emrPatConsFkey: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: filter by consultation primary key"),
  page: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: page number"),
  limit: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: items per page (default: 0)"),
});

type LabOrdersResponse = {
  data: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

function stripRestrictedFields(obj: Record<string, unknown>) {
  if (!obj || typeof obj !== "object") return;

  const restrictedKeys = new Set([
    "medicalRecordNum",
    "ssn",
    "insNumber",
    "email",
    "phone",
    "homePhone",
    "address1",
    "address2",
    "address3",
    "address4",
    "zipCode",
    "token",
    "password",
    "secret",
  ]);

  for (const key of Object.keys(obj)) {
    if (restrictedKeys.has(key)) {
      delete obj[key];
      continue;
    }

    if (key === "email" || key === "phone" || key === "address") {
      delete obj[key];
      continue;
    }

    if (obj[key] && typeof obj[key] === "object") {
      stripRestrictedFields(obj[key] as Record<string, unknown>);
    }
  }
}

export const getLabOrders = tool({
  description: `Retrieve lab orders (paginated) with optional filters.

REQUIREMENTS:
- All query parameters are optional; combine filters to narrow results.
- fromDate / toDate: date range for orders (ISO date strings, e.g. 2026-01-01).
- providerLegalEntityFkey: filter by provider/doctor legal entity ID (use getListOfProvidersLegalEntities to resolve).
- patientFkey: filter by patient primary key (patientPkey). If the user only gives a name, call getPatient first to obtain patientFkey.
- emrPatConsFkey: filter by consultation primary key (often from getPatientVisitHistory as emrPatConsPkey).
- page / limit: pagination (defaults: page=1, limit=50).

WHEN TO USE:
- User asks about lab orders, pending labs, ordered tests, or lab workflow for a patient, provider, visit, or date range.

OUTPUT:
- Paginated object with data[] and total, page, limit, pages.
- Restricted PHI fields are removed before returning.`,
  inputSchema,
  execute: async ({
    fromDate,
    toDate,
    providerLegalEntityFkey,
    patientFkey,
    emrPatConsFkey,
    page = 1,
    limit = 50,
  }) => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (providerLegalEntityFkey !== undefined) {
        params.append(
          "providerLegalEntityFkey",
          String(providerLegalEntityFkey),
        );
      }
      if (patientFkey !== undefined) {
        params.append("patientFkey", String(patientFkey));
      }
      if (emrPatConsFkey !== undefined) {
        params.append("emrPatConsFkey", String(emrPatConsFkey));
      }
      params.append("page", String(page));
      params.append("limit", String(limit));

      const queryString = params.toString();
      const url = `${process.env.EHR_BASE_URL}/lab-orders${queryString ? `?${queryString}` : ""}`;

      console.log("Fetching lab orders:", url);

      const response = await ehrFetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch lab orders: ${response.status} ${response.statusText}`,
        );
      }

      const result: LabOrdersResponse = await response.json();

      const data = (result.data || []).map((item) => {
        const copy = structuredClone(item) as Record<string, unknown>;
        stripRestrictedFields(copy);
        return copy;
      });

      return {
        data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      };
    } catch (error) {
      if (isEhrAuthError(error)) {
        throw error;
      }
      console.error("Error fetching lab orders:", error);
      throw new Error("Unable to retrieve lab orders at this time.");
    }
  },
});
