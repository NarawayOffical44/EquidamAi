"use strict";
/**
 * Input validation utilities
 * Reusable validators for common data types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = void 0;
exports.validateObject = validateObject;
const config_1 = require("@/lib/config");
const errors_1 = require("./errors");
exports.validators = {
    /**
     * Validate email format
     */
    email: (value, opts) => {
        if (!value && opts?.allowEmpty)
            return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new errors_1.ValidationError(opts?.customMessage || 'Invalid email format');
        }
        return true;
    },
    /**
     * Validate URL format
     */
    url: (value, opts) => {
        if (!value && opts?.allowEmpty)
            return true;
        if (!config_1.config.validation.urlPattern.test(value)) {
            throw new errors_1.ValidationError(opts?.customMessage || 'Invalid URL format');
        }
        return true;
    },
    /**
     * Validate company name
     */
    companyName: (value) => {
        if (!value || value.length < config_1.config.validation.companyNameMinLength) {
            throw new errors_1.ValidationError(`Company name must be at least ${config_1.config.validation.companyNameMinLength} characters`);
        }
        if (value.length > config_1.config.validation.companyNameMaxLength) {
            throw new errors_1.ValidationError(`Company name must not exceed ${config_1.config.validation.companyNameMaxLength} characters`);
        }
        return true;
    },
    /**
     * Validate stage
     */
    stage: (value) => {
        const validStages = ['pre-revenue', 'seed', 'series-a', 'series-b+'];
        if (!validStages.includes(value)) {
            throw new errors_1.ValidationError(`Invalid stage. Must be one of: ${validStages.join(', ')}`);
        }
        return true;
    },
    /**
     * Validate numeric range
     */
    range: (value, min, max, fieldName) => {
        if (value < min || value > max) {
            throw new errors_1.ValidationError(`${fieldName} must be between ${min} and ${max}, got ${value}`);
        }
        return true;
    },
    /**
     * Validate required field
     */
    required: (value, fieldName) => {
        if (!value && value !== 0) {
            throw new errors_1.ValidationError(`${fieldName} is required`);
        }
        return true;
    },
    /**
     * Validate array is not empty
     */
    notEmpty: (arr, fieldName) => {
        if (!Array.isArray(arr) || arr.length === 0) {
            throw new errors_1.ValidationError(`${fieldName} cannot be empty`);
        }
        return true;
    },
    /**
     * Validate percentage (0-100)
     */
    percentage: (value, fieldName) => {
        exports.validators.range(value, 0, 100, fieldName);
        return true;
    },
};
/**
 * Batch validate multiple fields
 */
function validateObject(obj, schema) {
    const errors = {};
    for (const [key, validator] of Object.entries(schema)) {
        try {
            validator(obj[key]);
        }
        catch (error) {
            if (error instanceof errors_1.ValidationError) {
                errors[key] = error.message;
            }
        }
    }
    if (Object.keys(errors).length > 0) {
        throw new errors_1.ValidationError('Validation failed', errors);
    }
    return true;
}
//# sourceMappingURL=validation.js.map