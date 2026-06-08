"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getJudgeByCode } from "@/lib/firestore";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const judge = await getJudgeByCode(code);
      if (!judge) {
        setError("Mã giám khảo không hợp lệ. Vui lòng kiểm tra lại.");
        setLoading(false);
        return;
      }
      sessionStorage.setItem("judgeId", judge.id);
      sessionStorage.setItem("judgeName", judge.name);
      router.push("/judge");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  return (
    <main className={`page ${styles.loginPage}`}>
      {/* Logo / Title */}
      <div className={`${styles.header} animate-fadeInUp`}>
        <div className={styles.logoIcon}>
          <Image
            src="/imgs/logo.png"
            alt="Logo"
            width={180}
            height={80}
            className={styles.logoImg}
            priority
          />
        </div>
        <p className={styles.subtitle}>Chấm điểm văn nghệ Gala Dinner</p>
      </div>

      {/* Login Card */}
      <div
        className={`glass ${styles.card} animate-fadeInUp`}
        style={{ animationDelay: "0.1s" }}
      >
        <h2 className={styles.cardTitle}>Đăng nhập Giám khảo</h2>
        <p className={styles.cardDesc}>Nhập mã giám khảo được BTC cung cấp</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="code" className={styles.label}>
              Mã giám khảo
            </label>
            <input
              id="code"
              type="text"
              className={`input ${error ? "error" : ""}`}
              placeholder="Nhập mã (vd: ABC123)"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              autoComplete="off"
              autoFocus
              disabled={loading}
            />
            {error && <p className={styles.errorMsg}>⚠ {error}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px" }}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Đang xác thực...
              </>
            ) : (
              "Vào trang chấm điểm →"
            )}
          </button>
        </form>
      </div>

      {/* Display link */}
      <div
        className={`${styles.displayLink} animate-fadeInUp`}
        style={{ animationDelay: "0.2s" }}
      >
        <a href="/display" className={styles.displayAnchor}>
          📺 Mở màn hình xem điểm
        </a>
      </div>
    </main>
  );
}
