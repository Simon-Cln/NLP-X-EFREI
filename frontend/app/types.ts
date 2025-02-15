export interface VerificationResponse {
  debug: {
    success: boolean;
    found: boolean;
    message: string;
    extracted_triplet?: [string, string, string];
    matched_triples?: [string, string, string][];
  };
  result: {
    message: string;
    found?: boolean;
    extracted_triplet?: string[];
  };
}
