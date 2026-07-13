export interface User {
  id: string;
  role: "admin" | "elector";
  registerNumber?: string;
  username?: string;
  name: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "Upcoming" | "Active" | "Closed";
  candidatesCount: number;
  totalVotes: number;
  hasVoted?: boolean;
  votedCandidateId?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  registerNumber: string;
  electionId: string;
  createdAt: string;
  photo?: string;
}

export interface Elector {
  id: string;
  name: string;
  registerNumber: string;
  createdAt: string;
}

export interface ElectorHistory {
  id: string;
  electionId: string;
  electionTitle: string;
  candidateId: string;
  candidateName: string;
  votedAt: string;
}

export interface DashboardStats {
  totalElectors: number;
  totalElections: number;
  totalCandidates: number;
  totalVotesCast: number;
  pendingVoters: number;
  votingPercentage: number;
  recentActivity: Array<{
    type: "vote_cast" | "election_created";
    electorName: string;
    electorReg: string;
    electionTitle: string;
    candidateName?: string;
    timestamp: string;
  }>;
}

export interface ElectionResult {
  election: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  totalVotes: number;
  candidates: Array<{
    id: string;
    name: string;
    registerNumber: string;
    voteCount: number;
    percentage: number;
  }>;
  winner: {
    name: string;
    registerNumber: string;
    voteCount: number;
    percentage: number;
    isTie?: boolean;
    tiedCandidates?: string[];
  } | null;
}

export interface RemainingVotersReport {
  election: {
    id: string;
    title: string;
    description: string;
    status: string;
  };
  stats: {
    totalRegistered: number;
    totalVotesCast: number;
    remainingCount: number;
    votingPercentage: number;
  };
  remainingVoters: Array<{
    id: string;
    registerNumber: string;
    name: string;
  }>;
}

