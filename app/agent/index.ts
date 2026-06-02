import { getAppointments } from "./tools/doctor";
import { getPatient, getPatientDetails } from "./tools/patient";
import { getPatientAppointments } from "./tools/appointments";
import { getPatientVisitHistory } from "./tools/visit-history";

export const tools = {
  getAppointments,
  getPatient,
  getPatientDetails,
  getPatientAppointments,
  getPatientVisitHistory,
};
