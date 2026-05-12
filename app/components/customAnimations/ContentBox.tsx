import React from "react";
import { spanifyText } from "~/components/customAnimations/utils";

function ContentBox({ content }: { content: string | React.ReactNode }) {
  // Determine if content is text or a React element
  const isText = typeof content === "string";

  return (
    <div
      className="
        content-box
        flex-1
        min-w-[120px]
        flex items-center justify-center
        bg-black
        self-stretch
        p-0.5
        transform
        min-h-[40px]
      "
      style={{
        backgroundColor: "rgba(0,0,0,0)", // фон анимируется через anime.js
      }}
    >
      {isText ? (
        <div className="box-text text-white text-center leading-tight text-[14px] font-medium">
          {spanifyText(content as string)}
        </div>
      ) : (
        <div className="box-text">{content as React.ReactNode}</div>
      )}
    </div>
  );
}

export default ContentBox;
