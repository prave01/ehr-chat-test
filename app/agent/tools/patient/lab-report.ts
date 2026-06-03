import { tool } from "ai";
import z from "zod";

export const getPatientLabReport = tool({
  description: `
Retrieve a patient's lab report for a specific lab test using their patientId and the lab test name.
`,
  inputSchema: z.object({
    patientId: z.string().describe("The patient's unique patientId."),
  }),
  execute: async ({ patientId }) => {
    try {
      const response = await fetch(
        `${process.env.EHR_BASE_URL}/patients/${patientId}/lab-results`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EHR_TEMP_KEY}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lab report: ${response.statusText}`);
      }

      const { data } = await response.json();

      return data;
    } catch (err) {
      console.error("Error fetching lab report:", err);
      throw new Error("Failed to fetch lab report. Please try again later.");
    }
  },
});
