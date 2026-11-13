import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"input"> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

export function Field({ label, name, errors, hint, className, ...props }: Props) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={!!errors?.length} {...props} />
      {hint && !errors?.length && <p className="text-muted-foreground text-xs">{hint}</p>}
      {errors?.map((e) => (
        <p key={e} className="text-destructive text-xs">
          {e}
        </p>
      ))}
    </div>
  );
}

type SelectProps = React.ComponentProps<"select"> & {
  label: string;
  name: string;
  errors?: string[];
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function SelectField({
  label,
  name,
  errors,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <select
        // Remount when the default changes so the selection survives a form reset after an error.
        key={String(props.defaultValue ?? "")}
        id={name}
        name={name}
        aria-invalid={!!errors?.length}
        className="border-input bg-card aria-invalid:border-destructive h-9 rounded-lg border px-3 text-sm shadow-xs outline-none"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errors?.map((e) => (
        <p key={e} className="text-destructive text-xs">
          {e}
        </p>
      ))}
    </div>
  );
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
      {error}
    </p>
  );
}
