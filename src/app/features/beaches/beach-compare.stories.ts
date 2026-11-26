import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { AnalyticsService } from '../../core/services/analytics';
import {
  MOCK_BEACH_CALA_MILLOR,
  MOCK_BEACH_CALA_MONDRAGO,
  MOCK_BEACH_CALA_TURQUETA,
  MOCK_BEACH_CALA_VARQUES,
  MOCK_BEACH_ES_TRENC,
  MOCK_PALMA_LOCATION,
  createMockAnalyticsService,
} from '../../../stories/beach-fixtures';
import { BeachCompare } from './beach-compare';

const meta: Meta<BeachCompare> = {
  title: 'Playas/BeachCompare',
  component: BeachCompare,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: false,
        iframeHeight: 720,
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [{ provide: AnalyticsService, useFactory: () => createMockAnalyticsService() }],
    }),
  ],
  args: {
    shareUrl: 'https://costa-clara-k23.pages.dev/?comparar=es-trenc,cala-mondrago',
    userLocation: MOCK_PALMA_LOCATION,
    removed: fn(),
    cleared: fn(),
    selected: fn(),
    closed: fn(),
  },
};

export default meta;
type Story = StoryObj<BeachCompare>;

export const DosPlayas: Story = {
  args: {
    beaches: [MOCK_BEACH_ES_TRENC, MOCK_BEACH_CALA_MONDRAGO],
  },
};

export const TresPlayas: Story = {
  args: {
    beaches: [MOCK_BEACH_ES_TRENC, MOCK_BEACH_CALA_MILLOR, MOCK_BEACH_CALA_VARQUES],
    shareUrl: 'https://costa-clara-k23.pages.dev/?comparar=es-trenc,cala-millor,cala-varques',
  },
};

export const SinServicios: Story = {
  args: {
    beaches: [MOCK_BEACH_CALA_VARQUES, MOCK_BEACH_CALA_TURQUETA],
    userLocation: null,
    shareUrl: 'https://costa-clara-k23.pages.dev/?comparar=cala-varques,cala-turqueta',
  },
};

export const Movil: Story = {
  args: {
    beaches: [MOCK_BEACH_ES_TRENC, MOCK_BEACH_CALA_MILLOR, MOCK_BEACH_CALA_VARQUES],
  },
  globals: {
    viewport: { value: 'mobile', isRotated: false },
  },
};
