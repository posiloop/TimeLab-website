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
    <section
      id="partnership"
      className="flex flex-col items-center gap-[30px] px-4 pt-[150px] max-md:pt-20"
    >
      <SectionTitle>互惠合作</SectionTitle>

      <ul className="flex w-full max-w-[1524px] justify-center gap-[30px] max-lg:flex-col max-lg:items-center">
        {PARTNERSHIPS.map((item) => (
          <li
            key={item.id}
            className="w-[747px] max-w-full overflow-hidden rounded-[20px] border border-brand bg-brand-mist/70"
          >
            <h3 className="bg-brand py-4 text-center text-section text-white max-md:text-2xl">
              {item.title}
            </h3>
            <div className="flex flex-col items-center gap-4 px-8 py-6 max-md:px-5">
              <p className="text-h1 text-brand-ink max-md:text-lg">
                {item.tagline}
              </p>
              <ul className="flex w-full justify-center gap-4 max-md:flex-wrap">
                {item.features.map((feature) => (
                  <li
                    key={feature.label}
                    className="flex h-[100px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[10px] bg-white/70 px-2 pb-2 pt-3 text-title text-brand max-md:h-[86px] max-md:flex-none max-md:basis-[130px] max-md:text-sm"
                  >
                    <Image
                      src={feature.icon}
                      alt=""
                      width={48}
                      height={48}
                      className="h-[42px] w-auto object-contain max-md:h-8"
                    />
                    <span className="whitespace-nowrap max-md:whitespace-normal">
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-h1 text-brand-ink max-md:text-lg">
                {item.highlight}
              </p>
              <p className="text-center text-title text-brand-ink">
                {item.desc}
              </p>
              <button
                type="button"
                onClick={() => setOpenId(item.id)}
                className="flex items-center gap-2 text-h1 text-brand-ink transition-opacity hover:opacity-70 max-md:text-lg"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-[18px]"
                    aria-hidden
                  >
                    <path
                      d="m9.5 5.5 7 6.5-7 6.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                更多
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
