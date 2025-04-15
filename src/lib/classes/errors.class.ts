export class BadRequestException extends Error {
    public readonly statusCode: number;

    constructor(message: string) {
        super(message);
        this.statusCode = 400;
    }
}

export class NotFoundException extends Error {
    public readonly statusCode: number;

    constructor(message: string) {
        super( message );
        this.statusCode = 404; 
    }
}

export class ForbiddenException extends Error {
    public readonly statusCode: number;
    constructor(message: string) {
        super(message);
        this.statusCode = 403;
    }
}
export class UnauthenticatedException extends Error {
    public readonly statusCode: number;
    
    constructor(message: string) {
        super( message );
        this.statusCode = 401;
    }
}
export class ValidationException extends Error {
    public readonly statusCode: number;
    public readonly errors: Record<string, string>;

    constructor(message: string, errors: Record<string, string>) {
        super( message );
        this.errors = errors;
        this.statusCode = 400;
    }
}
export class TooManyRequestsException extends Error {
    public readonly statusCode: number;

    constructor( message: string )
    {
        super(message);
        this.statusCode = 419;
    }
}

export class ConflictException extends Error {
    public readonly statusCode: number;

    constructor( message: string) {
        super(message);
        this.statusCode = 409;
    }
}