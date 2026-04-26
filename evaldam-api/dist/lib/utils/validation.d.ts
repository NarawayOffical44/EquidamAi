/**
 * Input validation utilities
 * Reusable validators for common data types
 */
export interface ValidatorOptions {
    allowEmpty?: boolean;
    customMessage?: string;
}
export declare const validators: {
    /**
     * Validate email format
     */
    email: (value: string, opts?: ValidatorOptions) => boolean;
    /**
     * Validate URL format
     */
    url: (value: string, opts?: ValidatorOptions) => boolean;
    /**
     * Validate company name
     */
    companyName: (value: string) => boolean;
    /**
     * Validate stage
     */
    stage: (value: string) => boolean;
    /**
     * Validate numeric range
     */
    range: (value: number, min: number, max: number, fieldName: string) => boolean;
    /**
     * Validate required field
     */
    required: (value: any, fieldName: string) => boolean;
    /**
     * Validate array is not empty
     */
    notEmpty: (arr: any[], fieldName: string) => boolean;
    /**
     * Validate percentage (0-100)
     */
    percentage: (value: number, fieldName: string) => boolean;
};
/**
 * Batch validate multiple fields
 */
export declare function validateObject<T extends Record<string, any>>(obj: T, schema: Record<keyof T, (value: any) => void>): boolean;
//# sourceMappingURL=validation.d.ts.map