/**
 * Core application definitions.
 *
 * Standard for new apps:
 * - Provide a unique id, title, and icon class name.
 * - Decide if the app appears on the desktop and/or the start menu.
 * - Implement launch() to create window content on demand.
 */

import type { AppDefinition, StartMenuGroup, WindowConfig } from '../types';

function createFileBrowserWindow(id: string, title: string, placeholder: string): WindowConfig {
  const content = document.createElement('div');
  content.className = 'window-content file-browser';
  content.innerHTML = `
    <div class="window-toolbar">
      <button class="button">Back</button>
      <button class="button">Forward</button>
      <button class="button">Up</button>
    </div>
    <div class="window-address-bar">
      <label>Address:</label>
      <input type="text" value="${title}" readonly />
    </div>
    <div class="window-body" style="background: white; padding: 8px;">
      <p style="color: #808080; font-style: italic;">
        ${placeholder}
      </p>
    </div>
  `;

  return {
    id,
    title,
    width: 600,
    height: 400,
    content,
  };
}

function createSettingsWindow(): WindowConfig {
  const content = document.createElement('div');
  content.className = 'window-content settings-panel';
  content.innerHTML = `
    <div style="padding: 16px;">
      <fieldset>
        <legend>Display Settings</legend>
        <p style="color: #808080; font-style: italic;">
          Settings panel coming in Phase 2...
        </p>
      </fieldset>
    </div>
  `;

  return {
    id: 'settings',
    title: 'Settings',
    width: 400,
    height: 300,
    content,
  };
}

function createRunDialog(): WindowConfig {
  const content = document.createElement('div');
  content.className = 'window-content run-dialog';
  content.innerHTML = `
    <div style="padding: 16px;">
      <p>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
      <div style="margin-top: 16px;">
        <label for="run-input">Open:</label>
        <input type="text" id="run-input" style="width: 100%; margin-top: 4px;" />
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button class="button" data-action="run-ok" style="min-width: 75px;">OK</button>
        <button class="button" data-action="run-cancel" style="min-width: 75px; margin-left: 8px;">Cancel</button>
        <button class="button" data-action="run-browse" style="min-width: 75px; margin-left: 8px;">Browse...</button>
      </div>
    </div>
  `;

  const cancelButton = content.querySelector<HTMLButtonElement>('[data-action="run-cancel"]');
  cancelButton?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('close-window', { detail: { id: 'run-dialog' } }));
  });

  const okButton = content.querySelector<HTMLButtonElement>('[data-action="run-ok"]');
  okButton?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('close-window', { detail: { id: 'run-dialog' } }));
  });

  return {
    id: 'run-dialog',
    title: 'Run',
    width: 400,
    height: 180,
    resizable: false,
    content,
  };
}

function createRecycleBinWindow(): WindowConfig {
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="padding: 16px; background: white; height: 100%;">
      <p style="color: #808080; font-style: italic; text-align: center; margin-top: 40px;">
        Recycle Bin is empty
      </p>
    </div>
  `;

  return {
    id: 'recycle-bin',
    title: 'Recycle Bin',
    width: 500,
    height: 350,
    content,
  };
}

function createShutdownDialog(): WindowConfig {
  const content = document.createElement('div');
  content.className = 'window-content shutdown-dialog';
  content.innerHTML = `
    <div style="padding: 16px; text-align: center;">
      <p style="margin-bottom: 16px;">What do you want the computer to do?</p>
      <select style="width: 200px; margin-bottom: 16px;">
        <option>Shut down</option>
        <option>Restart</option>
        <option>Log off</option>
      </select>
      <div style="margin-top: 16px;">
        <button class="button" data-action="shutdown-ok" style="min-width: 75px;">OK</button>
        <button class="button" data-action="shutdown-cancel" style="min-width: 75px; margin-left: 8px;">Cancel</button>
      </div>
      <p style="margin-top: 16px; color: #808080; font-size: 10px;">
        (This is a demo - shutdown is not implemented)
      </p>
    </div>
  `;

  const cancelButton = content.querySelector<HTMLButtonElement>('[data-action="shutdown-cancel"]');
  cancelButton?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('close-window', { detail: { id: 'shutdown-dialog' } }));
  });

  return {
    id: 'shutdown-dialog',
    title: 'Shut Down Windows',
    width: 300,
    height: 220,
    resizable: false,
    modal: true,
    content,
  };
}

function defineApp(
  id: string,
  title: string,
  icon: string,
  startMenuGroup: StartMenuGroup | undefined,
  showOnDesktop: boolean,
  launch: () => WindowConfig,
): AppDefinition {
  return {
    id,
    title,
    icon,
    startMenuGroup,
    showOnDesktop,
    launch,
  };
}

export const coreApps: AppDefinition[] = [
  defineApp(
    'my-computer',
    'My Computer',
    'computer',
    'primary',
    true,
    () => createFileBrowserWindow('my-computer', 'My Computer', 'File browser coming in Phase 2...'),
  ),
  defineApp(
    'my-documents',
    'My Documents',
    'folder',
    'primary',
    true,
    () => createFileBrowserWindow('my-documents', 'My Documents', 'File browser coming in Phase 2...'),
  ),
  defineApp(
    'settings',
    'Settings',
    'settings',
    'secondary',
    false,
    () => createSettingsWindow(),
  ),
  defineApp(
    'run',
    'Run...',
    'run',
    'secondary',
    false,
    () => createRunDialog(),
  ),
  defineApp(
    'recycle-bin',
    'Recycle Bin',
    'trash',
    undefined,
    true,
    () => createRecycleBinWindow(),
  ),
  defineApp(
    'shutdown',
    'Shut Down...',
    'shutdown',
    'power',
    false,
    () => createShutdownDialog(),
  ),
];
