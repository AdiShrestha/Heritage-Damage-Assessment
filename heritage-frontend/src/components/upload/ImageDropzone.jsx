import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export function ImageDropzone({ onFile, disabled = false }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled,
    onDropAccepted: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        onFile(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      const code = rejection?.errors?.[0]?.code;

      if (code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 10MB.');
        return;
      }

      if (code === 'file-invalid-type') {
        toast.error('Unsupported format. Use JPEG, PNG, or WebP.');
        return;
      }

      toast.error('Please upload a JPEG, PNG, or WebP image.');
    },
  });

  const rootClasses = isDragActive
    ? 'border-[#a4432d] bg-[#fff3ea] text-[#a4432d]'
    : 'border-[#d9c4b3] bg-[#fffaf3] text-[#7b6a61]';

  return (
    <div
      {...getRootProps()}
      className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed px-6 py-8 text-center transition-all duration-300 ease-out ${
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:border-[#a4432d] hover:bg-white'
      } ${rootClasses}`}
      aria-disabled={disabled}
    >
      <input {...getInputProps()} aria-label="Upload heritage image" />
      <div className="pointer-events-none absolute inset-x-6 top-5 h-7 rounded-t-lg border-t border-[#d2b79f] opacity-60">
        <div className="mx-auto -mt-1 h-2 w-14 rounded-b-full bg-[#d2b79f]" />
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#a4432d] text-white shadow-sm transition duration-300 group-hover:scale-105">
        <Upload className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-base font-semibold text-[#251c19]">{isDragActive ? 'Release to upload' : 'Drop an image here'}</p>
      <p className="mt-1 text-sm text-[#7c6b62]">or click to browse</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-[#9b6b57]">JPEG · PNG · WebP · Max 10MB</p>
    </div>
  );
}
