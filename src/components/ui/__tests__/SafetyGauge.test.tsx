/**
 * SafetyGauge Component Tests
 * Comprehensive test suite for SafetyGauge UI component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SafetyGauge from '../SafetyGauge';

describe('SafetyGauge Component', () => {
  describe('Rendering', () => {
    it('should render safety score', () => {
      render(<SafetyGauge score={85} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should render Low risk level for scores >= 85', () => {
      render(<SafetyGauge score={85} />);
      expect(screen.getByText(/Low/i)).toBeInTheDocument();
    });

    it('should render Medium risk level for scores 60-84', () => {
      render(<SafetyGauge score={70} />);
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should render High risk level for scores < 60', () => {
      render(<SafetyGauge score={45} />);
      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });

    it('should render safety label', () => {
      render(<SafetyGauge score={85} />);
      expect(screen.getByText(/Safety/i)).toBeInTheDocument();
    });
  });

  describe('Score Boundaries', () => {
    it('should handle score of 0', () => {
      render(<SafetyGauge score={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });

    it('should handle score of 100', () => {
      render(<SafetyGauge score={100} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText(/Low/i)).toBeInTheDocument();
    });

    it('should handle score at Low boundary (85)', () => {
      render(<SafetyGauge score={85} />);
      expect(screen.getByText(/Low/i)).toBeInTheDocument();
    });

    it('should handle score at Medium lower boundary (60)', () => {
      render(<SafetyGauge score={60} />);
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should handle score at Medium upper boundary (84)', () => {
      render(<SafetyGauge score={84} />);
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();
    });

    it('should handle score at High boundary (59)', () => {
      render(<SafetyGauge score={59} />);
      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply green styling for Low risk', () => {
      const { container } = render(<SafetyGauge score={90} />);
      const riskBadge = screen.getByText(/Low/i);
      expect(riskBadge).toHaveClass('text-green-400');
    });

    it('should apply yellow styling for Medium risk', () => {
      const { container } = render(<SafetyGauge score={70} />);
      const riskBadge = screen.getByText(/Medium/i);
      expect(riskBadge).toHaveClass('text-yellow-400');
    });

    it('should apply red styling for High risk', () => {
      const { container } = render(<SafetyGauge score={40} />);
      const riskBadge = screen.getByText(/High/i);
      expect(riskBadge).toHaveClass('text-red-400');
    });

    it('should have glass-morphism effect', () => {
      const { container } = render(<SafetyGauge score={85} />);
      const gauge = container.firstChild;
      expect(gauge).toHaveClass('backdrop-blur-xl');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      const { container } = render(<SafetyGauge score={85} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display score prominently', () => {
      render(<SafetyGauge score={85} />);
      const score = screen.getByText('85');
      expect(score).toHaveClass('text-5xl');
    });

    it('should have readable text contrast', () => {
      render(<SafetyGauge score={85} />);
      const score = screen.getByText('85');
      expect(score).toHaveClass('text-white');
    });
  });

  describe('Score Ranges', () => {
    it('should correctly categorize low scores', () => {
      const lowScores = [0, 10, 30, 50, 59];
      lowScores.forEach((score) => {
        const { unmount } = render(<SafetyGauge score={score} />);
        expect(screen.getByText(/High/i)).toBeInTheDocument();
        unmount();
      });
    });

    it('should correctly categorize medium scores', () => {
      const mediumScores = [60, 65, 70, 75, 80, 84];
      mediumScores.forEach((score) => {
        const { unmount } = render(<SafetyGauge score={score} />);
        expect(screen.getByText(/Medium/i)).toBeInTheDocument();
        unmount();
      });
    });

    it('should correctly categorize high scores', () => {
      const highScores = [85, 90, 95, 100];
      highScores.forEach((score) => {
        const { unmount } = render(<SafetyGauge score={score} />);
        expect(screen.getByText(/Low/i)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative scores gracefully', () => {
      render(<SafetyGauge score={-10} />);
      expect(screen.getByText('-10')).toBeInTheDocument();
    });

    it('should handle scores over 100 gracefully', () => {
      render(<SafetyGauge score={150} />);
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should handle decimal scores', () => {
      render(<SafetyGauge score={85.5} />);
      expect(screen.getByText('85.5')).toBeInTheDocument();
    });

    it('should handle very large scores', () => {
      render(<SafetyGauge score={9999} />);
      expect(screen.getByText('9999')).toBeInTheDocument();
    });
  });

  describe('Component Updates', () => {
    it('should update when score changes', () => {
      const { rerender } = render(<SafetyGauge score={85} />);
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText(/Low/i)).toBeInTheDocument();

      rerender(<SafetyGauge score={45} />);
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });

    it('should update risk level when crossing boundaries', () => {
      const { rerender } = render(<SafetyGauge score={86} />);
      expect(screen.getByText(/Low/i)).toBeInTheDocument();

      rerender(<SafetyGauge score={84} />);
      expect(screen.getByText(/Medium/i)).toBeInTheDocument();

      rerender(<SafetyGauge score={59} />);
      expect(screen.getByText(/High/i)).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should render multiple gauges independently', () => {
      const { container } = render(
        <>
          <SafetyGauge score={90} />
          <SafetyGauge score={70} />
          <SafetyGauge score={40} />
        </>
      );

      expect(screen.getByText('90')).toBeInTheDocument();
      expect(screen.getByText('70')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('should show different risk levels for different scores', () => {
      render(
        <>
          <SafetyGauge score={90} />
          <SafetyGauge score={70} />
          <SafetyGauge score={40} />
        </>
      );

      const riskLevels = screen.getAllByText(/Low|Medium|High/i);
      expect(riskLevels.length).toBeGreaterThanOrEqual(3);
    });
  });
});
