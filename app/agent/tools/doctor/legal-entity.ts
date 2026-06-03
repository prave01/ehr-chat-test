import { tool } from "ai";
import z from "zod";
import { ehrFetch, isEhrAuthError } from "../../ehr-fetch";

export const getListOfProvidersLegalEntities = tool({
  description: "Get the list of legal entities for a provider",
  inputSchema: z.object(),
  execute: async () => {
    try {
      const response = await ehrFetch(
        `${process.env.EHR_BASE_URL}/provider-legal-entity`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch legal entities: ${response.status} ${response.statusText}`,
        );
      }

      const { data } = await response.json();

      return data;
    } catch (err) {
      if (isEhrAuthError(err)) {
        throw err;
      }
      console.error("Error fetching legal entities:", err);
      throw new Error("Unable to retrieve legal entities at this time.");
    }
  },
});
