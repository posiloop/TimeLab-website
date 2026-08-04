"use client";

import { useState } from "react";
import Image from "next/image";
import SectionTitle from "../components/SectionTitle";
import { MACHINES, MACHINE_TAGS } from "../data/machines";

export default function Machines() {
  const [index, setIndex] = useState(0);
  const machine = MACHINES[index];

  const move = (step: number) =>
    setIndex((prev) => (prev + step + MACHINES.length) % MACHINES.length);

  return (
    <section
      id="machines"
      className="flex flex-col items-center gap-[30px] px-4 pt-[150px] max-md:pt-20"
    >
      <SectionTitle>機台介紹</SectionTitle>

      <div className="flex w-full max-w-[1722px] items-center gap-4">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="上一個機台"
          className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-brand text-3xl text-white transition-opacity hover:opacity-80 max-md:size-12 max-md:text-xl"
        >
          ←
        </button>

        <div className="grid flex-1 grid-cols-2 items-center gap-10 rounded-[20px] bg-brand-mist/70 px-10 py-12 max-lg:grid-cols-1 max-md:px-5 max-md:py-8">
          <div className="flex items-center justify-center">
            <Image
              src={machine.image}
              alt={machine.name}
              width={694}
              height={780}
              priority
              className="h-auto w-full max-w-[560px] object-contain"
            />
          </div>

          <div className="flex flex-col gap-6">
            <ul className="flex flex-wrap gap-3">
              {MACHINE_TAGS.map((tag) => {
                const active = machine.tags.includes(tag);
                return (
                  <li
                    key={tag}
                    className={`flex h-9 w-[85px] items-center justify-center rounded-full border border-brand text-title max-md:w-[70px] max-md:text-sm ${
                      active ? "bg-brand text-white" : "bg-white/40 text-brand"
                    }`}
                  >
                    {tag}
                  </li>
                );
              })}
            </ul>

            <h3 className="text-[48px] leading-tight text-brand-ink max-lg:text-[36px] max-md:text-[28px]">
              {machine.name}
            </h3>

            <div className="flex flex-col gap-1">
              {machine.specs.map((spec) => (
                <p
                  key={spec}
                  className="text-[28px] leading-snug text-brand-ink max-lg:text-xl max-md:text-base"
                >
                  {spec}
                </p>
              ))}
            </div>

            <p className="text-title text-brand-ink">{machine.note}</p>

            <dl className="flex flex-col gap-3 text-brand-ink">
              {[
                ["相機機型", machine.camera],
                ["相印機型", machine.printer],
                ["付款模式", machine.payment],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <dt className="shrink-0 text-title">・{label}</dt>
                  <dd className="text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <button
          type="button"
          onClick={() => move(1)}
          aria-label="下一個機台"
          className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-brand text-3xl text-white transition-opacity hover:opacity-80 max-md:size-12 max-md:text-xl"
        >
          →
        </button>
      </div>

    </section>
  );
}
