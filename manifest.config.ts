import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Auto Ads Shopee',
  description: 'Pantau iklan Shopee dan tampilkan notifikasi otomatis.',
  version: pkg.version,

  icons: {
    16: 'icons/logo16.png',
    48: 'icons/logo48.png',
    128: 'icons/logo128.png',
  },

  action: {
    default_icon: {
      16: 'icons/logo16.png',
      48: 'icons/logo48.png',
      128: 'icons/logo128.png',
    },
    // default_popup: 'src/popup/index.html',
  },

  permissions: [
    'sidePanel',
    'scripting',
    'alarms',
    'storage',
    'tabs',
    'notifications',
  ],

  host_permissions: [
    'https://shopee.co.id/*',
    'https://seller.shopee.co.id/*',
    'https://creator.shopee.co.id/*',
  ],

  // content_scripts: [
  //   {
  //     js: ['src/content/main.tsx'],
  //     matches: ['https://*/*'],
  //   },
  // ],

  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },

  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },

  web_accessible_resources: [
    {
      resources: ['icons/*.png'],
      matches: ['<all_urls>'],
    },
  ],

  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
})
