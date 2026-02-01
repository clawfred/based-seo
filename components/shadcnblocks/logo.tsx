import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function LogoImage({ src, alt, className }: LogoImageProps) {
  return <Image src={src} alt={alt} width={32} height={32} className={cn("h-8 w-8", className)} />;
}

interface LogoTextProps {
  children: React.ReactNode;
  className?: string;
}

export function LogoText({ children, className }: LogoTextProps) {
  return <span className={cn("text-base font-semibold", className)}>{children}</span>;
}
