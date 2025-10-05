export interface Meeting {
  date: string; // ISO 8601 date string
  notes?: string;
}

export interface Friend {
  id: string;
  name: string;
  avatarImage?: string; // Image name in image service
  tags: string[];
  notes: string;
  birthday?: string; // ISO 8601 date string
  meetings: Meeting[];
}
