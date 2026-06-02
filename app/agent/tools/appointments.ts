import { tool } from "ai";
import { z } from "zod";
import type {
  Appointment,
  CleanAppointment,
  PaginatedAppointments,
  CleanPaginatedAppointments,
} from "../types/appointments.types";

const inputSchema = z.object({
  patientId: z
    .union([z.string(), z.number()])
    .describe("Path parameter: patientId"),
  startDate: z.string().optional().describe("Query parameter: startDate"),
  endDate: z.string().optional().describe("Query parameter: endDate"),
  page: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: page (default: 1)"),
  limit: z
    .number()
    .int()
    .optional()
    .describe("Query parameter: limit (default: 50)"),
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

    // remove grouped objects entirely
    if (key === "email" || key === "phone" || key === "address") {
      delete obj[key];
      continue;
    }

    if (obj[key] && typeof obj[key] === "object") {
      stripRestrictedFields(obj[key] as Record<string, unknown>);
    }
  }
}

function sanitizeAppointment(appt: Appointment): CleanAppointment {
  const copy = structuredClone(appt) as Appointment;
  stripRestrictedFields(copy as unknown as Record<string, unknown>);

  return {
    apptSchedulesPkey: copy.apptSchedulesPkey,
    scheduleType: copy.scheduleType,
    requestReason: copy.requestReason,
    scheduleLength: copy.scheduleLength,
    examRoom: copy.examRoom,
    apptStartTimeInCalendar: copy.apptStartTimeInCalendar,
    scheduleStatus: copy.scheduleStatus,
    patientMaster: {
      extFirstName: copy.patientMaster?.extFirstName ?? null,
      extLastName: copy.patientMaster?.extLastName ?? null,
      extDateOfBirth: copy.patientMaster?.extDateOfBirth ?? null,
    },
  };
}

export const getPatientAppointments = tool({
  description: `Retrieve appointments for a single patient (paginated).

REQUIREMENTS:
- Must provide patientId path param.
- startDate, endDate, page, and limit may be provided as query params.

Use the patientId/patientPkey to fetch appointments for that patient. The response will be paginated, so you may need to make multiple calls if there are many appointments.

If users just provided the patient's name and date of birth, you should have already called the search patients tool to get the patientId/patientPkey. Use that patientId to call this tool.

RESTRICTED FIELDS:
- medicalRecordNum, ssn, insNumber, email.*, phone.*, homePhone, address.*

OUTPUT:
- Returns a paginated object with data[] and pagination fields.
- Restricted fields are removed before returning.`,
  inputSchema,
  execute: async ({ patientId, startDate, endDate, page = 1, limit = 50 }) => {
    try {
      console.log("Fetching appointments for patientId:", patientId);

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      params.append("page", String(page));
      params.append("limit", String(limit));

      const url = `${process.env.EHR_BASE_URL}/patients/${patientId}/appointments?${params.toString()}`;

      console.log(url);

      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.EHR_TEMP_KEY}`,
        },
      });

      if (!resp.ok) {
        throw new Error(
          `Failed to fetch appointments: ${resp.status} ${resp.statusText}`,
        );
      }

      const result: PaginatedAppointments = await resp.json();

      const clean: CleanPaginatedAppointments = {
        data: (result.data || []).map(sanitizeAppointment),
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      };

      return clean;
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
      throw new Error("Unable to retrieve patient appointments at this time.");
    }
  },
});
