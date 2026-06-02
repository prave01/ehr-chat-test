import { tool } from "ai";
import { z } from "zod";
import type {
  VisitHistoryItem,
  VisitHistoryResponse,
  CleanVisitHistoryItem,
  CleanVisitHistoryResponse,
} from "../../types/visit-history.types";

const inputSchema = z.object({
  patientId: z
    .union([z.string(), z.number()])
    .describe("Path parameter: patientId"),
  fromDate: z.string().optional().describe("Query parameter: fromDate"),
  toDate: z.string().optional().describe("Query parameter: toDate"),
  providerLegalEntityIds: z
    .union([
      z.string(),
      z.number().int(),
      z.array(z.union([z.string(), z.number().int()])),
    ])
    .optional()
    .describe(
      "Query parameter: providerLegalEntityIds (single value, comma-separated string, or array)",
    ),
});

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

function sanitizeVisitHistoryItem(
  item: VisitHistoryItem,
): CleanVisitHistoryItem {
  const copy = structuredClone(item) as VisitHistoryItem;
  stripRestrictedFields(copy as unknown as Record<string, unknown>);

  return {
    emrPatConsPkey: copy.emrPatConsPkey,
    emrPatConSheetName: copy.emrPatConSheetName,
    dateOfService: copy.dateOfService,
    visitType: copy.visitType,
    consultationStatus: copy.consultationStatus,
    esignStatus: copy.esignStatus,
    provider: {
      firstName: copy.provider?.firstName ?? null,
      lastName: copy.provider?.lastName ?? null,
    },
    practice: {
      name: copy.practice?.name ?? null,
    },
  };
}

export const getPatientVisitHistory = tool({
  description: `Retrieve visit history for a single patient.

REQUIREMENTS:
- Must provide patientId path param.
- fromDate, toDate, and providerLegalEntityIds may be provided as query params.
- If the user just provided the name of a patient but still wants the visit history, you can first call the patient search tool to get the patientId, then use that patientId to call this visit history tool.

WHEN TO USE:
- Use this tool when the user asks for prior visits, consultations, or service history for a specific patient.


RESTRICTED FIELDS:
- medicalRecordNum, ssn, insNumber, email.*, phone.*, homePhone, address.*

OUTPUT:
- Returns a paginated visit-history response with data[] and pagination fields.
- Restricted fields are removed before returning.`,
  inputSchema,
  execute: async ({ patientId, fromDate, toDate, providerLegalEntityIds }) => {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      if (providerLegalEntityIds !== undefined) {
        if (Array.isArray(providerLegalEntityIds)) {
          params.append(
            "providerLegalEntityIds",
            providerLegalEntityIds.map((value) => String(value)).join(","),
          );
        } else {
          params.append(
            "providerLegalEntityIds",
            String(providerLegalEntityIds),
          );
        }
      }

      const queryString = params.toString();
      const url = `${process.env.EHR_BASE_URL}/patients/${patientId}/visit-history${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.EHR_TEMP_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch visit history: ${response.status} ${response.statusText}`,
        );
      }

      const result: VisitHistoryResponse = await response.json();

      const clean: CleanVisitHistoryResponse = {
        data: (result.data || []).map(sanitizeVisitHistoryItem),
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      };

      return clean;
    } catch (error) {
      console.error("Error fetching patient visit history:", error);
      throw new Error("Unable to retrieve patient visit history at this time.");
    }
  },
});
