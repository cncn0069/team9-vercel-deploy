import { render, screen } from '@testing-library/react';

import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders the button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
