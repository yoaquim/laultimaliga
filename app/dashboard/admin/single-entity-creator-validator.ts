import Ajv, { JSONSchemaType } from 'ajv'
import addFormats from 'ajv-formats'
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema'

const ajv = new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    keywords: ['uniforms'],
})
addFormats(ajv)

function createValidator<T>(schema: JSONSchemaType<T>) {
    const validator = ajv.compile(schema)

    return (model: Record<string, unknown>) => {
        // Transform `Date` objects into ISO strings
        const transformedModel = Object.fromEntries(
            Object.entries(model).map(([key, value]) =>
                value instanceof Date ? [key, value.toISOString().split('T')[0]] : [key, value]
            )
        )

        validator(transformedModel)
        return validator.errors?.length
            ? {details: validator.errors.map((error) => ({message: error.message, name: error.instancePath}))}
            : null
    }
}

export default function createSchemaBridge(schema: JSONSchemaType<SECSchemaType>) {
    const schemaValidator = createValidator(schema)
    return new JSONSchemaBridge({schema, validator: schemaValidator,})
}
