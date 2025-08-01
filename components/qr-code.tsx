import Image from 'next/image'

interface QRCodeProps {
  className?: string
}

export function QRCode({ className = "" }: QRCodeProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Image
        src="/Screenshot 2025-08-01 132606.png"
        alt="QR Code for Clara AI"
        width={256}
        height={256}
        className="rounded-lg shadow-lg"
        priority
      />
    </div>
  )
} 