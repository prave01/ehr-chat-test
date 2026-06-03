import { getDoctorAppointments } from "./tools/doctor/doctor";
import { getPatient, getPatientDetails } from "./tools/patient/patient";
import { getPatientAppointments } from "./tools/patient/appointments";
import { getPatientVisitHistory } from "./tools/patient/visit-history";
import { getPatientVistNote } from "./tools/patient/note-preview";
import { getPatientLabReport } from "./tools/patient/lab-report";
import { getDateTime } from "./tools/date-time";
import { getListOfProvidersLegalEntities } from "./tools/doctor/legal-entity";

export const tools = {
  getDoctorAppointments,
  getPatient,
  getPatientDetails,
  getPatientAppointments,
  getPatientVisitHistory,
  getPatientVistNote,
  getPatientLabReport,
  getDateTime,
  getListOfProvidersLegalEntities,
};
