import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as CryptoJS from 'crypto-js';

/**
 * EncryptionService
 * 
 * Handles AES encryption/decryption for sensitive data:
 * - SAS admin passwords
 * - Agent passwords
 * 
 * SECURITY NOTE: Never log decrypted values
 */
@Injectable()
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(private readonly configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('sas.encryptionKey')!;
    
    if (!this.encryptionKey) {
      throw new Error('SAS_ENCRYPTION_KEY is not defined in environment variables');
    }
  }

  /**
   * Encrypt sensitive data using AES
   * @param plainText - Data to encrypt
   * @returns Encrypted string
   */
  encrypt(plainText: string): string {
    if (!plainText) {
      return '';
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(
        plainText,
        this.encryptionKey,
      ).toString();
      
      return encrypted;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   * @param cipherText - Encrypted data
   * @returns Decrypted string
   */
  decrypt(cipherText: string): string {
    if (!cipherText) {
      return '';
    }

    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption resulted in empty string');
      }
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt JSON payload for SAS Radius API
   * @param payload - Object to encrypt
   * @returns Encrypted string
   */
  encryptPayload(payload: any): string {
    try {
      const jsonString = JSON.stringify(payload);
      return this.encrypt(jsonString);
    } catch (error) {
      throw new Error('Payload encryption failed');
    }
  }

  /**
   * Decrypt JSON response from SAS Radius API
   * @param encryptedData - Encrypted JSON string
   * @returns Decrypted object
   */
  decryptPayload<T = any>(encryptedData: string): T {
    try {
      const decrypted = this.decrypt(encryptedData);
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Payload decryption failed');
    }
  }
}
