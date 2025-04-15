import { HttpStatus } from "./http-status.class";

export class BadRequestException extends Error {
    public readonly statusCode: number;

    constructor(message: string) {
        super(message);
        this.statusCode = HttpStatus.BAD_REQUEST;
    }
}

export class NotFoundException extends Error {
    public readonly statusCode: number;

    constructor(message: string) {
        super( message );
        this.statusCode = HttpStatus.NOT_FOUND; 
    }
}

export class ForbiddenException extends Error {
    public readonly statusCode: number;
    constructor(message: string) {
        super(message);
        this.statusCode = HttpStatus.FORBIDDEN;
    }
}
export class UnauthenticatedException extends Error {
    public readonly statusCode: number;
    
    constructor(message: string) {
        super( message );
        this.statusCode = HttpStatus.UNAUTHORIZED;
    }
}
export class ValidationException extends Error {
    public readonly statusCode: number;
    public readonly errors: Record<string, string>;

    constructor(message: string, errors: Record<string, string>) {
        super( message );
        this.errors = errors;
        this.statusCode = HttpStatus.BAD_REQUEST;
    }
}
export class TooManyRequestsException extends Error {
    public readonly statusCode: number;

    constructor( message: string )
    {
        super(message);
        this.statusCode = HttpStatus.TOO_MANY_REQUESTS;
    }
}

export class ConflictException extends Error {
    public readonly statusCode: number;

    constructor( message: string) {
        super(message);
        this.statusCode = HttpStatus.CONFLICT;
    }
}