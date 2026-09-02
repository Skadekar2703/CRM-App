export interface Area {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  createdDate: string;
  locationCount: number;
}

export const INITIAL_AREAS: Area[] = [];
