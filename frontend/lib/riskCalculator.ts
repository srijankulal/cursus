export interface RiskStatus {
  riskLevel: 'green' | 'yellow' | 'red';
  requiredPace: number;
  currentPace: number;
  daysLeft: number;
  percentageComplete: number;
  totalTopics: number;
  completedTopics: number;
}

export function calculateRisk(
  totalTopics: number,
  completedTopicsCount: number,
  examDate: Date,
  semesterStartDate: Date = new Date(new Date().setDate(new Date().getDate() - 90)) // Default to 90 days ago
): RiskStatus {
  const today = new Date();
  const diffTime = Math.max(0, examDate.getTime() - today.getTime());
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // At least 1 day left if it's today

  const daysSinceStart = Math.ceil((today.getTime() - semesterStartDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  
  const remainingTopics = totalTopics - completedTopicsCount;
  const requiredPace = remainingTopics / daysLeft;
  const currentPace = completedTopicsCount / daysSinceStart;

  let riskLevel: 'green' | 'yellow' | 'red' = 'red';
  if (currentPace >= requiredPace) {
    riskLevel = 'green';
  } else if (currentPace >= requiredPace * 0.7) {
    riskLevel = 'yellow';
  }

  return {
    riskLevel,
    requiredPace: Math.round(requiredPace * 10) / 10,
    currentPace: Math.round(currentPace * 10) / 10,
    daysLeft,
    percentageComplete: Math.round((completedTopicsCount / totalTopics) * 100),
    totalTopics,
    completedTopics: completedTopicsCount,
  };
}
