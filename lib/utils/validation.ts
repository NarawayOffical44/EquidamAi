/**
 * Input validation utilities
 * Reusable validators for common data types
 */

import { config } from '@/lib/config';
import { ValidationError } from './errors';

export interface ValidatorOptions {
  allowEmpty?: boolean;
  customMessage?: string;
}

export const validators = {
  /**
   * Validate email format
   */
  email: (value: string, opts?: ValidatorOptions) => {
    if (!value && opts?.allowEmpty) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(opts?.customMessage || 'Invalid email format');
    }
    return true;
  },

  /**
   * Validate URL format
   */
  url: (value: string, opts?: ValidatorOptions) => {
    if (!value && opts?.allowEmpty) return true;
    if (!config.validation.urlPattern.test(value)) {
      throw new ValidationError(opts?.customMessage || 'Invalid URL format');
    }
    return true;
  },

  /**
   * Validate company name
   */
  companyName: (value: string) => {
    if (!value || value.length < config.validation.companyNameMinLength) {
      throw new ValidationError(
        `Company name must be at least ${config.validation.companyNameMinLength} characters`
      );
    }
    if (value.length > config.validation.companyNameMaxLength) {
      throw new ValidationError(
        `Company name must not exceed ${config.validation.companyNameMaxLength} characters`
      );
    }
    return true;
  },

  /**
   * Validate stage
   */
  stage: (value: string) => {
    const validStages = ['pre-revenue', 'seed', 'series-a', 'series-b+'];
    if (!validStages.includes(value)) {
      throw new ValidationError(
        `Invalid stage. Must be one of: ${validStages.join(', ')}`
      );
    }
    return true;
  },

  /**
   * Validate numeric range
   */
  range: (value: number, min: number, max: number, fieldName: string) => {
    if (value < min || value > max) {
      throw new ValidationError(
        `${fieldName} must be between ${min} and ${max}, got ${value}`
      );
    }
    return true;
  },

  /**
   * Validate required field
   */
  required: (value: any, fieldName: string) => {
    if (!value && value !== 0) {
      throw new ValidationError(`${fieldName} is required`);
    }
    return true;
  },

  /**
   * Validate array is not empty
   */
  notEmpty: (arr: any[], fieldName: string) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }
    return true;
  },

  /**
   * Validate percentage (0-100)
   */
  percentage: (value: number, fieldName: string) => {
    validators.range(value, 0, 100, fieldName);
    return true;
  },
};

/**
 * Batch validate multiple fields
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, (value: any) => void>
) {
  const errors: Record<string, string> = {};

  for (const [key, validator] of Object.entries(schema)) {
    try {
      validator(obj[key as keyof T]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors[key] = error.message;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return true;
}
