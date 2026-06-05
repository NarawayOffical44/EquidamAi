interface FormErrorProps {
  id?: string;
  message?: string;
  className?: string;
}

export function FormError({ id, message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className={`form-error ${className}`.trim()}>
      {message}
    </p>
  );
}
