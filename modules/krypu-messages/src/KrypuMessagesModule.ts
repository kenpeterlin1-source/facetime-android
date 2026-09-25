import { NativeModule, requireNativeModule } from 'expo';

export type SmsLink = { address: string; url: string; at: number };
export type FoundLink = { sender: string; url: string; at: number };

declare class KrypuMessagesModule extends NativeModule {
  hasSmsPermission(): boolean;
  scanSms(): Promise<SmsLink[]>;
  isWatching(): boolean;
  openWatchSettings(): void;
  takeFound(): FoundLink[];
}

export default requireNativeModule<KrypuMessagesModule>('KrypuMessages');
