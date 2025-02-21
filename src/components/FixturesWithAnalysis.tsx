import React from 'react';
import { FixtureList } from './FixtureList';
import { Statistics } from './Statistics';
import { SimilarMatches } from './SimilarMatches';
import { MatchHeader } from './MatchHeader';
import { Match } from '../utils/types/match';
import { TeamMapping } from '../utils/types/team';
import { AnalysisResult } from '../utils/matchAnalysis';

interface FixturesWithAnalysisProps {
  fixtures: Match[];
  matchData: Match[];
  selectedMatch: Match | null;
  teamData: TeamMapping;
  searchResults: AnalysisResult | null;
  onSelectMatch: (match: Match) => void;
}

export function FixturesWithAnalysis({ 
  fixtures,
  matchData,
  selectedMatch,
  teamData,
  searchResults,
  onSelectMatch
}: FixturesWithAnalysisProps) {
  return (
    <div className="flex gap-4">
      {/* Fixtures section - takes up 40% of the width */}
      <div className="w-[40%]">
        <FixtureList 
          fixtures={fixtures}
          onSelectMatch={onSelectMatch}
          selectedMatch={selectedMatch}
          teamData={teamData}
        />
      </div>

      {/* Analysis section - takes up 60% of the width */}
      <div className="w-[60%]">
        {searchResults && selectedMatch ? (
          <div className="space-y-6">
            <MatchHeader match={selectedMatch} teamData={teamData} />
            <Statistics 
              data={searchResults} 
              selectedMatch={selectedMatch}
              allMatches={matchData}
              teamData={teamData}
            />
            <SimilarMatches 
              matches={searchResults.matches} 
              selectedMatch={selectedMatch}
              teamData={teamData}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Analiz için bir maç seçin
          </div>
        )}
      </div>
    </div>
  );
} 