export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  searchQuery?: string;
  filters: {
    location?: string;
    type?: string;
    remote?: boolean;
    minSalary?: number;
    source?: string;
  };
  createdAt: string;
  lastUsed?: string;
  alertEnabled: boolean;
}

