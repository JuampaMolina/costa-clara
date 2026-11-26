import { provideRouter } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { NotFound } from './not-found';

const meta: Meta<NotFound> = {
  title: 'Navegación/NotFound',
  component: NotFound,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: false,
        iframeHeight: 540,
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
};

export default meta;
type Story = StoryObj<NotFound>;

export const Default: Story = {};

export const Movil: Story = {
  globals: {
    viewport: { value: 'mobile', isRotated: false },
  },
};
