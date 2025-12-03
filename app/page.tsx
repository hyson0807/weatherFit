"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다.");
        setIsLoading(false);
        return;
      }

      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "오류가 발생했습니다.");
        setIsLoading(false);
        return;
      }

      // 로그인 성공 시 localStorage에 저장하고 대시보드로 이동
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
        {/* Background Blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="relative z-10 w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-sky)] mb-4 shadow-lg">
              <span className="text-4xl">👕</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">
              WeatherFit
            </h1>
            <p className="text-[var(--color-text-light)]">
              날씨에 맞는 옷차림을 추천해드려요
            </p>
          </div>

          {/* Auth Card */}
          <div className="organic-card p-8">
            {/* Tab Toggle */}
            <div className="flex rounded-xl bg-[var(--color-cream-dark)] p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                  isLogin
                    ? "bg-white text-[var(--color-text)] shadow-sm"
                    : "text-[var(--color-text-light)]"
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? "bg-white text-[var(--color-text)] shadow-sm"
                    : "text-[var(--color-text-light)]"
                }`}
              >
                회원가입
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  닉네임
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  className="organic-input"
                  required
                  minLength={2}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="organic-input"
                  required
                  minLength={4}
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="organic-input"
                    required
                    minLength={4}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30">
                  <p className="text-sm text-[var(--color-coral)] text-center">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="organic-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    처리 중...
                  </span>
                ) : isLogin ? (
                  "로그인"
                ) : (
                  "가입하기"
                )}
              </button>
            </form>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: "🌤️", label: "날씨 확인" },
              { icon: "👔", label: "옷 추천" },
              { icon: "📱", label: "텔레그램 알림" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="text-center p-3 rounded-2xl bg-white/60 backdrop-blur-sm"
              >
                <div className="text-2xl mb-1">{feature.icon}</div>
                <div className="text-xs text-[var(--color-text-light)]">
                  {feature.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}