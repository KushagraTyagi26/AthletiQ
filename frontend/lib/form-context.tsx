'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { DEFAULT_INPUTS, PredictionInputs } from '@/lib/types';

interface FormContextValue {
  inputs: PredictionInputs;
  setInputs: (inputs: PredictionInputs) => void;
  updateInput: (key: keyof PredictionInputs, value: number) => void;
  resetInputs: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputsState] = useState<PredictionInputs>(DEFAULT_INPUTS);

  const setInputs = useCallback((next: PredictionInputs) => {
    setInputsState(next);
  }, []);

  const updateInput = useCallback(
    (key: keyof PredictionInputs, value: number) => {
      setInputsState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetInputs = useCallback(() => {
    setInputsState(DEFAULT_INPUTS);
  }, []);

  return (
    <FormContext.Provider value={{ inputs, setInputs, updateInput, resetInputs }}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useForm must be used within FormProvider');
  return ctx;
}
