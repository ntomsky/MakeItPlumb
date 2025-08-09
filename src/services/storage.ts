import { MMKV } from 'react-native-mmkv';

export class StorageService {
  private static instance: StorageService;
  private storage: MMKV;

  private constructor() {
    this.storage = new MMKV();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  set(key: string, value: any): void {
    this.storage.set(key, JSON.stringify(value));
  }

  get<T = any>(key: string): T | null {
    const value = this.storage.getString(key);
    if (value) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return null;
      }
    }
    return null;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clearAll();
  }

  getAllKeys(): string[] {
    return this.storage.getAllKeys();
  }

  // Redux persist storage adapter
  static createReduxPersistStorage() {
    const storage = StorageService.getInstance();
    
    return {
      setItem: (key: string, value: string) => {
        storage.storage.set(key, value);
        return Promise.resolve(true);
      },
      getItem: (key: string) => {
        const value = storage.storage.getString(key);
        return Promise.resolve(value);
      },
      removeItem: (key: string) => {
        storage.storage.delete(key);
        return Promise.resolve();
      },
    };
  }
}

export const storage = StorageService.getInstance();
