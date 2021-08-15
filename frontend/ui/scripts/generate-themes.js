import colors from 'tailwindcss/colors.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

console.log('Writing theme files...')
fs.writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../static/css/themes/vanilla-light.css'), `
body.theme-vanilla-light {
  --color-text-default: ${colors.black};
  --color-text-default-2: ${colors.coolGray[800]};
  --color-text-default-3: ${colors.coolGray[600]};
  --color-text-default-4: ${colors.coolGray[400]};
  --color-text-inverse: ${colors.white};
  --color-text-inverse-2: ${colors.coolGray[50]};
  --color-text-inverse-3: ${colors.coolGray[100]};
  --color-text-inverse-4: ${colors.coolGray[200]};
  --color-text-primary: ${colors.blue[600]};
  --color-text-primary-2: ${colors.blue[400]};
  --color-text-secondary: ${colors.green[600]};
  --color-text-secondary-2: ${colors.green[400]};
  --color-text-error: ${colors.red[600]};
  --color-text-error-2: ${colors.red[400]};
  --color-text-link: ${colors.blue[600]};

  --color-bg-default: ${colors.white};
  --color-bg-default-2: ${colors.coolGray[50]};
  --color-bg-default-3: ${colors.coolGray[100]};
  --color-bg-default-4: ${colors.coolGray[200]};
  --color-bg-inverse: ${colors.black};
  --color-bg-inverse-2: ${colors.coolGray[800]};
  --color-bg-inverse-3: ${colors.coolGray[600]};
  --color-bg-inverse-4: ${colors.coolGray[400]};
  --color-bg-primary: ${colors.blue[600]};
  --color-bg-primary-2: ${colors.blue[400]};
  --color-bg-secondary: ${colors.green[600]};
  --color-bg-secondary-2: ${colors.green[400]};
  --color-bg-error: ${colors.red[50]};
  --color-bg-error-2: ${colors.red[100]};

  --color-border-default: ${colors.coolGray[300]};
  --color-border-default-2: ${colors.coolGray[200]};
  --color-border-default-3: ${colors.coolGray[100]};
  --color-border-default-4: ${colors.coolGray[50]};
  --color-border-darker: ${colors.coolGray[400]};
  --color-border-darker-2: ${colors.coolGray[500]};
  --color-border-darker-3: ${colors.coolGray[600]};
  --color-border-inverse: ${colors.white};
  --color-border-primary: ${colors.blue[600]};
  --color-border-primary-2: ${colors.blue[400]};
  --color-border-secondary: ${colors.green[600]};
  --color-border-secondary-2: ${colors.green[400]};
  --color-border-error: ${colors.red[600]};
  --color-border-error-2: ${colors.red[400]};

  --font-body: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-heading: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-code:  ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
`)
console.log('Done')