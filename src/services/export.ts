import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const EXPORT_FORMAT = {
  CSV: 'csv',
  JSON: 'json',
} as const;

export type ExportFormat = (typeof EXPORT_FORMAT)[keyof typeof EXPORT_FORMAT];

const EXPORT_MIME = {
  CSV: 'text/csv',
  JSON: 'application/json',
} as const;

const EXPORT_FILE_PREFIX = {
  CSV: 'pause_sip_hydration_',
  JSON: 'pause_sip_backup_',
} as const;

const EXPORT_FILE_EXT = {
  CSV: '.csv',
  JSON: '.json',
} as const;

export class ExportService {
  /**
   * Export data (CSV/JSON) cleanly across Web, Android, and iOS.
   * - Web: Triggers browser DOM file download.
   * - Native (Android/iOS): Saves file locally and launches system Share/Save sheet.
   */
  static async exportData(
    content: string,
    format: ExportFormat
  ): Promise<boolean> {
    const timestamp = Date.now();
    const isFormatCSV = format === EXPORT_FORMAT.CSV;
    const prefix = isFormatCSV ? EXPORT_FILE_PREFIX.CSV : EXPORT_FILE_PREFIX.JSON;
    const ext = isFormatCSV ? EXPORT_FILE_EXT.CSV : EXPORT_FILE_EXT.JSON;
    const mime = isFormatCSV ? EXPORT_MIME.CSV : EXPORT_MIME.JSON;
    const fileName = `${prefix}${timestamp}${ext}`;

    const isWebPlatform = Platform.OS === 'web';

    if (isWebPlatform) {
      try {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        console.warn('[ExportService] Web export failed:', error);
        return false;
      }
    }

    // Native Execution Path for Android & iOS
    try {
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const fileUri = `${docDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: mime,
          dialogTitle: `Save ${format.toUpperCase()} Export`,
          UTI: isFormatCSV ? 'public.comma-separated-values-text' : 'public.json',
        });
        return true;
      }

      await Share.share({
        title: fileName,
        message: content,
      });
      return true;
    } catch (error) {
      console.warn('[ExportService] Native export failed:', error);
      return false;
    }
  }
}
