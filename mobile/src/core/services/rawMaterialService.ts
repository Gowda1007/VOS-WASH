import { ApiService } from './apiService';
import { RawMaterial } from '../types/investmentTypes';

export class RawMaterialService {
  private apiService: ApiService;
  private readonly baseUrl = '/raw-materials';

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  async getRawMaterials(): Promise<RawMaterial[]> {
    try {
      const response = await this.apiService.get<RawMaterial[]>(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Error fetching raw materials:', error);
      throw error;
    }
  }

  async addRawMaterial(rawMaterial: RawMaterial): Promise<RawMaterial> {
    try {
      const response = await this.apiService.post<RawMaterial>(this.baseUrl, rawMaterial);
      return response.data;
    } catch (error) {
      console.error('Error adding raw material:', error);
      throw error;
    }
  }

  async updateRawMaterial(updatedRawMaterial: RawMaterial): Promise<RawMaterial> {
    try {
      const response = await this.apiService.put<RawMaterial>(
        `${this.baseUrl}/${updatedRawMaterial.id}`,
        updatedRawMaterial
      );
      return response.data;
    } catch (error) {
      console.error('Error updating raw material:', error);
      throw error;
    }
  }

  async deleteRawMaterial(id: string): Promise<void> {
    try {
      await this.apiService.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error('Error deleting raw material:', error);
      throw error;
    }
  }
}