/** Instagram 外框線稿圖示 */
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect
        x="1.75"
        y="1.75"
        width="20.5"
        height="20.5"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** LINE 實心圖示 */
export function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M12 3C6.9 3 2.75 6.36 2.75 10.5c0 3.71 3.29 6.82 7.74 7.41.3.06.71.2.81.46.09.24.06.6.03.85l-.13.79c-.4.23-.19.91.79.5.98-.42 5.3-3.12 7.23-5.35 1.33-1.46 1.97-2.94 1.97-4.66C21.19 6.36 17.04 3 12 3Z"
        fill="currentColor"
      />
      {/* 氣泡本體約 y3~18，視覺中心在 y10.5；不用 dominantBaseline（各家渲染不一致），
          直接以基線定位：基線 = 中心 + 大寫高一半 ≈ 10.5 + 0.358 × fontSize */}
      <text
        x="12"
        y="12.1"
        textAnchor="middle"
        fontSize="4.4"
        fontWeight="700"
        fontFamily="Arial, Helvetica, sans-serif"
        fill="#8C8CB4"
      >
        LINE
      </text>
    </svg>
  );
}
