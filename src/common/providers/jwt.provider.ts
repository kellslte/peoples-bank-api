import jwt, { JwtPayload } from 'jsonwebtoken';
import configServiceClass from '@/lib/classes/config-service.class';
import { convertHumanReadableTimeToMilliseconds } from '@/lib/utils';

export class JwtServiceProvider {
    public static sign = (payload: object): string => {
        return jwt.sign(payload, configServiceClass.getOrThrow("jwt_secret_key"), {
            expiresIn: convertHumanReadableTimeToMilliseconds(configServiceClass.getOrThrow("jwt_expires_in")),
        });
    };

    public static verify = (token: string): JwtPayload | string | null => {
        try {
            return jwt.verify(token, configServiceClass.getOrThrow("jwt_secret_key"));
        } catch (error) {
            return null;
        }
    };
}
