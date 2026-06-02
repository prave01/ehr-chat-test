export type Appointment = {
  apptSchedulesPkey: number;
  scheduleType: string;
  requestReason: string | null;
  scheduleLength: string | null;
  examRoom: string | null;
  apptStartTimeInCalendar: string;
  scheduleStatus: string;
  patientMaster: {
    extFirstName: string | null;
    extLastName: string | null;
    extDateOfBirth: string | null;
  };
};

export type PaginatedAppointments = {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

// Clean types returned by the tool (guarantee restricted fields removed)
export type CleanAppointment = Omit<Appointment, "patientMaster"> & {
  patientMaster: {
    extFirstName: string | null;
    extLastName: string | null;
    extDateOfBirth: string | null;
  };
};

export type CleanPaginatedAppointments = {
  data: CleanAppointment[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
