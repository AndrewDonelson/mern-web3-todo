// file: client/src/services/localstorage.service.ts
// description: Generic service for handling localStorage operations
// module: Client
// License: MIT
// Author: Andrew Donelson
// Copyright 2025 Andrew Donelson

/**
 * Service for handling localStorage operations in a typesafe and consistent way
 */
class LocalStorageService {
    /**
     * Store data in localStorage
     * @param key Storage key
     * @param data Data to store (will be JSON stringified)
     */
    public setItem<T>(key: string, data: T): void {
      try {
        const serializedData = JSON.stringify(data);
        localStorage.setItem(key, serializedData);
      } catch (error) {
        console.error(`Error storing data for key "${key}":`, error);
        throw new Error(`Failed to store data in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    /**
     * Retrieve data from localStorage
     * @param key Storage key
     * @returns Parsed data or null if not found
     */
    public getItem<T>(key: string): T | null {
      try {
        const serializedData = localStorage.getItem(key);
        if (!serializedData) {
          return null;
        }
        return JSON.parse(serializedData) as T;
      } catch (error) {
        console.error(`Error retrieving data for key "${key}":`, error);
        return null;
      }
    }
  
    /**
     * Remove data from localStorage
     * @param key Storage key
     */
    public removeItem(key: string): void {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Error removing data for key "${key}":`, error);
      }
    }
  
    /**
     * Check if key exists in localStorage
     * @param key Storage key
     * @returns True if key exists
     */
    public hasItem(key: string): boolean {
      return localStorage.getItem(key) !== null;
    }
  
    /**
     * Clear all data from localStorage
     */
    public clear(): void {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  
    /**
     * Store raw string data without JSON serialization
     * @param key Storage key
     * @param data String data to store
     */
    public setRawItem(key: string, data: string): void {
      try {
        localStorage.setItem(key, data);
      } catch (error) {
        console.error(`Error storing raw data for key "${key}":`, error);
        throw new Error(`Failed to store raw data in localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  
    /**
     * Retrieve raw string data without JSON parsing
     * @param key Storage key
     * @returns String data or null if not found
     */
    public getRawItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error(`Error retrieving raw data for key "${key}":`, error);
        return null;
      }
    }
  }
  
  // Export singleton instance
  export const localStorageService = new LocalStorageService();