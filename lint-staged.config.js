export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,css,md,html,yml,yaml}': ['prettier --write'],
  '*': () => ['npm run typecheck', 'npm test'],
}
