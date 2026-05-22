"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "../components/ui/Toast";

export interface UseAdminMutationOptions<TInput, TOutput> {
  readonly mutationFn: (input: TInput) => Promise<TOutput>;
  readonly onSuccess?: (output: TOutput, input: TInput) => void;
  readonly onError?: (error: unknown, input: TInput) => void;
  readonly concurrentGuardMessage?: string;
}

export interface UseAdminMutationResult<TInput, TOutput> {
  readonly mutate: (input: TInput) => Promise<TOutput | undefined>;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly reset: () => void;
}

export function useAdminMutation<TInput, TOutput>(
  options: UseAdminMutationOptions<TInput, TOutput>,
): UseAdminMutationResult<TInput, TOutput> {
  const { mutationFn, onSuccess, onError, concurrentGuardMessage = "既に保存中です" } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const inFlightRef = useRef(false);
  const { toast } = useToast();

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput | undefined> => {
      if (inFlightRef.current) {
        toast(concurrentGuardMessage);
        return undefined;
      }
      inFlightRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutationFn(input);
        onSuccess?.(result, input);
        return result;
      } catch (err) {
        setError(err);
        onError?.(err, input);
        return undefined;
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, toast, concurrentGuardMessage],
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
    inFlightRef.current = false;
  }, []);

  return { mutate, isLoading, error, reset };
}
