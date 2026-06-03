import { tool } from "ai";
import { z } from "zod";
import { convert } from "html-to-text";
import { ehrFetch, isEhrAuthError } from "../../ehr-fetch";

export const getPatientVistNote = tool({
  description: `
Fetches a text preview of a patient's note for a specific visit from the EHR system.

REQUIREMENTS:
- Requires both patientId and visitId to identify the specific note.
- The note preview should be concise and suitable for quick review.

OUTPUT:
- Returns a plain text summary of the note content for the specified patient and visit.
`,
  inputSchema: z.object({
    patientId: z
      .string()
      .describe(
        "The unique identifier of the patient whose note is being summarized.",
      ),
    visitId: z
      .string()
      .describe("The unique identifier of the visit associated with the note."),
  }),
  execute: async ({ patientId, visitId }) => {
    try {
      console.log(
        "Fetching note preview for patientId:",
        patientId,
        "visitId:",
        visitId,
      );

      const response = await ehrFetch(
        `${process.env.EHR_BASE_URL}/patients/${patientId}/visit-history/${visitId}/note-preview`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch note preview: ${response.status} ${response.statusText}`,
        );
      }

      const text = await response.text();

      const text_content = convert(text, {
        wordwrap: false,
      });

      return text_content;
    } catch (error) {
      if (isEhrAuthError(error)) {
        throw error;
      }
      console.error("Error fetching note preview:", error);
      throw new Error("Unable to retrieve note preview at this time.");
    }
  },
});
