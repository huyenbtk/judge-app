"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTeams, getScore, submitScore } from "@/lib/firestore";
import type { Team } from "@/lib/firestore";
import styles from "./judge.module.css";

export default function JudgePage() {
  const router = useRouter();

  // Auth
  const [judgeId, setJudgeId] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("judgeId") || "" : ""
  );
  const [judgeName, setJudgeName] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("judgeName") || "" : ""
  );

  // Data
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [score, setScore] = useState<number>(25);
  const [existingScore, setExistingScore] = useState<number | null>(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingScore, setCheckingScore] = useState(false);
  const [error, setError] = useState("");

  // Verify session
  useEffect(() => {
    if (!judgeId || !judgeName) {
      router.replace("/");
    }
  }, [judgeId, judgeName, router]);

  // Load teams
  useEffect(() => {
    if (!judgeId) return;
    getTeams()
      .then((t) => {
        const sorted = [...t].sort((a, b) => a.id.localeCompare(b.id));
        setTeams(sorted);
      })
      .finally(() => setLoading(false));
  }, [judgeId]);

  // Check existing score when team changes
  useEffect(() => {
    if (!judgeId || !selectedTeamId) {
      return;
    }

    getScore(judgeId, selectedTeamId).then((s) => {
      if (s !== null) {
        setExistingScore(s.score);
        setScore(s.score);
        setSubmitted(true);
      } else {
        setExistingScore(null);
        setScore(25);
        setSubmitted(false);
      }
      setCheckingScore(false);
    });
  }, [judgeId, selectedTeamId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await submitScore(judgeId, selectedTeamId, score);
      setExistingScore(score);
      setSubmitted(true);
    } catch {
      setError("Gửi điểm thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    sessionStorage.clear();
    router.replace("/");
  }

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (loading) {
    return (
      <main className="page">
        <div className={styles.loadingWrap}>
          <div className={styles.bigSpinner} />
          <p style={{ color: "var(--text-muted)", marginTop: 16 }}>
            Đang tải...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="page"
      style={{ justifyContent: "flex-start", paddingTop: "40px" }}
    >
      {/* Header bar */}
      <header className={`${styles.headerBar} animate-fadeInUp`}>
        <div className={styles.judgeInfo}>
          <div className={styles.judgeAvatar}>{judgeName.charAt(0)}</div>
          <div>
            <p className={styles.judgeLabel}>Giám khảo</p>
            <p className={styles.judgeName}>{judgeName}</p>
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={handleLogout}
          style={{ padding: "8px 16px", fontSize: "0.85rem" }}
        >
          Đăng xuất
        </button>
      </header>

      {/* Team selector */}
      <div
        className={`glass ${styles.card} animate-fadeInUp`}
        style={{ animationDelay: "0.08s" }}
      >
        <h2 className={styles.cardTitle}>Chọn đội thi</h2>
        <select
          className="select"
          value={selectedTeamId}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedTeamId(val);
            if (val) {
              setCheckingScore(true);
              setSubmitted(false);
            } else {
              setExistingScore(null);
              setSubmitted(false);
              setCheckingScore(false);
            }
          }}
          disabled={submitting}
        >
          <option value="">— Chọn đội —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Scoring panel */}
      {selectedTeamId && (
        <div
          className={`glass ${styles.card} ${styles.scoreCard} animate-fadeInUp`}
          style={{ animationDelay: "0.15s" }}
        >
          {checkingScore ? (
            <div className={styles.checkingWrap}>
              <div className={styles.smallSpinner} />
              <span>Đang kiểm tra...</span>
            </div>
          ) : (
            <>
              <div className={styles.teamBadge}>
                <span>🎤</span>
                <span>{selectedTeam?.name}</span>
              </div>

              {submitted && existingScore !== null ? (
                /* ─── Locked: already scored ─── */
                <div className={styles.lockedState}>
                  <div className={styles.lockedIcon}>✓</div>
                  <p className={styles.lockedTitle}>Đã chấm điểm</p>
                  <div className={styles.lockedScore}>
                    {existingScore}
                    <span>/50</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.scoreForm}>
                  {/* Score display */}
                  <div className={styles.scoreDisplay}>
                    <span className={styles.scoreNumber}>{score}</span>
                    <span className={styles.scoreMax}>/50</span>
                  </div>

                  {/* Slider */}
                  <div className={styles.sliderWrap}>
                    <span className={styles.sliderMin}>0</span>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={score}
                      onChange={(e) => setScore(Number(e.target.value))}
                      className={styles.slider}
                      disabled={submitting}
                    />
                    <span className={styles.sliderMax}>50</span>
                  </div>

                  {/* Quick pick */}
                  <div className={styles.quickPick}>
                    {[30, 35, 40, 42, 45, 48, 50].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`${styles.quickBtn} ${score === v ? styles.quickBtnActive : ""}`}
                        onClick={() => setScore(v)}
                        disabled={submitting}
                      >
                        {v}
                      </button>
                    ))}
                  </div>

                  {/* Manual input */}
                  <div className={styles.manualInput}>
                    <label className={styles.label}>Hoặc nhập thủ công:</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={score}
                      onChange={(e) => {
                        const v = Math.min(
                          50,
                          Math.max(0, Number(e.target.value)),
                        );
                        setScore(v);
                      }}
                      className={`input ${styles.numberInput}`}
                      disabled={submitting}
                    />
                  </div>

                  {error && <p className={styles.errorMsg}>⚠ {error}</p>}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      width: "100%",
                      padding: "16px",
                      fontSize: "1.05rem",
                    }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className={styles.smallSpinner}
                          style={{ borderTopColor: "#fff" }}
                        />
                        Đang gửi...
                      </>
                    ) : (
                      "🏆 Gửi kết quả"
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {!selectedTeamId && (
        <div
          className={`${styles.hint} animate-fadeIn`}
          style={{ animationDelay: "0.2s" }}
        >
          <p>👆 Chọn đội thi để bắt đầu chấm điểm</p>
        </div>
      )}
    </main>
  );
}
