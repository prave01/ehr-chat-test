import { tool } from "ai";
import z from "zod";
import { ehrFetch, isEhrAuthError } from "../../ehr-fetch";

export const getPatientLabReport = tool({
  description: `
Retrieve a patient's lab report for a specific lab test using their patientId and the lab test name.
`,
  inputSchema: z.object({
    patientId: z.string().describe("The patient's unique patientId."),
  }),
  execute: async ({ patientId }) => {
    try {
      const response = await ehrFetch(
        `${process.env.EHR_BASE_URL}/patients/${patientId}/lab-results`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lab report: ${response.statusText}`);
      }

      const { data } = await response.json();

      return data;
    } catch (err) {
      if (isEhrAuthError(err)) {
        throw err;
      }
      console.error("Error fetching lab report:", err);
      throw new Error("Failed to fetch lab report. Please try again later.");
    }
  },
});
