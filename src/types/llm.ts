export interface ValidationResult {
  isValid: boolean;
  types: string[];
  isTypeRequest: boolean;
  attributes?: {
    cuisine?: string[];
  };
}

export interface LLMService {
  initialize(): Promise<void>;
  isReady(): boolean;
  validateQuery(query: string): Promise<ValidationResult>;
}
