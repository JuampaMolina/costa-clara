import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular-vite';
import {
  MOCK_SAMPLES_DECLINING,
  MOCK_SAMPLES_IMPROVING,
  MOCK_SAMPLES_SINGLE,
} from '../../../stories/beach-fixtures';
import { BeachHistory } from './beach-history';

const meta: Meta<BeachHistory> = {
  title: 'Playas/BeachHistory',
  component: BeachHistory,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<div class="max-w-sm bg-white p-4">${story}</div>`),
  ],
};

export default meta;
type Story = StoryObj<BeachHistory>;

export const ConHistorico: Story = {
  args: {
    samples: MOCK_SAMPLES_IMPROVING,
  },
};

export const TendenciaEmpeora: Story = {
  args: {
    samples: MOCK_SAMPLES_DECLINING,
  },
};

export const UnaSolaMuestra: Story = {
  args: {
    samples: MOCK_SAMPLES_SINGLE,
  },
};

export const Vacio: Story = {
  args: {
    samples: [],
  },
};

export const Movil: Story = {
  args: {
    samples: MOCK_SAMPLES_IMPROVING,
  },
  globals: {
    viewport: { value: 'mobile', isRotated: false },
  },
};
