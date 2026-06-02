export type Patient = {
  patientPkey: number;
  extLastName: string;
  extFirstName: string;
  extMiddleName: string | null;
  extDateOfBirth: string;
  age: number;
  extSex: string;
  medicalRecordNum?: string;
  pcRefNumber: string | null;
  extHomePhone: string | null;
  ssn: string | null;
  insNumber: string;
};

export type PatientDetails = {
  patientPkey: number;
  extLastName: string;
  extFirstName: string;
  extMiddleName: string | null;
  extDateOfBirth: string; // YYYY-MM-DD
  age: number;
  extSex: string;
  medicalRecordNum: string;
  pcRefNumber: string | null;
  ssn: string | null;
  insNumber: string | null;

  email: {
    personal: string | null;
    work: string | null;
  };

  phone: {
    cellCall: string | null;
    cellText: string | null;
    work: string | null;
  };

  homePhone: string | null;

  address: {
    address1: string;
    address2: string | null;
    address3: string | null;
    address4: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  maritalStatus: string | null;
  preferredLanguage: string | null;
  sexualOrientation: string | null;
};
