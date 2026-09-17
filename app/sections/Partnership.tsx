"use client";

import { useState } from "react";
import Image from "next/image";
import Modal from "../components/Modal";
import PartnershipDetail from "../components/PartnershipDetail";
import SectionTitle from "../components/SectionTitle";
import { PARTNERSHIPS } from "../data/content";

export default function Partnership() {
  const [openId, setOpenId] = useState<string | null>(null);
  const active = PARTNERSHIPS.find((item) => item.id === openId);

  return (
    <section id="partnership" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>互惠合作</SectionTitle>

      <ul className="flex flex-col items-center gap-5 pb-6">
        {PARTNERSHIPS.map((item) => (
          <li
            key={item.id}
            className="flex w-[700px] max-w-full flex-col items-center justify-center transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.96]"
          >
            <h3 className="flex h-20 w-full items-center justify-center rounded-t-[20px] bg-brand p-[10px] text-h1 text-brand-mist [text-shadow:0_4px_4px_rgba(0,0,0,0.25)] max-md:h-auto max-md:py-4">
              {item.title}
            </h3>

            <div className="flex w-full flex-col items-center justify-center gap-2 rounded-b-[20px] border-x-2 border-b-2 border-brand bg-white p-5">
              {/* 設計稿把標語斷成兩行，中間不加標點 */}
              <p className="w-full whitespace-pre-line text-center text-h2 text-brand-ink">
                {item.tagline}
              </p>

              {/* 設計稿依項目數調整：3 項為 169px/間距 30，4 項為 153px/間距 15 */}
              <ul
                className={`flex items-center justify-center max-md:flex-wrap max-md:gap-3 ${
                  item.features.length > 3 ? "gap-[15px]" : "gap-[30px]"
                }`}
              >
                {item.features.map((feature) => (
                  <li
                    key={feature.label}
                    className={`flex h-[100px] flex-col items-center justify-start bg-brand-mist pt-2 max-md:w-[130px] ${
                      item.features.length > 3 ? "w-[153px]" : "w-[169px]"
                    }`}
                  >
                    <Image
                      src={feature.icon}
                      alt=""
                      width={60}
                      height={60}
                      className="h-[60px] w-auto object-contain"
                    />
                    <span className="text-title text-brand">
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="w-full text-center text-brand-ink">
                <p className="text-title">{item.highlight}</p>
                <p className="text-body font-normal">{item.desc}</p>
              </div>

              {/* 「更多」膠囊：左側圓形色塊內含箭頭，文字靠右 */}
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                className="group/more relative h-[30px] w-[100px] overflow-hidden rounded-[15px]"
              >
                {/* hover 時紫色塊由左側圓形展開成整顆膠囊 */}
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-[30px] w-[30px] -translate-y-1/2 rounded-[15px] bg-brand transition-[width] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/more:w-[100px]"
                />
                {/* 預設只露出箭頭尖端，hover 時長出尾線 */}
                <svg
                  viewBox="0 0 20 16"
                  fill="none"
                  aria-hidden
                  className="absolute left-[13px] top-1/2 h-4 w-5 -translate-x-[12.5px] -translate-y-1/2 text-brand-mist transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/more:translate-x-0"
                >
                  {/* 以 dash 位移讓尾線由左往右長出（SVG path 不吃 scale-x） */}
                  <path
                    d="M1 8h13"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1}
                    className="transition-[stroke-dashoffset] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/more:[stroke-dashoffset:0]"
                  />
                  <path
                    d="m12 3 5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute inset-y-0 left-12 right-4 flex items-center justify-center text-title text-brand-ink transition-colors duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/more:text-brand-mist">
                  更 多
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={openId !== null}
        onClose={() => setOpenId(null)}
        title={active?.title ?? ""}
      >
        {active && <PartnershipDetail item={active} />}
      </Modal>
    </section>
  );
}
