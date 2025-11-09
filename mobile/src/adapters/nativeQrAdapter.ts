// Native QR Code Adapter for React Native using react-native-qrcode-svg
import React from 'react';
import type { QrCodeAdapter, QrCodeOptions, QrCodeResult } from '../core/adapters/qrAdapter';
import QRCode from 'react-native-qrcode-svg';

export class NativeQrAdapter implements QrCodeAdapter {
  async generateQrCode(options: QrCodeOptions): Promise<QrCodeResult> {
    try {
      // In React Native, QR codes are rendered as components
      // We return the data and options for the component to use
      return {
        svg: options.data,
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR code generation failed',
      };
    }
  }

  async generateUpiQrCode(upiId: string, amount: number, name: string): Promise<QrCodeResult> {
    // Format UPI payment string
    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
    return this.generateQrCode({ data: upiString });
  }
}

// Helper function to get QR code options
export function getQrCodeSize(size?: number): number {
  return size || 200;
}
