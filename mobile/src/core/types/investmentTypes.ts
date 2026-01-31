export type RawMaterial = {
  id: string;
  name: string;
  quantity: number; // Purchased quantity
  remainingQuantity: number; // Quantity available for use
  unit: string; // e.g., 'kg', 'liter', 'item'
  costPerUnit: number;
  totalCost: number;
  date: string; // ISO date string
  supplier?: string;
};