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
    ? 'border-primary bg-primary-pale text-primary'
    : 'border-stone-custom-light bg-white text-stone-custom';

  return (
    <div
      {...getRootProps()}
      className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all duration-150 ease-in-out ${
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary hover:bg-primary-pale/30'
      } ${rootClasses}`}
      aria-disabled={disabled}
    >
      <input {...getInputProps()} aria-label="Upload heritage image" />
      <Upload className={`h-10 w-10 ${isDragActive ? 'text-primary' : 'text-primary'}`} />
      <p className="mt-4 text-base font-semibold text-text">{isDragActive ? 'Release to upload' : 'Drop an image here'}</p>
      <p className="mt-1 text-sm text-text-muted">or click to browse</p>
      <p className="mt-4 text-xs text-text-muted">JPEG · PNG · WebP · Max 10MB</p>
    </div>
  );
}
