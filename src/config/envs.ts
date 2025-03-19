import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    JWT_ACCESS_SECRET: joi.string().required(),
    JWT_REFRESH_SECRET: joi.string().required(),

})
.unknown(true);

const { error, value } = envsSchema.validate(process.env);

if ( error ) {
    throw new Error(`Config validation error: ${ error.message }`);
}

const envVars:EnvVars = value;

export const envs = {
    port: envVars.PORT,
    JWT_ACCESS_SECRET: envVars.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: envVars.JWT_REFRESH_SECRET,
}