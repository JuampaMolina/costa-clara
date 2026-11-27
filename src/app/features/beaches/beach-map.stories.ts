import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular-vite';
import { fn } from 'storybook/test';
import {
  MOCK_BEACH_ES_TRENC,
  MOCK_MAP_BEACHES,
  MOCK_PALMA_LOCATION,
} from '../../../stories/beach-fixtures';
import { BeachMap } from './beach-map';

const meta: Meta<BeachMap> = {
  title: 'Playas/BeachMap',
  component: BeachMap,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: false,
        iframeHeight: 560,
      },
    },
  },
  decorators: [
    componentWrapperDecorator(
      (story) => `<div class="h-dvh min-h-[32.5rem] w-full">${story}</div>`,
    ),
  ],
  args: {
    beaches: MOCK_MAP_BEACHES,
    selected: null,
    userLocation: null,
    beachSelected: fn(),
  },
};

export default meta;
type Story = StoryObj<BeachMap>;

export const ConPlayas: Story = {};

export const PlayaSeleccionada: Story = {
  args: {
    selected: MOCK_BEACH_ES_TRENC,
  },
};

export const Vacio: Story = {
  args: {
    beaches: [],
  },
};

export const ConUbicacionUsuario: Story = {
  args: {
    userLocation: MOCK_PALMA_LOCATION,
  },
};

export const Movil: Story = {
  args: {
    selected: MOCK_BEACH_ES_TRENC,
  },
  globals: {
    viewport: { value: 'mobile', isRotated: false },
  },
};
