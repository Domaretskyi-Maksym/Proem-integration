'use client'

import { useState } from 'react';
import { INTERVIEW_TYPES, DEV_TOKENS, PATIENT_EXTERNAL_ID, OCDFEAT_ID } from '@/constants';

export default function Home() {
  const [isIframeVisible, setIsIframeVisible] = useState(false);
  
  const iframeSrc = `https://proemhealth-app.nview.tech/interview/auth/${
    DEV_TOKENS.colin
  }/${OCDFEAT_ID}/${INTERVIEW_TYPES.cyBocs}/${PATIENT_EXTERNAL_ID}`;

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
            width="1200"
            height="800"
            className="border-0 mt-4 shadow-lg"
            title="Embedded Content"
          />
        )}
      </main>
    </div>
  );
}