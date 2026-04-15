/**
 * Centralized Error Handling
 * Provides consistent error handling across the application
 */

export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  PERMISSION = 'PERMISSION_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: unknown;
  timestamp: number;
}

class ErrorHandler {
  private errors: AppError[] = [];

  /**
   * Handle and log errors
   */
  handleError(type: ErrorType, message: string, details?: unknown): AppError {
    const error: AppError = {
      type,
      message,
      details,
      timestamp: Date.now(),
    };

    this.errors.push(error);

    // Log to console
    console.error(`[${type}]`, message, details);

    return error;
  }

  /**
   * Handle API errors
   */
  handleAPIError(apiName: string, statusCode: number, message: string): AppError {
    return this.handleError(
      ErrorType.API,
      `${apiName} API error (${statusCode}): ${message}`,
      { apiName, statusCode }
    );
  }

  /**
   * Handle network errors
   */
  handleNetworkError(message: string): AppError {
    return this.handleError(ErrorType.NETWORK, message);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(field: string, message: string): AppError {
    return this.handleError(ErrorType.VALIDATION, `${field}: ${message}`, { field });
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(permission: string, message: string): AppError {
    return this.handleError(ErrorType.PERMISSION, `${permission}: ${message}`, { permission });
  }

  /**
   * Get all errors
   */
  getErrors(): AppError[] {
    return this.errors;
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }
}

export const errorHandler = new ErrorHandler();
