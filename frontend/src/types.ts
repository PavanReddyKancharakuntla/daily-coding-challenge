export type Difficulty = 'easy' | 'medium' | 'hard';

export type SubmissionStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'compile_error'
  | 'tle'
  | 'error'
  | 'pending';

export interface TestCase {
  id: number;
  stdin: string;
  expected_stdout: string;
}

export interface Challenge {
  id: number;
  slug: string;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  starter_code: string | null;
  language: string;
  tags: string | null; // CSV
  source: string;
  sample_test_cases: TestCase[];
}

export interface ChallengeResponse {
  challenge_date: string;
  difficulty: Difficulty;
  challenge: Challenge;
}

export interface Submission {
  id: number;
  challenge_id: number;
  title?: string;
  status: SubmissionStatus;
  passed_count: number;
  total_count: number;
  runtime_ms: number | null;
  score_awarded: number;
  stderr?: string | null;
  submitted_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  total_score: number;
  current_streak: number;
  longest_streak: number;
  last_solved_date: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  total_score: number;
  current_streak: number;
  longest_streak: number;
}
