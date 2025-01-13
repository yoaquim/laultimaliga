import React, { Ref } from 'react'
import { HTMLFieldProps, connectField, filterDOMProps } from 'uniforms'

export type TextFieldProps = HTMLFieldProps<
    string,
    HTMLDivElement,
    { inputRef?: Ref<HTMLInputElement> }
>;

function Text({
                  autoComplete,
                  disabled,
                  id,
                  inputRef,
                  label,
                  name,
                  onChange,
                  placeholder,
                  readOnly,
                  type,
                  value,
                  ...props
              }: TextFieldProps) {
    return (
        <div {...filterDOMProps(props)} className="w-full flex flex-col gap-y-1">
            {label && <label htmlFor={id} className="text-white text-sm">{label}</label>}

            <input
                className="w-full rounded text-lul-dark-grey"
                autoComplete={autoComplete}
                disabled={disabled}
                id={id}
                name={name}
                onChange={event =>
                    onChange(event.target.value === '' ? undefined : event.target.value)
                }
                placeholder={placeholder}
                readOnly={readOnly}
                ref={inputRef}
                type={type}
                value={value ?? ''}
            />
        </div>
    )
}

Text.defaultProps = {type: 'text'}

export default connectField<TextFieldProps>(Text, {kind: 'leaf'})
