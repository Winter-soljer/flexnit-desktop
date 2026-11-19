import React from "react";
import { FlexnitLogo } from "../common/FlexnitLogo";

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  return (
    <footer className={`py-10 text-zinc-500 text-xs select-none ${className}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center space-x-3">
          <FlexnitLogo size="sm" />
          <span className="text-[11px] text-zinc-400">Desktop Edition</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Audio and Subtitles</li>
            <li className="hover:underline cursor-pointer">Media Center</li>
            <li className="hover:underline cursor-pointer">Privacy Policy</li>
            <li className="hover:underline cursor-pointer">Contact Us</li>
          </ul>

          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Audio Description</li>
            <li className="hover:underline cursor-pointer">Investor Relations</li>
            <li className="hover:underline cursor-pointer">Legal Notices</li>
            <li className="hover:underline cursor-pointer">Speed Test</li>
          </ul>

          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Help Center</li>
            <li className="hover:underline cursor-pointer">Jobs</li>
            <li className="hover:underline cursor-pointer">Cookie Preferences</li>
            <li className="hover:underline cursor-pointer">StreamLink Status</li>
          </ul>

          <ul className="space-y-2">
            <li className="hover:underline cursor-pointer">Gift Cards</li>
            <li className="hover:underline cursor-pointer">Terms of Use</li>
            <li className="hover:underline cursor-pointer">Corporate Information</li>
            <li className="hover:underline cursor-pointer">African Cinema Portal</li>
          </ul>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-zinc-600 border-t border-zinc-900 gap-2">
          <p>© 2026 Flexnit, Inc. All rights reserved. Netflix-style Desktop Client.</p>
          <div className="px-2.5 py-1 border border-zinc-700 text-zinc-400 w-fit text-[10px] rounded hover:text-white cursor-pointer">
            Service Code: 894-321
          </div>
        </div>
      </div>
    </footer>
  );
};
