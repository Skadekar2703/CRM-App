export interface Transport {
  id: string;
  transportName: string;
  mobile: string;
  contactPerson: string;
  vehicleNumber: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
}

export const INITIAL_TRANSPORTS: Transport[] = [];
