import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Landing } from '../pages/Landing';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/ProgressRing';
import { EmptyState } from '../components/ui/EmptyState';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

describe('LifeCare AI Frontend Test Suite', () => {
  it('1. Should render Landing Page with brand tagline and hero heading', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Landing />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    // H1 Heading
    const heroHeading = screen.getByRole('heading', { level: 1 });
    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading.textContent).toContain('Your Routine. Your Goals.');
    expect(heroHeading.textContent).toContain('Your Wellbeing.');

    // Interactive Demo CTA
    expect(screen.getByText(/Try Instant Interactive Demo/i)).toBeInTheDocument();
  });

  it('2. Should render Button component with custom text and variants', () => {
    render(<Button variant="primary">Hydrate Now</Button>);
    const btn = screen.getByRole('button', { name: /Hydrate Now/i });
    expect(btn).toBeInTheDocument();
  });

  it('3. Should render ProgressRing with percentage display', () => {
    render(<ProgressRing percentage={75} label="75%" sublabel="Hydrated" />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Hydrated')).toBeInTheDocument();
  });

  it('4. Should render EmptyState component with action trigger', () => {
    let clicked = false;
    render(
      <EmptyState
        title="No tasks scheduled"
        description="Add a task to start"
        actionText="Create Task"
        onAction={() => { clicked = true; }}
      />
    );

    expect(screen.getByText('No tasks scheduled')).toBeInTheDocument();
    const actionBtn = screen.getByRole('button', { name: /Create Task/i });
    expect(actionBtn).toBeInTheDocument();
    actionBtn.click();
    expect(clicked).toBe(true);
  });
});
