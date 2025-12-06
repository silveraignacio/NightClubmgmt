import React, { useRef } from 'react';
import QRCode from 'qrcode.react';
import { Download, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { useState } from 'react';

interface QRDisplayProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  bgColor?: string;
  fgColor?: string;
  title?: string;
  description?: string;
  showDownloadButton?: boolean;
  showCopyButton?: boolean;
  downloadFileName?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * QRDisplay Component
 * Displays a QR code with optional download and copy functionality
 */
const QRDisplay = React.forwardRef<HTMLDivElement, QRDisplayProps>(
  (
    {
      value,
      size = 256,
      level = 'H',
      includeMargin = true,
      bgColor = '#ffffff',
      fgColor = '#000000',
      title,
      description,
      showDownloadButton = true,
      showCopyButton = true,
      downloadFileName = 'qrcode.png',
      className,
      containerClassName,
    },
    ref
  ) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);

    const handleDownload = () => {
      if (!qrRef.current) return;

      const qrElement = qrRef.current.querySelector('canvas');
      if (!qrElement) return;

      const link = document.createElement('a');
      link.href = qrElement.toDataURL('image/png');
      link.download = downloadFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const handleCopy = async () => {
      if (!qrRef.current) return;

      try {
        const qrElement = qrRef.current.querySelector('canvas');
        if (!qrElement) return;

        qrElement.toBlob((blob) => {
          if (!blob) return;

          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]);

          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } catch (error) {
        console.error('Failed to copy QR code:', error);
      }
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center', containerClassName)}
      >
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
        )}

        {description && (
          <p className="text-sm text-gray-600 mb-4 text-center max-w-sm">
            {description}
          </p>
        )}

        {/* QR Code Container */}
        <div
          ref={qrRef}
          className={cn(
            'p-6 bg-white rounded-lg border-2 border-gray-200 shadow-sm',
            className
          )}
          role="img"
          aria-label={`QR code for ${value}`}
        >
          <QRCode
            value={value}
            size={size}
            level={level}
            includeMargin={includeMargin}
            bgColor={bgColor}
            fgColor={fgColor}
          />
        </div>

        {/* Actions */}
        {(showDownloadButton || showCopyButton) && (
          <div className="flex gap-2 mt-6">
            {showCopyButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                leftIcon={
                  copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
                aria-label="Copy QR code to clipboard"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}

            {showDownloadButton && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
                leftIcon={<Download className="h-4 w-4" />}
                aria-label={`Download ${downloadFileName}`}
              >
                Download
              </Button>
            )}
          </div>
        )}

        {/* Value Display - useful for debugging/reference */}
        <div className="mt-6 w-full">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              View encoded value
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
              <code className="text-xs text-gray-600 break-all">{value}</code>
            </div>
          </details>
        </div>
      </div>
    );
  }
);

QRDisplay.displayName = 'QRDisplay';

// QR Scanner placeholder component - for future implementation
interface QRScannerProps {
  onScan?: (value: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

const QRScanner = React.forwardRef<HTMLDivElement, QRScannerProps>(
  ({ onScan, onError, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full bg-gray-900 rounded-lg overflow-hidden',
        'flex items-center justify-center min-h-96',
        className
      )}
      role="region"
      aria-label="QR code scanner"
    >
      <div className="text-center text-white">
        <p className="text-lg font-semibold mb-2">QR Code Scanner</p>
        <p className="text-sm text-gray-400">
          Scanner integration coming soon
        </p>
      </div>
    </div>
  )
);

QRScanner.displayName = 'QRScanner';

export { QRDisplay, QRScanner };
export type { QRDisplayProps, QRScannerProps };
