"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  gender: string | null;
  location_name: string | null;
  notification_time: string;
  telegram_chat_id: string | null;
  verification_code: string | null;
  is_active: boolean;
}

// 한국 주요 도시 목록
const KOREAN_CITIES = [
  "서울", "부산", "인천", "대구", "대전", "광주", "울산", "수원", "제주"
];

// 알림 시간 옵션
const NOTIFICATION_TIMES = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00"
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 설정 폼 상태
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [notificationTime, setNotificationTime] = useState("07:00");

  // 사용자 정보 로드
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setGender(userData.gender || "");
      setLocation(userData.location_name || "");
      setNotificationTime(userData.notification_time?.slice(0, 5) || "07:00");

      // 최신 정보 가져오기
      fetchUserData(userData.id);
    } catch {
      router.push("/");
    }
  }, [router]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setGender(data.gender || "");
        setLocation(data.location_name || "");
        setNotificationTime(data.notification_time?.slice(0, 5) || "07:00");
        localStorage.setItem("user", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender: gender || null,
          location_name: location,
          notification_time: notificationTime + ":00",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("설정이 저장되었습니다!");
      } else {
        setMessage(data.error || "저장에 실패했습니다.");
      }
    } catch {
      setMessage("서버 연결에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;

    // 텔레그램 연동 안 된 상태에서 활성화 시도
    if (!user.is_active && !user.telegram_chat_id) {
      setMessage("텔레그램 연동을 먼저 완료해주세요.");
      return;
    }

    // 위치 설정 안 된 상태에서 활성화 시도
    if (!user.is_active && !location) {
      setMessage("위치를 먼저 설정해주세요.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage(data.user.is_active ? "알림이 활성화되었습니다!" : "알림이 비활성화되었습니다.");
      } else {
        setMessage(data.error || "상태 변경에 실패했습니다.");
      }
    } catch {
      setMessage("서버 연결에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--color-mint)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--color-text-light)]">로딩 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👕</span>
            <span className="font-semibold text-[var(--color-text)]">WeatherFit</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--color-text-light)] hover:text-[var(--color-coral)] transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome Card */}
        <div className="organic-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-mint)] to-[var(--color-sky)] flex items-center justify-center text-2xl">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">
                안녕하세요, {user?.name}님!
              </h1>
              <p className="text-sm text-[var(--color-text-light)]">
                날씨에 맞는 옷차림 알림을 설정해보세요
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="organic-card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <span>📊</span> 알림 상태
          </h2>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-cream-dark)]">
            <div>
              <p className="font-medium text-[var(--color-text)]">
                {user?.is_active ? "알림 활성화됨" : "알림 비활성화됨"}
              </p>
              <p className="text-sm text-[var(--color-text-light)]">
                {user?.is_active
                  ? `매일 ${notificationTime}에 알림을 받습니다`
                  : "알림을 받으려면 활성화하세요"}
              </p>
            </div>
            <button
              onClick={handleToggleActive}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                user?.is_active
                  ? "bg-[var(--color-coral)]/20 text-[var(--color-coral)] hover:bg-[var(--color-coral)]/30"
                  : "bg-[var(--color-mint)] text-white hover:bg-[var(--color-mint-dark)]"
              }`}
            >
              {user?.is_active ? "비활성화" : "활성화"}
            </button>
          </div>

          {/* 연동 상태 표시 */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl ${user?.telegram_chat_id ? "bg-[var(--color-mint-light)]/30" : "bg-[var(--color-peach)]/30"}`}>
              <div className="flex items-center gap-2 text-sm">
                <span>{user?.telegram_chat_id ? "✅" : "⏳"}</span>
                <span className="text-[var(--color-text)]">텔레그램 연동</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${location ? "bg-[var(--color-mint-light)]/30" : "bg-[var(--color-peach)]/30"}`}>
              <div className="flex items-center gap-2 text-sm">
                <span>{location ? "✅" : "⏳"}</span>
                <span className="text-[var(--color-text)]">위치 설정</span>
              </div>
            </div>
          </div>
        </div>

        {/* Telegram Connection Card */}
        <div className="organic-card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <span>📱</span> 텔레그램 연동
          </h2>

          {user?.telegram_chat_id ? (
            <div className="p-4 rounded-2xl bg-[var(--color-mint-light)]/30 border border-[var(--color-mint)]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-mint)] flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text)]">연동 완료!</p>
                  <p className="text-sm text-[var(--color-text-light)]">
                    텔레그램으로 알림을 받을 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[var(--color-peach)]/20 border border-[var(--color-peach)]/30">
                <p className="text-sm text-[var(--color-text)] mb-3">
                  텔레그램 연동이 필요합니다. 아래 단계를 따라해주세요:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--color-text-light)]">
                  <li>텔레그램에서 <strong className="text-[var(--color-text)]">@weather0807_bot</strong> 검색</li>
                  <li><strong className="text-[var(--color-text)]">/start</strong> 명령어 입력</li>
                  <li>아래 인증코드 입력</li>
                </ol>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--color-sky)]/20 text-center">
                <p className="text-sm text-[var(--color-text-light)] mb-2">나의 인증코드</p>
                <p className="text-2xl font-mono font-bold text-[var(--color-text)] tracking-wider">
                  {user?.verification_code || "------"}
                </p>
              </div>

              <a
                href="https://t.me/weather0807_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="organic-btn w-full text-center block"
              >
                텔레그램 봇 열기
              </a>
            </div>
          )}
        </div>

        {/* Settings Card */}
        <div className="organic-card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <span>⚙️</span> 알림 설정
          </h2>

          <div className="space-y-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                성별
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="organic-select"
              >
                <option value="">성별을 선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                위치
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="organic-select"
              >
                <option value="">도시를 선택하세요</option>
                {KOREAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Time */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                알림 시간
              </label>
              <select
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="organic-select"
              >
                {NOTIFICATION_TIMES.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-xl text-sm text-center ${
                message.includes("실패") || message.includes("먼저")
                  ? "bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
                  : "bg-[var(--color-mint-light)]/30 text-[var(--color-mint-dark)]"
              }`}>
                {message}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="organic-btn organic-btn-secondary w-full disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="organic-card p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <span>💡</span> 서비스 안내
          </h2>
          <div className="space-y-3 text-sm text-[var(--color-text-light)]">
            <p>• 매일 설정한 시간에 오늘의 날씨와 추천 옷차림을 알려드려요</p>
            <p>• 현재 기온에 맞는 상의, 하의, 외투를 추천해드려요</p>
            <p>• 비가 오는 날에는 우비/우산도 함께 알려드려요</p>
          </div>
        </div>
      </div>
    </main>
  );
}
