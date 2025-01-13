import React, { Ref } from 'react'
import { HTMLFieldProps, connectField, filterDOMProps } from 'uniforms'

type DateFieldType = 'date' | 'datetime-local';

/* istanbul ignore next */
const DateConstructor = (typeof global === 'object' ? global : window).Date
const dateFormat = (value?: Date, type: DateFieldType = 'datetime-local') =>
    value?.toISOString().slice(0, type === 'datetime-local' ? -8 : -14)

export type DateFieldProps = HTMLFieldProps<
    Date,
    HTMLDivElement,
    {
        inputRef?: Ref<HTMLInputElement>;
        max?: Date;
        min?: Date;
        type?: DateFieldType;
    }
>;

function Date({
                  disabled,
                  id,
                  inputRef,
                  label,
                  max,
                  min,
                  name,
                  onChange,
                  placeholder,
                  readOnly,
                  value,
                  type = 'datetime-local',
                  ...props
              }: DateFieldProps) {
    return (
        <div {...filterDOMProps(props)} className="w-full flex flex-col gap-y-1">
            {label && <label htmlFor={id} className="text-white text-sm">{label}</label>}

            <input
                className="w-full rounded text-lul-dark-grey"
                disabled={disabled}
                id={id}
                max={dateFormat(max)}
                min={dateFormat(min)}
                name={name}
                onChange={event => {
                    const date = new DateConstructor(event.target.valueAsNumber)
                    if (date.getFullYear() < 10000) {
                        onChange(date)
                    } else if (isNaN(event.target.valueAsNumber)) {
                        onChange(undefined)
                    }
                }}
                placeholder={placeholder}
                readOnly={readOnly}
                ref={inputRef}
                type={type}
                value={dateFormat(value, type) ?? ''}
            />
        </div>
    )
}

export default connectField<DateFieldProps>(Date, {kind: 'leaf'})
