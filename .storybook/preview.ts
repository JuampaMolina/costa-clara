import '../src/styles.css';
import type { Preview } from '@storybook/angular-vite';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

const COSTA_CLARA_VIEWPORTS = {
  mobile: {
    name: 'Móvil (390×844)',
    styles: {
      width: '390px',
      height: '844px',
    },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet (768×1024)',
    styles: {
      width: '768px',
      height: '1024px',
    },
    type: 'tablet' as const,
  },
  desktop: {
    name: 'Escritorio (1280×800)',
    styles: {
      width: '1280px',
      height: '800px',
    },
    type: 'desktop' as const,
  },
  ...INITIAL_VIEWPORTS,
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      options: COSTA_CLARA_VIEWPORTS,
    },
  },
};

export default preview;
