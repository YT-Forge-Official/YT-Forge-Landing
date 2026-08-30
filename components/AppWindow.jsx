import Image from 'next/image';
import { clsx } from '@/lib/clsx';

/**
 * Product chrome around a real app screenshot: traffic lights and a title,
 * and nothing else. The window is here to frame the app, not to narrate it.
 */
export function AppWindow({ src, alt, title = 'YT-FORGE', priority = false, className, frameClassName }) {
  return (
    <div className={clsx('panel panel-lg overflow-hidden', className)}>
      <div className="border-line-subtle flex h-11 items-center gap-3 border-b px-4">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/12" />
          <span className="size-2.5 rounded-full bg-white/12" />
          <span className="size-2.5 rounded-full bg-white/12" />
        </div>
        <p className="text-ink-3 truncate font-[family-name:var(--font-geist-mono)] text-[12px]">
          {title}
        </p>
      </div>

      <div className={clsx('bg-bg relative', frameClassName)}>
        <Image
          src={src}
          alt={alt}
          width={1598}
          height={1327}
          priority={priority}
          className="block h-auto w-full"
          sizes="(max-width: 1024px) 100vw, 1100px"
        />
      </div>
    </div>
  );
}
