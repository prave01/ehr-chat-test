import { tool } from "ai";
import z from "zod";

export const getCurrentDateTime = tool({
  description: "Get the current date and time in US Eastern Time",
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();

    const currentDateTime = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    return {
      currentDateTime,
      timezone: "America/New_York",
    };
  },
});
