'use client'

import { useState } from "react";

export default function Home() {
  const [isIframeVisible, setIsIframeVisible] = useState(false);
  const [iframeSrc] = useState("https://proemhealth-app.nview.tech/interview/auth/ecD-7s6gg0M1sJbH5xbn5W_Vklxw4Zac/971/322/557494896581");

  function handleClick() {
    setIsIframeVisible(true);
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] w-full h-full bg-white min-h-screen font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] justify-center relative items-center row-start-2">
        {!isIframeVisible && (
          <button
            onClick={handleClick}
            className="bg-blue-500 w-[200px] top-[1px] mb-[20px] relative hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Start Interview
          </button>
        )}
        {isIframeVisible && (
          <iframe
            src={iframeSrc}
            width="1000"
            height="800"
            title="Embedded Content"
            className="border-0 mt-4"
          />
        )}
      </main>
    </div>
  );
}