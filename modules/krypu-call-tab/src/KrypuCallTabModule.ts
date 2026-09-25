import { NativeModule, requireNativeModule } from 'expo';

export type TabEvent = { event: 'shown' | 'hidden' };

declare class KrypuCallTabModule extends NativeModule<{ onTabEvent: (e: TabEvent) => void }> {
  isAvailable(): boolean;
  open(url: string, heightFraction: number, toolbarColor: string): Promise<boolean>;
}

export default requireNativeModule<KrypuCallTabModule>('KrypuCallTab');
