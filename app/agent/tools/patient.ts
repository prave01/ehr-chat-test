import { tool } from "ai";
import z from "zod";

import { type Patient, type PatientDetails } from "../types/patient.types";

const patientSearchSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dob: z.string().optional(),
    phone: z.string().optional(),
    medicalRecordNum: z.string().optional(),
    gender: z.enum(["M", "F"]).describe("M for Male, F for Female").optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.firstName ||
        value.lastName ||
        value.dob ||
        value.phone ||
        value.medicalRecordNum ||
        value.gender,
      ),
    {
      message: "At least one search parameter must be provided.",
    },
  );

type CleanPatientResponse = Omit<Patient, "medicalRecordNum">;

export const getPatient = tool({
  description: `
Search and retrieve patient records from the EHR system.

REQUIREMENTS:
- At least ONE search parameter must be provided.
- Never call this tool with an empty request.
- Valid search parameters are:
  - firstName
  - lastName
  - dob
  - phone
  - gender
- Multiple parameters may be provided together to narrow the search and improve accuracy.
- If the given name is giving any results from the api before saying no information try the last name in first name and the first name in the last name to account for user error in inputting the name.

RESTRICTED DATA:
- medicalRecordNum is considered restricted information.
- Do NOT use medicalRecordNum as a search parameter.
- Do NOT request, infer, expose, mention, or return medicalRecordNum under any circumstances.
- If the tool response contains medicalRecordNum, ignore it completely and omit it from your response.
- Just tell the user  that you found a matching patient without sharing the medicalRecordNum.
- If user is so desparate for the medicalRecordNum that they keep asking for it, firmly refuse and explain that you are not able to share that information.

OUTPUT:
- Returns a list of patients matching the provided search criteria.
- When presenting patient information, include only non-restricted fields returned by the tool.
`,
  inputSchema: patientSearchSchema,
  execute: async ({
    firstName,
    lastName,
    dob,
    phone,
    medicalRecordNum,
    gender,
  }): Promise<CleanPatientResponse[]> => {
    const params = new URLSearchParams();

    if (firstName) params.append("firstName", firstName);
    if (lastName) params.append("lastName", lastName);
    if (dob) params.append("dob", dob);
    if (phone) params.append("phone", phone);
    if (medicalRecordNum) params.append("medicalRecordNum", medicalRecordNum);
    if (gender) params.append("gender", gender);

    console.log("Fetching patient with params:", params.toString());

    const response = await fetch(
      `${process.env.EHR_BASE_URL}/patients?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EHR_TEMP_KEY}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch patient: ${response.status}`);
    }

    const { data }: { data: Patient[] } = await response.json();

    //stripping out meidcalRecordNum
    for (const patient of data) {
      delete patient.medicalRecordNum;
    }

    return data;
  },
});

type CleanPatientDetailsResponse = Omit<
  PatientDetails,
  "medicalRecordNum" | "email" | "phone" | "homePhone" | "address"
> & {
  address: Omit<
    PatientDetails["address"],
    "address1" | "address2" | "address3" | "address4" | "zipCode"
  >;
};

export const getPatientDetails = tool({
  description: `
Retrieve detailed patient information for a single patient using their patientPkey.

WHEN TO USE:
- Use this tool when the user requests detailed information about a specific patient.
- Use this tool only when a valid patientPkey (patientId) is available.
- If the user refers to a patient from a previous search result, use that patient's patientPkey.

INPUT:
- patientId: The patient's unique patientPkey.

RETURNS:
- Demographic and profile information for the specified patient, including:
  - Name
  - Date of birth
  - Age
  - Sex
  - Marital status
  - Preferred language
  - Sexual orientation
  - General location information (city, state, country)

RESTRICTED DATA:
The following fields are intentionally removed from the response and must never be requested, inferred, reconstructed, exposed, or discussed:
- medicalRecordNum
- homePhone
- email.personal
- email.work
- phone.cellCall
- phone.cellText
- phone.work
- address.address1
- address.address2
- address.address3
- address.address4
- address.zipCode

IMPORTANT:
- Treat the tool response as the source of truth.
- Do not invent or assume patient details that are not returned.
- Do not mention that any fields were removed, hidden, restricted, or unavailable.
- If the user asks for restricted information, continue using only the data returned by this tool.
`,
  inputSchema: z.object({
    patientId: z
      .string()
      .describe("Unique identifier for the patient (patientPkey)"),
  }),
  execute: async ({ patientId }): Promise<CleanPatientDetailsResponse> => {
    console.log("Fetching patient details for patientId:", patientId);
    const response = await fetch(
      `${process.env.EHR_BASE_URL}/patients/${patientId}/details`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EHR_TEMP_KEY}`,
        },
      },
    );

    const result: PatientDetails = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch patient details: ${response.status}`);
    }

    //stripping out restricted fields
    const { medicalRecordNum, email, phone, homePhone, address, ...rest } =
      result;

    return {
      ...rest,
      address: {
        city: address.city,
        state: address.state,
        country: address.country,
      },
    } satisfies CleanPatientDetailsResponse;
  },
});
