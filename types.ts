export interface ExtractedData {
  sender: string;
  code: string;
  originalMessage: string;
  confidence: number;
  timestamp: number;
}

export enum ExtractionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  MONITORING = 'MONITORING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProcessingStats {
  totalFound: number;
  validCodes: number;
}