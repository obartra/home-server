import { FormControlLabel, FormLabel, RadioGroup as RG, Radio } from '@mui/material';

type Props<S> = {
  label: string;
  group: Array<{ value: S; label: string } | string>;
  selected: S;
  onChange: (newSelected: S) => void;
};

export function RadioGroup({ label, group, selected, onChange }: Props<string>) {
  return (
    <>
      <FormLabel>{label}</FormLabel>
      <RG
        defaultValue={selected}
        name="radio-buttons-group"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        {group.map((item) =>
          typeof item === 'string' ? (
            <FormControlLabel key={item} value={item} control={<Radio />} label={item} />
          ) : (
            <FormControlLabel
              key={item.label}
              value={item.value}
              control={<Radio />}
              label={item.label}
            />
          ),
        )}
      </RG>
    </>
  );
}
