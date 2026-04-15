/**
 * Analytics and Performance Monitoring
 * Tracks user interactions and app performance
 */

export interface AnalyticsEvent {
  eventName: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private performanceMetrics: Map<string, number> = new Map();

  /**
   * Track user events
   */
  trackEvent(eventName: string, data?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      eventName,
      timestamp: Date.now(),
      data,
    };
    
    this.events.push(event);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventName, data);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, duration: number): void {
    this.performanceMetrics.set(metricName, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metricName}: ${duration}ms`);
    }
  }

  /**
   * Track route search
   */
  trackRouteSearch(origin: string, destination: string, resultCount: number): void {
    this.trackEvent('route_search', {
      origin,
      destination,
      resultCount,
    });
  }

  /**
   * Track safety score calculation
   */
  trackSafetyScore(routeName: string, score: number, riskLevel: string): void {
    this.trackEvent('safety_score_calculated', {
      routeName,
      score,
      riskLevel,
    });
  }

  /**
   * Track voice input usage
   */
  trackVoiceInput(success: boolean): void {
    this.trackEvent('voice_input_used', {
      success,
    });
  }

  /**
   * Track AR feature usage
   */
  trackARUsage(activated: boolean): void {
    this.trackEvent('ar_feature_used', {
      activated,
    });
  }

  /**
   * Get all events
   */
  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Map<string, number> {
    return this.performanceMetrics;
  }
}

export const analytics = new Analytics();
