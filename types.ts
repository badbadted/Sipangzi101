
export enum ProjectStatus {
  PLANNING = '規劃中',
  DESIGNING = '設計中',
  CONSTRUCTION = '施工中',
  COMPLETED = '已完成'
}

export enum RoomType {
  LIVING_ROOM = '客廳',
  KITCHEN = '廚房',
  MASTER_BEDROOM = '主臥室',
  GUEST_BEDROOM = '客房',
  BATHROOM = '衛浴',
  DINING_ROOM = '餐廳',
  STUDY = '書房',
  BALCONY = '陽台',
  OTHER = '其他'
}

export interface FurnitureItem {
  id: string;
  name: string;
  description?: string;
  image?: string; // base64 encoded image
  url?: string; // product link or reference url
}

export interface RoomRequirement {
  id: string;
  type: RoomType;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  furniture?: FurnitureItem[];
  images?: string[];
}

export interface Project {
  id: string;
  title: string;
  clientName: string;
  location: string;
  size: number; // in pings (坪)
  stylePreference: string;
  status: ProjectStatus;
  rooms: RoomRequirement[];
  createdAt: string;
}
