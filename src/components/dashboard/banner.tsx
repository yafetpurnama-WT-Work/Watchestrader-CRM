"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function DashboardBanner() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 10000); // Auto loop every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full rounded-xl border border-theme-border bg-theme-bg-card px-4 py-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300">
      {/* Slide Wrapper for horizontal slide transition */}
      <div className="relative w-full overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {/* ── SLIDE 0: Values (S.T.A.R.S) ── */}
          <div className="w-full shrink-0 px-1 flex flex-col justify-center animate-fade-in">
            {/* VALUES CARD */}
            <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] h-full justify-center">
              <div className="bg-[#D5AD42] py-2.5 text-center text-xs sm:text-sm font-bold tracking-[0.2em] text-white uppercase select-none">
                VALUES
              </div>
              <div className="p-6 sm:p-8 flex flex-col items-center justify-center gap-4 text-center bg-white dark:bg-[#1e293b]">
                <h4 className="text-base sm:text-lg font-bold tracking-[0.35em] text-slate-800 dark:text-slate-100 select-none mb-2 uppercase">
                  S . T . A . R . S
                </h4>
                <ul className="flex flex-col gap-3 text-xs sm:text-[13.5px] font-medium max-w-2xl text-center select-none leading-[1.7] text-slate-700 dark:text-slate-300">
                  <li>
                    <span className="font-extrabold text-slate-900 dark:text-white">S</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">mart.</span>{" "}
                    <span className="font-normal text-slate-600 dark:text-slate-400">Have the ability to easily learn and understand customer needs.</span>
                  </li>
                  <li>
                    <span className="font-extrabold text-slate-900 dark:text-white">T</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">rustworthy.</span>{" "}
                    <span className="font-normal text-slate-600 dark:text-slate-400">Can be trusted and responsible in words and deeds.</span>
                  </li>
                  <li>
                    <span className="font-extrabold text-slate-900 dark:text-white">A</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">daptable.</span>{" "}
                    <span className="font-normal text-slate-600 dark:text-slate-400">Easily adapt with moving priorities, projects, customers, and technology.</span>
                  </li>
                  <li>
                    <span className="font-extrabold text-slate-900 dark:text-white">R</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">eputable.</span>{" "}
                    <span className="font-normal text-slate-600 dark:text-slate-400">Commited to provide excellent service for customer satisfaction.</span>
                  </li>
                  <li>
                    <span className="font-extrabold text-slate-900 dark:text-white">S</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">upreme.</span>{" "}
                    <span className="font-normal text-slate-600 dark:text-slate-400">Building an excellent spirit to achieve the best performance.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── SLIDE 1: Vision & Mission ── */}
          <div className="w-full shrink-0 px-1 flex flex-col gap-4 animate-fade-in">
            {/* VISION CARD */}
            <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="bg-[#1D4A94] py-2.5 text-center text-xs sm:text-sm font-bold tracking-[0.2em] text-white uppercase select-none">
                VISION
              </div>
              <div className="p-4 sm:p-5 text-center text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#1e293b] select-none leading-relaxed">
                To be THE BEST, MOST COMPLETE, and TRUSTED in Luxurious Watch Business
              </div>
            </div>

            {/* MISSION CARD */}
            <div className="flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="bg-[#C00000] py-2.5 text-center text-xs sm:text-sm font-bold tracking-[0.2em] text-white uppercase select-none">
                MISSION
              </div>
              <div className="p-4 sm:p-5 flex flex-col gap-2.5 text-center text-xs sm:text-[13.5px] font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#1e293b] select-none leading-relaxed">
                <p>Understanding various customer needs by providing a complete variety of luxury watch types.</p>
                <p>Always maintaining customer trust with excellent service and quality luxury watches.</p>
                <p>Providing competitive prices and buy back services at any time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators (Dots) */}
      <div className="flex justify-center items-center gap-2 mt-5">
        <button
          type="button"
          onClick={() => setActiveSlide(0)}
          aria-label="View Values"
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            activeSlide === 0
              ? "bg-slate-900 dark:bg-white scale-110"
              : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
          )}
        />
        <button
          type="button"
          onClick={() => setActiveSlide(1)}
          aria-label="View Vision and Mission"
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            activeSlide === 1
              ? "bg-slate-900 dark:bg-white scale-110"
              : "bg-slate-300 dark:bg-slate-700 hover:bg-slate-400"
          )}
        />
      </div>
    </div>
  );
}
