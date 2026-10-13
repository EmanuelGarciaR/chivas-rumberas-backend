export type ChivaStatus = "available" | "maintenance" | "retired";

export interface Chiva {
  id: string;
  name: string;          
  description: string;    
  capacity: number;       
  imageUrls: string[];    
  pricePerHour: number;   
  status: ChivaStatus;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

