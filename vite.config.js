import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' باعث می‌شود خروجی build از هر مسیری سرو شود.
export default defineConfig({
  plugins: [react()],
  base: './',
});
