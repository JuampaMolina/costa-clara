import {
  applicationConfig,
  componentWrapperDecorator,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import { AnalyticsService } from '../../core/services/analytics';
import { FavoritesStore } from '../../core/services/favorites';
import { MarineWeatherService } from '../../core/services/marine-weather';
import {
  MOCK_BEACH_CALA_VARQUES,
  MOCK_BEACH_ES_TRENC,
  createMockAnalyticsService,
  createMockFavoritesStore,
  createMockMarineWeatherService,
} from '../../../stories/beach-fixtures';
import { BeachDetail } from './beach-detail';

const meta: Meta<BeachDetail> = {
  title: 'Playas/BeachDetail',
  component: BeachDetail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: false,
        iframeHeight: 780,
      },
    },
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div class="relative min-h-[760px] w-full bg-slate-100">${story}</div>`,
    ),
  ],
  args: {
    shareUrl: 'https://costa-clara-k23.pages.dev/?playa=es-trenc',
    isCompared: false,
    compareToggled: fn(),
    closed: fn(),
  },
};

export default meta;
type Story = StoryObj<BeachDetail>;

export const Normal: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: FavoritesStore, useFactory: () => createMockFavoritesStore([]) },
        { provide: MarineWeatherService, useFactory: () => createMockMarineWeatherService() },
        { provide: AnalyticsService, useFactory: () => createMockAnalyticsService() },
      ],
    }),
  ],
  args: {
    beach: MOCK_BEACH_ES_TRENC,
    isCompared: false,
  },
};

export const FavoritaYComparada: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: FavoritesStore,
          useFactory: () => createMockFavoritesStore([MOCK_BEACH_ES_TRENC.id]),
        },
        { provide: MarineWeatherService, useFactory: () => createMockMarineWeatherService() },
        { provide: AnalyticsService, useFactory: () => createMockAnalyticsService() },
      ],
    }),
  ],
  args: {
    beach: MOCK_BEACH_ES_TRENC,
    isCompared: true,
  },
};

export const SinServiciosYDemo: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: FavoritesStore, useFactory: () => createMockFavoritesStore([]) },
        {
          provide: MarineWeatherService,
          useFactory: () => createMockMarineWeatherService({ status: 'error', reason: 'red' }),
        },
        { provide: AnalyticsService, useFactory: () => createMockAnalyticsService() },
      ],
    }),
  ],
  args: {
    beach: MOCK_BEACH_CALA_VARQUES,
    shareUrl: 'https://costa-clara-k23.pages.dev/?playa=cala-varques',
    isCompared: false,
  },
};

export const Movil: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: FavoritesStore, useFactory: () => createMockFavoritesStore([]) },
        { provide: MarineWeatherService, useFactory: () => createMockMarineWeatherService() },
        { provide: AnalyticsService, useFactory: () => createMockAnalyticsService() },
      ],
    }),
  ],
  args: {
    beach: MOCK_BEACH_ES_TRENC,
    isCompared: false,
  },
  globals: {
    viewport: { value: 'mobile', isRotated: false },
  },
};
