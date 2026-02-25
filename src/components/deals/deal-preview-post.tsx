"use client";

import Image from "next/image";

type DealPreviewPostProps = {
  title: string;
  url: string;
  imageUrl: string;
  postText: string;
};

export function DealPreviewPost({ title, url, imageUrl, postText }: DealPreviewPostProps) {
  const displayUrl = url && url !== "#" ? url : "https://www.fox.nl";
  const domain = "FOX.NL";
  const snippet = (postText || title || "").slice(0, 100) + (postText?.length > 100 ? "…" : "");

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-3">
        Concept preview
      </p>
      <div className="p-3">
        {/* Post header: Fox logo + name + time */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white text-lg font-bold" aria-hidden>F</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              Fox. Expert in rondreizen
            </p>
            <p className="text-xs text-slate-500">3u</p>
          </div>
          <button type="button" className="p-1 text-slate-400 hover:text-slate-600" aria-label="Menu">
            <span className="text-lg leading-none">⋯</span>
          </button>
        </div>

        {/* Post text */}
        <div className="text-sm text-slate-900 whitespace-pre-line break-words mb-3">
          {postText || "Posttekst verschijnt hier…"}
        </div>

        {/* Main image */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 mb-3">
          <Image
            src={imageUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80"}
            alt=""
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 400px) 100vw, 400px"
          />
        </div>

        {/* Link preview card */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
          <div className="p-2 border-b border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {domain}
            </p>
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
              {title || "Deal titel"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
              {snippet || "Bekijk het programma op fox.nl"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
