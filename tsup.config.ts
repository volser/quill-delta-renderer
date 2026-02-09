import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'common/index': 'src/common/index.ts',
    'renderers/html/index': 'src/renderers/html/index.ts',
    'renderers/react/index': 'src/renderers/react/index.ts',
    'renderers/markdown/index': 'src/renderers/markdown/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
});
