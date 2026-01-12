/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// WinBox type declarations
declare module 'winbox' {
  interface WinBoxOptions {
    id?: string;
    index?: number;
    title?: string;
    mount?: HTMLElement;
    html?: string;
    url?: string;
    width?: number | string;
    height?: number | string;
    minwidth?: number | string;
    minheight?: number | string;
    maxwidth?: number | string;
    maxheight?: number | string;
    x?: number | string;
    y?: number | string;
    max?: boolean;
    min?: boolean;
    hidden?: boolean;
    modal?: boolean;
    background?: string;
    border?: number;
    header?: number;
    class?: string | string[];
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
    autosize?: boolean;
    overflow?: boolean;

    // Callbacks
    oncreate?: (options: WinBoxOptions) => void;
    onshow?: () => void;
    onhide?: () => void | boolean;
    onfocus?: () => void;
    onblur?: () => void;
    onresize?: (width: number, height: number) => void;
    onmove?: (x: number, y: number) => void;
    onclose?: (force?: boolean) => boolean | void;
    onminimize?: () => boolean | void;
    onmaximize?: () => boolean | void;
    onrestore?: () => boolean | void;
    onfullscreen?: () => void;
  }

  class WinBox {
    constructor(options: WinBoxOptions);

    id: string;
    body: HTMLElement;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    min: boolean;
    max: boolean;
    hidden: boolean;
    focused: boolean;
    index: number;

    // Methods
    close(force?: boolean): boolean;
    focus(): this;
    blur(): this;
    hide(): this;
    show(): this;
    minimize(): this;
    maximize(): this;
    restore(): this;
    fullscreen(): this;
    move(x?: number | string, y?: number | string): this;
    resize(width?: number | string, height?: number | string): this;
    setTitle(title: string): this;
    setBackground(background: string): this;
    setUrl(url: string): this;
    mount(element: HTMLElement): this;

    // Static methods
    static stack(): void;
  }

  export = WinBox;
}

// Tauri types
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }
}

export {};
