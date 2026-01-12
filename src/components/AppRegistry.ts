/**
 * Application Registry
 * Centralized registry for standard kiosk applications.
 */

import type { AppDefinition, StartMenuGroup } from '../types';
import { WindowManager } from './WindowManager';

const START_MENU_ORDER: StartMenuGroup[] = ['primary', 'secondary', 'power'];

export class AppRegistry {
  private apps: Map<string, AppDefinition> = new Map();

  constructor(private windowManager: WindowManager) {}

  public register(app: AppDefinition): void {
    if (this.apps.has(app.id)) {
      console.warn(`AppRegistry: App already registered (${app.id})`);
      return;
    }
    this.apps.set(app.id, app);
  }

  public registerAll(apps: AppDefinition[]): void {
    apps.forEach((app) => this.register(app));
  }

  public getApp(id: string): AppDefinition | undefined {
    return this.apps.get(id);
  }

  public listApps(): AppDefinition[] {
    return Array.from(this.apps.values());
  }

  public getStartMenuApps(): AppDefinition[] {
    return this.sortByStartMenuOrder(this.listApps().filter((app) => app.startMenuGroup));
  }

  public getDesktopApps(): AppDefinition[] {
    return this.listApps().filter((app) => app.showOnDesktop);
  }

  public async launch(id: string): Promise<boolean> {
    const app = this.apps.get(id);
    if (!app) {
      console.warn(`AppRegistry: Unknown app (${id})`);
      return false;
    }

    const config = await app.launch();
    this.windowManager.createWindow(config);
    return true;
  }

  private sortByStartMenuOrder(apps: AppDefinition[]): AppDefinition[] {
    return apps.sort((a, b) => {
      const groupA = a.startMenuGroup ? START_MENU_ORDER.indexOf(a.startMenuGroup) : START_MENU_ORDER.length;
      const groupB = b.startMenuGroup ? START_MENU_ORDER.indexOf(b.startMenuGroup) : START_MENU_ORDER.length;
      if (groupA !== groupB) {
        return groupA - groupB;
      }
      return a.title.localeCompare(b.title);
    });
  }
}
