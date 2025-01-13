import React from 'react'
import { AutoFields, AutoForm, ErrorsField, SubmitField } from '@/ui/uniforms'
import createSchemaBridge from './single-entity-creator-validator'
import { JSONSchemaType } from 'ajv'

type SingleEntityCreatorProps = {
    schema: JSONSchemaType<SECSchemaType>
    onSubmit: (data: any) => void;
    entityName: string;
};

export function SingleEntityCreator({schema, onSubmit, entityName}: SingleEntityCreatorProps) {
    const bridge = createSchemaBridge(schema)

    return (
        <div className="flex-1 bg-lul-grey/20 rounded-md p-4">
            <h2 className="text-xl font-bold uppercase mb-4 text-lul-yellow">
                Create {entityName}
            </h2>
            <AutoForm schema={bridge} onSubmit={onSubmit}>
                <div className="w-full flex flex-col items-center justify-center gap-y-6 text-lul-black">
                    <AutoFields/>
                    <ErrorsField className="text-lul-red"/>
                    <SubmitField
                        value={`Create ${entityName}`}
                        className="px-4 py-2 bg-lul-blue text-white uppercase text-sm font-bold rounded-md hover:bg-lul-blue/70 transition-colors"/>
                </div>
            </AutoForm>
        </div>
    )
}
