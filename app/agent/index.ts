import { getAppointments } from "./tools/doctor/doctor";
import { getPatient, getPatientDetails } from "./tools/patient/patient";
import { getPatientAppointments } from "./tools/patient/appointments";
import { getPatientVisitHistory } from "./tools/patient/visit-history";
import { getPatientVistNote } from "./tools/patient/note-preview";

export const tools = {
  getAppointments,
  getPatient,
  getPatientDetails,
  getPatientAppointments,
  getPatientVisitHistory,
  getPatientVistNote,
};
