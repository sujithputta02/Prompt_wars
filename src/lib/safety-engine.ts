/**
 * Velora Safety Intelligence Engine
 * Implements the safety scoring formula from the PRD
 */

export interface RouteContext {
  congestionLevel: number; // 0-100
  zoneRiskIndex: number; // 0-100
  timeOfDay: 'day' | 'evening' | 'night';
  weatherSeverity: number; // 0-100 (0=Clear, 100=Severe Storm)
  complexity: number; // 0-100 (number of crossings, junctions)
}

export const calculateSafetyScore = (context: RouteContext): number => {
  const {
    congestionLevel,
    zoneRiskIndex,
    timeOfDay,
    weatherSeverity,
    complexity
  } = context;

  // 35% congestion severity
  const congestionScore = (100 - congestionLevel) * 0.35;

  // 25% zone risk index
  const zoneScore = (100 - zoneRiskIndex) * 0.25;

  // 15% time-of-day risk
  let timeScoreValue = 100;
  if (timeOfDay === 'evening') timeScoreValue = 85;
  if (timeOfDay === 'night') timeScoreValue = 60;
  const timeScore = timeScoreValue * 0.15;

  // 15% weather severity
  const weatherScore = (100 - weatherSeverity) * 0.15;

  // 10% route complexity
  const complexityScore = (100 - complexity) * 0.10;

  const totalScore = congestionScore + zoneScore + timeScore + weatherScore + complexityScore;

  return Math.round(Math.max(0, Math.min(100, totalScore)));
};

export const getRiskLevel = (score: number): 'Low' | 'Medium' | 'High' => {
  if (score >= 85) return 'Low';
  if (score >= 60) return 'Medium';
  return 'High';
};
