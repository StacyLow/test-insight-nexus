import { TestEntry } from '@/types/test-data';

class DatabaseService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  private async fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[DatabaseService] Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[DatabaseService] API response received:`, data.length ? `${data.length} items` : 'success');
      return data;
    } catch (error) {
      console.error(`[DatabaseService] API request failed:`, error);
      throw error;
    }
  }

  async getTestResults(
    startDate: Date,
    endDate: Date,
    testType?: string
  ): Promise<TestEntry[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (testType && testType !== 'All') {
      params.append('testType', testType);
    }

    return this.fetchAPI(`/test-results?${params.toString()}`);
  }

  async insertTestResult(testResult: TestEntry): Promise<void> {
    await this.fetchAPI('/test-results', {
      method: 'POST',
      body: JSON.stringify(testResult),
    });
  }
}

export const databaseService = new DatabaseService();