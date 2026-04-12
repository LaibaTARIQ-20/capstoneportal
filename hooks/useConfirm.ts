import { useState, useCallback } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: "red" | "blue" | "green";
}

export function useConfirm() {
  const [options, setOptions]   = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolver?.(true);
    setOptions(null);
    setResolver(null);
  }, [resolver]);

  const handleCancel = useCallback(() => {
    resolver?.(false);
    setOptions(null);
    setResolver(null);
  }, [resolver]);

  return { confirm, options, handleConfirm, handleCancel };
}