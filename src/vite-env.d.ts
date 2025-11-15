/// <reference types="vite/client" />

// PWA environment variables
interface ImportMetaEnv {
  readonly __PWA_ENABLED__: string;
  readonly __BUILD_TIME__: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Service Worker types
interface Navigator {
  readonly serviceWorker: ServiceWorkerContainer;
}

interface ServiceWorkerContainer {
  readonly controller: ServiceWorker | null;
  register(scriptURL: string | URL, options?: RegistrationOptions): Promise<ServiceWorkerRegistration>;
}

// PWA Install types
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
