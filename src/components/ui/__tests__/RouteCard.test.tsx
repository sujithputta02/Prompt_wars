/**
 * RouteCard Component Tests
 * Comprehensive test suite for RouteCard UI component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RouteCard from '../RouteCard';

describe('RouteCard Component', () => {
  const mockRoute = {
    id: 'route-1',
    name: 'Route Alpha',
    eta: '18 min',
    distance: '8.2 km',
    safetyScore: 85,
    riskLevel: 'Low' as const,
    explanation: 'Optimal route with minimal congestion',
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render route name', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText('Route Alpha')).toBeInTheDocument();
    });

    it('should render ETA', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText('18 min')).toBeInTheDocument();
    });

    it('should render distance', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText('8.2 km')).toBeInTheDocument();
    });

    it('should render safety score', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText(/85/)).toBeInTheDocument();
    });

    it('should render risk level', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText(/Low/i)).toBeInTheDocument();
    });

    it('should render explanation', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText('Optimal route with minimal congestion')).toBeInTheDocument();
    });
  });

  describe('Risk Level Styling', () => {
    it('should apply Low risk styling', () => {
      const lowRiskRoute = { ...mockRoute, riskLevel: 'Low' as const, safetyScore: 90 };
      const { container } = render(<RouteCard route={lowRiskRoute} onSelect={mockOnSelect} />);
      
      const riskBadge = screen.getByText(/Low/i);
      expect(riskBadge).toHaveClass('bg-green-500/20');
    });

    it('should apply Medium risk styling', () => {
      const mediumRiskRoute = { ...mockRoute, riskLevel: 'Medium' as const, safetyScore: 70 };
      const { container } = render(<RouteCard route={mediumRiskRoute} onSelect={mockOnSelect} />);
      
      const riskBadge = screen.getByText(/Medium/i);
      expect(riskBadge).toHaveClass('bg-yellow-500/20');
    });

    it('should apply High risk styling', () => {
      const highRiskRoute = { ...mockRoute, riskLevel: 'High' as const, safetyScore: 45 };
      const { container } = render(<RouteCard route={highRiskRoute} onSelect={mockOnSelect} />);
      
      const riskBadge = screen.getByText(/High/i);
      expect(riskBadge).toHaveClass('bg-red-500/20');
    });
  });

  describe('Interaction', () => {
    it('should call onSelect when clicked', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(mockRoute);
    });

    it('should be keyboard accessible', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should have hover effect', () => {
      const { container } = render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveClass('hover:border-purple-500/50');
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have accessible name', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();
    });

    it('should be keyboard navigable', () => {
      render(<RouteCard route={mockRoute} onSelect={mockOnSelect} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing explanation', () => {
      const routeWithoutExplanation = { ...mockRoute, explanation: '' };
      render(<RouteCard route={routeWithoutExplanation} onSelect={mockOnSelect} />);
      expect(screen.getByText('Route Alpha')).toBeInTheDocument();
    });

    it('should handle very long route names', () => {
      const longNameRoute = { ...mockRoute, name: 'Very Long Route Name That Might Overflow' };
      render(<RouteCard route={longNameRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText(longNameRoute.name)).toBeInTheDocument();
    });

    it('should handle zero safety score', () => {
      const zeroScoreRoute = { ...mockRoute, safetyScore: 0, riskLevel: 'High' as const };
      render(<RouteCard route={zeroScoreRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('should handle maximum safety score', () => {
      const maxScoreRoute = { ...mockRoute, safetyScore: 100, riskLevel: 'Low' as const };
      render(<RouteCard route={maxScoreRoute} onSelect={mockOnSelect} />);
      expect(screen.getByText(/100/)).toBeInTheDocument();
    });

    it('should handle very long explanations', () => {
      const longExplanation = 'This is a very long explanation that might need to be truncated or wrapped properly in the UI to maintain good user experience';
      const routeWithLongExplanation = { ...mockRoute, explanation: longExplanation };
      render(<RouteCard route={routeWithLongExplanation} onSelect={mockOnSelect} />);
      expect(screen.getByText(longExplanation)).toBeInTheDocument();
    });
  });

  describe('Multiple Routes', () => {
    it('should render multiple route cards independently', () => {
      const route1 = { ...mockRoute, id: 'route-1', name: 'Route A' };
      const route2 = { ...mockRoute, id: 'route-2', name: 'Route B' };
      const route3 = { ...mockRoute, id: 'route-3', name: 'Route C' };

      const { container } = render(
        <>
          <RouteCard route={route1} onSelect={mockOnSelect} />
          <RouteCard route={route2} onSelect={mockOnSelect} />
          <RouteCard route={route3} onSelect={mockOnSelect} />
        </>
      );

      expect(screen.getByText('Route A')).toBeInTheDocument();
      expect(screen.getByText('Route B')).toBeInTheDocument();
      expect(screen.getByText('Route C')).toBeInTheDocument();
    });

    it('should handle clicks on different routes', () => {
      const route1 = { ...mockRoute, id: 'route-1', name: 'Route A' };
      const route2 = { ...mockRoute, id: 'route-2', name: 'Route B' };

      render(
        <>
          <RouteCard route={route1} onSelect={mockOnSelect} />
          <RouteCard route={route2} onSelect={mockOnSelect} />
        </>
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[0]);
      expect(mockOnSelect).toHaveBeenCalledWith(route1);

      fireEvent.click(buttons[1]);
      expect(mockOnSelect).toHaveBeenCalledWith(route2);
    });
  });
});
