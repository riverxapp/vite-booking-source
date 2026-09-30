import { useCallback, useRef, useState, type ChangeEvent, type FormEvent, type ReactElement } from "react";

/**
 * Small controlled-form hook (replaces react-hook-form). Same shape for the
 * parts this app uses: register / Controller / handleSubmit / reset / watch /
 * formState.{errors,isSubmitting}. Validation runs on submit; editing a field
 * clears its error; the first invalid field is focused.
 */

type Validate<V> = (value: V) => true | string;
type FieldErrors<T> = Partial<Record<keyof T, { message: string }>>;

export type Control<T> = {
  values: T;
  setValue: <K extends keyof T>(name: K, value: T[K]) => void;
};

export function useForm<T extends Record<string, unknown>>({ defaultValues }: { defaultValues: T }) {
  const [values, setValues] = useState<T>(defaultValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const rules = useRef<Partial<Record<keyof T, Validate<never>>>>({});
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  }, []);

  function register<K extends keyof T>(name: K, options?: { validate?: Validate<T[K]> }) {
    rules.current[name] = options?.validate as Validate<never> | undefined;
    return {
      name: String(name),
      value: (values[name] ?? "") as string,
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(name, e.target.value as T[K]),
      "aria-invalid": errors[name] ? true : undefined,
    };
  }

  const reset = useCallback((next: T) => {
    setValues(next);
    setErrors({});
  }, []);

  function handleSubmit(onValid: (values: T) => unknown) {
    return async (event?: FormEvent) => {
      event?.preventDefault();
      const current = valuesRef.current;
      const next: FieldErrors<T> = {};
      for (const [name, validate] of Object.entries(rules.current) as [keyof T, Validate<unknown> | undefined][]) {
        const result = validate?.(current[name]);
        if (typeof result === "string") next[name] = { message: result };
      }
      setErrors(next);
      const firstInvalid = Object.keys(next)[0];
      if (firstInvalid) {
        (event?.currentTarget as HTMLFormElement | undefined)?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
        return;
      }
      setSubmitting(true);
      try {
        await onValid(current);
      } finally {
        setSubmitting(false);
      }
    };
  }

  const control: Control<T> = { values, setValue };
  const watch = <K extends keyof T>(name: K) => values[name];

  return { register, control, handleSubmit, reset, watch, formState: { errors, isSubmitting } };
}

type ControllerProps<T, K extends keyof T> = {
  control: Control<T>;
  name: K;
  render: (props: { field: { value: T[K]; onChange: (value: T[K]) => void } }) => ReactElement;
};

export function Controller<T, K extends keyof T>({ control, name, render }: ControllerProps<T, K>) {
  return render({ field: { value: control.values[name], onChange: (value) => control.setValue(name, value) } });
}
