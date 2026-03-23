export interface RiskStatus {
  riskLevel: 'green' | 'yellow' | 'red' | 'blue';
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
  semesterStartDate: Date = new Date(new Date().setDate(new Date().getDate() - 90))
): RiskStatus {
  const today = new Date();
  const diffTime = Math.max(0, examDate.getTime() - today.getTime());
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const daysSinceStart = Math.ceil((today.getTime() - semesterStartDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
  const percentageComplete = Math.round((completedTopicsCount / totalTopics) * 100);

  const remainingTopics = totalTopics - completedTopicsCount;
  const requiredPace = remainingTopics / daysLeft;
  const currentPace = completedTopicsCount / daysSinceStart;

  let riskLevel: 'green' | 'yellow' | 'red' | 'blue' = 'blue';

  // Base logic on percentage first to avoid mid-range "Red" which feels penalizing
  if (percentageComplete >= 75) {
    riskLevel = 'green';
  } else if (percentageComplete >= 50) {
    // If you are above 50% done, you are usually "On Track" or "Slightly Behind" instead of "Critical"
    riskLevel = currentPace >= requiredPace ? 'green' : 'blue';
  } else if (percentageComplete >= 25) {
    riskLevel = 'yellow';
  } else {
    riskLevel = 'red';
  }

  // Override by pace if it's really bad or really good
  if (currentPace > requiredPace * 1.2 && riskLevel !== 'green') {
    riskLevel = 'green';
  }
  
  if (daysLeft < 7 && percentageComplete < 90) {
    riskLevel = 'red'; // Final week crunch
  }

  return {
    riskLevel,
    requiredPace: Math.round(requiredPace * 10) / 10,
    currentPace: Math.round(currentPace * 10) / 10,
    daysLeft,
    percentageComplete,
    totalTopics,
    completedTopics: completedTopicsCount,
  };
}
