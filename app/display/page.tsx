"use client";

import { useState, useEffect } from "react";
import {
  getJudges,
  getTeams,
  subscribeTeamScores,
  subscribeAllScores,
} from "@/lib/firestore";
import type { Judge, Team, Score } from "@/lib/firestore";
import JudgeCard from "@/components/JudgeCard";
import styles from "./display.module.css";
import Image from "next/image";

export default function DisplayPage() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [scores, setScores] = useState<Score[]>([]);
  const [allScores, setAllScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  // Load judges + teams
  useEffect(() => {
    Promise.all([getJudges(), getTeams()]).then(([j, t]) => {
      setJudges(j.sort((a, b) => a.id.localeCompare(b.id)));
      setTeams(t.sort((a, b) => a.id.localeCompare(b.id)));
      setLoading(false);
    });
  }, []);

  // Subscribe to ALL scores for stats table (always on)
  useEffect(() => {
    const unsub = subscribeAllScores((incoming) => setAllScores(incoming));
    return () => unsub();
  }, []);

  // Subscribe to scores when team changes
  useEffect(() => {
    if (!selectedTeamId) return;

    const unsub = subscribeTeamScores(selectedTeamId, (incoming) => {
      setScores(incoming);
    });

    return () => unsub();
  }, [selectedTeamId]);

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const allScored = judges.length > 0 && scores.length >= judges.length;
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const scoredCount = judges.filter((j) =>
    scores.some((s) => s.judgeId === j.id),
  ).length;

  // Build stats for each team from allScores
  const teamStats = teams.map((team) => {
    const teamScores = allScores.filter((s) => s.teamId === team.id);
    const total = teamScores.reduce((sum, s) => sum + s.score, 0);
    const judgesScored = teamScores.length;
    const isComplete = judgesScored >= judges.length && judges.length > 0;
    const avg = judgesScored > 0 ? (total / judgesScored).toFixed(1) : null;
    return { team, total, avg, judgesScored, isComplete };
  });

  // Sort: completed teams by total desc, then incomplete
  const sortedStats = [...teamStats].sort((a, b) => {
    if (a.isComplete && !b.isComplete) return -1;
    if (!a.isComplete && b.isComplete) return 1;
    return b.total - a.total;
  });

  return (
    <div className={styles.displayRoot}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <Image
          src="/imgs/logo.png"
          alt="Logo"
          width={120}
          height={50}
          className={styles.logoImg}
          priority
        />

        <div className={styles.teamSelectorWrap}>
          {loading ? (
            <div className="skeleton" style={{ width: 220, height: 44 }} />
          ) : (
            <select
              className={`select ${styles.teamSelect}`}
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setScores([]);
              }}
            >
              <option value="">Tất cả</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        {!selectedTeamId ? (
          <div className={`${styles.emptyState} animate-fadeIn`}>
            <div className={styles.emptyIcon}>🏆</div>
            <h2 className={styles.emptyTitle}>Bảng xếp hạng</h2>

            {!loading && teams.length > 0 && (
              <div className={`${styles.statsWrap} animate-fadeInUp`}>
                <div className={styles.statsTable}>
                  <div className={styles.statsHeader}>
                    <span className={styles.statsColRank}>#</span>
                    <span className={styles.statsColTeam}></span>
                    <span className={styles.statsColJudged}>Giám khảo</span>
                    <span className={styles.statsColTotal}>Tổng điểm</span>
                  </div>
                  {sortedStats.map((row, i) => (
                    <div
                      key={row.team.id}
                      className={`${styles.statsRow} ${row.isComplete ? styles.statsRowComplete : ""} ${i === 0 && row.isComplete ? styles.statsRowFirst : ""}`}
                      style={{ animationDelay: `${i * 0.07}s` }}
                    >
                      <span className={styles.statsColRank}>
                        {i === 0 && row.isComplete ? (
                          "🥇"
                        ) : i === 1 && row.isComplete ? (
                          "🥈"
                        ) : i === 2 && row.isComplete ? (
                          "🥉"
                        ) : (
                          <span className={styles.rankNum}>{i + 1}</span>
                        )}
                      </span>
                      <span className={styles.statsColTeam}>
                        {row.team.name}
                      </span>
                      <span className={styles.statsColJudged}>
                        <span
                          className={`${styles.judgedBadge} ${row.isComplete ? styles.judgedComplete : ""}`}
                        >
                          {row.judgesScored}/{judges.length}
                        </span>
                      </span>
                      <span className={styles.statsColTotal}>
                        {row.judgesScored > 0 ? (
                          <strong
                            className={
                              row.isComplete
                                ? styles.totalGold
                                : styles.totalPending
                            }
                          >
                            {row.total}
                          </strong>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Team title */}
            <div className={`${styles.teamTitle} animate-fadeInUp`}>
              <div className={styles.teamTitleInner}>
                <h1 className={styles.teamName}>{selectedTeam?.name ?? ""}</h1>
                <div className={styles.progressWrap}>
                  <span className={styles.progressText}>
                    {scoredCount}/{judges.length} giám khảo đã chấm
                  </span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${judges.length > 0 ? (scoredCount / judges.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Judge cards grid */}
            <div className={styles.grid}>
              {judges.map((judge, i) => (
                <JudgeCard
                  key={judge.id}
                  judge={judge}
                  score={scores.find((s) => s.judgeId === judge.id)}
                  index={i}
                />
              ))}
            </div>

            {/* Total score panel */}
            {allScored && (
              <div className={`glass ${styles.totalPanel} animate-fadeInUp`}>
                <p className={styles.totalLabel}>🏆 TỔNG ĐIỂM</p>
                <div className={styles.totalScore}>{totalScore}</div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
