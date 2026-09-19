import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { PLATFORM_OS } from '@/types';

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

const EXPORT_UTI = {
  CSV: 'public.comma-separated-values-text',
  JSON: 'public.json',
} as const;

const EXPORT_DIALOG_TITLE = {
  CSV: 'Save CSV Export',
  JSON: 'Save JSON Export',
} as const;

const EXPORT_LOG_TAGS = {
  WEB_FAILED: '[ExportService] Web export failed:',
  NATIVE_FAILED: '[ExportService] Native export failed:',
} as const;

interface ExportConfig {
  prefix: string;
  ext: string;
  mime: string;
  uti: string;
  dialogTitle: string;
}

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
    let config: ExportConfig;

    switch (format) {
      case EXPORT_FORMAT.CSV: {
        config = {
          prefix: EXPORT_FILE_PREFIX.CSV,
          ext: EXPORT_FILE_EXT.CSV,
          mime: EXPORT_MIME.CSV,
          uti: EXPORT_UTI.CSV,
          dialogTitle: EXPORT_DIALOG_TITLE.CSV,
        };
        break;
      }
      case EXPORT_FORMAT.JSON: {
        config = {
          prefix: EXPORT_FILE_PREFIX.JSON,
          ext: EXPORT_FILE_EXT.JSON,
          mime: EXPORT_MIME.JSON,
          uti: EXPORT_UTI.JSON,
          dialogTitle: EXPORT_DIALOG_TITLE.JSON,
        };
        break;
      }
    }

    const fileName = `${config.prefix}${timestamp}${config.ext}`;
    const currentPlatform = Platform.OS;
    const isWebPlatform = currentPlatform === PLATFORM_OS.WEB;

    if (isWebPlatform) {
      try {
        const blob = new Blob([content], { type: config.mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        console.warn(EXPORT_LOG_TAGS.WEB_FAILED, error);
        return false;
      }
    }

    // Native Execution Path for Android & iOS
    try {
      const hasDocDirectory = Boolean(FileSystem.documentDirectory);
      const targetDirectory = hasDocDirectory
        ? FileSystem.documentDirectory
        : FileSystem.cacheDirectory;
      const fileUri = `${targetDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: config.mime,
          dialogTitle: config.dialogTitle,
          UTI: config.uti,
        });
        return true;
      }

      await Share.share({
        title: fileName,
        message: content,
      });
      return true;
    } catch (error) {
      console.warn(EXPORT_LOG_TAGS.NATIVE_FAILED, error);
      return false;
    }
  }
}
