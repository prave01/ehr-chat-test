export type VisitHistoryItem = {
  emrPatConsPkey: number;
  emrPatConSheetName: string;
  dateOfService: string;
  visitType: string | null;
  consultationStatus: string;
  esignStatus: string | null;
  provider: {
    firstName: string | null;
    lastName: string | null;
  };
  practice: {
    name: string | null;
  };
};

export type VisitHistoryResponse = {
  data: VisitHistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type CleanVisitHistoryItem = VisitHistoryItem;

export type CleanVisitHistoryResponse = {
  data: CleanVisitHistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};
