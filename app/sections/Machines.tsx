"use client";

import { useState } from "react";
import Image from "next/image";
import SectionTitle from "../components/SectionTitle";
import { MACHINES, MACHINE_TAGS } from "../data/machines";

export default function Machines() {
  const [index, setIndex] = useState(0);
  const machine = MACHINES[index];

  return (
    <section id="machines" className="px-16 max-lg:px-8 max-md:px-4">
      <SectionTitle>機台介紹</SectionTitle>

      <div className="mx-auto flex w-[900px] max-w-full flex-col items-center gap-6 pb-6">
        <div className="flex flex-wrap justify-center gap-[25px] max-md:gap-3">
          {MACHINES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={`flex h-[50px] w-[200px] items-center justify-center rounded-[20px] text-h2 shadow-[0_0_5px_rgba(140,140,180,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[0.96] max-md:h-11 max-md:w-[150px] max-md:text-base ${
                i === index
                  ? "bg-brand text-white"
                  : "bg-white text-brand-ink hover:bg-brand-mist"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="flex h-[480px] w-full items-center justify-end gap-10 overflow-hidden rounded-[20px] bg-gradient-to-b from-brand-mist to-white shadow-[0_0_5px_rgba(140,140,180,0.5)] max-lg:h-auto max-lg:flex-col max-lg:justify-start max-lg:gap-6 max-lg:py-8">
          <Image
            src={machine.image}
            alt={machine.name}
            width={365}
            height={456}
            priority
            className="h-[456px] w-[365px] shrink-0 object-contain max-lg:h-[320px] max-lg:w-auto"
          />

          <div className="flex h-[480px] min-w-0 flex-col gap-5 pr-[50px] pt-[50px] max-lg:h-auto max-lg:w-full max-lg:px-6 max-lg:pr-6 max-lg:pt-0">
            <div className="flex w-[402px] max-w-full flex-col gap-4">
              <h3 className="text-h1 text-black">
                {machine.name}
              </h3>

              <div className="flex flex-col gap-[10px] text-black">
                <div className="text-title">
                  {machine.specs.map((spec) => (
                    <p key={spec}>{spec}</p>
                  ))}
                </div>
                <p className="text-caption">{machine.note}</p>
              </div>

              {/* 設計稿在 Mobile 把標題移到標籤上方，標籤列以 justify-between 均分不換行 */}
              <div className="flex items-center gap-[10px] max-md:flex-col max-md:items-stretch max-md:gap-0">
                {/* 設計稿的框寬 60px 但文字不換行，允許自然超出 */}
                <span className="flex h-[30px] w-[60px] shrink-0 items-center justify-center whitespace-nowrap rounded-full text-title text-brand">
                  推薦場合
                </span>
                <div className="flex items-center gap-[10px] max-md:justify-between max-md:gap-0">
                  {/* 設計稿五個場合皆列出；適用者實心、不適用者為外框 */}
                  {MACHINE_TAGS.map((tag) => {
                    const active = machine.tags.includes(tag);
                    return (
                      <span
                        key={tag}
                        className={`flex h-[25px] w-[50px] shrink-0 items-center justify-center rounded-full text-title ${
                          active
                            ? "bg-brand text-white"
                            : "border border-brand bg-white text-brand"
                        }`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <dl className="flex flex-col gap-[10px]">
              {[
                ["相機機型", machine.camera],
                ["相印機型", machine.printer],
                ["付款模式", machine.payment],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col justify-center">
                  <dt className="text-title text-brand-ink">{label}</dt>
                  <dd className="w-fit bg-brand-mist text-title text-brand-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
