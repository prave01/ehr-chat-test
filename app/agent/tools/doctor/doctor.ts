import { tool } from "ai";
import { z } from "zod";
import { ehrFetch, isEhrAuthError } from "../../ehr-fetch";

export const getDoctorAppointments = tool({
  description: `Retrieves a paginated list of appointments for a doctor based on the creation date and optional filters.
    Note: 
    - Both provider and doctor are same thing, so providerLegalEntityFkey is the filter to use for doctor.
`,
  inputSchema: z.object({
    creationDate: z.string().describe("Creation date filter (mandatory)"),
    page: z
      .number()
      .int()
      .default(1)
      .describe("Page number (optional, default: 1)"),
    limit: z
      .number()
      .int()
      .default(50)
      .describe("Items per page (optional, default: 50)"),
    practiceLegalEntityFkey: z
      .number()
      .int()
      .optional()
      .describe("Practice legal entity ID filter (optional)"),
    providerLegalEntityFkey: z
      .number()
      .int()
      .optional()
      .describe("Provider legal entity ID filter (optional)"),
    scheduleStatus: z
      .string()
      .optional()
      .describe("Schedule status filter (optional)"),
  }),
  execute: async ({ creationDate, page = 1, limit = 50 }) => {
    try {
      console.log(`Fetching appointments with creationDate: ${creationDate}`);

      const response = await ehrFetch(
        `${process.env.EHR_BASE_URL}/appointments?creationDate=${creationDate}&page=${page}&limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch appointments: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (isEhrAuthError(error)) {
        throw error;
      }
      console.error("Error fetching appointments:", error);
      throw new Error("Unable to retrieve appointments at this time.");
    }
  },
});
