import Image from 'next/image';
import { clsx } from '@/lib/clsx';

export function Logo({ size = 32, showWord = true, className }) {
  return (
    <span className={clsx('flex items-center gap-2.5', className)}>
      <Image
        src="/icon-black.svg"
        alt=""
        width={size}
        height={size}
        className="rounded-[9px] invert opacity-90"
        priority
      />
      {showWord ? (
        <span className="font-[family-name:var(--font-poppins)] text-[18px] font-semibold tracking-[-0.04em]">
          YT-FORGE
        </span>
      ) : null}
    </span>
  );
}
