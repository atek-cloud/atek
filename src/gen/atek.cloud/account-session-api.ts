import { ApiBrokerClient } from '@atek-cloud/api-broker';
// Generated file
class AccountSessionAPIClient extends ApiBrokerClient {
    constructor() {
        super({
            "id": "atek.cloud/account-session-api",
            "type": "api",
            "title": "Account Session API",
            "description": "This API is used by the host environment to manage HTTP sessions with the GUI.",
            "definition": {
                "methods": {
                    "whoami": {
                        "description": "Get the user account attached to the current session cookie.",
                        "response": {
                            "type": "object",
                            "required": [
                                "hasSession"
                            ],
                            "properties": {
                                "hasSession": {
                                    "type": "boolean"
                                },
                                "account": {
                                    "type": "object",
                                    "required": [
                                        "id",
                                        "username"
                                    ],
                                    "properties": {
                                        "id": {
                                            "type": "string"
                                        },
                                        "username": {
                                            "type": "string"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "login": {
                        "description": "Create a new session.",
                        "params": [
                            {
                                "name": "opts",
                                "type": "object",
                                "required": [
                                    "username",
                                    "password"
                                ],
                                "properties": {
                                    "username": {
                                        "type": "string"
                                    },
                                    "password": {
                                        "type": "string"
                                    }
                                }
                            }
                        ]
                    },
                    "logout": {
                        "description": "Destroys the current session."
                    }
                }
            }
        });
    }
    async whoami(): Promise<Whoami_Response> {
        return this._rpc("whoami", []);
    }
    async login(opts: LoginOpts): Promise<undefined> {
        return this._rpc("login", [opts]);
    }
    async logout(): Promise<undefined> {
        return this._rpc("logout", []);
    }
}
export type Whoami_Response = {
    hasSession: boolean;
    account?: {
        id: string;
        username: string;
    };
};
export type LoginOpts = {
    username: string;
    password: string;
};
const client: AccountSessionAPIClient = new AccountSessionAPIClient();
export default client;
