"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTeams, getScore, submitScore } from "@/lib/firestore";
import type { Team } from "@/lib/firestore";
import styles from "./judge.module.css";

export default function JudgePage() {
  const router = useRouter();

  // Auth – read once from sessionStorage
  const [judgeId] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("judgeId") || ""
      : "",
  );
  const [judgeName] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("judgeName") || ""
      : "",
  );

  // Data
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [score, setScore] = useState<number>(0);
  const [existingScore, setExistingScore] = useState<number | null>(null);

  // UI
  const [loading, setLoading] = useState(() => !!judgeId);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkingScore, setCheckingScore] = useState(false);
  const [error, setError] = useState("");

  // Race-condition guard for getScore
  const scoreRequestRef = useRef(0);

  // ─── Verify session ────────────────────────────────────────
  useEffect(() => {
    if (!judgeId || !judgeName) {
      router.replace("/");
    }
  }, [judgeId, judgeName, router]);

  // ─── Load teams ────────────────────────────────────────────
  useEffect(() => {
    if (!judgeId) return;

    let cancelled = false;

    getTeams()
      .then((t) => {
        if (cancelled) return;
        const sorted = [...t].sort((a, b) => a.id.localeCompare(b.id));
        setTeams(sorted);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError("Không thể tải danh sách đội. Vui lòng tải lại trang.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [judgeId]);

  // ─── Check existing score when team changes ────────────────
  useEffect(() => {
    if (!judgeId || !selectedTeamId) {
      return;
    }

    // Increment request counter to detect stale responses
    const requestId = ++scoreRequestRef.current;

    getScore(judgeId, selectedTeamId)
      .then((s) => {
        // Ignore if user already switched to another team
        if (requestId !== scoreRequestRef.current) return;

        if (s !== null) {
          setExistingScore(s.score);
          setScore(s.score);
          setSubmitted(true);
        } else {
          setExistingScore(null);
          setScore(0);
          setSubmitted(false);
        }
      })
      .catch(() => {
        if (requestId !== scoreRequestRef.current) return;
        setError("Không thể kiểm tra điểm. Vui lòng chọn lại đội.");
        setExistingScore(null);
        setSubmitted(false);
      })
      .finally(() => {
        if (requestId !== scoreRequestRef.current) return;
        setCheckingScore(false);
      });
  }, [judgeId, selectedTeamId]);

  // ─── Handle team selection ─────────────────────────────────
  const handleTeamChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedTeamId(val);
      setError("");
      if (val) {
        setCheckingScore(true);
      } else {
        setExistingScore(null);
        setSubmitted(false);
        setCheckingScore(false);
      }
      // checkingScore will be set to true by the useEffect above
    },
    [],
  );

  // ─── Submit score ──────────────────────────────────────────
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

  // ─── Loading state ─────────────────────────────────────────
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

  // ─── Load error state ──────────────────────────────────────
  if (loadError) {
    return (
      <main className="page">
        <div className={styles.loadingWrap}>
          <p className={styles.errorMsg}>⚠ {loadError}</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
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
          onChange={handleTeamChange}
          disabled={submitting}
        >
          <option value="">Chọn đội</option>
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

              {error && <p className={styles.errorMsg}>⚠ {error}</p>}

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
                    {[30, 35, 40, 45, 50].map((v) => (
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
